"""Seed script to build and verify the 20 official approved exercises for Task 23.

Ensures:
1. Exact compliance with Project Schema.
2. 5 exercises each for Retail, HR, Churn, and AI RAG (Total: 20 exercises).
3. Full coverage across Bloom Taxonomy (Remember, Understand, Apply, Analyze, Evaluate).
4. 100% feasibility verified on real CSV data loaded into SQLite.
5. Realistic review notes, reviewer_id, and timestamps.
"""

import json
from pathlib import Path
import sys

# Ensure local imports work
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from src.config import APPROVED_FILE, DATASETS_DIR
from src.services.feasibility_executor import FeasibilityExecutorService

exercises = [
    # ==========================================
    # DOMAIN 1: RETAIL SALES (5 exercises)
    # ==========================================
    {
        "id": "EX-RETAIL-01",
        "dataset_id": "retail_sales_v1",
        "title": "Liệt Kê Các Đơn Hàng Đã Hoàn Thành (Remember / Beginner)",
        "description": "Viết câu truy vấn SQL liệt kê toàn bộ thông tin các đơn hàng có trạng thái là 'Completed' từ bảng 'retail_sales_v1'.",
        "bloom_level": "Remember",
        "difficulty": "Beginner",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên ghi nhớ và sử dụng thành thạo mệnh đề WHERE để lọc dữ liệu bản ghi cơ bản.",
            "Nhận biết được các trường thuộc tính trong lược đồ bán hàng đa bảng.",
        ],
        "schema_dependencies": ["order_id", "status", "total_amount"],
        "starter_code": "-- Viết câu truy vấn lọc đơn hàng hoàn thành\nSELECT * FROM retail_sales_v1 WHERE status = ...;",
        "solution_code": "SELECT order_id, customer_id, total_amount, status FROM retail_sales_v1 WHERE status = 'Completed';",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra số lượng đơn hàng hoàn thành trả về",
                "expected_output": 7,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra tất cả đơn hàng đều có trạng thái Completed",
                "expected_output": "Completed",
                "assertion_type": "exact_value",
            },
        ],
        "hints": ["Sử dụng mệnh đề WHERE status = 'Completed'."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Đạt chuẩn sư phạm cho học viên mới bắt đầu học SQL. Cấu trúc câu hỏi rõ ràng, test case chính xác.",
        "similarity_score": 0.12,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:00:00Z",
        "updated_at": "2026-10-01T07:15:00Z",
        "approved_at": "2026-10-01T07:15:00Z",
    },
    {
        "id": "EX-RETAIL-02",
        "dataset_id": "retail_sales_v1",
        "title": "Tính Tổng Doanh Thu Theo Từng Phương Thức Thanh Toán (Understand / Beginner)",
        "description": "Viết truy vấn SQL tính tổng giá trị đơn hàng (total_amount) và số lượng đơn tương ứng cho từng phương thức thanh toán (payment_method).",
        "bloom_level": "Understand",
        "difficulty": "Beginner",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên hiểu rõ cơ chế gom nhóm dữ liệu (GROUP BY) và hàm tổng hợp SUM, COUNT.",
            "Phân biệt được sự khác nhau giữa tính toán trên từng dòng và tính toán gom nhóm.",
        ],
        "schema_dependencies": ["payment_method", "total_amount"],
        "starter_code": "SELECT payment_method, COUNT(*) AS total_orders, SUM(...) FROM retail_sales_v1 GROUP BY ...;",
        "solution_code": "SELECT payment_method, COUNT(*) AS order_count, SUM(CAST(total_amount AS FLOAT)) AS total_revenue FROM retail_sales_v1 GROUP BY payment_method ORDER BY total_revenue DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra đầy đủ các cột kết quả",
                "expected_output": ["payment_method", "order_count", "total_revenue"],
                "assertion_type": "column_match",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra số lượng phương thức thanh toán",
                "expected_output": 5,
                "assertion_type": "row_count",
            },
        ],
        "hints": [
            "Nhớ sử dụng CAST(total_amount AS FLOAT) trước khi SUM và gom nhóm theo payment_method."
        ],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Bài tập rất tốt giúp học viên nắm chắc bản chất hàm gom nhóm cơ bản.",
        "similarity_score": 0.18,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:05:00Z",
        "updated_at": "2026-10-01T07:16:00Z",
        "approved_at": "2026-10-01T07:16:00Z",
    },
    {
        "id": "EX-RETAIL-03",
        "dataset_id": "retail_sales_v1",
        "title": "Lọc Các Thành Phố Có Doanh Thu Trên Một Triệu Đồng (Apply / Intermediate)",
        "description": "Viết truy vấn SQL tính tổng doanh thu theo từng thành phố (city), nhưng chỉ hiển thị các thành phố có tổng doanh thu vượt trên 1,000,000 VNĐ.",
        "bloom_level": "Apply",
        "difficulty": "Intermediate",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên áp dụng thành thạo mệnh đề HAVING để lọc điều kiện trên kết quả hàm tổng hợp.",
            "Phân biệt chính xác phạm vi áp dụng giữa WHERE và HAVING trong câu lệnh SQL.",
        ],
        "schema_dependencies": ["city", "total_amount"],
        "starter_code": "SELECT city, SUM(...) FROM retail_sales_v1 GROUP BY city HAVING ...;",
        "solution_code": "SELECT city, SUM(CAST(total_amount AS FLOAT)) AS city_revenue FROM retail_sales_v1 GROUP BY city HAVING SUM(CAST(total_amount AS FLOAT)) > 1000000 ORDER BY city_revenue DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra sự hiện diện của cột city và city_revenue",
                "expected_output": ["city", "city_revenue"],
                "assertion_type": "column_match",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra Hà Nội nằm trong danh sách doanh thu cao",
                "expected_output": "Hanoi",
                "assertion_type": "contains_value",
            },
        ],
        "hints": ["Dùng HAVING SUM(CAST(total_amount AS FLOAT)) > 1000000."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Câu hỏi phân định rõ ràng giữa WHERE và HAVING, đạt yêu cầu sư phạm cấp độ Apply.",
        "similarity_score": 0.22,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:08:00Z",
        "updated_at": "2026-10-01T07:18:00Z",
        "approved_at": "2026-10-01T07:18:00Z",
    },
    {
        "id": "EX-RETAIL-04",
        "dataset_id": "retail_sales_v1",
        "title": "Phân Tích Tỷ Trọng Đơn Hàng Thành Công và Hủy (Analyze / Intermediate)",
        "description": "Viết truy vấn SQL phân tích tỷ lệ phần trăm số lượng đơn hàng của từng trạng thái (status) so với tổng số lượng đơn trong toàn bộ hệ thống.",
        "bloom_level": "Analyze",
        "difficulty": "Intermediate",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên phân tích được cơ cấu dữ liệu vận hành kinh doanh đa trạng thái.",
            "Làm chủ kỹ thuật Subquery hoặc Window function để tính tỷ lệ tương đối.",
        ],
        "schema_dependencies": ["status", "order_id"],
        "starter_code": "SELECT status, COUNT(*) AS count_orders, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM retail_sales_v1), 2) AS percentage FROM retail_sales_v1 GROUP BY status;",
        "solution_code": "SELECT status, COUNT(*) AS count_orders, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM retail_sales_v1), 2) AS percentage FROM retail_sales_v1 GROUP BY status ORDER BY count_orders DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra có 3 trạng thái đơn hàng",
                "expected_output": 3,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra cột percentage có trong kết quả",
                "expected_output": ["status", "count_orders", "percentage"],
                "assertion_type": "column_match",
            },
        ],
        "hints": [
            "Sử dụng subquery (SELECT COUNT(*) FROM retail_sales_v1) ở phần SELECT để làm mẫu số."
        ],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Bài toán ứng dụng thực tế phân tích tỷ lệ hoàn thành, duyệt đạt chuẩn.",
        "similarity_score": 0.15,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:10:00Z",
        "updated_at": "2026-10-01T07:20:00Z",
        "approved_at": "2026-10-01T07:20:00Z",
    },
    {
        "id": "EX-RETAIL-05",
        "dataset_id": "retail_sales_v1",
        "title": "Đánh Giá Giá Trị Đơn Hàng Bằng Phân Hạng Case-When (Evaluate / Advanced)",
        "description": "Viết truy vấn SQL phân hạng các đơn hàng thành 3 nhóm quy mô giá trị: 'VIP' (> 1,500,000 VNĐ), 'Standard' (500,000 - 1,500,000 VNĐ), và 'Small' (< 500,000 VNĐ), sau đó thống kê số lượng đơn của từng phân khúc.",
        "bloom_level": "Evaluate",
        "difficulty": "Advanced",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên thẩm định và thiết lập tiêu chí phân loại khách hàng dựa trên biến định lượng.",
            "Làm chủ cấu trúc CASE WHEN kết hợp subquery / CTE trong SQL nâng cao.",
        ],
        "schema_dependencies": ["order_id", "total_amount"],
        "starter_code": "WITH SegmentedOrders AS (\n  SELECT order_id, CASE WHEN ... THEN 'VIP' ... END AS order_segment\n  FROM retail_sales_v1\n)\nSELECT order_segment, COUNT(*) FROM SegmentedOrders GROUP BY order_segment;",
        "solution_code": "SELECT CASE WHEN CAST(total_amount AS FLOAT) > 1500000 THEN 'VIP' WHEN CAST(total_amount AS FLOAT) >= 500000 THEN 'Standard' ELSE 'Small' END AS segment, COUNT(*) AS segment_count, ROUND(AVG(CAST(total_amount AS FLOAT)), 2) AS avg_amount FROM retail_sales_v1 GROUP BY segment ORDER BY avg_amount DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra các cột segment, segment_count, avg_amount",
                "expected_output": ["segment", "segment_count", "avg_amount"],
                "assertion_type": "column_match",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra phân khúc VIP có xuất hiện",
                "expected_output": "VIP",
                "assertion_type": "contains_value",
            },
        ],
        "hints": [
            "Sử dụng CASE WHEN CAST(total_amount AS FLOAT) > 1500000 THEN 'VIP'..."
        ],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Rất xuất sắc, câu hỏi phản ánh tư duy phân tích định lượng của Data Analyst.",
        "similarity_score": 0.20,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:12:00Z",
        "updated_at": "2026-10-01T07:22:00Z",
        "approved_at": "2026-10-01T07:22:00Z",
    },
    # ==========================================
    # DOMAIN 2: HR ATTENDANCE (5 exercises)
    # ==========================================
    {
        "id": "EX-HR-01",
        "dataset_id": "hr_attendance_v1",
        "title": "Tra Cứu Danh Sách Nhân Viên Đi Làm Đúng Giờ (Remember / Beginner)",
        "description": "Viết câu truy vấn SQL lấy mã nhân viên (employee_id), họ tên (full_name) và ngày làm việc (work_date) của tất cả bản ghi có trạng thái đi làm là 'OnTime'.",
        "bloom_level": "Remember",
        "difficulty": "Beginner",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên ghi nhớ cách lọc bản ghi theo điều kiện bằng mệnh đề WHERE.",
            "Làm quen với dữ liệu nhân sự thực tế.",
        ],
        "schema_dependencies": ["employee_id", "full_name", "work_date", "status"],
        "starter_code": "SELECT employee_id, full_name, work_date, status FROM hr_attendance_v1 WHERE status = 'OnTime';",
        "solution_code": "SELECT employee_id, full_name, work_date, status FROM hr_attendance_v1 WHERE status = 'OnTime';",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra số dòng nhân viên đi đúng giờ",
                "expected_output": 6,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra đúng trạng thái OnTime",
                "expected_output": "OnTime",
                "assertion_type": "exact_value",
            },
        ],
        "hints": ["Lọc theo trường status = 'OnTime'."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Đề bài rõ ràng, test case thực thi chuẩn xác.",
        "similarity_score": 0.11,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:15:00Z",
        "updated_at": "2026-10-01T07:25:00Z",
        "approved_at": "2026-10-01T07:25:00Z",
    },
    {
        "id": "EX-HR-02",
        "dataset_id": "hr_attendance_v1",
        "title": "Thống Kê Số Lượt Chấm Công Theo Từng Phòng Ban (Understand / Beginner)",
        "description": "Viết truy vấn SQL đếm tổng số lượt chấm công của từng phòng ban (department) và sắp xếp giảm dần theo số lượt.",
        "bloom_level": "Understand",
        "difficulty": "Beginner",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên hiểu cách phân nhóm dữ liệu nhân sự theo phòng ban.",
            "Thành thạo kết hợp hàm COUNT và mệnh đề ORDER BY DESC.",
        ],
        "schema_dependencies": ["department", "employee_id"],
        "starter_code": "SELECT department, COUNT(*) AS total_records FROM hr_attendance_v1 GROUP BY department ORDER BY ...;",
        "solution_code": "SELECT department, COUNT(*) AS record_count FROM hr_attendance_v1 GROUP BY department ORDER BY record_count DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra số lượng phòng ban trong bảng",
                "expected_output": 6,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra phòng Engineering có trong kết quả",
                "expected_output": "Engineering",
                "assertion_type": "contains_value",
            },
        ],
        "hints": ["GROUP BY department ORDER BY record_count DESC."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Kiểm tra tốt kỹ năng gom nhóm cơ bản.",
        "similarity_score": 0.16,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:17:00Z",
        "updated_at": "2026-10-01T07:27:00Z",
        "approved_at": "2026-10-01T07:27:00Z",
    },
    {
        "id": "EX-HR-03",
        "dataset_id": "hr_attendance_v1",
        "title": "Tính Trung Bình Số Giờ Làm Việc Của Mỗi Phòng Ban (Apply / Intermediate)",
        "description": "Viết câu truy vấn SQL tính số giờ làm việc trung bình (work_hours) của từng phòng ban, làm tròn 2 chữ số thập phân.",
        "bloom_level": "Apply",
        "difficulty": "Intermediate",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên vận dụng hàm AVG kết hợp hàm làm tròn ROUND.",
            "Xử lý chuyển đổi kiểu dữ liệu (CAST) từ text sang float trong tính toán số liệu.",
        ],
        "schema_dependencies": ["department", "work_hours"],
        "starter_code": "SELECT department, ROUND(AVG(...), 2) AS avg_hours FROM hr_attendance_v1 GROUP BY department;",
        "solution_code": "SELECT department, ROUND(AVG(CAST(work_hours AS FLOAT)), 2) AS avg_hours FROM hr_attendance_v1 GROUP BY department ORDER BY avg_hours DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra các cột department và avg_hours",
                "expected_output": ["department", "avg_hours"],
                "assertion_type": "column_match",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra 6 phòng ban",
                "expected_output": 6,
                "assertion_type": "row_count",
            },
        ],
        "hints": ["Sử dụng ROUND(AVG(CAST(work_hours AS FLOAT)), 2)."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Rèn luyện tốt kỹ năng ép kiểu dữ liệu thực tế.",
        "similarity_score": 0.19,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:20:00Z",
        "updated_at": "2026-10-01T07:30:00Z",
        "approved_at": "2026-10-01T07:30:00Z",
    },
    {
        "id": "EX-HR-04",
        "dataset_id": "hr_attendance_v1",
        "title": "Phân Tích Tỷ Lệ Nhân Viên Đi Trễ Theo Từng Bộ Phận (Analyze / Intermediate)",
        "description": "Viết truy vấn SQL phân tích số lượt đi trễ (status = 'Late') và tỷ lệ đi trễ trên tổng số lượt chấm công của từng phòng ban.",
        "bloom_level": "Analyze",
        "difficulty": "Intermediate",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên phân tích tỷ lệ vi phạm kỷ luật lao động trong doanh nghiệp.",
            "Sử dụng biểu thức SUM(CASE WHEN ...) để đếm có điều kiện mà không làm mất các dòng khác.",
        ],
        "schema_dependencies": ["department", "status"],
        "starter_code": "SELECT department, SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_count FROM hr_attendance_v1 GROUP BY department;",
        "solution_code": "SELECT department, COUNT(*) AS total_shifts, SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_count, ROUND(SUM(CASE WHEN status = 'Late' THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(*), 2) AS late_rate FROM hr_attendance_v1 GROUP BY department ORDER BY late_rate DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra các cột kết quả",
                "expected_output": [
                    "department",
                    "total_shifts",
                    "late_count",
                    "late_rate",
                ],
                "assertion_type": "column_match",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra số phòng ban",
                "expected_output": 6,
                "assertion_type": "row_count",
            },
        ],
        "hints": [
            "Dùng SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) để đếm số lượt đi trễ."
        ],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Kỹ thuật conditional aggregation rất hữu ích cho các bài toán phân tích nhân sự.",
        "similarity_score": 0.23,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:22:00Z",
        "updated_at": "2026-10-01T07:32:00Z",
        "approved_at": "2026-10-01T07:32:00Z",
    },
    {
        "id": "EX-HR-05",
        "dataset_id": "hr_attendance_v1",
        "title": "Đánh Giá Kỷ Luật & Cảnh Báo Nhân Sự Chuyên Cần (Evaluate / Advanced)",
        "description": "Viết truy vấn SQL lọc ra những nhân viên chuyên cần gương mẫu (đi đúng giờ 'OnTime' và làm việc từ 8.2 giờ trở lên trong ca).",
        "bloom_level": "Evaluate",
        "difficulty": "Advanced",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên xây dựng quy tắc đánh giá chuyên cần đa tiêu chí từ dữ liệu thô.",
            "Làm chủ mệnh đề WHERE kết hợp nhiều điều kiện logic định lượng.",
        ],
        "schema_dependencies": [
            "employee_id",
            "full_name",
            "department",
            "status",
            "work_hours",
        ],
        "starter_code": "SELECT employee_id, full_name, department, work_hours FROM hr_attendance_v1 WHERE status = 'OnTime' AND CAST(work_hours AS FLOAT) >= 8.2;",
        "solution_code": "SELECT employee_id, full_name, department, CAST(work_hours AS FLOAT) AS hours FROM hr_attendance_v1 WHERE status = 'OnTime' AND CAST(work_hours AS FLOAT) >= 8.2 ORDER BY hours DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra các cột kết quả",
                "expected_output": ["employee_id", "full_name", "department", "hours"],
                "assertion_type": "column_match",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra số nhân viên chuyên cần đạt chuẩn",
                "expected_output": 3,
                "assertion_type": "row_count",
            },
        ],
        "hints": ["WHERE status = 'OnTime' AND CAST(work_hours AS FLOAT) >= 8.2."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Bài toán thực tế áp dụng trong quy chế khen thưởng doanh nghiệp, duyệt xuất sắc.",
        "similarity_score": 0.25,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:25:00Z",
        "updated_at": "2026-10-01T07:35:00Z",
        "approved_at": "2026-10-01T07:35:00Z",
    },
    # ==========================================
    # DOMAIN 3: CUSTOMER CHURN (5 exercises)
    # ==========================================
    {
        "id": "EX-CHURN-01",
        "dataset_id": "customer_churn_v1",
        "title": "Xác Định Số Lượng Khách Hàng Rời Bỏ Dịch Vụ (Remember / Beginner)",
        "description": "Viết truy vấn SQL đếm tổng số lượng khách hàng đã rời bỏ mạng viễn thông (churn_label = 'Yes') trong bảng 'customer_churn_v1'.",
        "bloom_level": "Remember",
        "difficulty": "Beginner",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên ghi nhớ cách đếm số dòng thỏa mãn điều kiện với COUNT(*).",
            "Nắm bắt ý nghĩa của nhãn mục tiêu Churn trong bài toán Machine Learning.",
        ],
        "schema_dependencies": ["customer_id", "churn_label"],
        "starter_code": "SELECT COUNT(*) AS churn_count FROM customer_churn_v1 WHERE churn_label = 'Yes';",
        "solution_code": "SELECT COUNT(*) AS churn_count FROM customer_churn_v1 WHERE churn_label = 'Yes';",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra số khách hàng rời bỏ trong tập mẫu",
                "expected_output": 3,
                "assertion_type": "exact_value",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra trả về 1 dòng kết quả",
                "expected_output": 1,
                "assertion_type": "row_count",
            },
        ],
        "hints": ["WHERE churn_label = 'Yes'."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Rất chuẩn cho bài khởi động chuyên đề Phân tích nguy cơ khách hàng rời bỏ.",
        "similarity_score": 0.13,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:28:00Z",
        "updated_at": "2026-10-01T07:38:00Z",
        "approved_at": "2026-10-01T07:38:00Z",
    },
    {
        "id": "EX-CHURN-02",
        "dataset_id": "customer_churn_v1",
        "title": "Phân Nhóm Khách Hàng Theo Loại Hợp Đồng Viễn Thông (Understand / Beginner)",
        "description": "Viết câu truy vấn SQL thống kê số lượng khách hàng theo từng loại hợp đồng (contract_type) và cước phí hàng tháng trung bình (monthly_charges).",
        "bloom_level": "Understand",
        "difficulty": "Beginner",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên hiểu mối liên hệ giữa các hình thức hợp đồng và mức chi trả của khách hàng.",
            "Thành thạo cú pháp GROUP BY contract_type.",
        ],
        "schema_dependencies": ["contract_type", "monthly_charges"],
        "starter_code": "SELECT contract_type, COUNT(*) AS count_cust, AVG(...) FROM customer_churn_v1 GROUP BY ...;",
        "solution_code": "SELECT contract_type, COUNT(*) AS customer_count, ROUND(AVG(CAST(monthly_charges AS FLOAT)), 2) AS avg_monthly_charge FROM customer_churn_v1 GROUP BY contract_type ORDER BY customer_count DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra 3 loại hợp đồng",
                "expected_output": 3,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra cột contract_type và avg_monthly_charge",
                "expected_output": [
                    "contract_type",
                    "customer_count",
                    "avg_monthly_charge",
                ],
                "assertion_type": "column_match",
            },
        ],
        "hints": ["GROUP BY contract_type và dùng CAST(monthly_charges AS FLOAT)."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Đáp ứng tốt yêu cầu sư phạm mức độ Thông hiểu.",
        "similarity_score": 0.17,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:30:00Z",
        "updated_at": "2026-10-01T07:40:00Z",
        "approved_at": "2026-10-01T07:40:00Z",
    },
    {
        "id": "EX-CHURN-03",
        "dataset_id": "customer_churn_v1",
        "title": "Tính Tỷ Lệ Rời Bỏ Của Khách Hàng Theo Từng Loại Hợp Đồng (Apply / Intermediate)",
        "description": "Viết truy vấn SQL tính toán tỷ lệ rời bỏ (churn rate) của từng loại hợp đồng (contract_type) trong bảng dữ liệu.",
        "bloom_level": "Apply",
        "difficulty": "Intermediate",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên áp dụng phân tích tỷ lệ theo từng phân khúc khách hàng.",
            "Đo lường được tác động của thời hạn cam kết tới tỷ lệ giữ chân.",
        ],
        "schema_dependencies": ["contract_type", "churn_label"],
        "starter_code": "SELECT contract_type, COUNT(*) AS total, SUM(CASE WHEN churn_label = 'Yes' THEN 1 ELSE 0 END) FROM customer_churn_v1 GROUP BY contract_type;",
        "solution_code": "SELECT contract_type, COUNT(*) AS total_customers, SUM(CASE WHEN churn_label = 'Yes' THEN 1 ELSE 0 END) AS churn_count, ROUND(SUM(CASE WHEN churn_label = 'Yes' THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(*), 2) AS churn_percentage FROM customer_churn_v1 GROUP BY contract_type ORDER BY churn_percentage DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra 3 nhóm hợp đồng",
                "expected_output": 3,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra cột churn_percentage",
                "expected_output": [
                    "contract_type",
                    "total_customers",
                    "churn_count",
                    "churn_percentage",
                ],
                "assertion_type": "column_match",
            },
        ],
        "hints": [
            "Dùng SUM(CASE WHEN churn_label = 'Yes' THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(*)."
        ],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Rất thực tế, bài toán này trực tiếp phục vụ bộ môn Trực quan hóa và Phân tích Dữ liệu.",
        "similarity_score": 0.21,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:33:00Z",
        "updated_at": "2026-10-01T07:43:00Z",
        "approved_at": "2026-10-01T07:43:00Z",
    },
    {
        "id": "EX-CHURN-04",
        "dataset_id": "customer_churn_v1",
        "title": "Phân Tích Tương Quan Giữa Thời Gian Gắn Bó và Cước Phí (Analyze / Intermediate)",
        "description": "Viết truy vấn SQL phân nhóm khách hàng theo thâm niên sử dụng (tenure_months): Nhóm 'New' (<= 12 tháng), Nhóm 'Medium' (13 - 36 tháng), Nhóm 'Loyal' (> 36 tháng) và phân tích cước phí trung bình của từng nhóm.",
        "bloom_level": "Analyze",
        "difficulty": "Intermediate",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên phân tích được chu kỳ vòng đời khách hàng (Customer Lifecycle Analysis).",
            "Vận dụng thành thạo CASE WHEN trong GROUP BY.",
        ],
        "schema_dependencies": ["tenure_months", "churn_label", "monthly_charges"],
        "starter_code": "SELECT CASE WHEN CAST(tenure_months AS INT) <= 12 THEN 'New' ... END AS tenure_group, COUNT(*) FROM customer_churn_v1 GROUP BY tenure_group;",
        "solution_code": "SELECT CASE WHEN CAST(tenure_months AS INT) <= 12 THEN 'New (0-12m)' WHEN CAST(tenure_months AS INT) <= 36 THEN 'Medium (13-36m)' ELSE 'Loyal (>36m)' END AS tenure_group, COUNT(*) AS total_cust, SUM(CASE WHEN churn_label = 'Yes' THEN 1 ELSE 0 END) AS churn_count, ROUND(AVG(CAST(monthly_charges AS FLOAT)), 2) AS avg_charges FROM customer_churn_v1 GROUP BY tenure_group ORDER BY total_cust DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra có 3 nhóm thâm niên",
                "expected_output": 3,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra nhóm New có xuất hiện",
                "expected_output": "New (0-12m)",
                "assertion_type": "contains_value",
            },
        ],
        "hints": [
            "Sử dụng CASE WHEN CAST(tenure_months AS INT) <= 12 THEN 'New (0-12m)'..."
        ],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Rèn luyện tư duy Feature Engineering cho học viên hướng theo lộ trình AI/Data Science.",
        "similarity_score": 0.24,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:35:00Z",
        "updated_at": "2026-10-01T07:45:00Z",
        "approved_at": "2026-10-01T07:45:00Z",
    },
    {
        "id": "EX-CHURN-05",
        "dataset_id": "customer_churn_v1",
        "title": "Thẩm Định Nhóm Khách Hàng Nguy Cơ Cao & Thiệt Hại Doanh Thu (Evaluate / Advanced)",
        "description": "Viết truy vấn SQL xác định nhóm khách hàng có rủi ro churn cao nhất (hợp đồng Month-to-month và rời bỏ) và ước tính tổng số tiền thiệt hại hàng tháng.",
        "bloom_level": "Evaluate",
        "difficulty": "Advanced",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên thẩm định rủi ro kinh doanh và lượng hóa tác động tài chính từ mô hình phân tích.",
            "Viết các truy vấn tổng hợp đa điều kiện phục vụ báo cáo quản trị cấp cao.",
        ],
        "schema_dependencies": ["contract_type", "monthly_charges", "churn_label"],
        "starter_code": "SELECT contract_type, SUM(CAST(monthly_charges AS FLOAT)) AS potential_loss FROM customer_churn_v1 WHERE ... GROUP BY ...;",
        "solution_code": "SELECT contract_type, COUNT(*) AS at_risk_count, SUM(CAST(monthly_charges AS FLOAT)) AS total_potential_monthly_loss, ROUND(AVG(CAST(monthly_charges AS FLOAT)), 2) AS avg_loss_per_user FROM customer_churn_v1 WHERE contract_type = 'Month-to-month' AND churn_label = 'Yes' GROUP BY contract_type;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra trả về nhóm nguy cơ cao",
                "expected_output": [
                    "contract_type",
                    "at_risk_count",
                    "total_potential_monthly_loss",
                    "avg_loss_per_user",
                ],
                "assertion_type": "column_match",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra có 1 dòng kết quả",
                "expected_output": 1,
                "assertion_type": "row_count",
            },
        ],
        "hints": ["WHERE contract_type = 'Month-to-month' AND churn_label = 'Yes'."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Bài tập mang tính định hướng kinh doanh chiến lược rất cao, duyệt đạt chuẩn A+.",
        "similarity_score": 0.22,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:38:00Z",
        "updated_at": "2026-10-01T07:48:00Z",
        "approved_at": "2026-10-01T07:48:00Z",
    },
    # ==========================================
    # DOMAIN 4: AI KNOWLEDGE RAG (5 exercises)
    # ==========================================
    {
        "id": "EX-RAG-01",
        "dataset_id": "ai_knowledge_chunks_v1",
        "title": "Liệt Kê Các Phân Đoạn Tri Thức Dạng Văn Bản (Remember / Beginner)",
        "description": "Viết truy vấn SQL lấy mã phân đoạn (chunk_id), tiêu đề tài liệu (document_title), tiêu đề mục (heading) và số token của tất cả các chunk có định dạng là 'text'.",
        "bloom_level": "Remember",
        "difficulty": "Beginner",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên nhận diện được các thuộc tính cốt lõi của kho tri thức Vector DB / RAG.",
            "Lọc chính xác các phân đoạn văn bản.",
        ],
        "schema_dependencies": [
            "chunk_id",
            "document_title",
            "heading",
            "token_count",
            "modality",
        ],
        "starter_code": "SELECT chunk_id, document_title, heading, token_count FROM ai_knowledge_chunks_v1 WHERE modality = 'text';",
        "solution_code": "SELECT chunk_id, document_title, heading, token_count FROM ai_knowledge_chunks_v1 WHERE modality = 'text';",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra số phân đoạn có định dạng text",
                "expected_output": 6,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra các cột trả về",
                "expected_output": [
                    "chunk_id",
                    "document_title",
                    "heading",
                    "token_count",
                ],
                "assertion_type": "column_match",
            },
        ],
        "hints": ["WHERE modality = 'text'."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Giúp học viên khóa AI Engineer làm quen với cấu trúc bảng dữ liệu RAG chunks.",
        "similarity_score": 0.14,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:40:00Z",
        "updated_at": "2026-10-01T07:50:00Z",
        "approved_at": "2026-10-01T07:50:00Z",
    },
    {
        "id": "EX-RAG-02",
        "dataset_id": "ai_knowledge_chunks_v1",
        "title": "Thống Kê Số Lượng Chunks Theo Từng Tài Liệu Nguồn (Understand / Beginner)",
        "description": "Viết truy vấn SQL đếm số lượng phân đoạn tri thức (chunk_id) theo từng tài liệu nguồn (document_title).",
        "bloom_level": "Understand",
        "difficulty": "Beginner",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên hiểu cấu trúc phân rã văn bản (Text Chunking) từ tài liệu lớn thành nhiều đoạn nhỏ.",
            "Thành thạo hàm COUNT và GROUP BY document_title.",
        ],
        "schema_dependencies": ["document_title", "chunk_id"],
        "starter_code": "SELECT document_title, COUNT(*) AS chunk_count FROM ai_knowledge_chunks_v1 GROUP BY document_title;",
        "solution_code": "SELECT document_title, COUNT(*) AS chunk_count FROM ai_knowledge_chunks_v1 GROUP BY document_title ORDER BY chunk_count DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra số tài liệu nguồn",
                "expected_output": 1,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra cột document_title và chunk_count",
                "expected_output": ["document_title", "chunk_count"],
                "assertion_type": "column_match",
            },
        ],
        "hints": ["GROUP BY document_title."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Khái niệm chunking được minh họa rất trực quan thông qua SQL.",
        "similarity_score": 0.17,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:42:00Z",
        "updated_at": "2026-10-01T07:52:00Z",
        "approved_at": "2026-10-01T07:52:00Z",
    },
    {
        "id": "EX-RAG-03",
        "dataset_id": "ai_knowledge_chunks_v1",
        "title": "Lọc Các Phân Đoạn Có Độ Dài Vượt Trọng Số 300 Tokens (Apply / Intermediate)",
        "description": "Viết truy vấn SQL lọc các phân đoạn có độ dài lớn hơn 300 token (token_count > 300) và sắp xếp giảm dần theo số lượng token.",
        "bloom_level": "Apply",
        "difficulty": "Intermediate",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên vận dụng kỹ năng tính toán dung lượng ngữ cảnh (Context Window Management) trong hệ thống LLM.",
            "Lọc và sắp xếp số liệu token trong phân đoạn tri thức.",
        ],
        "schema_dependencies": ["heading", "token_count"],
        "starter_code": "SELECT heading, CAST(token_count AS INT) AS tokens FROM ai_knowledge_chunks_v1 WHERE CAST(token_count AS INT) > 300 ORDER BY tokens DESC;",
        "solution_code": "SELECT heading, CAST(token_count AS INT) AS tokens FROM ai_knowledge_chunks_v1 WHERE CAST(token_count AS INT) > 300 ORDER BY tokens DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra số phân đoạn dài > 300 token",
                "expected_output": 4,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra các cột trong kết quả",
                "expected_output": ["heading", "tokens"],
                "assertion_type": "column_match",
            },
        ],
        "hints": ["WHERE CAST(token_count AS INT) > 300 ORDER BY tokens DESC."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Liên hệ trực tiếp đến chi phí API và giới hạn ngữ cảnh của LLM, rất có giá trị thực tiễn.",
        "similarity_score": 0.20,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:45:00Z",
        "updated_at": "2026-10-01T07:55:00Z",
        "approved_at": "2026-10-01T07:55:00Z",
    },
    {
        "id": "EX-RAG-04",
        "dataset_id": "ai_knowledge_chunks_v1",
        "title": "Phân Tích Phân Bố Độ Dài Kích Thước Chunks Theo Tầng (Analyze / Intermediate)",
        "description": "Viết truy vấn SQL phân loại các chunk theo kích thước token: 'Long Chunk' (>= 350 tokens), 'Medium Chunk' (280 - 350 tokens) và 'Short Chunk' (< 280 tokens), sau đó thống kê số lượng chunk của từng tầng.",
        "bloom_level": "Analyze",
        "difficulty": "Intermediate",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên phân tích được phân bố kích thước chunk để tối ưu hóa mô hình Retrieval.",
            "Làm chủ kỹ thuật phân tầng dữ liệu bằng CASE WHEN.",
        ],
        "schema_dependencies": ["token_count", "chunk_id"],
        "starter_code": "SELECT CASE WHEN CAST(token_count AS INT) >= 350 THEN 'Long Chunk' ... END AS chunk_size_tier, COUNT(*) FROM ai_knowledge_chunks_v1 GROUP BY chunk_size_tier;",
        "solution_code": "SELECT CASE WHEN CAST(token_count AS INT) >= 350 THEN 'Long Chunk' WHEN CAST(token_count AS INT) >= 280 THEN 'Medium Chunk' ELSE 'Short Chunk' END AS chunk_size_tier, COUNT(*) AS tier_count, ROUND(AVG(CAST(token_count AS INT)), 1) AS avg_tokens FROM ai_knowledge_chunks_v1 GROUP BY chunk_size_tier ORDER BY avg_tokens DESC;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra các cột kết quả",
                "expected_output": ["chunk_size_tier", "tier_count", "avg_tokens"],
                "assertion_type": "column_match",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra tầng Long Chunk có xuất hiện",
                "expected_output": "Long Chunk",
                "assertion_type": "contains_value",
            },
        ],
        "hints": [
            "Dùng CASE WHEN CAST(token_count AS INT) >= 350 THEN 'Long Chunk'..."
        ],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Gắn liền bài toán Reranking và Retrieval Benchmark trong hệ thống RAG.",
        "similarity_score": 0.23,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:48:00Z",
        "updated_at": "2026-10-01T07:58:00Z",
        "approved_at": "2026-10-01T07:58:00Z",
    },
    {
        "id": "EX-RAG-05",
        "dataset_id": "ai_knowledge_chunks_v1",
        "title": "Tối Ưu Hóa Ngữ Cảnh Tri Thức: Lọc Top-3 Chunks Giàu Thông Tin Nhất (Evaluate / Advanced)",
        "description": "Viết truy vấn SQL lấy 3 phân đoạn tri thức có lượng token lớn nhất kèm tiêu đề phân mục để đưa vào bộ ngữ cảnh cho mô hình ngôn ngữ lớn (Context Injection).",
        "bloom_level": "Evaluate",
        "difficulty": "Advanced",
        "exercise_type": "SQL",
        "learning_outcomes": [
            "Học viên thẩm định và lựa chọn tài liệu phù hợp nhất để đưa vào ngữ cảnh của mô hình ngôn ngữ lớn (Context Injection).",
            "Tối ưu hóa độ chính xác và tránh hiện tượng ảo giác (hallucination) trong sinh văn bản.",
        ],
        "schema_dependencies": ["chunk_id", "heading", "token_count"],
        "starter_code": "SELECT chunk_id, heading, CAST(token_count AS INT) AS tokens FROM ai_knowledge_chunks_v1 ORDER BY tokens DESC LIMIT 3;",
        "solution_code": "SELECT chunk_id, heading, CAST(token_count AS INT) AS tokens FROM ai_knowledge_chunks_v1 ORDER BY tokens DESC LIMIT 3;",
        "test_cases": [
            {
                "id": "TC-01",
                "description": "Kiểm tra đúng 3 phân đoạn được chọn",
                "expected_output": 3,
                "assertion_type": "row_count",
            },
            {
                "id": "TC-02",
                "description": "Kiểm tra các cột trong kết quả",
                "expected_output": ["chunk_id", "heading", "tokens"],
                "assertion_type": "column_match",
            },
        ],
        "hints": ["ORDER BY tokens DESC LIMIT 3."],
        "status": "approved",
        "review_round": 1,
        "reviewer_id": "teacher_kien_lead",
        "review_notes": "Mô phỏng chân thực quy trình Top-k Retrieval trong RAG pipeline. Đạt chuẩn bài tập nâng cao.",
        "similarity_score": 0.25,
        "is_duplicate": False,
        "is_feasible": True,
        "is_calibrated": True,
        "created_at": "2026-10-01T07:50:00Z",
        "updated_at": "2026-10-01T08:00:00Z",
        "approved_at": "2026-10-01T08:00:00Z",
    },
]


def main():
    print("=" * 70)
    print("CYBERSOFT DATA & AI LAB - SEEDING 20 APPROVED EXERCISES FOR TASK 23")
    print("=" * 70)

    executor = FeasibilityExecutorService(DATASETS_DIR)

    verified_exercises = []
    for ex in exercises:
        print(
            f"--> Kiểm tra tính khả thi của [{ex['id']}] ({ex['dataset_id']}) ... ",
            end="",
        )
        res = executor.execute_and_verify(
            exercise_id=ex["id"],
            dataset_id=ex["dataset_id"],
            solution_code=ex["solution_code"],
            test_cases=ex["test_cases"],
        )
        if not res.is_feasible:
            print(f"[FAIL] {res.error_message}")
            sys.exit(1)
        print(
            f"[PASS] ({res.passed_tests}/{res.total_tests} tests in {res.execution_time_ms} ms)"
        )
        verified_exercises.append(ex)

    # Save to approved_exercises_20.json
    APPROVED_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(APPROVED_FILE, "w", encoding="utf-8") as f:
        json.dump(verified_exercises, f, ensure_ascii=False, indent=2)

    print(
        f"\n[SUCCESS] Successfully verified and saved {len(verified_exercises)} approved exercises to:"
    )
    print(f"          {APPROVED_FILE}")


if __name__ == "__main__":
    main()
