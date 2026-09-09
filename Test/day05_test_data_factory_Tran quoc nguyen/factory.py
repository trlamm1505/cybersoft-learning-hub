from __future__ import annotations

import hashlib
import json
import random
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any


def stable_int(text: str) -> int:
    """Tạo số nguyên ổn định từ text để kết hợp seed + worker."""
    return int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:12], 16)


@dataclass
class Scenario:
    id: str
    category: str
    entity: str
    description: str
    data: dict[str, Any]
    expected_valid: bool
    expected_result: str


class TestDataFactory:
    """
    Test Data Factory cho 4 loại dữ liệu:
    - user
    - course
    - exercise
    - submission

    Tính tái lập:
    Cùng seed + worker_id => cùng dữ liệu.
    Tách worker:
    worker_id được đưa vào ID, email và run_id để tránh đụng nhau khi chạy song song.
    """

    def __init__(self, seed: int = 20260908, worker_id: str = "w0"):
        self.seed = int(seed)
        self.worker_id = worker_id
        combined_seed = self.seed + stable_int(worker_id)
        self.rng = random.Random(combined_seed)
        self.run_id = f"seed{self.seed}_{self.worker_id}"

    def _uid(self, prefix: str, index: int) -> str:
        return f"{prefix}_{self.run_id}_{index:03d}"

    def user(self, index: int = 1, role: str = "student") -> dict[str, Any]:
        return {
            "id": self._uid("usr", index),
            "username": f"qa_{self.worker_id}_{index:03d}",
            "email": f"qa_{self.worker_id}_{index:03d}@example.test",
            "role": role,
            "display_name": f"Test User {index:03d}",
            "active": True,
            "run_id": self.run_id,
        }

    def course(self, index: int = 1) -> dict[str, Any]:
        return {
            "id": self._uid("crs", index),
            "code": f"QA{index:03d}",
            "title": f"Khoá học kiểm thử mẫu {index:03d}",
            "status": "published",
            "owner_id": self._uid("usr", 900 + index),
            "run_id": self.run_id,
        }

    def exercise(self, index: int = 1, exercise_type: str = "quiz") -> dict[str, Any]:
        return {
            "id": self._uid("ex", index),
            "course_id": self._uid("crs", 1),
            "title": f"Bài tập kiểm thử {index:03d}",
            "type": exercise_type,
            "max_score": 10,
            "time_limit_sec": 900,
            "run_id": self.run_id,
        }

    def submission(self, index: int = 1, status: str = "submitted") -> dict[str, Any]:
        return {
            "id": self._uid("sub", index),
            "user_id": self._uid("usr", 1),
            "exercise_id": self._uid("ex", 1),
            "answer": f"sample-answer-{self.worker_id}-{index:03d}",
            "status": status,
            "score": None,
            "run_id": self.run_id,
        }

    def build_20_scenarios(self) -> list[Scenario]:
        s: list[Scenario] = []

        # 1-5: VALID
        s.append(Scenario(
            "SC01", "valid", "user",
            "User học viên hợp lệ",
            self.user(1, "student"), True,
            "Dữ liệu được chấp nhận và tạo user thành công."
        ))
        s.append(Scenario(
            "SC02", "valid", "user",
            "User giảng viên hợp lệ",
            self.user(2, "teacher"), True,
            "Dữ liệu được chấp nhận với role teacher."
        ))
        s.append(Scenario(
            "SC03", "valid", "course",
            "Course hợp lệ",
            self.course(1), True,
            "Course được tạo thành công."
        ))
        s.append(Scenario(
            "SC04", "valid", "exercise",
            "Exercise quiz hợp lệ",
            self.exercise(1, "quiz"), True,
            "Exercise được tạo thành công."
        ))
        s.append(Scenario(
            "SC05", "valid", "submission",
            "Submission hợp lệ",
            self.submission(1), True,
            "Submission được ghi nhận."
        ))

        # 6-10: BOUNDARY
        u6 = self.user(6); u6["username"] = "abc"
        s.append(Scenario(
            "SC06", "boundary", "user",
            "Username ở biên tối thiểu 3 ký tự",
            u6, True,
            "Hệ thống chấp nhận đúng tại biên dưới."
        ))

        u7 = self.user(7); u7["username"] = "u" * 30
        s.append(Scenario(
            "SC07", "boundary", "user",
            "Username ở biên tối đa 30 ký tự",
            u7, True,
            "Hệ thống chấp nhận đúng tại biên trên."
        ))

        c8 = self.course(8); c8["title"] = "A"
        s.append(Scenario(
            "SC08", "boundary", "course",
            "Course title có đúng 1 ký tự",
            c8, True,
            "Hệ thống chấp nhận title ở biên tối thiểu."
        ))

        e9 = self.exercise(9); e9["max_score"] = 0
        s.append(Scenario(
            "SC09", "boundary", "exercise",
            "max_score tại biên dưới bằng 0",
            e9, True,
            "Hệ thống chấp nhận giá trị biên 0 nếu rule cho phép >= 0."
        ))

        e10 = self.exercise(10); e10["time_limit_sec"] = 1
        s.append(Scenario(
            "SC10", "boundary", "exercise",
            "time_limit_sec tại biên dưới bằng 1",
            e10, True,
            "Hệ thống chấp nhận thời gian tối thiểu."
        ))

        # 11-15: INVALID
        u11 = self.user(11); u11["email"] = ""
        s.append(Scenario(
            "SC11", "invalid", "user",
            "Email rỗng",
            u11, False,
            "Bị từ chối với lỗi email bắt buộc."
        ))

        u12 = self.user(12); u12["role"] = "superhero"
        s.append(Scenario(
            "SC12", "invalid", "user",
            "Role không nằm trong danh sách cho phép",
            u12, False,
            "Bị từ chối với lỗi role không hợp lệ."
        ))

        c13 = self.course(13); c13["title"] = ""
        s.append(Scenario(
            "SC13", "invalid", "course",
            "Course title rỗng",
            c13, False,
            "Bị từ chối với lỗi title bắt buộc."
        ))

        e14 = self.exercise(14); e14["max_score"] = -1
        s.append(Scenario(
            "SC14", "invalid", "exercise",
            "max_score âm",
            e14, False,
            "Bị từ chối vì điểm tối đa không được âm."
        ))

        sub15 = self.submission(15); sub15["status"] = "UNKNOWN"
        s.append(Scenario(
            "SC15", "invalid", "submission",
            "Submission status không hợp lệ",
            sub15, False,
            "Bị từ chối vì status ngoài enum."
        ))

        # 16-20: ADVERSARIAL
        u16 = self.user(16); u16["display_name"] = "<script>alert('x')</script>"
        s.append(Scenario(
            "SC16", "adversarial", "user",
            "Chuỗi HTML/script trong display_name",
            u16, False,
            "Không thực thi script; dữ liệu phải được escape/sanitize hoặc từ chối."
        ))

        c17 = self.course(17); c17["title"] = "' OR '1'='1"
        s.append(Scenario(
            "SC17", "adversarial", "course",
            "Chuỗi giống SQL injection trong title",
            c17, True,
            "Không làm thay đổi truy vấn; hệ thống xử lý như text bình thường hoặc từ chối an toàn."
        ))

        e18 = self.exercise(18); e18["title"] = "../../etc/passwd"
        s.append(Scenario(
            "SC18", "adversarial", "exercise",
            "Chuỗi path traversal trong title",
            e18, True,
            "Không được dùng giá trị này làm đường dẫn file; chỉ xử lý như text."
        ))

        sub19 = self.submission(19); sub19["answer"] = "=HYPERLINK(\"http://example.test\",\"x\")"
        s.append(Scenario(
            "SC19", "adversarial", "submission",
            "Chuỗi formula injection khi export CSV/Excel",
            sub19, True,
            "Khi export phải neutralize công thức, không để spreadsheet tự thực thi."
        ))

        sub20 = self.submission(20); sub20["answer"] = "A" * 10000
        s.append(Scenario(
            "SC20", "adversarial", "submission",
            "Payload answer rất dài",
            sub20, False,
            "Hệ thống từ chối hoặc giới hạn kích thước theo validation rule."
        ))

        return s

    def export(self, output_dir: str | Path) -> Path:
        output_dir = Path(output_dir)
        run_dir = output_dir / self.run_id
        run_dir.mkdir(parents=True, exist_ok=True)

        scenarios = [asdict(x) for x in self.build_20_scenarios()]
        output_file = run_dir / "scenarios.json"
        output_file.write_text(
            json.dumps(scenarios, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

        manifest = {
            "seed": self.seed,
            "worker_id": self.worker_id,
            "run_id": self.run_id,
            "scenario_count": len(scenarios),
            "note": "Synthetic test data only. No real PII."
        }
        (run_dir / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
        return run_dir
