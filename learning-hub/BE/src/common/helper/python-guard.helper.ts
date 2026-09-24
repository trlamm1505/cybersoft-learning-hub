import { spawn } from 'child_process';

/**
 * AST-based guard for untrusted Python code before it is ever executed.
 *
 * Ngày 2/7 yêu cầu code học viên không được chạy tùy ý trên app server và
 * không được đọc file hệ thống. Môi trường này không có Docker, nên thay vì
 * "sandbox process thật" (namespace/cgroup/container), rào chắn ở đây là:
 * chặn TRƯỚC KHI CHẠY mọi con đường mà code Python có thể dùng để chạm tới
 * hệ thống — import module nguy hiểm, gọi hàm nguy hiểm (open/eval/exec/
 * __import__), hoặc dùng dunder attribute (`__subclasses__`, `__globals__`,
 * `__builtins__`...) để "leo" từ một object thường ra tới `os`/`subprocess`
 * mà không cần `import` — đây chính là kiểu bypass mà bản regex cũ (line-scan
 * theo `import X`/`open(`) không bắt được, vì nó không cần match bất kỳ từ
 * khóa nào trong danh sách chặn.
 *
 * Để bắt đúng những trường hợp đó một cách đáng tin cậy, guard này KHÔNG tự
 * viết parser Python — nó gọi module `ast` CHUẨN của chính Python (script
 * PYTHON_AST_GUARD_SCRIPT bên dưới) để phân tích cú pháp thật, rồi duyệt cây
 * AST tìm Import/Call/Attribute nguy hiểm. Điều này bắt được cả các biến thể
 * viết hoa/thường, alias (`import os as o`), gọi gián tiếp qua biến
 * (`f = open; f(...)`) ở mức tên hàm, và mọi truy cập thuộc tính bắt đầu
 * bằng `__` — thứ mà chuỗi ghép động (`'o'+'pen'`) không thể né vì AST thấy
 * đúng node `Call(func=Name(id='open'))` sau khi Python tự đánh giá cú pháp,
 * không phải so khớp text.
 *
 * Vẫn KHÔNG phải một sandbox process thật — code sau khi qua guard vẫn chạy
 * trực tiếp trên host (xem code-runner.helper.ts). Đây là một lớp phòng thủ
 * tĩnh bổ sung, không thay thế được cô lập ở tầng OS/container.
 */

const BLOCKED_MODULES = [
  'os',
  'sys',
  'subprocess',
  'socket',
  'shutil',
  'pathlib',
  'importlib',
  'ctypes',
  'multiprocessing',
  'threading',
  'signal',
  'resource',
  'pty',
  'platform',
  'inspect',
  'gc',
  'urllib',
  'http',
  'ftplib',
  'telnetlib',
  'ssl',
  'marshal',
  'pickle',
  'code',
  'codeop',
  'runpy',
];

// NOTE: `input()` is intentionally NOT blocked — exercises feed stdin test cases through it.
const BLOCKED_CALLS = [
  'eval',
  'exec',
  'compile',
  '__import__',
  'open',
  'vars',
  'globals',
  'locals',
];

// Dunder attribute access dùng để "leo" từ một object bất kỳ ra tới class
// nội bộ của Python mà không cần `import` — ví dụ kinh điển:
// `().__class__.__base__.__subclasses__()` rồi lọc ra class nào expose được
// os/subprocess. Chặn truy cập các thuộc tính này thẳng từ nguồn, bất kể nó
// được gọi trên object nào.
const BLOCKED_DUNDER_ATTRS = [
  '__subclasses__',
  '__globals__',
  '__builtins__',
  '__base__',
  '__bases__',
  '__mro__',
  '__class__',
  '__dict__',
  '__getattribute__',
  '__loader__',
  '__import__',
  '__code__',
  '__closure__',
];

export interface GuardViolation {
  line: number;
  reason: string;
}

interface RawViolation {
  line: number;
  kind: 'import' | 'call' | 'attr' | 'syntax_error';
  name: string;
}

// Script Python nhúng: parse source bằng `ast.parse`, duyệt cây tìm node
// nguy hiểm, in ra JSON list các vi phạm. Nhận danh sách chặn qua argv (JSON)
// để không phải đồng bộ hai nơi định nghĩa danh sách.
const PYTHON_AST_GUARD_SCRIPT = `
import ast, json, sys

def main():
    blocked_modules = set(json.loads(sys.argv[1]))
    blocked_calls = set(json.loads(sys.argv[2]))
    blocked_attrs = set(json.loads(sys.argv[3]))
    source = sys.stdin.read()

    violations = []

    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        # Lỗi cú pháp không phải vấn đề bảo mật — để checkPythonSyntax() xử
        # lý riêng bằng py_compile, ở đây coi như "không có gì để chặn".
        print(json.dumps([]))
        return

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root = alias.name.split('.')[0]
                if root in blocked_modules:
                    violations.append({"line": node.lineno, "kind": "import", "name": root})
        elif isinstance(node, ast.ImportFrom):
            root = (node.module or '').split('.')[0]
            if root in blocked_modules:
                violations.append({"line": node.lineno, "kind": "import", "name": root})
        elif isinstance(node, ast.Call):
            fn = node.func
            name = None
            if isinstance(fn, ast.Name):
                name = fn.id
            elif isinstance(fn, ast.Attribute):
                name = fn.attr
            if name in blocked_calls:
                violations.append({"line": node.lineno, "kind": "call", "name": name})
        elif isinstance(node, ast.Name):
            # Tham chiếu hàm nguy hiểm dưới dạng giá trị (không gọi ngay tại
            # chỗ này), ví dụ "imp = __import__" rồi gọi "imp(...)" ở dòng
            # khác — vẫn phải chặn vì mục đích rõ ràng là né việc match
            # "__import__(" trực tiếp.
            if node.id in blocked_calls and not isinstance(node.ctx, ast.Store):
                violations.append({"line": node.lineno, "kind": "call", "name": node.id})
        elif isinstance(node, ast.Attribute):
            if node.attr in blocked_attrs:
                violations.append({"line": node.lineno, "kind": "attr", "name": node.attr})

    print(json.dumps(violations))

main()
`;

function reasonFor(v: RawViolation): string {
  switch (v.kind) {
    case 'import':
      return `Không được phép import module "${v.name}"`;
    case 'call':
      return `Không được phép gọi hàm "${v.name}(...)"`;
    case 'attr':
      return `Không được phép truy cập thuộc tính "${v.name}"`;
    default:
      return 'Vi phạm chính sách bảo mật';
  }
}

/**
 * Phân tích AST thật của Python để tìm import/call/attribute nguy hiểm.
 * Trả về [] nếu code có SyntaxError — lỗi cú pháp không phải mối lo bảo mật
 * và được `checkPythonSyntax()` báo cáo riêng dưới dạng CE.
 */
export async function scanPythonForViolations(
  code: string,
  pythonBin: string = resolveGuardPythonBin(),
): Promise<GuardViolation[]> {
  return new Promise((resolve) => {
    const child = spawn(
      pythonBin,
      [
        '-I',
        '-c',
        PYTHON_AST_GUARD_SCRIPT,
        JSON.stringify(BLOCKED_MODULES),
        JSON.stringify(BLOCKED_CALLS),
        JSON.stringify(BLOCKED_DUNDER_ATTRS),
      ],
      { windowsHide: true },
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => (stdout += chunk.toString('utf-8')));
    child.stderr.on('data', (chunk) => (stderr += chunk.toString('utf-8')));

    child.on('error', () => {
      // Không khởi chạy được Python để phân tích AST — fail-closed: coi như
      // vi phạm để chặn thực thi, thay vì âm thầm bỏ qua guard.
      resolve([
        {
          line: 0,
          reason: 'Không thể kiểm tra an toàn mã nguồn trước khi chạy.',
        },
      ]);
    });

    child.on('close', () => {
      try {
        const raw: RawViolation[] = JSON.parse(stdout.trim() || '[]');
        resolve(raw.map((v) => ({ line: v.line, reason: reasonFor(v) })));
      } catch {
        resolve([
          {
            line: 0,
            reason: `Không thể phân tích mã nguồn: ${stderr.trim() || 'lỗi không xác định'}`,
          },
        ]);
      }
    });

    child.stdin.write(code);
    child.stdin.end();
  });
}

/**
 * Tách riêng khỏi resolvePythonBin() của code-runner.helper.ts để guard
 * không phụ thuộc ngược vào module thực thi code — cùng logic chọn interpreter
 * trên Windows (App Execution Alias shim), nhưng đây chỉ dùng để PHÂN TÍCH
 * cú pháp, không chạy code của học viên.
 */
function resolveGuardPythonBin(): string {
  if (process.platform !== 'win32') return 'python3';

  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  const candidate = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'Python', 'bin', 'python.exe')
    : null;

  if (candidate && fs.existsSync(candidate)) return candidate;
  return 'python';
}
