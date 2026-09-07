"""Kiểm tra tính tương thích và toàn vẹn của môi trường thực thi."""

import sys


def test_python_version():
    """Đảm bảo phiên bản Python tương thích (>= 3.10)."""
    assert sys.version_info >= (
        3,
        10,
    ), f"Yêu cầu Python >= 3.10, hiện tại là: {sys.version}"


def test_env_example_exists(root_dir):
    """Đảm bảo file .env.example luôn tồn tại và không chứa secrets thực tế."""
    env_example = root_dir / ".env.example"
    assert env_example.exists(), "Thiếu file .env.example"

    content = env_example.read_text(encoding="utf-8")
    assert "APP_NAME" in content
    assert "DATABASE_URL" in content
    assert "EMBEDDING_DEVICE=cpu" in content
    # Kiểm tra không chứa secret thực tế
    assert (
        "change-this" in content
        or "your-secret" in content
        or "dummy" in content.lower()
    )


def test_gitignore_security_rules(root_dir):
    """Đảm bảo .gitignore chặn đúng các file nhạy cảm và dữ liệu lớn."""
    gitignore = root_dir / ".gitignore"
    assert gitignore.exists(), "Thiếu file .gitignore"

    content = gitignore.read_text(encoding="utf-8")
    assert ".env" in content
    assert "*.parquet" in content or "data/raw/*" in content
    assert "*.db" in content
    assert "chroma_db/" in content
    assert "__pycache__/" in content
