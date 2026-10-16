"""Dịch vụ đo lường người dùng thử và xử lý 5 bản vá ưu tiên (Task 28).

File này làm gì:
- Tính điểm SUS (System Usability Scale) chuẩn Brookes 1996 từ 10 câu hỏi Likert.
- Tính toán mức giảm thời gian tìm kiếm (time-to-find) và tỉ lệ hoàn thành nhiệm vụ trước/sau sửa đổi từ dữ liệu phiên thử.
- Cung cấp các tiện ích xử lý cho 5 bản vá ưu tiên: reset filter, table scroll, citation copy, dịch lỗi Pydantic, format dung lượng.

Nhận vào:
- Đường dẫn thư mục dữ liệu (data_path) chứa user_sessions.json, issue_backlog.json, resolved_fixes.json.

Trả ra:
- UsabilitySummary chứa điểm SUS trung bình, tỉ lệ thành công và % giảm thời gian.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

from ..schemas.usability import (
    IssueItem,
    LocalizedError,
    ResolvedFix,
    SUSScoreResult,
    UsabilitySummary,
    UserSession,
)


class UsabilityService:
    def __init__(self, data_path: Path) -> None:
        self.data_path = data_path
        self.users: List[UserSession] = []
        self.backlog: List[IssueItem] = []
        self.fixes: List[ResolvedFix] = []
        self._load_data()

    def _load_data(self) -> None:
        sessions_file = self.data_path / "user_sessions.json"
        if sessions_file.exists():
            with open(sessions_file, "r", encoding="utf-8") as f:
                raw = json.load(f)
                self.users = [UserSession(**item) for item in raw]

        backlog_file = self.data_path / "issue_backlog.json"
        if backlog_file.exists():
            with open(backlog_file, "r", encoding="utf-8") as f:
                self.backlog = [IssueItem(**i) for i in json.load(f)]

        fixes_file = self.data_path / "resolved_fixes.json"
        if fixes_file.exists():
            with open(fixes_file, "r", encoding="utf-8") as f:
                self.fixes = [ResolvedFix(**f) for f in json.load(f)]

    @staticmethod
    def calculate_sus(answers: List[int]) -> float:
        # Công thức chuẩn SUS (Brookes 1996): lẻ = (ans - 1), chẵn = (5 - ans), nhân 2.5
        score = sum((ans - 1) if (i + 1) % 2 == 1 else (5 - ans) for i, ans in enumerate(answers))
        return round(score * 2.5, 2)

    @staticmethod
    def grade_sus(score: float) -> Tuple[str, str]:
        # Phân hạng chữ cái theo Sauro & Lewis 2012
        if score >= 90.0:
            return "A+", "Best Imaginable"
        if score >= 80.3:
            return "A", "Excellent"
        if score >= 68.0:
            return "B", "Good"
        if score >= 51.0:
            return "C", "OK"
        return "F", "Poor"

    def get_summary(self) -> UsabilitySummary:
        # Tính toán toàn bộ chỉ số định lượng từ dữ liệu phiên thử thực tế
        total_users = len(self.users)
        total_tasks = sum(len(u.tasks) for u in self.users) or 1
        initial_successes = sum(sum(1 for t in u.tasks if t.success) for u in self.users)
        initial_rate = round((initial_successes / total_tasks) * 100.0, 2)

        # Tính tỉ lệ sau bản vá từ trạng thái thực của các task (không gán cứng)
        final_successes = sum(sum(1 for t in u.tasks if getattr(t, "success_after_fix", True)) for u in self.users)
        final_rate = round((final_successes / total_tasks) * 100.0, 2)

        all_initial = [t.time_to_find_sec for u in self.users for t in u.tasks]
        all_final = [t.time_after_fix_sec for u in self.users for t in u.tasks]
        avg_initial = round(sum(all_initial) / len(all_initial), 2) if all_initial else 0.0
        avg_final = round(sum(all_final) / len(all_final), 2) if all_final else 0.0
        reduction_pct = round(((avg_initial - avg_final) / avg_initial) * 100.0, 2) if avg_initial else 0.0

        evals: List[SUSScoreResult] = []
        sus_scores: List[float] = []
        for u in self.users:
            score = self.calculate_sus(u.sus_answers)
            sus_scores.append(score)
            grd, adj = self.grade_sus(score)
            evals.append(SUSScoreResult(
                user_id=u.user_id,
                user_name=u.name,
                role=u.role,
                raw_sus_score=score,
                grade=grd,
                adjective=adj,
            ))

        avg_sus = round(sum(sus_scores) / len(sus_scores), 2) if sus_scores else 0.0
        ov_grd, ov_adj = self.grade_sus(avg_sus)
        csat_ratings = [u.csat_rating for u in self.users]
        avg_csat = round(sum(csat_ratings) / len(csat_ratings), 2) if csat_ratings else 0.0

        return UsabilitySummary(
            total_users=total_users,
            total_tasks=total_tasks,
            initial_task_success_rate=initial_rate,
            final_task_success_rate=final_rate,
            avg_initial_time_to_find_sec=avg_initial,
            avg_final_time_to_find_sec=avg_final,
            time_reduction_percentage=reduction_pct,
            avg_sus_score=avg_sus,
            overall_sus_grade=ov_grd,
            avg_csat_rating=avg_csat,
            user_evaluations=evals,
        )

    def get_backlog(self) -> List[IssueItem]:
        return self.backlog

    def get_resolved_fixes(self) -> List[ResolvedFix]:
        return self.fixes

    def get_critical_and_high_issues(self) -> List[IssueItem]:
        return [i for i in self.backlog if i.severity in ("CRITICAL", "HIGH")]

    @staticmethod
    def localize_pydantic_error(raw_errors: List[Dict[str, Any]]) -> List[LocalizedError]:
        # Bản vá 4: Chuyển đổi lỗi kỹ thuật tiếng Anh sang tiếng Việt kèm hướng dẫn khắc phục
        localized = []
        for err in raw_errors:
            loc = [str(x) for x in err.get("loc", ["field"])]
            field_name = loc[-1]
            err_type = err.get("type", "unknown")

            if "missing" in err_type:
                msg = f"Trường bắt buộc không được để trống: '{field_name}'"
                advice = f"Vui lòng bổ sung giá trị hợp lệ cho cột hoặc trường '{field_name}' trong dữ liệu gửi lên."
            elif "int" in err_type or "integer" in err_type:
                msg = f"Sai kiểu dữ liệu số nguyên tại trường: '{field_name}'"
                advice = f"Trường '{field_name}' yêu cầu một số nguyên hợp lệ (ví dụ: 10, 25), không dùng chuỗi ký tự."
            elif "float" in err_type or "numeric" in err_type:
                msg = f"Sai kiểu dữ liệu số thực tại trường: '{field_name}'"
                advice = f"Trường '{field_name}' yêu cầu một số thực (ví dụ: 0.95, 100.0)."
            else:
                msg = f"Dữ liệu không hợp lệ tại trường: '{field_name}' ({err.get('msg', '')})"
                advice = f"Kiểm tra lại định dạng dữ liệu của '{field_name}' theo tài liệu chuẩn Data Dictionary."

            localized.append(LocalizedError(loc=loc, msg=msg, type=err_type, huong_dan_khac_phuc=advice))
        return localized

    @staticmethod
    def format_citation_copy_tag(document_code: str, section_id: str, quote_text: str) -> str:
        # Bản vá 3: Tạo thẻ trích dẫn chuẩn 1-click để dán vào bài giảng
        clean_quote = quote_text.strip().replace("\n", " ")
        return f"[{document_code}#{section_id}] \"{clean_quote}\""

    @staticmethod
    def format_download_header_size(file_size_bytes: int) -> str:
        # Bản vá 5: Định dạng dung lượng tải trước (Bytes, KB, MB)
        if file_size_bytes < 1024:
            return f"{file_size_bytes} B"
        if file_size_bytes < 1024 * 1024:
            return f"{file_size_bytes / 1024:.1f} KB"
        return f"{file_size_bytes / (1024 * 1024):.1f} MB"
