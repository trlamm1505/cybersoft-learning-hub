"""CYBERSOFT DATA & AI LAB - SYNTHETIC HR & OPERATIONS DATASET GENERATOR.

Author: Dao Trung Kien (Data & AI Resource Engineer)
Task: Day 07 - HR & Operations Multi-table Dataset (HR_ops_v1)
Seed: 42 (Deterministic & Reproducible)
"""

import csv
import json
from pathlib import Path
import random
import sys

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ---------------------------------------------------------------------------
# CONSTANTS & SYNTHETIC DICTIONARIES (ZERO PII)
# ---------------------------------------------------------------------------

VIETNAMESE_HO = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Huỳnh",
    "Phan",
    "Vũ",
    "Võ",
    "Đặng",
    "Bùi",
    "Đỗ",
    "Hồ",
    "Ngô",
    "Dương",
    "Đinh",
]

VIETNAMESE_DEM_NAM = [
    "Văn",
    "Đình",
    "Hữu",
    "Minh",
    "Đức",
    "Quốc",
    "Gia",
    "Thành",
    "Hải",
    "Tuấn",
]

VIETNAMESE_DEM_NU = [
    "Thị",
    "Thanh",
    "Ngọc",
    "Thu",
    "Mai",
    "Phương",
    "Hải",
    "Khánh",
    "Mỹ",
    "Thùy",
]

VIETNAMESE_TEN_NAM = [
    "An",
    "Bình",
    "Cường",
    "Dũng",
    "Đạt",
    "Huy",
    "Hải",
    "Hùng",
    "Khoa",
    "Kiên",
    "Long",
    "Minh",
    "Nam",
    "Nghĩa",
    "Phong",
    "Phúc",
    "Quân",
    "Quang",
    "Sơn",
    "Thắng",
    "Thịnh",
    "Tiến",
    "Toàn",
    "Trung",
    "Tú",
    "Việt",
    "Vinh",
    "Vũ",
]

VIETNAMESE_TEN_NU = [
    "Anh",
    "Bích",
    "Châu",
    "Dung",
    "Duyên",
    "Giang",
    "Hà",
    "Hạnh",
    "Hoa",
    "Hương",
    "Huyền",
    "Lan",
    "Linh",
    "Mai",
    "Nga",
    "Ngân",
    "Nhi",
    "Nhung",
    "Oanh",
    "Phương",
    "Quỳnh",
    "Thảo",
    "Trang",
    "Trâm",
    "Tuyết",
    "Uyên",
    "Vân",
    "Vy",
    "Yến",
]

DEPARTMENTS = [
    {
        "name": "Kỹ thuật & Công nghệ",
        "code": "ENG",
        "positions": [
            ("Backend Engineer", 18000000, 38000000),
            ("Frontend Engineer", 16000000, 35000000),
            ("Data Engineer", 20000000, 42000000),
            ("AI/ML Engineer", 22000000, 48000000),
            ("DevOps Engineer", 20000000, 40000000),
            ("QA Automation Engineer", 15000000, 30000000),
            ("Engineering Lead", 38000000, 52000000),
        ],
        "weight": 35,
    },
    {
        "name": "Đào tạo & Học vụ",
        "code": "ACA",
        "positions": [
            ("Giảng viên Full-stack", 20000000, 40000000),
            ("Giảng viên Data & AI", 22000000, 45000000),
            ("Mentor Học tập", 12000000, 20000000),
            ("Trợ giảng Kỹ thuật", 8000000, 14000000),
            ("Chuyên viên R&D Khóa học", 16000000, 30000000),
            ("Trưởng nhóm Đào tạo", 32000000, 48000000),
        ],
        "weight": 25,
    },
    {
        "name": "Kinh doanh & Marketing",
        "code": "MKT",
        "positions": [
            ("Chuyên viên Tư vấn Tuyển sinh", 10000000, 22000000),
            ("Digital Marketing Specialist", 14000000, 28000000),
            ("Content Creator", 11000000, 20000000),
            ("Partnership Executive", 15000000, 30000000),
            ("Sales Team Leader", 25000000, 42000000),
        ],
        "weight": 20,
    },
    {
        "name": "Vận hành & Hỗ trợ",
        "code": "OPS",
        "positions": [
            ("Customer Success Executive", 10000000, 18000000),
            ("IT Helpdesk System", 11000000, 20000000),
            ("Facility Coordinator", 9000000, 16000000),
            ("Operations Supervisor", 22000000, 35000000),
        ],
        "weight": 12,
    },
    {
        "name": "Nhân sự & Hành chính",
        "code": "HRD",
        "positions": [
            ("Talent Acquisition Specialist", 13000000, 25000000),
            ("C&B Specialist", 14000000, 26000000),
            ("HR Operations Officer", 10000000, 18000000),
            ("HR Manager", 35000000, 50000000),
        ],
        "weight": 8,
    },
]

LOCATIONS = ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng"]
LOCATION_WEIGHTS = [65, 25, 10]

TRAINING_COURSES = [
    ("Phân tích Dữ liệu với SQL & Power BI", "Kỹ thuật", 3500000),
    ("Ứng dụng AI & Prompt Engineering trong Giáo dục", "Kỹ thuật", 4500000),
    ("Kỹ năng Trình bày & Giảng dạy Truyền cảm hứng", "Kỹ năng mềm", 2500000),
    ("Quản trị Dự án Agile/Scrum Chuẩn Quốc tế", "Lãnh đạo", 5000000),
    ("An toàn Thông tin & Tuân thủ ISO 27001", "Tuân thủ", 2000000),
    ("Tư duy Dịch vụ Khách hàng Xuất sắc", "Kỹ năng mềm", 1800000),
    ("Kỹ năng Lãnh đạo Đội ngũ Hiệu suất cao", "Lãnh đạo", 6500000),
    ("Python Nâng cao cho Tự động hóa Quy trình", "Kỹ thuật", 4000000),
]

RESIGNATION_REASONS = [
    "Cơ hội phát triển nghề nghiệp tốt hơn",
    "Chuyển nơi cư trú hoặc việc gia đình",
    "Chuyển hướng chuyên môn / khởi nghiệp",
    "Thu nhập và chế độ đãi ngộ cạnh tranh",
    "Lý do sức khỏe và cân bằng công việc",
]


def remove_accents(text: str) -> str:
    """Strip Vietnamese diacritics for email generation."""
    mapping = {
        "à": "a",
        "á": "a",
        "ả": "a",
        "ã": "a",
        "ạ": "a",
        "ă": "a",
        "ằ": "a",
        "ắ": "a",
        "ẳ": "a",
        "ẵ": "a",
        "ặ": "a",
        "â": "a",
        "ầ": "a",
        "ấ": "a",
        "ẩ": "a",
        "ẫ": "a",
        "ậ": "a",
        "đ": "d",
        "è": "e",
        "é": "e",
        "ẻ": "e",
        "ẽ": "e",
        "ẹ": "e",
        "ê": "e",
        "ề": "e",
        "ế": "e",
        "ể": "e",
        "ễ": "e",
        "ệ": "e",
        "ì": "i",
        "í": "i",
        "ỉ": "i",
        "ĩ": "i",
        "ị": "i",
        "ò": "o",
        "ó": "o",
        "ỏ": "o",
        "õ": "o",
        "ọ": "o",
        "ô": "o",
        "ồ": "o",
        "ố": "o",
        "ổ": "o",
        "ỗ": "o",
        "ộ": "o",
        "ơ": "o",
        "ờ": "o",
        "ớ": "o",
        "ở": "o",
        "ỡ": "o",
        "ợ": "o",
        "ù": "u",
        "ú": "u",
        "ủ": "u",
        "ũ": "u",
        "ụ": "u",
        "ư": "u",
        "ừ": "u",
        "ứ": "u",
        "ử": "u",
        "ữ": "u",
        "ự": "u",
        "ỳ": "y",
        "ý": "y",
        "ỷ": "y",
        "ỹ": "y",
        "ỵ": "y",
    }
    result = []
    for char in text.lower():
        result.append(mapping.get(char, char))
    return "".join(result)


def generate_employees(num_employees=250, num_resigned=35):
    """Generate deterministic employee records."""
    employees = []
    dept_choices = []
    for dept in DEPARTMENTS:
        dept_choices.extend([dept] * dept.get("weight", 10))

    # Pre-determine which employee indices will be resigned (35 out of 250)
    # Pick some newer hires and some older to be realistic
    resigned_indices = set(random.sample(range(10, num_employees), num_resigned))

    managers_by_dept = {}

    for i in range(1, num_employees + 1):
        emp_id = f"EMP{i:03d}"
        gender = "Nam" if random.random() < 0.55 else "Nữ"
        ho = random.choice(VIETNAMESE_HO)
        if gender == "Nam":
            dem = random.choice(VIETNAMESE_DEM_NAM)
            ten = random.choice(VIETNAMESE_TEN_NAM)
        else:
            dem = random.choice(VIETNAMESE_DEM_NU)
            ten = random.choice(VIETNAMESE_TEN_NU)
        full_name = f"{ho} {dem} {ten}"

        # Age 22 to 50
        birth_year = random.randint(1975, 2002)
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        birth_date = f"{birth_year:04d}-{birth_month:02d}-{birth_day:02d}"

        dept_obj = random.choice(dept_choices)
        dept_name = dept_obj["name"]

        # If first few per department, make them Manager/Lead
        if dept_name not in managers_by_dept:
            position_info = [
                p
                for p in dept_obj["positions"]
                if "Lead" in p[0] or "Manager" in p[0] or "Supervisor" in p[0]
            ]
            pos_title, min_sal, max_sal = (
                position_info[0] if position_info else dept_obj["positions"][-1]
            )
            managers_by_dept[dept_name] = emp_id
            manager_id = ""  # Top level reports to Director
            hire_year = random.randint(2021, 2022)
        else:
            pos_title, min_sal, max_sal = random.choice(dept_obj["positions"])
            manager_id = managers_by_dept[dept_name]
            hire_year = random.randint(2022, 2025)

        hire_month = random.randint(1, 12) if hire_year < 2025 else random.randint(1, 9)
        hire_day = random.randint(1, 28)
        hire_date = f"{hire_year:04d}-{hire_month:02d}-{hire_day:02d}"

        # Base salary stepped by 500,000 VND
        raw_sal = random.randint(min_sal // 500000, max_sal // 500000) * 500000
        base_salary = float(raw_sal)

        is_resigned = (i - 1) in resigned_indices
        status = "Resigned" if is_resigned else "Active"

        location = random.choices(LOCATIONS, weights=LOCATION_WEIGHTS)[0]

        employees.append(
            {
                "employee_id": emp_id,
                "full_name": full_name,
                "gender": gender,
                "birth_date": birth_date,
                "department": dept_name,
                "position": pos_title,
                "hire_date": hire_date,
                "base_salary": base_salary,
                "status": status,
                "manager_id": manager_id,
                "work_location": location,
            }
        )

    return employees


def generate_turnovers(employees):
    """Generate turnover records strictly matching employees with status == 'Resigned'."""
    turnovers = []
    t_idx = 1

    for emp in employees:
        if emp["status"] != "Resigned":
            continue

        turnover_id = f"TRN{t_idx:03d}"
        t_idx += 1

        # Resignation date at least 3 months after hire_date, within 2025
        hire_y, hire_m, hire_d = map(int, emp["hire_date"].split("-"))
        resign_y = 2025
        min_m = hire_m + 3 if hire_y == 2025 else 1
        if min_m > 10:
            min_m = 10
        resign_m = random.randint(min_m, 10)
        resign_d = random.randint(1, 20)
        resignation_date = f"{resign_y:04d}-{resign_m:02d}-{resign_d:02d}"

        # Last working date ~30 days later
        last_m = resign_m + 1 if resign_m < 12 else 12
        last_d = min(resign_d + 10, 28)
        last_working_date = f"{resign_y:04d}-{last_m:02d}-{last_d:02d}"

        reason = random.choice(RESIGNATION_REASONS)
        # Exit interview score (1 to 5)
        exit_score = round(random.uniform(1.5, 4.2), 1)
        handover = "Completed" if random.random() < 0.90 else "Pending"

        turnovers.append(
            {
                "turnover_id": turnover_id,
                "employee_id": emp["employee_id"],
                "resignation_date": resignation_date,
                "last_working_date": last_working_date,
                "reason": reason,
                "exit_interview_score": exit_score,
                "handover_status": handover,
            }
        )

    return turnovers


def generate_attendance(employees, turnovers):
    """Generate ~5,250 daily attendance records for working days in Oct-Nov 2025."""
    attendance = []
    att_idx = 1

    # Map employee_id -> last_working_date for resigned employees
    turnover_map = {t["employee_id"]: t["last_working_date"] for t in turnovers}

    # Working days calendar: 21 days in Oct 2025, 4 days in Nov 2025 = 25 working days
    # 25 days * ~215-250 employees = ~5,250 records
    working_days = []
    # October 2025 Mondays to Fridays (1 to 31)
    # 2025-10-01 was Wednesday
    for day in range(1, 32):
        # 2025-10-01 is weekday 2 (Wednesday)
        # Day of week: (2 + day - 1) % 7. 0=Wed, 1=Thu, 2=Fri, 3=Sat, 4=Sun, 5=Mon, 6=Tue
        # Let's compute directly:
        # Weekdays in Oct 2025: Oct 1-3, 6-10, 13-17, 20-24, 27-31 (23 days)
        day_of_week = (
            2 + (day - 1)
        ) % 7  # 0:Wed, 1:Thu, 2:Fri, 3:Sat, 4:Sun, 5:Mon, 6:Tue
        if day_of_week not in (3, 4):  # Skip Sat, Sun
            working_days.append(f"2025-10-{day:02d}")

    # First 2 days in Nov 2025 (Nov 3, 4 - Mon, Tue) to get exactly 25 working days
    working_days.extend(["2025-11-03", "2025-11-04"])
    working_days = working_days[:25]  # Exactly 25 business days

    for w_date in working_days:
        for emp in employees:
            emp_id = emp["employee_id"]
            hire_date = emp["hire_date"]

            # If not yet hired on this date, skip
            if hire_date > w_date:
                continue

            # If resigned before this date, skip
            if emp_id in turnover_map and turnover_map[emp_id] < w_date:
                continue

            att_id = f"ATT{att_idx:05d}"
            att_idx += 1

            # Probability distribution:
            # 88% Present, 6% Late, 2% Early Departure, 3% On Leave, 1% Absent
            rand_val = random.random()

            if rand_val < 0.88:
                # Present (On-time)
                status = "Present"
                # Check-in 08:15:00 - 08:34:59
                c_min = random.randint(15, 34)
                c_sec = random.randint(0, 59)
                check_in = f"08:{c_min:02d}:{c_sec:02d}"

                # Overtime chance: 20%
                if random.random() < 0.20:
                    ot_hours = round(random.choice([1.0, 1.5, 2.0, 2.5]), 1)
                    out_hour = 18 + int(ot_hours)
                    out_min = int((ot_hours % 1) * 60) + random.randint(0, 15)
                    check_out = f"{out_hour:02d}:{min(out_min, 59):02d}:00"
                    hours_worked = round(8.0 + ot_hours, 1)
                else:
                    ot_hours = 0.0
                    out_min = random.randint(30, 50)
                    check_out = f"17:{out_min:02d}:00"
                    hours_worked = 8.0

            elif rand_val < 0.94:
                # Late
                status = "Late"
                # Check-in 08:36:00 - 09:25:00
                c_min = random.randint(36, 55)
                check_in = (
                    f"08:{c_min:02d}:00" if c_min <= 59 else f"09:{c_min-60:02d}:00"
                )
                check_out = f"17:{random.randint(30, 55):02d}:00"
                ot_hours = 0.0
                hours_worked = round(8.0 - (c_min - 30) / 60.0, 1)
                if hours_worked < 7.0:
                    hours_worked = 7.0

            elif rand_val < 0.96:
                # Early Departure
                status = "Early Departure"
                check_in = f"08:{random.randint(20, 30):02d}:00"
                c_out_h = random.randint(15, 16)
                c_out_m = random.randint(0, 59)
                check_out = f"{c_out_h:02d}:{c_out_m:02d}:00"
                ot_hours = 0.0
                hours_worked = round((c_out_h - 8.5) - 1.0, 1)  # 1hr lunch
                if hours_worked < 5.0:
                    hours_worked = 5.0

            elif rand_val < 0.99:
                # On Leave
                status = "On Leave"
                check_in = ""
                check_out = ""
                hours_worked = 0.0
                ot_hours = 0.0

            else:
                # Absent
                status = "Absent"
                check_in = ""
                check_out = ""
                hours_worked = 0.0
                ot_hours = 0.0

            attendance.append(
                {
                    "attendance_id": att_id,
                    "employee_id": emp_id,
                    "work_date": w_date,
                    "check_in": check_in,
                    "check_out": check_out,
                    "hours_worked": hours_worked,
                    "overtime_hours": ot_hours,
                    "status": status,
                }
            )

    return attendance


def generate_kpi_evaluations(employees, turnovers):
    """Generate quarterly KPI evaluations for 2025 (Q1, Q2, Q3) -> ~700 records."""
    evaluations = []
    kpi_idx = 1

    turnover_map = {t["employee_id"]: t["resignation_date"] for t in turnovers}
    quarters = [
        ("2025-Q1", "2025-03-31"),
        ("2025-Q2", "2025-06-30"),
        ("2025-Q3", "2025-09-30"),
    ]

    for q_code, q_end in quarters:
        for emp in employees:
            emp_id = emp["employee_id"]
            hire_date = emp["hire_date"]

            # Must have been hired before quarter ends
            if hire_date > q_end:
                continue

            # If resigned before quarter started, skip
            if emp_id in turnover_map:
                q_start = (
                    q_code.replace("-Q1", "-01-01")
                    .replace("-Q2", "-04-01")
                    .replace("-Q3", "-07-01")
                )
                if turnover_map[emp_id] < q_start:
                    continue

            kpi_id = f"KPI{kpi_idx:04d}"
            kpi_idx += 1

            target_score = 100.0

            # Employees who resigned tend to have lower KPI scores in later quarters
            is_turnover = emp["status"] == "Resigned"
            if is_turnover and q_code == "2025-Q3":
                actual_score = round(random.uniform(55.0, 78.0), 1)
            elif is_turnover and q_code == "2025-Q2":
                actual_score = round(random.uniform(65.0, 88.0), 1)
            else:
                actual_score = round(random.uniform(72.0, 115.0), 1)

            completion_rate = round((actual_score / target_score) * 100.0, 2)

            if completion_rate >= 105.0:
                rating = "Xuất sắc"
            elif completion_rate >= 90.0:
                rating = "Đạt"
            elif completion_rate >= 70.0:
                rating = "Cần cải thiện"
            else:
                rating = "Không đạt"

            reviewer_id = emp["manager_id"] if emp["manager_id"] else "EMP001"

            evaluations.append(
                {
                    "kpi_id": kpi_id,
                    "employee_id": emp_id,
                    "evaluation_period": q_code,
                    "target_score": target_score,
                    "actual_score": actual_score,
                    "completion_rate": completion_rate,
                    "rating": rating,
                    "reviewer_id": reviewer_id,
                }
            )

    return evaluations


def generate_training_records(employees, count=450):
    """Generate 450 training enrollment records."""
    trainings = []

    for i in range(1, count + 1):
        trg_id = f"TRG{i:04d}"
        emp = random.choice(employees)
        course_name, course_type, base_cost = random.choice(TRAINING_COURSES)

        # Dates within 2025, after hire_date
        h_year = int(emp["hire_date"][:4])
        t_year = 2025 if h_year <= 2025 else h_year
        start_m = random.randint(2, 9)
        start_d = random.randint(1, 20)
        start_date = f"{t_year:04d}-{start_m:02d}-{start_d:02d}"

        # Duration 3 to 21 days
        duration = random.randint(3, 21)
        end_d = start_d + duration
        if end_d > 28:
            end_m = start_m + 1 if start_m < 12 else 12
            end_d = end_d - 28
            end_date = f"{t_year:04d}-{end_m:02d}:{min(end_d, 28):02d}".replace(
                ":", "-"
            )
        else:
            end_date = f"{t_year:04d}-{start_m:02d}-{end_d:02d}"

        # Status: 85% Completed, 10% In Progress, 5% Dropped
        r_stat = random.random()
        if r_stat < 0.85:
            status = "Completed"
            score = round(random.uniform(65.0, 98.0), 1)
        elif r_stat < 0.95:
            status = "In Progress"
            score = ""
        else:
            status = "Dropped"
            score = (
                round(random.uniform(30.0, 55.0), 1) if random.random() < 0.5 else ""
            )

        cost = float(base_cost)

        trainings.append(
            {
                "record_id": trg_id,
                "employee_id": emp["employee_id"],
                "course_name": course_name,
                "training_type": course_type,
                "start_date": start_date,
                "end_date": end_date,
                "score": score,
                "completion_status": status,
                "training_cost": cost,
            }
        )

    return trainings


def inject_dirty_anomalies(
    clean_employees, clean_turnovers, clean_attendance, clean_kpi, clean_training
):
    """Inject 10 deliberate real-world data anomalies into deep-copied dirty datasets."""
    # Deep copy using dict comprehensions
    dirty_emp = [dict(r) for r in clean_employees]
    dirty_trn = [dict(r) for r in clean_turnovers]
    dirty_att = [dict(r) for r in clean_attendance]
    dirty_kpi = [dict(r) for r in clean_kpi]
    dirty_trg = [dict(r) for r in clean_training]

    ground_truth = []

    # 1. Foreign Key Orphan: In attendance, set employee_id='EMP999' on 3 rows
    for idx, row_idx in enumerate([102, 540, 1205]):
        orig_val = dirty_att[row_idx]["employee_id"]
        dirty_att[row_idx]["employee_id"] = "EMP999"
        ground_truth.append(
            {
                "anomaly_id": f"ANO-01-{idx+1}",
                "error_type": "Foreign Key Orphan",
                "table": "attendance.csv",
                "row_index": row_idx + 2,  # 1-based + header
                "column": "employee_id",
                "faulty_value": "EMP999",
                "expected_value": orig_val,
                "description": "Mã nhân viên EMP999 không tồn tại trong bảng employees (vi phạm khóa ngoại).",
                "sql_fix": f"UPDATE attendance SET employee_id = '{orig_val}' WHERE attendance_id = '{dirty_att[row_idx]['attendance_id']}';",
            }
        )

    # 2. Inverted Datetime: check_out before check_in on 3 rows
    for idx, row_idx in enumerate([320, 890, 1640]):
        dirty_att[row_idx]["check_in"] = "17:30:00"
        dirty_att[row_idx]["check_out"] = "08:30:00"
        ground_truth.append(
            {
                "anomaly_id": f"ANO-02-{idx+1}",
                "error_type": "Inverted Datetime",
                "table": "attendance.csv",
                "row_index": row_idx + 2,
                "column": "check_out",
                "faulty_value": "08:30:00 (trước check-in 17:30:00)",
                "expected_value": "17:30:00",
                "description": "Giờ ra ca sớm hơn giờ vào ca, vi phạm logic trình tự thời gian.",
                "sql_fix": f"UPDATE attendance SET check_in = '08:30:00', check_out = '17:30:00' WHERE attendance_id = '{dirty_att[row_idx]['attendance_id']}';",
            }
        )

    # 3. Duplicate Attendance Record: duplicate record on 2 instances
    for idx, target_id in enumerate(["ATT00450", "ATT01120"]):
        target_row = next(r for r in dirty_att if r["attendance_id"] == target_id)
        # Create a duplicated record
        dup_row = dict(target_row)
        dup_row["attendance_id"] = f"ATT_DUP_{idx+1}"
        dirty_att.insert(50 + idx * 200, dup_row)
        ground_truth.append(
            {
                "anomaly_id": f"ANO-03-{idx+1}",
                "error_type": "Duplicate Attendance Record",
                "table": "attendance.csv",
                "row_index": 52 + idx * 200,
                "column": "attendance_id, employee_id, work_date",
                "faulty_value": f"{dup_row['employee_id']} - {dup_row['work_date']}",
                "expected_value": "Duy nhất một bản ghi chấm công mỗi nhân viên mỗi ngày",
                "description": f"Trùng lặp 2 bản ghi chấm công của nhân viên {dup_row['employee_id']} trong cùng ngày {dup_row['work_date']}.",
                "sql_fix": f"DELETE FROM attendance WHERE attendance_id = '{dup_row['attendance_id']}';",
            }
        )

    # 4. Out-of-bounds KPI actual_score: score = 999.0 and -25.0
    kpi_anomalies = [(25, 999.0, 95.0), (112, -25.0, 75.0)]
    for idx, (r_idx, f_val, exp_val) in enumerate(kpi_anomalies):
        dirty_kpi[r_idx]["actual_score"] = f_val
        dirty_kpi[r_idx]["completion_rate"] = f_val
        ground_truth.append(
            {
                "anomaly_id": f"ANO-04-{idx+1}",
                "error_type": "Out-of-bounds KPI Score",
                "table": "kpi_evaluations.csv",
                "row_index": r_idx + 2,
                "column": "actual_score",
                "faulty_value": str(f_val),
                "expected_value": str(exp_val),
                "description": f"Điểm KPI thực tế {f_val} nằm ngoài dải giá trị chuẩn (0 đến 150 điểm).",
                "sql_fix": f"UPDATE kpi_evaluations SET actual_score = {exp_val}, completion_rate = {exp_val} WHERE kpi_id = '{dirty_kpi[r_idx]['kpi_id']}';",
            }
        )

    # 5. Rating Mismatch: completion_rate < 70 but rating = 'Xuất sắc' on 2 rows
    for idx, r_idx in enumerate([48, 185]):
        dirty_kpi[r_idx]["completion_rate"] = 58.5
        dirty_kpi[r_idx]["actual_score"] = 58.5
        dirty_kpi[r_idx]["rating"] = "Xuất sắc"
        ground_truth.append(
            {
                "anomaly_id": f"ANO-05-{idx+1}",
                "error_type": "KPI Rating Mismatch",
                "table": "kpi_evaluations.csv",
                "row_index": r_idx + 2,
                "column": "rating",
                "faulty_value": "Xuất sắc (trong khi completion_rate = 58.5%)",
                "expected_value": "Không đạt",
                "description": "Điểm hoàn thành dưới 70% nhưng xếp loại lại là Xuất sắc, vi phạm quy tắc thang đánh giá.",
                "sql_fix": f"UPDATE kpi_evaluations SET rating = 'Không đạt' WHERE kpi_id = '{dirty_kpi[r_idx]['kpi_id']}';",
            }
        )

    # 6. Ghost Attendance (resigned employee still attending)
    # Pick a resigned employee who resigned before Oct 2025
    resigned_emp = next(t for t in dirty_trn if t["last_working_date"] < "2025-08-01")
    ghost_emp_id = resigned_emp["employee_id"]
    ghost_att_id = "ATT_GHOST_1"
    dirty_att.append(
        {
            "attendance_id": ghost_att_id,
            "employee_id": ghost_emp_id,
            "work_date": "2025-10-15",
            "check_in": "08:25:00",
            "check_out": "17:35:00",
            "hours_worked": 8.0,
            "overtime_hours": 0.0,
            "status": "Present",
        }
    )
    ground_truth.append(
        {
            "anomaly_id": "ANO-06-1",
            "error_type": "Ghost Attendance Post-Turnover",
            "table": "attendance.csv",
            "row_index": len(dirty_att) + 1,
            "column": "work_date",
            "faulty_value": "2025-10-15",
            "expected_value": f"Không có bản ghi sau ngày {resigned_emp['last_working_date']}",
            "description": f"Nhân viên {ghost_emp_id} đã thôi việc từ {resigned_emp['last_working_date']} nhưng vẫn có chấm công ngày 2025-10-15.",
            "sql_fix": f"DELETE FROM attendance WHERE attendance_id = '{ghost_att_id}';",
        }
    )

    # 7. Turnover Status Discrepancy: employee in turnovers has status='Active' in employees
    target_trn_emp = dirty_trn[5]["employee_id"]
    emp_record = next(e for e in dirty_emp if e["employee_id"] == target_trn_emp)
    emp_record["status"] = "Active"
    ground_truth.append(
        {
            "anomaly_id": "ANO-07-1",
            "error_type": "Turnover Status Discrepancy",
            "table": "employees.csv",
            "row_index": dirty_emp.index(emp_record) + 2,
            "column": "status",
            "faulty_value": "Active",
            "expected_value": "Resigned",
            "description": f"Nhân viên {target_trn_emp} đã có hồ sơ trong bảng turnovers nhưng trạng thái trong employees vẫn ghi là Active.",
            "sql_fix": f"UPDATE employees SET status = 'Resigned' WHERE employee_id = '{target_trn_emp}';",
        }
    )

    # 8. Negative or Zero Salary on 2 employees
    for idx, (emp_idx, f_sal) in enumerate([(15, -15000000.0), (78, 0.0)]):
        dirty_emp[emp_idx]["base_salary"] = f_sal
        ground_truth.append(
            {
                "anomaly_id": f"ANO-08-{idx+1}",
                "error_type": "Invalid Base Salary",
                "table": "employees.csv",
                "row_index": emp_idx + 2,
                "column": "base_salary",
                "faulty_value": str(f_sal),
                "expected_value": "18000000.0",
                "description": f"Lương cơ bản có giá trị {f_sal} VND không hợp lệ (nhỏ hơn hoặc bằng 0).",
                "sql_fix": f"UPDATE employees SET base_salary = 18000000.0 WHERE employee_id = '{dirty_emp[emp_idx]['employee_id']}';",
            }
        )

    # 9. Invalid Training Dates (end_date before start_date) on 2 rows
    for idx, r_idx in enumerate([42, 168]):
        orig_start = dirty_trg[r_idx]["start_date"]
        dirty_trg[r_idx]["start_date"] = "2025-08-20"
        dirty_trg[r_idx]["end_date"] = "2025-08-10"
        ground_truth.append(
            {
                "anomaly_id": f"ANO-09-{idx+1}",
                "error_type": "Inverted Training Dates",
                "table": "training_records.csv",
                "row_index": r_idx + 2,
                "column": "end_date",
                "faulty_value": "2025-08-10 (trước start_date 2025-08-20)",
                "expected_value": "2025-08-25",
                "description": "Ngày kết thúc khóa đào tạo diễn ra trước ngày bắt đầu.",
                "sql_fix": f"UPDATE training_records SET start_date = '{orig_start}', end_date = '2025-08-25' WHERE record_id = '{dirty_trg[r_idx]['record_id']}';",
            }
        )

    # 10. Inconsistent Attendance Status: status='On Leave' but hours_worked=8.0 and has check-in/out
    for idx, r_idx in enumerate([215, 670]):
        dirty_att[r_idx]["status"] = "On Leave"
        dirty_att[r_idx]["check_in"] = "08:30:00"
        dirty_att[r_idx]["check_out"] = "17:30:00"
        dirty_att[r_idx]["hours_worked"] = 8.0
        ground_truth.append(
            {
                "anomaly_id": f"ANO-10-{idx+1}",
                "error_type": "Inconsistent Attendance Status",
                "table": "attendance.csv",
                "row_index": r_idx + 2,
                "column": "status, hours_worked",
                "faulty_value": "status='On Leave', hours_worked=8.0",
                "expected_value": "status='Present' hoặc hours_worked=0.0",
                "description": "Bản ghi trạng thái là Nghỉ phép (On Leave) nhưng vẫn có dữ liệu chấm công và giờ làm việc 8.0.",
                "sql_fix": f"UPDATE attendance SET status = 'Present' WHERE attendance_id = '{dirty_att[r_idx]['attendance_id']}';",
            }
        )

    return dirty_emp, dirty_trn, dirty_att, dirty_kpi, dirty_trg, ground_truth


def save_csv(data, file_path):
    """Save a list of dicts to CSV."""
    if not data:
        return
    keys = list(data[0].keys())
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)


def main():
    """Main execution entry point."""
    print("=" * 70)
    print("CYBERSOFT DATA & AI LAB - HR & OPERATIONS DATASET GENERATOR")
    print("Deterministic Seed: 42 | Target: > 5,000 Records across 5 Tables")
    print("=" * 70)

    random.seed(42)

    # Base directory
    base_dir = Path(__file__).resolve().parent.parent
    clean_dir = base_dir / "data" / "clean"
    dirty_dir = base_dir / "data" / "dirty"
    docs_dir = base_dir / "docs"

    clean_dir.mkdir(parents=True, exist_ok=True)
    dirty_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)

    # 1. Generate Clean Datasets
    print("\n[1/5] Sinh dữ liệu Danh mục Nhân viên (employees.csv)...")
    clean_employees = generate_employees(num_employees=250, num_resigned=35)
    print(f"      -> {len(clean_employees)} nhân viên (215 Active, 35 Resigned)")

    print("\n[2/5] Sinh dữ liệu Biến động Nhân sự (turnovers.csv)...")
    clean_turnovers = generate_turnovers(clean_employees)
    print(
        f"      -> {len(clean_turnovers)} hồ sơ thôi việc (khớp 100% nhân sự Resigned)"
    )

    print("\n[3/5] Sinh dữ liệu Chấm công Hàng ngày (attendance.csv)...")
    clean_attendance = generate_attendance(clean_employees, clean_turnovers)
    print(
        f"      -> {len(clean_attendance)} bản ghi chấm công (25 ngày công tiêu chuẩn)"
    )

    print("\n[4/5] Sinh dữ liệu Đánh giá Hiệu suất KPI (kpi_evaluations.csv)...")
    clean_kpi = generate_kpi_evaluations(clean_employees, clean_turnovers)
    print(f"      -> {len(clean_kpi)} bản ghi đánh giá KPI (3 Quý: Q1, Q2, Q3)")

    print("\n[5/5] Sinh dữ liệu Đào tạo & Phát triển (training_records.csv)...")
    clean_training = generate_training_records(clean_employees, count=450)
    print(f"      -> {len(clean_training)} bản ghi tham gia khóa đào tạo")

    total_clean_rows = (
        len(clean_employees)
        + len(clean_turnovers)
        + len(clean_attendance)
        + len(clean_kpi)
        + len(clean_training)
    )
    print(
        f"\n[OK] TỔNG SỐ BẢN GHI CLEAN: {total_clean_rows:,} dòng (Đạt chỉ tiêu > 5.000 dòng)"
    )

    # Save clean datasets
    save_csv(clean_employees, clean_dir / "employees.csv")
    save_csv(clean_turnovers, clean_dir / "turnovers.csv")
    save_csv(clean_attendance, clean_dir / "attendance.csv")
    save_csv(clean_kpi, clean_dir / "kpi_evaluations.csv")
    save_csv(clean_training, clean_dir / "training_records.csv")
    print("      -> Đã xuất 5 tệp CSV clean vào data/clean/")

    # 2. Inject deliberate anomalies for dirty datasets
    print("\n[INFO] Cài cắm 10 loại lỗi nghiệp vụ thực tế vào bản dirty...")
    dirty_emp, dirty_trn, dirty_att, dirty_kpi, dirty_trg, ground_truth = (
        inject_dirty_anomalies(
            clean_employees,
            clean_turnovers,
            clean_attendance,
            clean_kpi,
            clean_training,
        )
    )

    save_csv(dirty_emp, dirty_dir / "employees.csv")
    save_csv(dirty_trn, dirty_dir / "turnovers.csv")
    save_csv(dirty_att, dirty_dir / "attendance.csv")
    save_csv(dirty_kpi, dirty_dir / "kpi_evaluations.csv")
    save_csv(dirty_trg, dirty_dir / "training_records.csv")
    print(
        f"      -> Đã xuất 5 tệp CSV dirty vào data/dirty/ với {len(ground_truth)} điểm lỗi cài cắm"
    )

    # 3. Save Ground Truth metadata (JSON & MD)
    gt_json_path = docs_dir / "dirty_data_ground_truth.json"
    with open(gt_json_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"      -> Đã lưu Ground Truth JSON: {gt_json_path.name}")

    gt_md_path = docs_dir / "dirty_data_ground_truth.md"
    with open(gt_md_path, "w", encoding="utf-8") as f:
        f.write("# BẢNG ĐÁP ÁN ĐỐI CHỨNG CÁC LỖI CÀI CẮM (`HR_ops_v1_dirty`)\n\n")
        f.write("> **Dự án**: CyberSoft Data & AI Lab  \n")
        f.write(
            f"> **Tổng số điểm vi phạm**: {len(ground_truth)} lỗi thuộc 10 nhóm lỗi nghiệp vụ  \n\n"
        )
        f.write(
            "| Mã Lỗi | Nhóm Lỗi | Tệp | Vị trí (Dòng, Cột) | Giá trị Sai | Giá trị Chuẩn | Mã SQL Khắc phục |\n"
        )
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n")
        for gt in ground_truth:
            f.write(
                f"| `{gt['anomaly_id']}` | **{gt['error_type']}** | `{gt['table']}` | "
                f"Dòng {gt['row_index']}, `{gt['column']}` | `{gt['faulty_value']}` | "
                f"`{gt['expected_value']}` | `{gt['sql_fix']}` |\n"
            )
        f.write("\n")
    print(f"      -> Đã lưu Ground Truth Markdown: {gt_md_path.name}")

    print("\n" + "=" * 70)
    print("HOÀN THÀNH QUÁ TRÌNH SINH DỮ LIỆU NHÂN SỰ & VẬN HÀNH!")
    print("=" * 70)


if __name__ == "__main__":
    main()
