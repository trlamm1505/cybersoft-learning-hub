"""Logging configuration using Loguru."""

import sys

from loguru import logger


def setup_logger(log_level: str = "INFO"):
    """Cấu hình logging có cấu trúc cho console và file."""
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=log_level,
    )
    return logger
