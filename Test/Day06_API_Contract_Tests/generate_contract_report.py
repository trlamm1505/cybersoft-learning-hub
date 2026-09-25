from pathlib import Path
import xml.etree.ElementTree as ET
from datetime import datetime

junit = Path("reports/junit.xml")
out = Path("reports/contract_report.md")

if not junit.exists():
    raise SystemExit("Không tìm thấy reports/junit.xml. Hãy chạy pytest trước.")

root = ET.parse(junit).getroot()
# pytest may emit testsuites root or testsuite root
suite = root if root.tag == "testsuite" else root.find("testsuite")
if suite is None:
    raise SystemExit("JUnit XML không hợp lệ")

tests = int(suite.attrib.get("tests", 0))
failures = int(suite.attrib.get("failures", 0))
errors = int(suite.attrib.get("errors", 0))
skipped = int(suite.attrib.get("skipped", 0))
passed = tests - failures - errors - skipped
status = "PASS" if failures == 0 and errors == 0 else "FAIL"

text = f"""# CONTRACT REPORT - DAY 06

- Generated at: {datetime.now().isoformat(timespec='seconds')}
- Overall: **{status}**
- Total tests: **{tests}**
- Passed: **{passed}**
- Failed: **{failures}**
- Errors: **{errors}**
- Skipped: **{skipped}**

## Contract coverage

- Auth: status code, success schema, common error schema, validation boundary.
- Resource: GET/POST contract, 404 schema, name/type boundaries.
- Exercise: GET/POST contract, 404 schema, type/score boundaries.
- Submission: response schema, references, answer boundaries.
- OpenAPI: required paths/methods and required response fields.

## Release interpretation

- PASS: API contract baseline v0.1 is compatible with the required contract.
- FAIL: investigate the failed test; a missing path/field or changed status/error schema may be a breaking change.
"""
out.write_text(text, encoding="utf-8")
print(f"Wrote: {out}")
