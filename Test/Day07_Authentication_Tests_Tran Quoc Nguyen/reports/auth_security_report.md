# DAY 07 - AUTHENTICATION & AUTHORIZATION TEST REPORT

## Summary

- Total tests: 42
- Passed: 42
- Failed: 0
- Result: PASS
- Environment: Local FastAPI mock / pytest

## Coverage

| Group | Tests | Main focus |
|---|---:|---|
| Token Security | 11 | valid, missing, expired, tampered, malformed, safe logging |
| Profile RBAC | 7 | self, other user, cross-class, teacher, admin |
| Submission IDOR | 7 | ownership, cross-class, teacher/admin access |
| Exercise Permissions | 8 | create/delete permission by role/class |
| Admin Permissions | 4 | admin-only audit endpoint |
| Security Regression | 5 | auth-required, 401/403 schema, no token echo, IDOR |

## Acceptance Criteria Check

- Basic IDOR coverage: PASS
- No real token logged: PASS (`Authorization` / cookies redacted)
- Sensitive endpoints covered: PASS
- Student/Teacher/Admin and cross-class cases: PASS
- Missing/Expired/Tampered token: PASS

## Evidence

- `reports/junit.xml`
- `reports/test_run.txt`
- `Access_Matrix_Day07_Tran_Quoc_Nguyen.xlsx`
- `DEFECT_REPORT.md`
