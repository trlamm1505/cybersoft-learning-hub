/**
 * Che đường dẫn nội bộ của máy chủ trong thông báo lỗi trả cho học viên (Day 30: DEF-060, DEF-034, DEF-035).
 * Traceback của Python luôn kèm đường dẫn tuyệt đối tới file tạm (vd `C:\Users\...\Temp\code-runner-ab12\<uuid>.py`
 * hoặc `/tmp/code-runner-x/<uuid>.py`): lộ tên tài khoản hệ điều hành và cấu trúc thư mục máy chủ.
 */
export const PUBLIC_SCRIPT_NAME = 'main.py';
export const PYTHON_LIB_NAME = '<python>';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Đường dẫn tuyệt đối Windows (C:\..., \\server\...) hoặc POSIX (/tmp/..., /home/...) kết thúc bằng tên file .py.
const ABS_PY_PATH = /(?:[A-Za-z]:[\\/]|\\\\|\/)(?:[^\s"'<>|:*?\r\n]+[\\/])*[^\s"'<>|:*?\\/\r\n]+\.py\b/g;
// Thư mục tạm của bộ chạy code còn sót lại (không kèm tên file).
const RUNNER_DIR = /(?:[A-Za-z]:[\\/]|\/)(?:[^\s"'<>|:*?\r\n]+[\\/])*code-runner[^\s"'<>|:*?\\/\r\n]*[\\/]?/g;

/**
 * Thay mọi đường dẫn tới file bài làm bằng `main.py`, bỏ các đường dẫn thư mục tạm khác.
 * `knownPaths` (đường dẫn chính xác của lần chạy) được thay trước để kết quả ổn định trên mọi hệ điều hành.
 * `libraries: false` (dùng cho stdout): chỉ che đường dẫn của bộ chạy code (vd `print(__file__)`, `os.getcwd()`), không đụng
 * chuỗi .py khác mà bài làm in ra hợp lệ.
 */
export function scrubServerPaths(text: string | undefined | null, knownPaths: string[] = [], { libraries = true }: { libraries?: boolean } = {}): string {
  if (!text) return text ?? '';
  let out = text;
  for (const p of knownPaths.filter(Boolean).sort((a, b) => b.length - a.length)) {
    const variants = new Set([p, p.replace(/\\/g, '/'), p.replace(/\//g, '\\')]);
    for (const v of variants) out = out.replace(new RegExp(escapeRegex(v), 'gi'), PUBLIC_SCRIPT_NAME);
  }
  // File bài làm nằm trong thư mục tạm code-runner → main.py; file .py khác (thư viện chuẩn của Python) → <python>.
  return out
    .replace(ABS_PY_PATH, (m) => (/code-runner/i.test(m) ? PUBLIC_SCRIPT_NAME : libraries ? PYTHON_LIB_NAME : m))
    .replace(RUNNER_DIR, '');
}
