"""Application Settings and Configuration Management.

Tuân thủ nguyên tắc 12-Factor App, tải cấu hình an toàn từ file .env.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Cấu hình ứng dụng toàn cục CyberSoft Data & AI Lab."""

    # Application info
    app_name: str = Field(default="CyberSoft-Data-AI-Lab", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=True, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # API Server
    api_host: str = Field(default="127.0.0.1", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")

    # Storage Paths
    database_url: str = Field(
        default="sqlite:///./cybersoft_lab.db", alias="DATABASE_URL"
    )
    chroma_persist_dir: str = Field(default="./chroma_db", alias="CHROMA_PERSIST_DIR")
    data_dir: str = Field(default="./data", alias="DATA_DIR")

    # AI / Embedding (CPU-First default)
    embedding_model_name: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2", alias="EMBEDDING_MODEL_NAME"
    )
    embedding_device: str = Field(default="cpu", alias="EMBEDDING_DEVICE")
    embedding_dimension: int = Field(default=384, alias="EMBEDDING_DIMENSION")
    chunk_size: int = Field(default=512, alias="CHUNK_SIZE")
    chunk_overlap: int = Field(default=64, alias="CHUNK_OVERLAP")
    similarity_threshold: float = Field(default=0.65, alias="SIMILARITY_THRESHOLD")

    # Quality Gate
    min_quality_score: float = Field(default=85.0, alias="MIN_QUALITY_SCORE")
    enable_pii_detection: bool = Field(default=True, alias="ENABLE_PII_DETECTION")

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    """Lấy singleton settings đã cache."""
    return Settings()
