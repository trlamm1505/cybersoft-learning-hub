"""Configuration settings for CyberSoft Lineage and Versioning System v0.1."""

from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_DIR = DATA_DIR / "artifacts"
RELEASES_DIR = DATA_DIR / "releases"
PORTAL_DIR = BASE_DIR / "portal"


class AppConfig(BaseModel):
    app_name: str = "CyberSoft Lineage & Versioning System"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    host: str = "0.0.0.0"
    port: int = 8000

    # Storage settings
    base_dir: Path = BASE_DIR
    data_dir: Path = DATA_DIR
    artifacts_dir: Path = ARTIFACTS_DIR
    releases_dir: Path = RELEASES_DIR
    portal_dir: Path = PORTAL_DIR

    # WORM & Lineage settings
    enable_worm_enforcement: bool = True
    hash_algorithm: str = "sha256"
    supported_types: list[str] = [
        "dataset",
        "prompt",
        "model",
        "index",
        "evaluation",
        "exercise",
    ]


config = AppConfig()
