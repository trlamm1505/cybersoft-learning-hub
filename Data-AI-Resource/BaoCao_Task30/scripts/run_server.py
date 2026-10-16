"""Script to run FastAPI server for Task 30 on port 8030."""

import sys
from pathlib import Path
import uvicorn

TASK30_ROOT = Path(__file__).resolve().parent.parent
if str(TASK30_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK30_ROOT))

from src.config import HOST, PORT  # noqa: E402

if __name__ == "__main__":
    display_host = "localhost" if HOST in ("0.0.0.0", "127.0.0.1", "") else HOST
    print(f"Starting Task 30 Final Handover Service on http://{display_host}:{PORT}")
    print(f"Handover Dashboard available at http://{display_host}:{PORT}/portal/")
    print(f"  -> Link trực tiếp mở trình duyệt: http://localhost:{PORT}/portal/")
    print(f"  -> Link dự phòng IP cục bộ: http://127.0.0.1:{PORT}/portal/")
    print(f"Swagger API Docs available at http://{display_host}:{PORT}/docs")
    uvicorn.run("src.main:app", host=HOST, port=PORT, reload=False)
