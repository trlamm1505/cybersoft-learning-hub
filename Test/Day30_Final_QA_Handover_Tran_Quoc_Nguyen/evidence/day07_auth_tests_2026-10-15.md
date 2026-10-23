# Day 7 auth/RBAC tests - chạy lại
Thời điểm (UTC): 2026-10-15 13:02:28
Máy: Linux VM Cowork trên máy tester; Python 3.10.12; pytest 9.1.1
Commit repo: d804c49
Phạm vi: API FastAPI mô phỏng của Ngày 7 (app.py), không phải BE NestJS
Lệnh: python -m pytest -q -p no:cacheprovider
```
  <venv>/lib/python3.10/site-packages/starlette/testclient.py:45: DeprecationWarning: The anyio.abc.BlockingPortal alias is deprecated, use anyio.from_thread.BlockingPortal instead.
    _PortalFactoryType = Callable[[], AbstractContextManager[anyio.abc.BlockingPortal]]

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
42 passed, 1 warning in 0.48s
exit code: 0
```
