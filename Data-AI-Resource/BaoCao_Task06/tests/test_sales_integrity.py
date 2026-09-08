"""
Pytest Suite kiểm tra tính toàn vẹn và chất lượng dữ liệu Task 06 (sales_v1)
CyberSoft Data & AI Lab
Tác giả: Đào Trung Kiên - Data & AI Resource Engineer
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from scripts.validate_sales_data import read_csv, validate_dataset  # noqa: E402

CLEAN_DIR = os.path.join(BASE_DIR, "data", "clean")
DIRTY_DIR = os.path.join(BASE_DIR, "data", "dirty")


class TestCleanDataset:
    """Kiểm tra bộ dữ liệu sạch (sales_v1_clean)."""

    def test_file_existence(self):
        """Tất cả 5 bảng bắt buộc phải tồn tại."""
        tables = [
            "customers.csv",
            "products.csv",
            "employees.csv",
            "orders.csv",
            "order_details.csv",
        ]
        for t in tables:
            path = os.path.join(CLEAN_DIR, t)
            assert os.path.exists(path), f"Thiếu tệp dữ liệu: {t}"

    def test_primary_key_uniqueness(self):
        """Khóa chính trên cả 5 bảng phải duy nhất 100%."""
        tables = [
            ("customers.csv", "customer_id"),
            ("products.csv", "product_id"),
            ("employees.csv", "employee_id"),
            ("orders.csv", "order_id"),
            ("order_details.csv", "order_detail_id"),
        ]
        for tbl, pk in tables:
            rows = read_csv(os.path.join(CLEAN_DIR, tbl))
            pks = [r[pk] for r in rows]
            assert len(pks) == len(set(pks)), f"Trùng lặp khóa chính '{pk}' trong {tbl}"

    def test_foreign_key_referential_integrity(self):
        """Khóa ngoại giữa 5 bảng phải toàn vẹn, không có orphan records."""
        custs = {
            r["customer_id"] for r in read_csv(os.path.join(CLEAN_DIR, "customers.csv"))
        }
        emps = {
            r["employee_id"] for r in read_csv(os.path.join(CLEAN_DIR, "employees.csv"))
        }
        prods = {
            r["product_id"] for r in read_csv(os.path.join(CLEAN_DIR, "products.csv"))
        }
        orders = read_csv(os.path.join(CLEAN_DIR, "orders.csv"))
        order_ids = {r["order_id"] for r in orders}
        details = read_csv(os.path.join(CLEAN_DIR, "order_details.csv"))

        for o in orders:
            assert (
                o["customer_id"] in custs
            ), f"Khóa ngoại customer_id {o['customer_id']} không tồn tại"
            assert (
                o["employee_id"] in emps
            ), f"Khóa ngoại employee_id {o['employee_id']} không tồn tại"

        for d in details:
            assert (
                d["order_id"] in order_ids
            ), f"Khóa ngoại order_id {d['order_id']} không tồn tại"
            assert (
                d["product_id"] in prods
            ), f"Khóa ngoại product_id {d['product_id']} không tồn tại"

    def test_financial_calculations(self):
        """Kiểm tra phép tính dòng tiền trong order_details và orders."""
        details = read_csv(os.path.join(CLEAN_DIR, "order_details.csv"))
        for d in details:
            qty = int(d["quantity"])
            price = float(d["unit_price"])
            disc = float(d["discount"])
            expected = round(qty * price * (1.0 - disc), 2)
            actual = float(d["line_total"])
            assert (
                abs(actual - expected) < 0.05
            ), f"Sai lệch line_total tại {d['order_detail_id']}"

    def test_clean_validation_pass_zero_errors(self):
        """Toàn bộ pipeline validation trên bản clean phải trả về 0 lỗi."""
        issues = validate_dataset(CLEAN_DIR)
        assert len(issues) == 0, f"Bản clean không được có lỗi: {issues}"


class TestDirtyDataset:
    """Kiểm tra phát hiện lỗi có chủ ý trên bản dirty (sales_v1_dirty)."""

    def test_dirty_validation_detects_all_issues(self):
        """Validator phải phát hiện lỗi trên bản dirty."""
        issues = validate_dataset(DIRTY_DIR)
        assert (
            len(issues) >= 10
        ), "Bản dirty phải phát hiện đầy đủ ít nhất 10 lỗi cài cắm."

        # Kiểm tra sự xuất hiện của các mã lỗi định danh
        issue_text = " ".join(issues)
        assert "ERR_PK_DUP" in issue_text
        assert "ERR_FK_ORPHAN" in issue_text
        assert "ERR_NULL_MANDATORY" in issue_text
        assert "ERR_INVALID_FORMAT" in issue_text
        assert "ERR_TEMPORAL_PARADOX" in issue_text
        assert "ERR_OUT_OF_RANGE" in issue_text
        assert "ERR_INCONSISTENT_CAT" in issue_text
        assert "ERR_MATH_DISCREPANCY" in issue_text
        assert "ERR_WHITESPACE_ARTIFACT" in issue_text
        assert "ERR_STATUS_CONFLICT" in issue_text
