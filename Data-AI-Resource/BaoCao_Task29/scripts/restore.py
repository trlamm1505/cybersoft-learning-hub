import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TASK29_ROOT = Path(__file__).resolve().parent.parent
if str(TASK29_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK29_ROOT))

from src.services.backup_restore import BackupRestoreEngine
from src.config import DATA_DIR


def run_restore():
    engine = BackupRestoreEngine(DATA_DIR / "backup_sample")
    res = engine.verify_and_restore()
    if res.status == "SUCCESS":
        print(f"[SUCCESS] Phục hồi thành công {res.verified_files} tệp tin với mã băm toàn vẹn.")
        return 0
    else:
        print(f"[FAILED] Phục hồi thất bại: {res.details}")
        return 1


if __name__ == "__main__":
    sys.exit(run_restore())
