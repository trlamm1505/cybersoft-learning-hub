"""CYBERSOFT DATA & AI LAB - PYTEST SUITE FOR HR & OPS DATASET (HR_ops_v1).

Author: Dao Trung Kien (Data & AI Resource Engineer)
Task: Day 07 - HR & Operations Multi-table Dataset
"""

from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from scripts.validate_hr_data import (  # noqa: E402
    EXPECTED_COLUMNS,
    REQUIRED_TABLES,
    HRDataValidator,
    load_csv,
)

CLEAN_DIR = BASE_DIR / "data" / "clean"
DIRTY_DIR = BASE_DIR / "data" / "dirty"


class TestCleanDataset:
    """Kiểm tra các tiêu chuẩn nghiệm thu (DoD) của bộ dữ liệu sạch."""

    def test_file_existence(self):
        """Tất cả 5 bảng CSV bắt buộc phải tồn tại."""
        for t_name in REQUIRED_TABLES:
            t_path = CLEAN_DIR / t_name
            assert t_path.exists(), f"Thiếu tệp dữ liệu bắt buộc: {t_name}"

    def test_minimum_row_count_dod(self):
        """Tổng số bản ghi phải đạt tối thiểu 5.000 bản ghi theo tiêu chí nghiệm thu."""
        total_rows = 0
        for t_name in REQUIRED_TABLES:
            data = load_csv(CLEAN_DIR / t_name)
            assert data is not None, f"Không thể đọc tệp {t_name}"
            total_rows += len(data)
        assert (
            total_rows >= 5000
        ), f"Tổng số bản ghi ({total_rows}) chưa đạt chuẩn tối thiểu 5.000."

    def test_schema_and_column_integrity(self):
        """Cấu trúc cột của cả 5 bảng phải khớp 100% với đặc tả Data Dictionary."""
        for t_name, exp_cols in EXPECTED_COLUMNS.items():
            data = load_csv(CLEAN_DIR / t_name)
            actual_cols = list(data[0].keys())
            missing = [c for c in exp_cols if c not in actual_cols]
            assert not missing, f"Bảng {t_name} thiếu các cột: {missing}"

    def test_primary_key_uniqueness(self):
        """Khóa chính trên cả 5 bảng phải duy nhất 100%."""
        pk_mapping = {
            "employees.csv": "employee_id",
            "turnovers.csv": "turnover_id",
            "attendance.csv": "attendance_id",
            "kpi_evaluations.csv": "kpi_id",
            "training_records.csv": "record_id",
        }
        for t_name, pk_col in pk_mapping.items():
            rows = load_csv(CLEAN_DIR / t_name)
            pks = [r[pk_col] for r in rows]
            assert len(pks) == len(
                set(pks)
            ), f"Trùng lặp khóa chính '{pk_col}' trong {t_name}"

    def test_foreign_key_referential_integrity(self):
        """Khóa ngoại giữa các bảng Fact và Dimension employees phải toàn vẹn 100%."""
        employees = load_csv(CLEAN_DIR / "employees.csv")
        valid_emp_ids = {r["employee_id"] for r in employees}

        # Check turnovers
        turnovers = load_csv(CLEAN_DIR / "turnovers.csv")
        for t in turnovers:
            assert (
                t["employee_id"] in valid_emp_ids
            ), f"Khóa ngoại thôi việc mồ côi: {t['employee_id']}"

        # Check attendance
        attendance = load_csv(CLEAN_DIR / "attendance.csv")
        for a in attendance:
            assert (
                a["employee_id"] in valid_emp_ids
            ), f"Khóa ngoại chấm công mồ côi: {a['employee_id']}"

        # Check KPI evaluations
        kpis = load_csv(CLEAN_DIR / "kpi_evaluations.csv")
        for k in kpis:
            assert (
                k["employee_id"] in valid_emp_ids
            ), f"Khóa ngoại KPI mồ côi: {k['employee_id']}"

        # Check training records
        trainings = load_csv(CLEAN_DIR / "training_records.csv")
        for tr in trainings:
            assert (
                tr["employee_id"] in valid_emp_ids
            ), f"Khóa ngoại đào tạo mồ côi: {tr['employee_id']}"

    def test_turnover_kpi_cross_validation(self):
        """Kiểm tra đối soát chéo biến động nhân sự: số lượng Resigned phải khớp 100%."""
        employees = load_csv(CLEAN_DIR / "employees.csv")
        turnovers = load_csv(CLEAN_DIR / "turnovers.csv")

        resigned_emps = {
            r["employee_id"] for r in employees if r["status"] == "Resigned"
        }
        turnover_emps = {r["employee_id"] for r in turnovers}

        assert (
            resigned_emps == turnover_emps
        ), "Danh sách nhân viên Resigned không khớp với bảng turnovers!"
        assert (
            len(turnovers) == 35
        ), f"Số lượng hồ sơ thôi việc ({len(turnovers)}) không đúng kỳ vọng 35."

    def test_clean_validation_pass_zero_errors(self):
        """Toàn bộ pipeline validation trên bản clean phải trả về 0 vi phạm (PASS 100%)."""
        validator = HRDataValidator(CLEAN_DIR)
        is_valid = validator.run_all_checks()
        assert (
            is_valid is True
        ), f"Bản clean phát sinh lỗi vi phạm: {validator.violations}"
        assert len(validator.violations) == 0


class TestDirtyDataset:
    """Kiểm tra khả năng phát hiện lỗi có chủ ý trên bộ dữ liệu dirty."""

    def test_dirty_validation_detects_all_anomalies(self):
        """Validator phải bắt chính xác toàn bộ các lỗi cài cắm trong bản dirty."""
        validator = HRDataValidator(DIRTY_DIR)
        is_valid = validator.run_all_checks()
        assert is_valid is False, "Bản dirty phải bị gắn cờ FAIL."
        assert (
            len(validator.violations) >= 20
        ), f"Bản dirty phải bắt ít nhất 20 vi phạm (bắt được {len(validator.violations)})."

        # Kiểm tra sự xuất hiện của các mã lỗi vi phạm
        rule_ids = {v["rule_id"] for v in validator.violations}
        assert "VAL-04" in rule_ids  # FK Orphan
        assert "VAL-05" in rule_ids  # Inverted time / inconsistent status
        assert "VAL-06" in rule_ids  # Out-of-bounds salary / KPI
        assert "VAL-07" in rule_ids  # Turnover cross-validation
        assert "VAL-08" in rule_ids  # Ghost attendance
        assert "VAL-09" in rule_ids  # Duplicate attendance
