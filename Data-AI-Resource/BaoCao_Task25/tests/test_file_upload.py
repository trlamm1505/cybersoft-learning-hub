"""Unit and integration tests for Secure File Upload and Magic Byte Inspection."""

import io
import zipfile
from src.services.file_security import FileSecurityService
from src.config import MAX_UPLOAD_SIZE_BYTES


def test_block_dangerous_extension(file_service: FileSecurityService):
    res = file_service.inspect_file("exploit.exe", b"binary content")
    assert res.is_safe is False
    assert res.action == "REJECTED"
    assert any("DANGEROUS_EXTENSION_BLOCKED" in v for v in res.violation_codes)


def test_block_double_extension_attack(file_service: FileSecurityService):
    res = file_service.inspect_file("exercise_data.csv.exe", b"dummy payload")
    assert res.is_safe is False
    assert res.action == "REJECTED"
    assert any("DOUBLE_EXTENSION_ATTACK" in v for v in res.violation_codes)


def test_block_pe_executable_disguised_as_json(file_service: FileSecurityService):
    # Starts with MZ magic byte
    fake_pe_content = b'MZ\x90\x00\x03\x00\x00\x00{"fake": "json"}'
    res = file_service.inspect_file("dataset_dump.json", fake_pe_content)
    assert res.is_safe is False
    assert res.action == "REJECTED"
    assert any("EXECUTABLE_PE_MAGIC_BYTE" in v for v in res.violation_codes)


def test_block_zip_slip_attack_archive(file_service: FileSecurityService):
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("../../etc/cron.d/backdoor", b"malicious content")
    zip_bytes = zip_buffer.getvalue()

    res = file_service.inspect_file("course_archive.zip", zip_bytes)
    assert res.is_safe is False
    assert res.action == "REJECTED"
    assert any("ZIP_SLIP_ATTACK_DETECTED" in v for v in res.violation_codes)


def test_block_oversized_file_dos(file_service: FileSecurityService):
    oversized = b"A" * (MAX_UPLOAD_SIZE_BYTES + 1024)
    res = file_service.inspect_file("huge_dataset.csv", oversized)
    assert res.is_safe is False
    assert res.action == "REJECTED"
    assert any("FILE_SIZE_EXCEEDED" in v for v in res.violation_codes)


def test_accept_valid_json_upload(file_service: FileSecurityService):
    valid_json = b'{"course_name": "AI Engineering", "students_count": 45}'
    res = file_service.inspect_file("course_info.json", valid_json)
    assert res.is_safe is True
    assert res.action == "ACCEPTED"
    assert len(res.violation_codes) == 0
    assert res.detected_mime == "application/json"
