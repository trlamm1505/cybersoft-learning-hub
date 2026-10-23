"""Verify the controlled LAB-09 SQLite snapshot and restore buggy mode."""
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from create_snapshot import create_snapshot

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "data" / "day14_snapshot.sqlite"
REPORT = ROOT / "reports" / "2026-09-23-LAB09-sql-reset-verification.json"


def inspect_snapshot():
    with sqlite3.connect(DB) as db:
        duplicates = db.execute(
            """SELECT lower(trim(email)) AS email_key, COUNT(*) AS total
               FROM users GROUP BY lower(trim(email)) HAVING COUNT(*) > 1"""
        ).fetchall()
        orphans = db.execute(
            """SELECT a.id, a.userId FROM attempts a
               LEFT JOIN users u ON u.id = a.userId WHERE u.id IS NULL"""
        ).fetchall()
    return {
        "duplicateEmails": [{"emailKey": row[0], "count": row[1]} for row in duplicates],
        "orphanAttempts": [{"attemptId": row[0], "userId": row[1]} for row in orphans],
    }


buggy_path = create_snapshot(clean=False)
buggy = inspect_snapshot()
create_snapshot(clean=True)
clean = inspect_snapshot()
create_snapshot(clean=False)
restored = inspect_snapshot()

result = {
    "checkedAt": datetime.now(timezone.utc).astimezone().isoformat(),
    "database": str(buggy_path),
    "buggy": buggy,
    "clean": clean,
    "restoredBuggy": restored,
    "pass": (
        len(buggy["duplicateEmails"]) == 1
        and len(buggy["orphanAttempts"]) == 1
        and len(clean["duplicateEmails"]) == 0
        and len(clean["orphanAttempts"]) == 0
        and restored == buggy
    ),
}
REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
raise SystemExit(0 if result["pass"] else 1)
