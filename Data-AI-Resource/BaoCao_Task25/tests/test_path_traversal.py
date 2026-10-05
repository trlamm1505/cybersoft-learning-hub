"""Unit and integration tests for Path Traversal Sandboxing."""

import pytest
from src.services.file_security import FileSecurityService, PathTraversalError


def test_block_standard_dot_dot_traversal(file_service: FileSecurityService):
    with pytest.raises(PathTraversalError) as exc_info:
        file_service.validate_safe_path("../../etc/passwd")
    assert "PATH_TRAVERSAL_DETECTED" in str(exc_info.value)


def test_block_windows_backslash_traversal(file_service: FileSecurityService):
    with pytest.raises(PathTraversalError) as exc_info:
        file_service.validate_safe_path("..\\..\\Windows\\System32\\cmd.exe")
    assert "PATH_TRAVERSAL_DETECTED" in str(exc_info.value)


def test_block_null_byte_injection(file_service: FileSecurityService):
    with pytest.raises(PathTraversalError) as exc_info:
        file_service.validate_safe_path("report.json\x00.exe")
    assert "NULL_BYTE_INJECTION_DETECTED" in str(exc_info.value)


def test_block_url_encoded_traversal(file_service: FileSecurityService):
    with pytest.raises(PathTraversalError) as exc_info:
        file_service.validate_safe_path("%2e%2e/%2e%2e/data/config.py")
    assert "PATH_TRAVERSAL_DETECTED" in str(exc_info.value)


def test_allow_safe_subpath_inside_sandbox(file_service: FileSecurityService):
    safe_subfile = "datasets/clean_retail_sample.json"
    resolved = file_service.validate_safe_path(safe_subfile)
    assert str(resolved).startswith(str(file_service.sandbox_dir))
    assert resolved.name == "clean_retail_sample.json"
