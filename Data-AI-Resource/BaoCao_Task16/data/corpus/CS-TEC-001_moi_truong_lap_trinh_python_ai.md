---
document_id: CS-TEC-001
title: "Hướng dẫn cấu hình môi trường lập trình Python & AI/ML"
category: Technical Guide
version: v3.0
effective_date: 2025-02-15
last_updated: 2025-11-10
author: "Đội ngũ Giảng viên AI & Data Systems"
tags: ["python", "ai", "conda", "vscode", "environment"]
target_audience: "Học viên lớp Data & AI, Python Automation"
---

# CS-TEC-001: Hướng dẫn cấu hình môi trường lập trình Python & AI/ML

## SEC-TEC-001-01: Yêu cầu phần cứng và phiên bản hệ điều hành chuẩn

Hệ thống khuyến nghị cho học viên ngành Data & AI: Bộ vi xử lý tối thiểu Intel Core i5 thế hệ 11 hoặc AMD Ryzen 5 tương đương trở lên; Bộ nhớ RAM tối thiểu 16GB (khuyến nghị 32GB để chạy các tác vụ Vector Embeddings và Docker Containers); Ổ cứng SSD trống tối thiểu 50GB; Hệ điều hành Windows 11 64-bit (đã bật WSL2), macOS 13+ (Apple Silicon M1/M2/M3), hoặc Ubuntu Linux 22.04 LTS.

## SEC-TEC-001-02: Cài đặt Miniconda và quản lý môi trường ảo độc lập

Bắt buộc sử dụng Miniconda phiên bản mới nhất với Python runtime chuẩn 3.10.13. Tuyệt đối không cài đặt trực tiếp các gói thư viện vào môi trường base. Lệnh khởi tạo môi trường chuẩn: `conda create -n cybersoft-ai python=3.10.13 -y` sau đó kích hoạt bằng `conda activate cybersoft-ai`. Toàn bộ gói phụ thuộc dự án phải được quản lý thông qua file `requirements.txt` hoặc `environment.yml` có ghim chặt phiên bản (pinned versions).

## SEC-TEC-001-03: Cấu hình Visual Studio Code và các Extensions bắt buộc

Trình biên tập code tiêu chuẩn là Visual Studio Code (VS Code). Danh mục Extensions bắt buộc cài đặt bao gồm: Python (Microsoft), Pylance (kiểm tra type checking nghiêm ngặt chế độ basic), Jupyter (chạy notebook tương tác), Black Formatter (tự động format code theo chuẩn PEP8 khi bấm Ctrl+S/Cmd+S), và GitLens (theo dõi lịch sử commit và blame theo dòng).

## SEC-TEC-001-04: Khắc phục các lỗi môi trường Python phổ biến

Lỗi `ModuleNotFoundError` thường phát sinh do VS Code chưa chọn đúng Python Interpreter của môi trường ảo; cách xử lý: bấm `Ctrl+Shift+P` -> gõ `Python: Select Interpreter` -> chọn đúng đường dẫn của conda env `cybersoft-ai`. Lỗi xung đột DLL trên Windows khi import torch hoặc numpy được khắc phục bằng cách cài đặt gói Visual C++ Redistributable 2015-2022 bản x64 từ trang chủ Microsoft.
