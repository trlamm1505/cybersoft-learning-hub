"""Kiểm tra sự tồn tại và cấu trúc đầy đủ của Repository Skeleton."""


def test_core_directories_exist(root_dir):
    """Đảm bảo đầy đủ 5 thư mục cốt lõi: src, data, notebooks, tests, docs."""
    required_dirs = ["src", "data", "notebooks", "tests", "docs"]
    for dir_name in required_dirs:
        dir_path = root_dir / dir_name
        assert (
            dir_path.exists() and dir_path.is_dir()
        ), f"Thiếu thư mục bắt buộc: {dir_name}"


def test_data_subdirectories_exist(root_dir):
    """Đảm bảo cấu trúc 3 tầng data: raw, processed, interim kèm .gitkeep."""
    sub_dirs = ["raw", "processed", "interim"]
    for sub in sub_dirs:
        sub_path = root_dir / "data" / sub
        assert sub_path.exists() and sub_path.is_dir(), f"Thiếu thư mục data/{sub}"
        gitkeep = sub_path / ".gitkeep"
        assert gitkeep.exists(), f"Thiếu .gitkeep trong data/{sub}"


def test_modules_exist(root_dir):
    """Đảm bảo đầy đủ 5 module kiến trúc trong src/modules/."""
    modules = ["registry", "quality", "project", "rag", "evaluation"]
    for mod in modules:
        mod_path = root_dir / "src" / "modules" / mod
        assert mod_path.exists() and mod_path.is_dir(), f"Thiếu module: {mod}"
        assert (
            mod_path / "__init__.py"
        ).exists(), f"Thiếu __init__.py trong module {mod}"


def test_single_command_scripts_exist(root_dir):
    """Đảm bảo các script thực thi 1 lệnh chuẩn tồn tại cho mọi nền tảng OS."""
    assert (root_dir / "run.ps1").exists(), "Thiếu run.ps1 cho Windows"
    assert (root_dir / "run.sh").exists(), "Thiếu run.sh cho Linux/macOS"
    assert (root_dir / "Makefile").exists(), "Thiếu Makefile"
