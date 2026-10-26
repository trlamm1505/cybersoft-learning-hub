#!/usr/bin/env python3
"""PR Quality Bot: chọn gate theo file thay đổi, chạy gate, tạo report kiểm chứng được.

Exit code:
  0  không có gate blocking nào FAIL (PASS / WARN / PLANNED)
  1  FAIL: có secret/policy finding, gate blocking fail, hoặc file chưa map khi bật --strict-unmapped
  2  lỗi cấu hình / không xác định được danh sách file thay đổi (không được coi là PASS)
"""

from __future__ import annotations

import argparse
import datetime as dt
import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


DAY22_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = DAY22_DIR.parents[1]
DEFAULT_CONFIG = DAY22_DIR / "config" / "change-impact-map.json"
DEFAULT_OUTPUT = DAY22_DIR / "reports"

# --- Rule chống spam: report luôn có kích thước giới hạn -------------------
MAX_LOG_CHARS = 12000        # log thô tối đa giữ lại cho 1 step (JSON)
PASS_LOG_LINES = 15          # step PASS chỉ in vài dòng cuối
FAIL_LOG_LINES = 80          # step FAIL in nhiều hơn để đủ chẩn đoán
MAX_FILES_LISTED = 50        # số file liệt kê trong bảng change impact
MAX_FINDINGS_LISTED = 20     # số security finding liệt kê
MAX_REPORT_CHARS = 60000     # dưới giới hạn 65 536 ký tự của 1 comment/summary GitHub
MAX_SCAN_BYTES = 2_000_000

# Giá trị là BIỂU THỨC CODE (gọi hàm, tham chiếu biến/thuộc tính) thì không phải secret viết cứng:
#   JWT_SECRET: h.generateSecret() }      jwtSecret = config.jwt.secret;      JWT_SECRET: secretFromEnv,
# Tên biến đứng cuối dòng và không có chữ số (một định danh thuần chữ) cũng coi là code.
_CODE_EXPR = r"(?![A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\s*(?:\(|[,;)}\]]))(?![A-Za-z_$.]+\s*$)"

_PLACEHOLDER = r"(?!\$\{|\$\(|<|\{|your[_-]|example|test|dummy|changeme|xxx|\*\*\*|process\.env|os\.environ)"

SECRET_PATTERNS = {
    "private_key": re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----"),
    "github_token": re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b"),
    "openai_key": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "google_api_key": re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
    "aws_access_key": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "postman_api_key": re.compile(r"\bPMAK-[A-Za-z0-9]{20,}-[A-Za-z0-9]{20,}\b"),
    "assigned_secret": re.compile(
        r"(?i)\b(?:POSTMAN_API_KEY|GEMINI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|JWT_SECRET|TOKENCYBERSOFT)"
        r"\s*[:=]\s*(?:[\"']" + _PLACEHOLDER + r"|" + _PLACEHOLDER + _CODE_EXPR + r")[^\s\"']{16,}",
        re.MULTILINE,
    ),
    "url_with_credentials": re.compile(
        r"(?i)\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqp)://"
        r"(?!user(?:name)?:|root:root@|admin:admin@|postgres:postgres@|<)[^\s:/@\"']+:" + _PLACEHOLDER + r"[^\s:/@\"']{6,}@"
    ),
}

# Chỉ dùng để che log (không dùng làm finding vì dễ báo nhầm).
REDACT_EXTRA = [
    (re.compile(r"(?i)(authorization\s*[:=]\s*(?:bearer\s+|basic\s+)?)[^\s\"']+"), r"\1[REDACTED]"),
    (re.compile(r"(?i)\b(bearer\s+)[A-Za-z0-9._~+/=-]{12,}"), r"\1[REDACTED]"),
    (re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*"), "[REDACTED]"),
    (re.compile(r"(?i)\b((?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key)\w*\s*[:=]\s*[\"']?)[^\s\"',;]{4,}"), r"\1[REDACTED]"),
    (re.compile(r"(?i)(://[^\s:/@\"']+:)[^\s:/@\"']+@"), r"\1[REDACTED]@"),
]

UNSAFE_WORKFLOW_PATTERNS = {
    "pull_request_target": (re.compile(r"(?m)^\s*pull_request_target\s*:"),
                            "Trigger pull_request_target chạy code PR với quyền của repo gốc."),
    "write_all_permission": (re.compile(r"(?m)^\s*permissions\s*:\s*write-all\s*$"),
                             "Workflow xin quyền write-all."),
    "automatic_pr_approval": (re.compile(r"(?i)\bgh\s+pr\s+review\b[^\n]*\s--approve\b|\bevent\s*:\s*[\"']?APPROVE\b|createReview\s*\("),
                              "Workflow tự approve PR; chỉ người review được approve."),
    "automatic_pr_merge": (re.compile(r"(?i)\bgh\s+pr\s+merge\b|pulls\.merge\s*\(|enablePullRequestAutoMerge"),
                           "Workflow tự merge PR."),
    "unbounded_pr_comment": (re.compile(r"(?i)\bgh\s+(?:pr|issue)\s+comment\b(?![^\n]*--edit-last)|issues\.createComment\s*\("),
                             "Workflow tạo comment mới ở mỗi lần chạy (spam); dùng Job Summary hoặc cập nhật 1 comment duy nhất (--edit-last)."),
}

SECURITY_REMEDIATION = (
    "Secret: xóa khỏi commit, rotate khóa nếu là khóa thật, chuyển sang GitHub Secrets/biến môi trường. "
    "Workflow: giảm quyền về read, bỏ lệnh approve/merge/comment tự động rồi chạy lại."
)


def normalize_path(value: str) -> str:
    normalized = value.strip().strip('"').replace("\\", "/")
    while normalized.startswith("./"):
        normalized = normalized[2:]
    return normalized


def matches(path: str, patterns: list[str]) -> bool:
    # fnmatchcase: phân biệt hoa/thường giống nhau trên Windows (local) và Linux (CI).
    return any(fnmatch.fnmatchcase(path, pattern) for pattern in patterns)


def is_docs_only(path: str, config: dict) -> bool:
    if matches(path, config.get("docs_only_exceptions", [])):
        return False
    return matches(path, config.get("docs_only_patterns", []))


def classify_changes(changed_files: list[str], config: dict) -> dict:
    """Trả về gate được chọn + lý do cho từng file. File code không khớp gate nào = UNMAPPED."""
    gates = config["gates"]
    impact, selected_ids, unmapped, docs = [], [], [], []
    for path in dict.fromkeys(normalize_path(p) for p in changed_files if p.strip()):
        if is_docs_only(path, config):
            docs.append(path)
            impact.append({"file": path, "kind": "docs-only", "gates": []})
            continue
        hit = [gate["id"] for gate in gates if matches(path, gate["patterns"])]
        if hit:
            impact.append({"file": path, "kind": "mapped", "gates": hit})
            selected_ids.extend(hit)
        else:
            unmapped.append(path)
            impact.append({"file": path, "kind": "unmapped", "gates": []})
    selected = [gate for gate in gates if gate["id"] in set(selected_ids)]
    code_files = [item["file"] for item in impact if item["kind"] != "docs-only"]
    advisories = [
        {"id": adv["id"], "message": adv["message"], "files": [f for f in code_files if matches(f, adv["patterns"])]}
        for adv in config.get("advisories", [])
    ]
    advisories = [adv for adv in advisories if adv["files"]]
    return {"impact": impact, "selected": selected, "unmapped": unmapped, "docs_only": docs, "advisories": advisories}


def select_gates(changed_files: list[str], gates: list[dict], config: dict | None = None) -> list[dict]:
    merged = dict(config or {})
    merged["gates"] = gates
    return classify_changes(changed_files, merged)["selected"]


def redact(text: str) -> str:
    result = text
    for pattern in SECRET_PATTERNS.values():
        result = pattern.sub("[REDACTED]", result)
    for pattern, replacement in REDACT_EXTRA:
        result = pattern.sub(replacement, result)
    return result


def scan_security(changed_files: list[str], repo_root: Path) -> list[dict]:
    """Quét MỌI file text thay đổi (không lọc theo đuôi file). Không bao giờ trả về giá trị secret."""
    findings: list[dict] = []
    seen = set()

    def add(file: str, rule: str, line: int, message: str) -> None:
        if (file, rule) not in seen:
            seen.add((file, rule))
            findings.append({"file": file, "rule": rule, "line": line, "message": message})

    for relative in changed_files:
        normalized = normalize_path(relative)
        path = repo_root / normalized
        try:
            if not path.is_file() or path.stat().st_size > MAX_SCAN_BYTES:
                continue
            raw = path.read_bytes()
        except OSError:
            continue
        if b"\x00" in raw[:8192]:
            continue  # file nhị phân
        content = raw.decode("utf-8", errors="replace")
        for name, pattern in SECRET_PATTERNS.items():
            match = pattern.search(content)
            if match:
                add(normalized, name, content.count("\n", 0, match.start()) + 1, "Phát hiện chuỗi có dạng secret thật.")
        if normalized.startswith(".github/workflows/"):
            for name, (pattern, message) in UNSAFE_WORKFLOW_PATTERNS.items():
                match = pattern.search(content)
                if match:
                    add(normalized, name, content.count("\n", 0, match.start()) + 1, message)
    return findings


def apply_allowlist(findings: list[dict], allowlist: list[dict]) -> tuple[list[dict], list[dict]]:
    """Tách finding nằm trong fixture đã được người review cho phép (config `secret_scan_allowlist`).

    Chỉ áp dụng cho rule secret được liệt kê; rule về workflow (approve/merge/quyền ghi) không bao giờ được allowlist.
    """
    blocking, allowed = [], []
    for finding in findings:
        entry = next((item for item in allowlist
                      if finding["rule"] in SECRET_PATTERNS and finding["rule"] in item["rules"]
                      and fnmatch.fnmatchcase(finding["file"], item["pattern"])), None)
        if entry:
            allowed.append({**finding, "allowlist_reason": entry["reason"]})
        else:
            blocking.append(finding)
    return blocking, allowed


def resolve_command(command: list[str]) -> list[str]:
    resolved = list(command)
    if not resolved:
        return resolved
    if resolved[0] == "python":
        resolved[0] = sys.executable
    elif os.name == "nt" and resolved[0] == "npm":
        resolved[0] = shutil.which("npm.cmd") or "npm.cmd"
    return resolved


def command_display(command: list[str]) -> str:
    return " ".join(f'"{part}"' if " " in part else part for part in command)


def run_command(command: list[str], cwd: Path, display: list[str] | None = None) -> dict:
    resolved = resolve_command(command)
    started = time.perf_counter()
    try:
        completed = subprocess.run(
            resolved, cwd=cwd, text=True, encoding="utf-8", errors="replace",
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=False, check=False,
        )
        code = completed.returncode
        output = redact(completed.stdout or "")[-MAX_LOG_CHARS:]
    except OSError as exc:
        code = 127
        output = f"Không chạy được lệnh: {exc}"
    return {
        # Hiển thị lệnh gốc trong config, không in đường dẫn tuyệt đối của máy chạy.
        "command": command_display(display or command),
        "exit_code": code,
        "duration_seconds": round(time.perf_counter() - started, 2),
        "output": output,
    }


def read_changed_files(args: argparse.Namespace, repo_root: Path) -> list[str]:
    if args.changed_file:
        return [normalize_path(line) for line in Path(args.changed_file).read_text(encoding="utf-8-sig").splitlines() if line.strip()]
    if args.files:
        return [normalize_path(item) for item in args.files]
    if args.base and args.head:
        command = ["git", "-c", "core.quotepath=false", "diff", "--name-only", f"{args.base}...{args.head}"]
    else:
        command = ["git", "-c", "core.quotepath=false", "diff", "--name-only", "HEAD"]
    completed = subprocess.run(command, cwd=repo_root, text=True, encoding="utf-8", errors="replace", capture_output=True, check=False)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or "Không lấy được danh sách file thay đổi từ git.")
    return [normalize_path(line) for line in completed.stdout.splitlines() if line.strip()]


def execute_gate(gate: dict, repo_root: Path, plan_only: bool, tmp_dir: str = "") -> dict:
    blocking = gate.get("blocking", True)
    result = {
        "id": gate["id"],
        "name": gate["name"],
        "blocking": blocking,
        "status": "PLANNED" if plan_only else "PASS",
        "exit_code": None if plan_only else 0,
        "remediation": gate["remediation"],
        "steps": [],
    }
    if plan_only:
        return result
    cwd = repo_root / gate["cwd"] if gate.get("cwd") else repo_root
    for phase in ("setup", "commands"):
        for command in gate.get(phase, []):
            actual = [part.replace("{tmp}", tmp_dir).replace("{repo}", str(repo_root)) for part in command]
            shown = [part.replace("{tmp}", "<tmp>").replace("{repo}", "<repo>") for part in command]
            step = run_command(actual, cwd, shown)
            step["phase"] = phase
            result["steps"].append(step)
            if step["exit_code"] != 0:
                # Exit code khác 0 của bất kỳ bước nào quyết định kết quả gate; dừng ngay, không chạy tiếp.
                result["exit_code"] = step["exit_code"]
                result["status"] = "FAIL" if blocking else "WARN"
                return result
    return result


def decide_overall(findings: list[dict], results: list[dict], unmapped: list[str], plan_only: bool, strict_unmapped: bool) -> str:
    if findings or any(item["status"] == "FAIL" for item in results) or (strict_unmapped and unmapped):
        return "FAIL"
    if plan_only:
        return "PLANNED"
    if unmapped or any(item["status"] == "WARN" for item in results):
        return "WARN"
    return "PASS"


def tail_lines(text: str, count: int) -> str:
    lines = text.rstrip().splitlines()
    if len(lines) <= count:
        return "\n".join(lines)
    return f"... (ẩn {len(lines) - count} dòng đầu; log đầy đủ trong artifact JSON)\n" + "\n".join(lines[-count:])


def build_report(changed_files: list[str], results: list[dict], findings: list[dict], plan_only: bool,
                 classification: dict | None = None, strict_unmapped: bool = False,
                 allowlisted: list[dict] | None = None) -> tuple[str, dict]:
    allowlisted = allowlisted or []
    classification = classification or {"impact": [{"file": f, "kind": "mapped", "gates": []} for f in changed_files],
                                        "unmapped": [], "docs_only": [], "advisories": []}
    unmapped = classification["unmapped"]
    security_status = "FAIL" if findings else "PASS"
    overall = decide_overall(findings, results, unmapped, plan_only, strict_unmapped)
    timestamp = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    run_url = ""
    if os.getenv("GITHUB_SERVER_URL") and os.getenv("GITHUB_REPOSITORY") and os.getenv("GITHUB_RUN_ID"):
        run_url = f"{os.environ['GITHUB_SERVER_URL']}/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{os.environ['GITHUB_RUN_ID']}"

    payload = {
        "generated_at_utc": timestamp,
        "commit": os.getenv("GITHUB_SHA", ""),
        "overall_status": overall,
        "exit_code": 1 if overall == "FAIL" else 0,
        "plan_only": plan_only,
        "strict_unmapped": strict_unmapped,
        "changed_files": changed_files,
        "change_impact": classification["impact"],
        "unmapped_files": unmapped,
        "advisories": classification["advisories"],
        "security_gate": {"status": security_status, "findings": findings, "allowlisted": allowlisted},
        "gates": results,
        "actions_run_url": run_url,
        "auto_approve": False,
    }

    lines = [
        "# Day 22 - PR Quality Report",
        "",
        f"- **Kết quả tổng:** {overall} (exit code {payload['exit_code']})",
        f"- **Thời gian UTC:** {timestamp}",
        f"- **Số file thay đổi:** {len(changed_files)} (docs-only: {len(classification['docs_only'])}, chưa map: {len(unmapped)})",
        f"- **Secret và workflow policy:** {security_status}",
    ]
    if run_url:
        lines.append(f"- **Link report:** [GitHub Actions run]({run_url}) → artifact `pr-quality-report-{os.environ['GITHUB_RUN_ID']}` (Markdown + JSON)")
    else:
        lines.append("- **Link report:** `reports/pr-quality-report.md`, `reports/pr-quality-report.json` (chạy local)")

    lines += ["", "## Gate summary", "", "| Gate | Loại | Trạng thái | Exit code |", "|---|---|---:|---:|"]
    lines.append(f"| Secret và workflow policy | blocking | {security_status} | {1 if findings else 0} |")
    for result in results:
        code = "-" if result["exit_code"] is None else result["exit_code"]
        lines.append(f"| {result['name']} | {'blocking' if result['blocking'] else 'advisory'} | {result['status']} | {code} |")
    if not results:
        lines.append("| (không có gate test nào được chọn) | - | - | - |")

    lines += ["", "## Change impact", "", "| File | Phân loại | Gate được chọn |", "|---|---|---|"]
    for item in classification["impact"][:MAX_FILES_LISTED]:
        label = {"mapped": "code", "docs-only": "docs-only", "unmapped": "**CHƯA MAP**"}[item["kind"]]
        lines.append(f"| `{item['file']}` | {label} | {', '.join(item['gates']) or '-'} |")
    hidden = len(classification["impact"]) - MAX_FILES_LISTED
    if hidden > 0:
        lines.append(f"| ... và {hidden} file khác (xem JSON) | | |")
    if not classification["impact"]:
        lines.append("| (không có file thay đổi) | | |")

    if unmapped:
        lines += [
            "",
            f"## Cảnh báo: {len(unmapped)} file chưa có gate",
            "",
            "Các file này **không được test tự động nào bao phủ**, nên kết quả của bot không nói gì về chúng.",
            "",
            "**Cách xử lý:** thêm pattern vào `config/change-impact-map.json` (gate phù hợp hoặc `docs_only_patterns`), "
            "hoặc người review kiểm tay và ghi rõ trong PR."
            + (" Đang bật `--strict-unmapped` nên kết quả là FAIL." if strict_unmapped else ""),
        ]
    for advisory in classification["advisories"]:
        lines += ["", f"## Lưu ý cho người review: {advisory['id']}", "", advisory["message"], "",
                  "File liên quan: " + ", ".join(f"`{f}`" for f in advisory["files"][:10])]

    if findings:
        lines += ["", "## Security findings", ""]
        for finding in findings[:MAX_FINDINGS_LISTED]:
            lines.append(f"- `{finding['file']}:{finding.get('line', '?')}` / `{finding['rule']}`: {finding['message']}")
        if len(findings) > MAX_FINDINGS_LISTED:
            lines.append(f"- ... và {len(findings) - MAX_FINDINGS_LISTED} finding khác (xem JSON).")
        lines += ["", f"**Cách khắc phục:** {SECURITY_REMEDIATION}"]

    if allowlisted:
        lines += ["", f"_{len(allowlisted)} chuỗi giống secret nằm trong fixture đã allowlist (có lý do trong `secret_scan_allowlist`; chi tiết ở JSON)._"]

    for result in results:
        lines += ["", f"## {result['name']} — {result['status']}", ""]
        if result["status"] == "PLANNED":
            lines.append("Gate được chọn ở chế độ lập kế hoạch, chưa chạy lệnh.")
        for step in result["steps"]:
            failed = step["exit_code"] != 0
            lines += [
                f"- `{step['command']}`",
                f"- Exit code: `{step['exit_code']}`; thời gian: `{step['duration_seconds']}s`",
                "",
                "```text",
                tail_lines(step["output"], FAIL_LOG_LINES if failed else PASS_LOG_LINES) or "(không có output)",
                "```",
            ]
        if result["status"] in ("FAIL", "WARN"):
            note = "" if result["blocking"] else " (Gate advisory: không chặn PR nhưng cần người review xem.)"
            lines += ["", f"**Cách khắc phục:** {result['remediation']}{note}"]

    lines += [
        "",
        "## Quyết định review",
        "",
        "Bot chỉ cung cấp bằng chứng PASS/FAIL. Bot **không có quyền và không được tự approve/merge PR**; người review chịu trách nhiệm quyết định cuối cùng.",
        "",
    ]
    markdown = "\n".join(lines)
    if len(markdown) > MAX_REPORT_CHARS:
        markdown = markdown[:MAX_REPORT_CHARS] + "\n```\n\n_(Report bị cắt để tránh spam; xem bản JSON trong artifact.)_\n"
    return markdown, payload


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base", help="Git base SHA/ref")
    parser.add_argument("--head", help="Git head SHA/ref")
    parser.add_argument("--changed-file", help="File text chứa một đường dẫn thay đổi trên mỗi dòng")
    parser.add_argument("--files", nargs="*", help="Danh sách file thay đổi truyền trực tiếp")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--plan-only", action="store_true", help="Chỉ lập kế hoạch gate, không chạy test")
    parser.add_argument("--strict-unmapped", action="store_true", help="File code chưa map gate nào thì FAIL thay vì WARN")
    parser.add_argument("--allow-empty", action="store_true", help="Chấp nhận danh sách file thay đổi rỗng")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        changed_files = list(dict.fromkeys(read_changed_files(args, REPO_ROOT)))
        config = json.loads(Path(args.config).read_text(encoding="utf-8"))
        if not changed_files and not args.allow_empty:
            raise RuntimeError(
                "Danh sách file thay đổi rỗng. Một PR luôn có file đổi, nên đây là lỗi lấy diff chứ không phải PASS. "
                "Cách xử lý: kiểm tra base/head SHA và fetch-depth: 0; nếu cố ý chạy rỗng thì thêm --allow-empty."
            )
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"PR Quality Bot configuration error: {exc}", file=sys.stderr)
        return 2

    classification = classify_changes(changed_files, config)
    findings, allowlisted = apply_allowlist(scan_security(changed_files, REPO_ROOT), config.get("secret_scan_allowlist", []))
    tmp_dir = tempfile.mkdtemp(prefix="pr-quality-")
    try:
        results = [execute_gate(gate, REPO_ROOT, args.plan_only, tmp_dir) for gate in classification["selected"]]
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
    markdown, payload = build_report(changed_files, results, findings, args.plan_only, classification, args.strict_unmapped, allowlisted)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "pr-quality-report.md").write_text(markdown, encoding="utf-8")
    (output_dir / "pr-quality-report.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(markdown)
    return payload["exit_code"]


if __name__ == "__main__":
    raise SystemExit(main())
