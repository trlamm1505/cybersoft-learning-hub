import sys
from pathlib import Path

# Add BaoCao_Task16 directory to sys.path
TASK16_DIR = Path(__file__).resolve().parent.parent
if str(TASK16_DIR) not in sys.path:
    sys.path.insert(0, str(TASK16_DIR))
