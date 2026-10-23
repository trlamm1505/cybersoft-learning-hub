"""Chuyển hướng tương thích ngược cho UsabilityEngine."""
from .usability_service import UsabilityService

UsabilityEngine = UsabilityService
__all__ = ["UsabilityEngine"]
