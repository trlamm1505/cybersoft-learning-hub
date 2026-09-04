"""Pytest Fixtures for CyberSoft Data & AI Lab."""

from pathlib import Path

import pytest


@pytest.fixture
def root_dir():
    """Trả về thư mục gốc của skeleton."""
    return Path(__file__).parent.parent


@pytest.fixture
def sample_course_text():
    """Văn bản mẫu cho bài kiểm tra RAG."""
    return "Khóa học Data Analyst tại CyberSoft bao gồm SQL, Python, Power BI và Đồ án tốt nghiệp."


@pytest.fixture
def sample_pii_texts():
    """Danh sách văn bản chứa PII để kiểm tra Quality Checker."""
    return [
        "Học viên: Nguyen Van A, SĐT: 0912345678, Email: test@cybersoft.edu.vn",
        "Tài liệu bài giảng không chứa thông tin nhạy cảm.",
    ]
