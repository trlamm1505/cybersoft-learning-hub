"""Script to launch the Task 26 FastAPI server."""

import sys
from pathlib import Path
import uvicorn

TASK26_ROOT = Path(__file__).resolve().parent.parent
if str(TASK26_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK26_ROOT))

from src.config import HOST, PORT  # noqa: E402

if __name__ == "__main__":
    display_host = "localhost" if HOST in ("0.0.0.0", "127.0.0.1", "") else HOST
    print(
        f"Starting CyberSoft Learning Platform Integration Gateway at http://{display_host}:{PORT}"
    )
    print(f"Swagger API Docs: http://{display_host}:{PORT}/docs")
    uvicorn.run("src.main:app", host=HOST, port=PORT, reload=False)
