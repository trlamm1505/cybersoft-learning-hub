"""Unit tests for Backup Manifest and SHA-256 Disaster Recovery."""

import pytest
import hashlib
from pathlib import Path
from src.services.backup_restore import BackupRestoreEngine


def test_backup_manifest_structure_and_files(backup_engine):
    manifest = backup_engine.load_manifest()
    assert manifest.total_files == 2
    assert len(manifest.files) == 2
    filenames = [f.filename for f in manifest.files]
    assert "catalog_snapshot.json" in filenames
    assert "vector_index_snapshot.bin" in filenames


def test_sha256_checksum_verification_success(backup_engine):
    res = backup_engine.verify_and_restore()
    assert res.status == "SUCCESS"
    assert res.verified_files == 2
    assert res.matched_checksums == 2
    assert "thành công" in res.details


def test_restore_fails_on_missing_file(tmp_path):
    # Setup corrupted engine pointing to empty dir
    bad_engine = BackupRestoreEngine(tmp_path)
    with pytest.raises(FileNotFoundError):
        bad_engine.load_manifest()


def test_restore_fails_on_tampered_corrupted_file(tmp_path):
    manifest = {
        "backup_id": "BKP-TEST",
        "created_at": "2026-10-11T00:00:00Z",
        "total_files": 1,
        "files": [
            {"filename": "tampered.txt", "size_bytes": 10, "sha256": "fake_sha_256_hash_1234567890"}
        ]
    }
    import json
    (tmp_path / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    (tmp_path / "tampered.txt").write_bytes(b"actual_data")

    engine = BackupRestoreEngine(tmp_path)
    res = engine.verify_and_restore()
    assert res.status == "FAILED"
    assert "Checksum mismatch" in res.details
