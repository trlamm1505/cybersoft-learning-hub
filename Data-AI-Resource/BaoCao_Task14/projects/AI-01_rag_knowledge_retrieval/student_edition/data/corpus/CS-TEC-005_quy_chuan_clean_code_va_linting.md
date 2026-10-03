---
document_id: CS-TEC-005
title: "Quy chuẩn viết Clean Code, Type Hinting và Linting chuẩn PEP8"
category: Technical Guide
version: v1.4
effective_date: 2025-01-20
last_updated: 2025-09-01
author: "Ban Kỹ thuật Phần mềm CyberSoft"
tags: ["clean_code", "pep8", "type_hints", "flake8", "black"]
target_audience: "Lập trình viên và học viên toàn học viện"
---

# CS-TEC-005: Quy chuẩn viết Clean Code, Type Hinting và Linting chuẩn PEP8

## SEC-TEC-005-01: Quy tắc định danh biến, hàm và lớp theo chuẩn PEP8

Quy tắc định danh bắt buộc: Tên biến và tên hàm sử dụng kiểu chữ thường nối dấu gạch dưới `snake_case` (ví dụ: `calculate_monthly_kpi`, `total_amount`); Tên lớp (Class) sử dụng kiểu viết hoa chữ cái đầu `PascalCase` (ví dụ: `StudentEnrollmentService`); Tên hằng số toàn cục viết in hoa toàn bộ `UPPER_SNAKE_CASE` (ví dụ: `MAX_RETRIES_LIMIT = 5`). Không sử dụng các biến đơn lẻ tối nghĩa như `x`, `y`, `temp` trừ trong các phép lặp ngắn gọn.

## SEC-TEC-005-02: Bắt buộc khai báo Type Hints và Docstrings

Tất cả các hàm và phương thức public trong dự án bắt buộc phải khai báo Type Hints tường minh cho các đối số đầu vào và kiểu dữ liệu trả về (sử dụng module `typing` như `List`, `Dict`, `Optional`, `Tuple`). Mỗi hàm phải có Docstring theo định dạng Google Style hoặc Sphinx, mô tả tối thiểu: Tóm tắt mục đích hàm, danh sách tham số (Args), giá trị trả về (Returns), và các ngoại lệ có thể phát sinh (Raises).

## SEC-TEC-005-03: Thiết lập công cụ tự động kiểm tra cú pháp (Flake8 & Black)

Dự án phải tích hợp cấu hình file `.flake8` với độ dài dòng tối đa `max-line-length = 100` ký tự. Sử dụng công cụ `black` để định dạng mã nguồn tự động với lệnh `black --line-length 100 .` và chạy `flake8 .` để rà soát lỗi cú pháp trước khi commit. Không chấp nhận các đoạn mã để khoảng trắng thừa cuối dòng (trailing whitespace) hoặc import thư viện nhưng không sử dụng (unused imports).

## SEC-TEC-005-04: Nguyên tắc thiết kế hàm đơn nhiệm (Single Responsibility Principle)

Mỗi hàm chỉ thực hiện một nhiệm vụ logic duy nhất và không dài quá 50 dòng lệnh. Nếu hàm vượt quá 50 dòng hoặc có độ phức tạp chu trình (cyclomatic complexity) lớn hơn 10, học viên phải tách nhỏ hàm thành các hàm phụ trợ (helper functions) có tên mô tả rõ ràng hành vi.
