"""Dataset Registry Service: Quản lý catalog, metadata và vòng đời bộ dữ liệu."""

import hashlib
from pathlib import Path
from typing import Any


class DatasetRegistryService:
    """Dịch vụ quản lý đăng ký dataset và tính toàn vẹn băm SHA-256."""

    def __init__(self, storage_dir: str = "./data"):
        self.storage_dir = Path(storage_dir)

    def calculate_sha256(self, file_path: str | Path) -> str:
        """Tính toán mã băm SHA-256 của file dữ liệu để chống giả mạo."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Dataset file không tồn tại: {file_path}")

        sha256 = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(8192):
                sha256.update(chunk)
        return sha256.hexdigest()

    def register_dataset(self, metadata: dict[str, Any]) -> dict[str, Any]:
        """Đăng ký dataset mới vào catalog sau khi kiểm tra schema."""
        required_fields = ["dataset_id", "version", "domain", "file_path"]
        for field in required_fields:
            if field not in metadata:
                raise ValueError(f"Thiếu trường metadata bắt buộc: {field}")

        metadata["status"] = "PENDING_VALIDATION"
        return metadata
