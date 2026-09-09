import argparse
from pathlib import Path
import shutil


def main():
    parser = argparse.ArgumentParser(description="Cleanup dữ liệu fixture theo run_id.")
    parser.add_argument("--run-id", required=True, help="Ví dụ: seed20260908_w0")
    parser.add_argument("--output", default="generated")
    args = parser.parse_args()

    target = Path(args.output) / args.run_id

    if not target.exists():
        print(f"Nothing to cleanup: {target}")
        return

    shutil.rmtree(target)
    print(f"Cleaned: {target}")


if __name__ == "__main__":
    main()
