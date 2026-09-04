"""Hệ thống ngoại lệ chuẩn hóa cho CyberSoft Data & AI Lab.

Định nghĩa các mã lỗi (Error Codes) tương ứng với Ma trận trạng thái lỗi Ngày 02.
"""


class CyberSoftLabException(Exception):
    """Ngoại lệ cơ sở cho toàn bộ hệ sinh thái Data & AI Lab."""

    def __init__(self, code: str, message: str, details: dict | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}


class SchemaMismatchException(CyberSoftLabException):
    """Lỗi lệch schema dữ liệu (ERR_DATA_SCHEMA_MISMATCH)."""

    def __init__(
        self,
        message: str = "Lệch cấu trúc bảng so với schema quy định",
        details: dict | None = None,
    ):
        super().__init__("ERR_DATA_SCHEMA_MISMATCH", message, details)


class PIIDetectedException(CyberSoftLabException):
    """Phát hiện dữ liệu định danh cá nhân nhạy cảm (ERR_DATA_PII_DETECTED)."""

    def __init__(
        self,
        message: str = "Phát hiện thông tin cá nhân chưa ẩn danh",
        details: dict | None = None,
    ):
        super().__init__("ERR_DATA_PII_DETECTED", message, details)


class LowQualityScoreException(CyberSoftLabException):
    """Điểm chất lượng dữ liệu dưới ngưỡng cho phép (ERR_DATA_QUALITY_BELOW_THRESHOLD)."""

    def __init__(self, score: float, min_score: float = 85.0):
        super().__init__(
            "ERR_DATA_QUALITY_BELOW_THRESHOLD",
            f"Điểm chất lượng ({score}) chưa đạt ngưỡng tối thiểu ({min_score})",
            {"score": score, "min_score": min_score},
        )


class RAGAbstentionException(CyberSoftLabException):
    """RAG từ chối trả lời do tài liệu giáo trình không đủ dữ kiện (ERR_RAG_ABSTENTION)."""

    def __init__(self, message: str = "Tài liệu giáo trình không đủ dữ kiện đối soát"):
        super().__init__("ERR_RAG_ABSTENTION", message)
