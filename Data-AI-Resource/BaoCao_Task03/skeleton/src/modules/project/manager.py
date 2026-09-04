"""Project Bank Manager: Quản lý Capstone Projects và Rubric 100 điểm."""

from typing import Any


class ProjectBankManager:
    """Quản lý các đề tài đồ án mẫu và thang tiêu chí chấm điểm chuẩn hóa."""

    def __init__(self):
        self.projects = {}

    def register_project(
        self, project_id: str, title: str, domain: str, rubric: dict[str, int]
    ) -> dict[str, Any]:
        """Đăng ký một dự án capstone mới kèm barem điểm chuẩn."""
        total_points = sum(rubric.values())
        if total_points != 100:
            raise ValueError(
                f"Tổng điểm Rubric phải bằng đúng 100 điểm! Hiện tại: {total_points}"
            )

        project = {
            "project_id": project_id,
            "title": title,
            "domain": domain,
            "rubric": rubric,
            "status": "ACTIVE",
        }
        self.projects[project_id] = project
        return project
