import sys
import json
import hashlib
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = DATA_DIR / "backup_sample"


def create_backup():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    files_to_backup = ["catalog_snapshot.json", "vector_index_snapshot.bin"]
    manifest_files = []

    for f_name in files_to_backup:
        p = OUTPUT_DIR / f_name
        if p.exists():
            data = p.read_bytes()
            sha = hashlib.sha256(data).hexdigest()
            manifest_files.append({
                "filename": f_name,
                "size_bytes": len(data),
                "sha256": sha
            })

    manifest = {
        "backup_id": f"BKP-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "total_files": len(manifest_files),
        "files": manifest_files
    }

    with open(OUTPUT_DIR / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"[SUCCESS] Tạo bản sao lưu thành công với {len(manifest_files)} tệp tin.")


if __name__ == "__main__":
    create_backup()
