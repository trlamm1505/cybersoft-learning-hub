import argparse
from factory import TestDataFactory


def main():
    parser = argparse.ArgumentParser(description="Sinh test data deterministic cho Day 05.")
    parser.add_argument("--seed", type=int, default=20260908)
    parser.add_argument("--worker", default="w0")
    parser.add_argument("--output", default="generated")
    args = parser.parse_args()

    factory = TestDataFactory(seed=args.seed, worker_id=args.worker)
    run_dir = factory.export(args.output)
    print(f"Generated 20 scenarios at: {run_dir}")
    print(f"run_id={factory.run_id}")


if __name__ == "__main__":
    main()
