# Demo live-change: chứng minh suite bắt IDOR

Trong `app.py`, endpoint `get_submission()` có hai lớp kiểm tra:

1. `ensure_class_access(user, class_id)`
2. Student chỉ được đọc submission có `user_id == user["id"]`

Để demo, tạm thời bỏ dòng:

```python
ensure_class_access(user, class_id)
```

và tạm bỏ ownership check của student, sau đó chạy:

```powershell
python -m pytest tests/test_submission_idor.py tests/test_security_regression.py -v
```

Các IDOR test phải FAIL. Sau đó Undo để khôi phục code và chạy lại, suite phải PASS.

Không giữ phiên bản insecure sau khi demo.
