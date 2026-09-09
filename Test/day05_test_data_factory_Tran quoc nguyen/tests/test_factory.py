import json
import tempfile
import unittest
from pathlib import Path

from factory import TestDataFactory


class TestDataFactoryTests(unittest.TestCase):

    def test_same_seed_is_deterministic(self):
        a = TestDataFactory(seed=1234, worker_id="w0").build_20_scenarios()
        b = TestDataFactory(seed=1234, worker_id="w0").build_20_scenarios()
        self.assertEqual(a, b)

    def test_parallel_workers_do_not_collide(self):
        a = TestDataFactory(seed=1234, worker_id="w0").user(1)
        b = TestDataFactory(seed=1234, worker_id="w1").user(1)
        self.assertNotEqual(a["id"], b["id"])
        self.assertNotEqual(a["email"], b["email"])

    def test_no_real_pii_domain(self):
        scenarios = TestDataFactory(seed=1234, worker_id="w0").build_20_scenarios()
        for sc in scenarios:
            email = sc.data.get("email")
            if email:
                self.assertTrue(email.endswith("@example.test"))

    def test_has_exactly_20_scenarios(self):
        scenarios = TestDataFactory(seed=1234, worker_id="w0").build_20_scenarios()
        self.assertEqual(len(scenarios), 20)

    def test_has_all_categories(self):
        scenarios = TestDataFactory(seed=1234, worker_id="w0").build_20_scenarios()
        categories = {x.category for x in scenarios}
        self.assertEqual(categories, {"valid", "boundary", "invalid", "adversarial"})

    def test_export_creates_manifest_and_scenarios(self):
        with tempfile.TemporaryDirectory() as tmp:
            factory = TestDataFactory(seed=4321, worker_id="gw0")
            run_dir = factory.export(tmp)
            self.assertTrue((run_dir / "manifest.json").exists())
            self.assertTrue((run_dir / "scenarios.json").exists())
            data = json.loads((run_dir / "scenarios.json").read_text(encoding="utf-8"))
            self.assertEqual(len(data), 20)


if __name__ == "__main__":
    unittest.main()
