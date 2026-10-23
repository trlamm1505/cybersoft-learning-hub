# DAY 07 - Authentication & Authorization Tests

## Mục tiêu

Xây security regression suite cho Authentication và Authorization, tập trung vào:

- Role: student / teacher / admin
- Cross-class access
- Missing / expired / tampered token
- Basic IDOR/ownership checks
- Không log token thật
- Mọi endpoint nhạy cảm đều có test

> Đây là mock/local training project. Không sử dụng token, tài khoản hay dữ liệu production.

## Cài đặt

```powershell
python -m pip install -r requirements.txt
```

## Chạy test

```powershell
python -m pytest -v --junitxml=reports/junit.xml
```

## Chạy Mock API

```powershell
python -m uvicorn app:app --reload
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

## Cơ chế quyền

- Student: xem profile của chính mình và submission của chính mình.
- Teacher: xem dữ liệu học viên/submission trong đúng lớp của mình và tạo exercise trong lớp mình.
- Admin: được truy cập mọi lớp và endpoint quản trị.
- Unauthenticated: bị chặn ở endpoint nhạy cảm.
- Cross-class: student/teacher bị chặn.

## Cơ chế token

`issue_token()` tạo token HMAC mock có `sub`, `iat`, `exp`.

`decode_token()` kiểm tra:

1. Cấu trúc token.
2. Chữ ký HMAC.
3. Thời gian hết hạn.
4. User tương ứng còn tồn tại.

Token bị thiếu, hết hạn hoặc sửa chữ ký sẽ nhận HTTP 401.

## Basic IDOR

Ví dụ student `stu_a` biết ID `sub_b1` nhưng submission đó thuộc `class_b` và user khác. Endpoint phải trả 403 thay vì dữ liệu.

## Không log token

`sanitize_headers()` thay `Authorization`, `Cookie`, `Set-Cookie` thành `[REDACTED]` trước khi log.

## Bằng chứng nên chụp

1. Terminal toàn bộ test PASS.
2. Swagger có các endpoint nhạy cảm.
3. Một test IDOR PASS.
4. Một test expired/tampered token PASS.
5. Access Matrix.
6. JUnit report trong `reports/junit.xml`.
