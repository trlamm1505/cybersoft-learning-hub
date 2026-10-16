"""FastAPI Uvicorn runner script for CyberSoft Security & Privacy Guard."""

import uvicorn
import sys
from pathlib import Path

# Add root of task to path
TASK_ROOT = Path(__file__).resolve().parent.parent
if str(TASK_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK_ROOT))


if __name__ == "__main__":
    print(
        "Khởi động CyberSoft Security & Privacy Guard API tại http://localhost:8000 ..."
    )
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)
