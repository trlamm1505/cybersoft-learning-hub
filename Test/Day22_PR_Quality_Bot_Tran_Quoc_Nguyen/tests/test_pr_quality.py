import importlib.util
import io
import json
import os
import re
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path


DAY22 = Path(__file__).resolve().parents[1]
REPO = DAY22.parents[1]
SPEC = importlib.util.spec_from_file_location("pr_quality", DAY22 / "scripts" / "pr_quality.py")
pr_quality = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(pr_quality)

# Secret giả luôn được GHÉP lúc runtime để chính file test này không bị scanner bắt.
FAKE_OPENAI = "sk-" + ("b" * 32)
ENV_NAME = "OPENAI" + "_API_KEY"


def run_main(argv):
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = pr_quality.main(argv)
    return code, out.getvalue(), err.getvalue()


class MappingTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((DAY22 / "config" / "change-impact-map.json").read_text(encoding="utf-8"))

    def ids(self, *files):
        return [gate["id"] for gate in pr_quality.classify_changes(list(files), self.config)["selected"]]

    def test_frontend_change_selects_only_frontend_gate(self):
        self.assertEqual(["frontend_quality"], self.ids("learning-hub/FE/src/App.tsx"))

    def test_backend_controller_selects_backend_and_review_advisory(self):
        result = pr_quality.classify_changes(["learning-hub/BE/src/users/users.controller.ts"], self.config)
        self.assertEqual(["backend_quality"], [gate["id"] for gate in result["selected"]])
        self.assertEqual(["api-contract-mock"], [adv["id"] for adv in result["advisories"]])

    def test_quiz_seed_runs_backend_and_real_quiz_validation(self):
        self.assertEqual(["backend_quality", "quiz_content"], self.ids("learning-hub/BE/src/data/initial-quiz-questions.ts"))

    def test_exercise_seed_runs_real_coding_validation(self):
        self.assertIn("coding_content", self.ids("learning-hub/BE/src/data/initial-exercises-day14.ts"))

    def test_build_config_files_are_not_skipped(self):
        self.assertEqual(["backend_quality"], self.ids("learning-hub/BE/Dockerfile", "learning-hub/BE/nest-cli.json"))
        self.assertEqual(["frontend_quality"], self.ids("learning-hub/FE/index.html"))

    def test_any_workflow_change_runs_self_test(self):
        self.assertEqual(["pr_quality_self_test"], self.ids(".github/workflows/qa-ci.yml"))

    def test_docs_only_change_runs_no_gate_and_is_not_unmapped(self):
        result = pr_quality.classify_changes(["Test/day21/README.md", "learning-hub/BE/README.md", "Test/x/reports/junit.xml"], self.config)
        self.assertEqual([], result["selected"])
        self.assertEqual([], result["unmapped"])
        self.assertEqual(3, len(result["docs_only"]))

    def test_markdown_fixture_is_not_treated_as_docs(self):
        self.assertEqual(["content_lint_tool"], self.ids("Test/Day11_Content_Lint_Tran_Quoc_Nguyen/tools/content-lint/samples/lesson-bad.md"))

    def test_unmapped_code_file_is_reported_not_silently_passed(self):
        result = pr_quality.classify_changes(["Data-AI-Resource/pipeline/train.py"], self.config)
        self.assertEqual(["Data-AI-Resource/pipeline/train.py"], result["unmapped"])
        self.assertEqual("WARN", pr_quality.decide_overall([], [], result["unmapped"], False, False))
        self.assertEqual("FAIL", pr_quality.decide_overall([], [], result["unmapped"], False, True))

    def test_matching_is_case_sensitive_on_every_os(self):
        self.assertEqual([], self.ids("LEARNING-HUB/fe/src/App.tsx"))

    def test_every_gate_has_remediation_and_existing_entrypoints(self):
        for gate in self.config["gates"]:
            self.assertTrue(gate["remediation"].strip(), gate["id"])
            self.assertTrue(gate.get("commands"), gate["id"])
            if gate.get("cwd"):
                self.assertTrue((REPO / gate["cwd"]).is_dir(), gate["id"])
            for command in gate.get("setup", []) + gate["commands"]:
                for part in command:
                    if part.startswith("Test/") and "{tmp}" not in part:
                        self.assertTrue((REPO / part).exists(), f"{gate['id']}: thiếu {part}")


class SecurityTests(unittest.TestCase):
    def scan(self, name, content):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
            return [item["rule"] for item in pr_quality.scan_security([name], Path(temp))]

    def test_secret_detected_whatever_the_file_name(self):
        for name in ("config.env", ".env.production", "secrets.pem", "credentials", "deploy/notes.md"):
            self.assertTrue(self.scan(name, f"{ENV_NAME}={FAKE_OPENAI}"), name)

    def test_database_url_with_password_detected_but_local_url_allowed(self):
        self.assertEqual([], self.scan("a.env", "DATABASE_URL=mongodb://localhost:27017/cybersoft_day08"))
        self.assertEqual([], self.scan("b.md", "mongodb://username:password@host/db"))
        self.assertIn("url_with_credentials", self.scan("c.env", "DATABASE_URL=" + "mongodb+srv://" + "appuser:" + "Zx9kQ2mLp7" + "@cluster0.mongodb.net/db"))

    def test_placeholders_are_not_reported(self):
        self.assertEqual([], self.scan(".env.example", "JWT_SECRET=changeme_please_replace_this\nGEMINI_API_KEY=${GEMINI_API_KEY}\nOPENAI_API_KEY=<your key here>"))

    def test_findings_never_contain_the_secret_value(self):
        with tempfile.TemporaryDirectory() as temp:
            (Path(temp) / "x.txt").write_text(f"{ENV_NAME}={FAKE_OPENAI}", encoding="utf-8")
            findings = pr_quality.scan_security(["x.txt", "x.txt"], Path(temp))
        self.assertNotIn(FAKE_OPENAI, json.dumps(findings))
        self.assertEqual(len(findings), len({(f["file"], f["rule"]) for f in findings}), "finding bị lặp")

    def test_redaction_hides_tokens_passwords_and_jwt(self):
        jwt = "eyJ" + "hbGciOiJIUzI1NiJ9" + "." + "eyJzdWIiOiIxMjM0NTY3ODkwIn0" + "." + "abcDEF123"
        sample = "\n".join([
            "Authorization: Bearer abcdefghijklmnop",
            FAKE_OPENAI,
            "pass" + "word=hunter2secret",
            "login with Bearer " + "q" * 24,
            jwt,
            "mongodb://appuser:" + "Zx9kQ2mLp7" + "@host/db",
        ])
        redacted = pr_quality.redact(sample)
        for leaked in (FAKE_OPENAI, "abcdefghijklmnop", "hunter2secret", "q" * 24, jwt, "Zx9kQ2mLp7"):
            self.assertNotIn(leaked, redacted)

    def test_allowlist_only_covers_listed_secret_rules_never_workflow_rules(self):
        allow = [{"pattern": "spec/fake.spec.ts", "rules": ["openai_key", "automatic_pr_merge"], "reason": "fixture"}]
        findings = [
            {"file": "spec/fake.spec.ts", "rule": "openai_key", "line": 1, "message": "m"},
            {"file": "spec/fake.spec.ts", "rule": "github_token", "line": 2, "message": "m"},
            {"file": "src/real.ts", "rule": "openai_key", "line": 3, "message": "m"},
            {"file": "spec/fake.spec.ts", "rule": "automatic_pr_merge", "line": 4, "message": "m"},
        ]
        blocking, allowed = pr_quality.apply_allowlist(findings, allow)
        self.assertEqual([1], [f["line"] for f in allowed])
        self.assertEqual([2, 3, 4], [f["line"] for f in blocking])

    def test_every_allowlist_entry_has_a_reason_and_exact_file(self):
        config = json.loads((DAY22 / "config" / "change-impact-map.json").read_text(encoding="utf-8"))
        for entry in config["secret_scan_allowlist"]:
            self.assertGreater(len(entry["reason"]), 20)
            self.assertNotIn("*", entry["pattern"], "allowlist phải chỉ đích danh file")

    def test_workflow_scanner_blocks_auto_approve_merge_and_comment_spam(self):
        rules = self.scan(".github/workflows/bad.yml", "run: gh pr review 12 --approve\nrun: gh pr merge 12\nrun: gh pr comment 12 --body hi")
        for rule in ("automatic_pr_approval", "automatic_pr_merge", "unbounded_pr_comment"):
            self.assertIn(rule, rules)

    def test_repo_workflow_is_read_only_and_cannot_approve(self):
        text = (REPO / ".github" / "workflows" / "pr-quality.yml").read_text(encoding="utf-8")
        self.assertEqual([], [item["rule"] for item in pr_quality.scan_security([".github/workflows/pr-quality.yml"], REPO)])
        self.assertNotRegex(text, r":\s*write\b")
        self.assertNotIn("|| true", text)
        self.assertNotIn("continue-on-error", text)
        self.assertRegex(text, r"cancel-in-progress:\s*true")

    def test_bot_source_and_tests_pass_their_own_secret_scan(self):
        files = [str(p.relative_to(REPO)).replace(os.sep, "/") for p in DAY22.rglob("*") if p.is_file() and "__pycache__" not in p.parts]
        self.assertEqual([], pr_quality.scan_security(files, REPO))


class ExitCodeTests(unittest.TestCase):
    def gate(self, code, blocking=True):
        return {"id": "demo", "name": "Demo gate", "patterns": ["a.txt"], "blocking": blocking, "remediation": "Sửa lỗi và chạy lại.",
                "commands": [["python", "-c", f"import sys; print('step'); sys.exit({code})"], ["python", "-c", "print('KHONG DUOC CHAY')"]]}

    def run_bot(self, gates, files, *extra):
        with tempfile.TemporaryDirectory() as temp:
            config = Path(temp) / "map.json"
            config.write_text(json.dumps({"gates": gates, "docs_only_patterns": ["*.md"]}), encoding="utf-8")
            code, out, err = run_main(["--files", *files, "--config", str(config), "--output-dir", str(Path(temp) / "out"), *extra])
            report = Path(temp) / "out" / "pr-quality-report.json"
            payload = json.loads(report.read_text(encoding="utf-8")) if report.exists() else None
        return code, out, err, payload

    def test_failed_command_preserves_nonzero_exit_code(self):
        result = pr_quality.run_command(["python", "-c", "import sys; sys.exit(3)"], Path.cwd())
        self.assertEqual(3, result["exit_code"])

    def test_passing_gate_gives_exit_0(self):
        code, _, _, payload = self.run_bot([self.gate(0)], ["a.txt"])
        self.assertEqual((0, "PASS"), (code, payload["overall_status"]))

    def test_failing_gate_gives_exit_1_keeps_real_code_and_stops(self):
        code, out, _, payload = self.run_bot([self.gate(7)], ["a.txt"])
        self.assertEqual((1, "FAIL"), (code, payload["overall_status"]))
        self.assertEqual(7, payload["gates"][0]["exit_code"])
        self.assertEqual(1, len(payload["gates"][0]["steps"]))
        self.assertNotIn("KHONG DUOC CHAY", out)
        self.assertIn("**Cách khắc phục:** Sửa lỗi và chạy lại.", out)

    def test_advisory_gate_failure_warns_without_blocking(self):
        code, out, _, payload = self.run_bot([self.gate(4, blocking=False)], ["a.txt"])
        self.assertEqual((0, "WARN"), (code, payload["overall_status"]))
        self.assertIn("Cách khắc phục", out)

    def test_missing_tool_is_fail_not_pass(self):
        gate = self.gate(0)
        gate["commands"] = [["lenh-khong-ton-tai-xyz"]]
        code, _, _, payload = self.run_bot([gate], ["a.txt"])
        self.assertEqual(1, code)
        self.assertEqual(127, payload["gates"][0]["exit_code"])

    def test_secret_finding_fails_even_when_tests_pass(self):
        with tempfile.TemporaryDirectory() as temp:
            leak = Path(temp) / "leak.txt"
            leak.write_text(f"{ENV_NAME}={FAKE_OPENAI}", encoding="utf-8")
            findings = pr_quality.scan_security(["leak.txt"], Path(temp))
        markdown, payload = pr_quality.build_report(["leak.txt"], [], findings, False)
        self.assertEqual(("FAIL", 1), (payload["overall_status"], payload["exit_code"]))
        self.assertIn("**Cách khắc phục:**", markdown)
        self.assertNotIn(FAKE_OPENAI, markdown)

    def test_unmapped_file_warns_by_default_and_fails_in_strict_mode(self):
        code, out, _, payload = self.run_bot([self.gate(0)], ["other/code.py"])
        self.assertEqual((0, "WARN"), (code, payload["overall_status"]))
        self.assertIn("chưa có gate", out)
        code, _, _, payload = self.run_bot([self.gate(0)], ["other/code.py"], "--strict-unmapped")
        self.assertEqual((1, "FAIL"), (code, payload["overall_status"]))

    def test_empty_change_list_is_an_error_not_a_pass(self):
        with tempfile.TemporaryDirectory() as temp:
            empty = Path(temp) / "changed.txt"
            empty.write_text("\n", encoding="utf-8")
            code, _, err = run_main(["--changed-file", str(empty), "--output-dir", str(Path(temp) / "out")])
            self.assertEqual(2, code)
            self.assertIn("Cách xử lý", err)
            self.assertFalse((Path(temp) / "out").exists())

    def test_plan_only_runs_nothing(self):
        code, _, _, payload = self.run_bot([self.gate(9)], ["a.txt"], "--plan-only")
        self.assertEqual((0, "PLANNED"), (code, payload["overall_status"]))
        self.assertEqual([], payload["gates"][0]["steps"])

    def test_node_output_is_decoded_as_utf8(self):
        result = pr_quality.run_command(["node", "-e", "console.log('Không lỗi tiếng Việt')"], Path.cwd())
        self.assertEqual(0, result["exit_code"])
        self.assertIn("Không lỗi tiếng Việt", result["output"])


class ReportTests(unittest.TestCase):
    def test_report_never_claims_approval(self):
        markdown, payload = pr_quality.build_report(["a.py"], [], [], False)
        self.assertFalse(payload["auto_approve"])
        self.assertIn("không được tự approve/merge", markdown)
        self.assertNotRegex(markdown, r"(?i)\bLGTM\b|approved by bot")

    def test_passing_logs_are_shortened_and_report_size_is_capped(self):
        noisy = "\n".join(f"dòng {i} " + "x" * 200 for i in range(2000))
        step = {"command": "demo", "exit_code": 0, "duration_seconds": 0.1, "output": noisy[-pr_quality.MAX_LOG_CHARS:], "phase": "commands"}
        results = [{"id": f"g{i}", "name": f"Gate {i}", "blocking": True, "status": "PASS", "exit_code": 0, "remediation": "x", "steps": [step]} for i in range(40)]
        markdown, _ = pr_quality.build_report(["a.py"], results, [], False)
        self.assertLessEqual(len(markdown), pr_quality.MAX_REPORT_CHARS + 200)
        one, _ = pr_quality.build_report(["a.py"], results[:1], [], False)
        self.assertLessEqual(one.count("dòng "), pr_quality.PASS_LOG_LINES + 1)

    def test_long_file_and_finding_lists_are_truncated(self):
        files = [f"src/f{i}.py" for i in range(300)]
        findings = [{"file": f, "rule": "openai_key", "line": 1, "message": "m"} for f in files]
        impact = {"impact": [{"file": f, "kind": "unmapped", "gates": []} for f in files], "unmapped": files, "docs_only": [], "advisories": []}
        markdown, payload = pr_quality.build_report(files, [], findings, False, impact)
        self.assertEqual(300, len(payload["changed_files"]))
        self.assertLessEqual(len(re.findall(r"`src/f\d+\.py", markdown)), pr_quality.MAX_FILES_LISTED + pr_quality.MAX_FINDINGS_LISTED)
        self.assertIn("file khác", markdown)

    def test_report_links_to_actions_run_in_ci(self):
        env = {"GITHUB_SERVER_URL": "https://github.com", "GITHUB_REPOSITORY": "o/r", "GITHUB_RUN_ID": "123"}
        old = {k: os.environ.get(k) for k in env}
        os.environ.update(env)
        try:
            markdown, payload = pr_quality.build_report(["a.py"], [], [], False)
        finally:
            for key, value in old.items():
                os.environ.pop(key, None) if value is None else os.environ.__setitem__(key, value)
        self.assertEqual("https://github.com/o/r/actions/runs/123", payload["actions_run_url"])
        self.assertIn("pr-quality-report-123", markdown)

    def test_command_display_does_not_leak_local_paths(self):
        result = pr_quality.run_command(["python", "-c", "print(1)"], Path.cwd())
        self.assertTrue(result["command"].startswith("python "))


if __name__ == "__main__":
    unittest.main()
