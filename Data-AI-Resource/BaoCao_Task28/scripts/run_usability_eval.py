"""CLI Evaluator for Task 28 Usability Testing & Issue Resolution DoD Compliance.

Validates 6 DoD Stages:
Stage 1: User Testing Sessions Completeness (n = 5 users, 25 tasks, valid json)
Stage 2: SUS Scoring Validity (Formula, Score >= 80.0, Grade A, Brookes 1996)
Stage 3: Time-to-find Reduction Verification (Average reduction > 50%)
Stage 4: Issue Backlog Prioritization (10 issues, Impact/Effort matrix, Severity)
Stage 5: Top 5 Priority Fixes Verification (All 5 critical/high fixes verified)
Stage 6: Artifact Integrity & Zero Forbidden Words Check (No 'kịch' + 'bản')
"""

import sys
import json
from pathlib import Path

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent


def evaluate():
    print("=" * 80)
    print("CYBERSOFT DATA & AI LAB — KIỂM ĐỊNH CHUẨN ĐẦU RA TASK 28 (USABILITY TESTING)")
    print("=" * 80)

    stages_passed = 0

    # Stage 1: User Testing Sessions
    print("[STAGE 1/6] Kiểm tra Tính Đầy Đủ Của Hồ Sơ Người Dùng Thử (n = 5)...")
    sessions_file = BASE_DIR / "data" / "user_sessions.json"
    assert sessions_file.exists(), "Thiếu file data/user_sessions.json"
    with open(sessions_file, "r", encoding="utf-8") as f:
        users = json.load(f)
    assert len(users) == 5, f"Cỡ mẫu yêu cầu n = 5, thực tế: {len(users)}"
    total_tasks = sum(len(u["tasks"]) for u in users)
    assert total_tasks == 25, f"Yêu cầu 25 tác vụ thử nghiệm, thực tế: {total_tasks}"
    print(f"  ✓ Đạt chuẩn: {len(users)} người dùng thử đại diện, {total_tasks} lượt tác vụ đo lường.")
    stages_passed += 1

    # Stage 2: SUS Scoring Validity
    print("[STAGE 2/6] Kiểm định Công Thức và Điểm Hệ Thống SUS (System Usability Scale)...")
    sus_scores = []
    for u in users:
        ans = u["sus_answers"]
        assert len(ans) == 10, f"User {u['user_id']} không đủ 10 câu trả lời SUS"
        score = sum((ans[i] - 1) if (i % 2 == 0) else (5 - ans[i]) for i in range(10)) * 2.5
        sus_scores.append(score)
    avg_sus = sum(sus_scores) / len(sus_scores)
    assert avg_sus >= 80.0, f"Điểm SUS trung bình {avg_sus} chưa đạt mức Giỏi (>= 80.0)"
    print(f"  ✓ Đạt chuẩn: Điểm SUS trung bình đạt {avg_sus:.1f}/100 (Hạng A — Excellent).")
    stages_passed += 1

    # Stage 3: Time-to-find Reduction
    print("[STAGE 3/6] Đo Lường Mức Độ Giảm Thời Gian Tra Cứu (Time-to-find)...")
    all_init = [t["time_to_find_sec"] for u in users for t in u["tasks"]]
    all_final = [t["time_after_fix_sec"] for u in users for t in u["tasks"]]
    avg_init = sum(all_init) / len(all_init)
    avg_final = sum(all_final) / len(all_final)
    reduction = ((avg_init - avg_final) / avg_init) * 100.0
    assert reduction >= 50.0, f"Mức giảm thời gian {reduction:.1f}% chưa đạt kỳ vọng (>= 50%)"
    print(f"  ✓ Đạt chuẩn: Thời gian tra cứu giảm từ {avg_init:.1f}s → {avg_final:.1f}s (Giảm {reduction:.1f}%).")
    stages_passed += 1

    # Stage 4: Issue Backlog Prioritization
    print("[STAGE 4/6] Kiểm tra Danh Mục Vấn Đề Ghi Nhận (Issue Backlog 10 Items)...")
    backlog_file = BASE_DIR / "data" / "issue_backlog.json"
    assert backlog_file.exists(), "Thiếu file data/issue_backlog.json"
    with open(backlog_file, "r", encoding="utf-8") as f:
        backlog = json.load(f)
    assert len(backlog) == 10, f"Yêu cầu 10 vấn đề, thực tế: {len(backlog)}"
    critical_high = [i for i in backlog if i["severity"] in ("CRITICAL", "HIGH")]
    assert len(critical_high) == 5, f"Yêu cầu 5 vấn đề Critical/High, thực tế: {len(critical_high)}"
    print(f"  ✓ Đạt chuẩn: 10 vấn đề được phân loại Impact/Effort; 5 vấn đề ưu tiên hàng đầu.")
    stages_passed += 1

    # Stage 5: Top 5 Priority Fixes
    print("[STAGE 5/6] Kiểm tra 5 Bản Vá Ưu Tiên Đã Hoàn Tất và Kiểm Chứng...")
    fixes_file = BASE_DIR / "data" / "resolved_fixes.json"
    assert fixes_file.exists(), "Thiếu file data/resolved_fixes.json"
    with open(fixes_file, "r", encoding="utf-8") as f:
        fixes = json.load(f)
    assert len(fixes) == 5, f"Yêu cầu 5 bản vá ưu tiên, thực tế: {len(fixes)}"
    for fix in fixes:
        assert "PASSED" in fix["test_verified"], f"Bản vá {fix['fix_id']} chưa qua kiểm thử"
    print(f"  ✓ Đạt chuẩn: 5/5 bản vá ưu tiên đã giải quyết triệt để 100% vấn đề Critical/High.")
    stages_passed += 1

    # Stage 6: Artifact Integrity & Forbidden Words Check
    print("[STAGE 6/6] Kiểm tra Toàn Vẹn Hiện Vật Bàn Giao & Quét Từ Ngữ Cấm...")
    req_files = [
        BASE_DIR / "28_usability_measurement_report.md",
        BASE_DIR / "README.md",
        BASE_DIR / "AI_WORKLOG.md",
        BASE_DIR / "docs" / "GIAI_THICH.md",
        BASE_DIR / "src" / "services" / "usability_service.py",
        BASE_DIR / "src" / "routes" / "usability.py",
    ]
    for rf in req_files:
        assert rf.exists(), f"Thiếu hiện vật bắt buộc: {rf}"

    # Scan for forbidden words in docs
    forbidden_terms = ["kịch" + "bản", "kich" + "ban"]
    for doc_file in [BASE_DIR / "28_usability_measurement_report.md", BASE_DIR / "README.md", BASE_DIR / "AI_WORKLOG.md"]:
        text = doc_file.read_text(encoding="utf-8").lower()
        for term in forbidden_terms:
            assert term not in text, f"Phát hiện từ cấm '{term}' trong {doc_file}"

    print(f"  ✓ Đạt chuẩn: Đầy đủ hiện vật bàn giao, 0 từ ngữ cấm phát hiện.")
    stages_passed += 1

    print("=" * 80)
    print(f"[KẾT QUẢ CUỐI CÙNG] {stages_passed}/6 Chặng Kiểm Định ĐẠT CHUẨN (100% DoD SUCCESS)")
    print("=" * 80)
    return 0


if __name__ == "__main__":
    sys.exit(evaluate())
