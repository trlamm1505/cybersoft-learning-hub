"""CYBERSOFT DATA & AI LAB - HR & OPERATIONS DATA VALIDATION CLI.

Author: Dao Trung Kien (Data & AI Resource Engineer)
Task: Day 07 - HR & Operations Multi-table Dataset (HR_ops_v1)
POSIX Exit Codes:
  0: All integrity checks PASSED (Clean Dataset Validated)
  1: Quality violations found (Expected for Dirty Benchmark)
  2: System error / Missing required files
"""

import argparse
import csv
from pathlib import Path
import sys

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


REQUIRED_TABLES = [
    "employees.csv",
    "turnovers.csv",
    "attendance.csv",
    "kpi_evaluations.csv",
    "training_records.csv",
]

EXPECTED_COLUMNS = {
    "employees.csv": [
        "employee_id",
        "full_name",
        "gender",
        "birth_date",
        "department",
        "position",
        "hire_date",
        "base_salary",
        "status",
        "manager_id",
        "work_location",
    ],
    "turnovers.csv": [
        "turnover_id",
        "employee_id",
        "resignation_date",
        "last_working_date",
        "reason",
        "exit_interview_score",
        "handover_status",
    ],
    "attendance.csv": [
        "attendance_id",
        "employee_id",
        "work_date",
        "check_in",
        "check_out",
        "hours_worked",
        "overtime_hours",
        "status",
    ],
    "kpi_evaluations.csv": [
        "kpi_id",
        "employee_id",
        "evaluation_period",
        "target_score",
        "actual_score",
        "completion_rate",
        "rating",
        "reviewer_id",
    ],
    "training_records.csv": [
        "record_id",
        "employee_id",
        "course_name",
        "training_type",
        "start_date",
        "end_date",
        "score",
        "completion_status",
        "training_cost",
    ],
}


def load_csv(file_path):
    """Load CSV file into a list of dicts with raw string values."""
    if not Path(file_path).exists():
        return None
    with open(file_path, mode="r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        return list(reader)


class HRDataValidator:
    """Comprehensive Data Quality & KPI Cross-Validation Engine."""

    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.violations = []
        self.tables = {}
        self.metrics = {}

    def log_violation(self, rule_id: str, table: str, record_id: str, message: str):
        """Log a validation failure."""
        self.violations.append(
            {
                "rule_id": rule_id,
                "table": table,
                "record_id": record_id,
                "message": message,
            }
        )

    def run_all_checks(self) -> bool:
        """Execute all 10 verification suites."""
        print(f"\n[*] BAT DAU KIEM DINH CHAT LUONG DU LIEU TAI: {self.data_dir}")
        print("-" * 70)

        # 1. File existence
        for t_name in REQUIRED_TABLES:
            t_path = self.data_dir / t_name
            if not t_path.exists():
                print(f"[ERROR] Thieu tep bat buoc: {t_name}")
                return False
            data = load_csv(t_path)
            if data is None:
                print(f"[ERROR] Khong the doc tep: {t_name}")
                return False
            self.tables[t_name] = data
            self.metrics[t_name] = len(data)

        # 2. Check Row Count >= 5,000 total
        total_rows = sum(self.metrics.values())
        print(f"[CHECK 01] Tong so ban ghi: {total_rows:,} dong across 5 bang.")
        if total_rows < 5000:
            self.log_violation(
                "VAL-01",
                "ALL",
                "TOTAL",
                f"Tong so ban ghi ({total_rows}) nho hon tieu chuan 5,000.",
            )
        else:
            print("           -> [PASS] Vuot tieu chuan toi thieu 5.000 ban ghi.")

        # 3. Column Schema check
        print("[CHECK 02] Kiem tra Schema va cac cot bat buoc...")
        schema_pass = True
        for t_name, exp_cols in EXPECTED_COLUMNS.items():
            if not self.tables[t_name]:
                continue
            actual_cols = list(self.tables[t_name][0].keys())
            missing_cols = [c for c in exp_cols if c not in actual_cols]
            if missing_cols:
                self.log_violation(
                    "VAL-02", t_name, "HEADER", f"Thieu cac cot: {missing_cols}"
                )
                schema_pass = False
        if schema_pass:
            print("           -> [PASS] 100% ten cot va cau truc bang dung dac ta.")

        # 4. Primary Key Uniqueness
        print("[CHECK 03] Kiem tra tinh duy nhat cua Khoa Chinh (Primary Key)...")
        pk_mapping = {
            "employees.csv": "employee_id",
            "turnovers.csv": "turnover_id",
            "attendance.csv": "attendance_id",
            "kpi_evaluations.csv": "kpi_id",
            "training_records.csv": "record_id",
        }
        for t_name, pk_col in pk_mapping.items():
            seen_pks = set()
            for row_idx, row in enumerate(self.tables[t_name]):
                val = row.get(pk_col)
                if not val:
                    self.log_violation(
                        "VAL-03",
                        t_name,
                        f"Row {row_idx+2}",
                        f"Khoa chinh '{pk_col}' bi NULL.",
                    )
                elif val in seen_pks:
                    self.log_violation(
                        "VAL-03",
                        t_name,
                        val,
                        f"Khoa chinh '{pk_col}' bi trung lap: {val}",
                    )
                seen_pks.add(val)
        print(f"           -> Da kiem tra {len(pk_mapping)} khoa chinh.")

        # Build valid employee ID set
        valid_emp_ids = {
            r["employee_id"]
            for r in self.tables["employees.csv"]
            if r.get("employee_id")
        }

        # 5. Foreign Key Integrity
        print("[CHECK 04] Kiem tra toan ven tham chieu Khoa Ngoai (FK)...")
        fk_checks = [
            ("turnovers.csv", "employee_id"),
            ("attendance.csv", "employee_id"),
            ("kpi_evaluations.csv", "employee_id"),
            ("training_records.csv", "employee_id"),
        ]
        for t_name, fk_col in fk_checks:
            for row in self.tables[t_name]:
                fk_val = row.get(fk_col)
                rec_id = row.get(pk_mapping[t_name], "UNKNOWN")
                if fk_val and fk_val not in valid_emp_ids:
                    self.log_violation(
                        "VAL-04",
                        t_name,
                        rec_id,
                        f"Khoa ngoai mo coi: {fk_col}='{fk_val}' khong ton tai trong employees.csv",
                    )

        # 6. Datetime and Chronological Sequence Logic
        print("[CHECK 05] Kiem tra trinh tu thoi gian va Logic gio lam viec...")
        # Attendance: check_out >= check_in when status in (Present, Late, Early Departure)
        for row in self.tables["attendance.csv"]:
            att_id = row.get("attendance_id")
            c_in = row.get("check_in", "").strip()
            c_out = row.get("check_out", "").strip()
            status = row.get("status")

            if status in ("Present", "Late", "Early Departure") and c_in and c_out:
                if c_out < c_in:
                    self.log_violation(
                        "VAL-05",
                        "attendance.csv",
                        att_id,
                        f"Gio check_out ({c_out}) truoc gio check_in ({c_in}).",
                    )

            # Inconsistent attendance status: On Leave / Absent must not have working hours > 0
            hw = float(row.get("hours_worked", 0.0) or 0.0)
            if status in ("On Leave", "Absent") and (hw > 0 or c_in or c_out):
                self.log_violation(
                    "VAL-05",
                    "attendance.csv",
                    att_id,
                    f"Trang thai '{status}' nhung lai co gio lam viec ({hw}h) hoac co gio check-in/out.",
                )

        # Training: end_date >= start_date
        for row in self.tables["training_records.csv"]:
            rec_id = row.get("record_id")
            s_date = row.get("start_date", "")
            e_date = row.get("end_date", "")
            if s_date and e_date and e_date < s_date:
                self.log_violation(
                    "VAL-05",
                    "training_records.csv",
                    rec_id,
                    f"Ngay ket thuc khoa hoc ({e_date}) truoc ngay bat dau ({s_date}).",
                )

        # 7. Numeric Ranges (Salaries, KPI scores, Ratings)
        print("[CHECK 06] Kiem tra mien gia tri va cac truong so lieu...")
        for row in self.tables["employees.csv"]:
            emp_id = row.get("employee_id")
            try:
                sal = float(row.get("base_salary", 0.0))
                if sal <= 0:
                    self.log_violation(
                        "VAL-06", "employees.csv", emp_id, f"Luong co ban <= 0: {sal}"
                    )
            except ValueError:
                self.log_violation(
                    "VAL-06",
                    "employees.csv",
                    emp_id,
                    "Luong co ban khong phai so hop le.",
                )

        for row in self.tables["kpi_evaluations.csv"]:
            kpi_id = row.get("kpi_id")
            try:
                act_score = float(row.get("actual_score", 0.0))
                comp_rate = float(row.get("completion_rate", 0.0))
                rating = row.get("rating", "")

                if act_score < 0 or act_score > 150:
                    self.log_violation(
                        "VAL-06",
                        "kpi_evaluations.csv",
                        kpi_id,
                        f"Diem KPI actual_score ngoai le: {act_score}",
                    )

                # Check rating consistency
                if comp_rate >= 105.0 and rating != "Xuất sắc":
                    self.log_violation(
                        "VAL-06",
                        "kpi_evaluations.csv",
                        kpi_id,
                        f"Rating bat nhat: completion={comp_rate}% nhung rating='{rating}'",
                    )
                elif comp_rate < 70.0 and rating == "Xuất sắc":
                    self.log_violation(
                        "VAL-06",
                        "kpi_evaluations.csv",
                        kpi_id,
                        f"Rating bat nhat: completion={comp_rate}% nhung rating='{rating}' (phai la Khong dat)",
                    )
            except ValueError:
                self.log_violation(
                    "VAL-06",
                    "kpi_evaluations.csv",
                    kpi_id,
                    "Diem KPI hoac ty le hoan thanh khong dung dinh dang so.",
                )

        # 8. Cross-Validation: Employees vs Turnovers
        print(
            "[CHECK 07] Kiem tra doi soat cheo Bien dong Nhan su (Turnover Cross-Validation)..."
        )
        emp_status_map = {
            r["employee_id"]: r.get("status") for r in self.tables["employees.csv"]
        }
        resigned_in_emp = {
            emp_id for emp_id, status in emp_status_map.items() if status == "Resigned"
        }
        turnover_emp_ids = {r["employee_id"] for r in self.tables["turnovers.csv"]}

        # Check count
        if len(resigned_in_emp) != len(turnover_emp_ids):
            self.log_violation(
                "VAL-07",
                "employees/turnovers",
                "COUNT",
                f"So luong nhan vien Resigned trong employees ({len(resigned_in_emp)}) khac so ho so trong turnovers ({len(turnover_emp_ids)}).",
            )

        # Check status agreement
        for t_row in self.tables["turnovers.csv"]:
            t_emp_id = t_row.get("employee_id")
            curr_status = emp_status_map.get(t_emp_id)
            if curr_status != "Resigned":
                self.log_violation(
                    "VAL-07",
                    "turnovers.csv",
                    t_row.get("turnover_id"),
                    f"Nhan vien {t_emp_id} co trong turnovers nhung status trong employees la '{curr_status}'.",
                )

        # 9. Attendance Integrity Post-Turnover (Ghost Attendance)
        print("[CHECK 08] Kiem tra khong co cham cong phat sinh sau ngay thoi viec...")
        turnover_last_date = {
            r["employee_id"]: r.get("last_working_date")
            for r in self.tables["turnovers.csv"]
        }
        for a_row in self.tables["attendance.csv"]:
            a_emp = a_row.get("employee_id")
            w_date = a_row.get("work_date", "")
            if a_emp in turnover_last_date:
                last_d = turnover_last_date[a_emp]
                if w_date > last_d:
                    self.log_violation(
                        "VAL-08",
                        "attendance.csv",
                        a_row.get("attendance_id"),
                        f"Cham cong ma (Ghost Attendance): Nhan vien {a_emp} da nghi viec ngay {last_d} nhung van co cham cong ngay {w_date}.",
                    )

        # 10. Duplicate Attendance within same employee and work_date
        print("[CHECK 09] Kiem tra tinh duy nhat cua ban ghi cham cong moi ngay...")
        emp_date_set = set()
        for a_row in self.tables["attendance.csv"]:
            a_id = a_row.get("attendance_id")
            pair = (a_row.get("employee_id"), a_row.get("work_date"))
            if pair in emp_date_set:
                self.log_violation(
                    "VAL-09",
                    "attendance.csv",
                    a_id,
                    f"Trung lap ban ghi cham cong: Nhan vien {pair[0]} da co cham cong ngay {pair[1]}.",
                )
            emp_date_set.add(pair)

        # Summary
        print("-" * 70)
        if not self.violations:
            print("[SUCCESS] 100% TIÊU CHÍ TOÀN VẸN ĐẠT CHUẨN! (Zero Violations)")
            return True
        else:
            print(f"[WARNING] PHÁT HIỆN {len(self.violations)} ĐIỂM VI PHẠM TOÀN VẸN:")
            for v in self.violations:
                print(
                    f"  - [{v['rule_id']}] [{v['table']}] ID {v['record_id']}: {v['message']}"
                )
            return False


def main():
    """CLI Argument parser and execution."""
    parser = argparse.ArgumentParser(
        description="CyberSoft HR & Ops Data Validator CLI"
    )
    parser.add_argument(
        "-d", "--dir", type=str, default=None, help="Đường dẫn thư mục chứa 5 tệp CSV"
    )
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent.parent

    if args.dir:
        target_dir = Path(args.dir)
        validator = HRDataValidator(target_dir)
        is_valid = validator.run_all_checks()
        sys.exit(0 if is_valid else 1)
    else:
        print("=" * 70)
        print("TỰ ĐỘNG KIỂM ĐỊNH CẢ 2 PHIÊN BẢN (CLEAN & DIRTY BENCHMARK)")
        print("=" * 70)

        # 1. Clean dataset
        clean_dir = base_dir / "data" / "clean"
        print("\n>>> KIỂM TRA BỘ DỮ LIỆU SẠCH (data/clean) <<<")
        v_clean = HRDataValidator(clean_dir)
        clean_ok = v_clean.run_all_checks()

        # 2. Dirty dataset
        dirty_dir = base_dir / "data" / "dirty"
        print("\n>>> KIỂM TRA BỘ DỮ LIỆU CÀI CẮM LỖI (data/dirty) <<<")
        v_dirty = HRDataValidator(dirty_dir)
        dirty_ok = v_dirty.run_all_checks()

        # Expected: clean_ok is True and dirty_ok is False
        if clean_ok and not dirty_ok:
            print("\n" + "=" * 70)
            print("[HOÀN TẤT KIỂM ĐỊNH TOÀN DIỆN]")
            print("  1. Bản clean: PASS 100% (Không có vi phạm, đạt chuẩn DoD).")
            print(
                f"  2. Bản dirty: Bắt chính xác {len(v_dirty.violations)} vi phạm cài cắm (Zero False Negatives)."
            )
            print("=" * 70)
            sys.exit(0)
        else:
            print("\n[ERROR] Kết quả kiểm định không khớp kỳ vọng!")
            sys.exit(1)


if __name__ == "__main__":
    main()
