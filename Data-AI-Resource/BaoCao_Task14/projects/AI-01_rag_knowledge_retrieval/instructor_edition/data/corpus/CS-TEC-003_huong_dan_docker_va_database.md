---
document_id: CS-TEC-003
title: "Hướng dẫn triển khai Docker Compose & Cơ sở dữ liệu học tập"
category: Technical Guide
version: v2.0
effective_date: 2025-02-01
last_updated: 2025-09-15
author: "Đội ngũ Hạ tầng Cloud & Backend"
tags: ["docker", "docker_compose", "postgresql", "database", "pgadmin"]
target_audience: "Học viên Fullstack, Data & AI, DevOps"
---

# CS-TEC-003: Hướng dẫn triển khai Docker Compose & Cơ sở dữ liệu học tập

## SEC-TEC-003-01: Cài đặt Docker Desktop và kích hoạt WSL2 trên Windows

Học viên sử dụng hệ điều hành Windows bắt buộc phải cài đặt gói Linux Kernel WSL2 và Docker Desktop phiên bản 4.25 trở lên. Trong cài đặt Docker Desktop, tích chọn `Use the WSL 2 based engine` và cấp quyền truy cập tài nguyên RAM tối thiểu 4GB trong file `.wslconfig` để ngăn chặn hiện tượng máy tính bị treo tràn bộ nhớ khi khởi chạy các container cơ sở dữ liệu.

## SEC-TEC-003-02: Cấu hình Docker Compose chạy cụm PostgreSQL và pgAdmin

File `docker-compose.yml` học tập chuẩn của CyberSoft định nghĩa 2 services liên kết: `postgres_db` sử dụng image `postgres:15-alpine` mở port `5432:5432`, và `pgadmin_web` sử dụng image `dpage/pgadmin4:latest` mở port `8080:80`. Bắt buộc phải cấu hình named volume `postgres_data:/var/lib/postgresql/data` để duy trì bền vững dữ liệu bảng khi container bị tắt hoặc tạo lại.

## SEC-TEC-003-03: Thông số kết nối mặc định và bảo mật môi trường

Thông số kết nối cục bộ tiêu chuẩn trong môi trường phát triển: Host: `localhost`, Port: `5432`, Database: `cybersoft_db`, Username: `admin`, Password lưu trong file `.env` cục bộ với giá trị mẫu `CyberSoft@2025!`. Tuyệt đối cấm commit file `.env` chứa mật khẩu thật lên repository công khai trên GitHub; luôn thêm `.env` vào file `.gitignore`.

## SEC-TEC-003-04: Sao lưu và phục hồi dữ liệu bằng CLI

Để sao lưu toàn bộ cơ sở dữ liệu học tập ra file sql, sử dụng lệnh: `docker exec -t <container_id> pg_dump -U admin cybersoft_db > backup.sql`. Để khôi phục cơ sở dữ liệu từ file sql có sẵn: `docker exec -i <container_id> psql -U admin cybersoft_db < backup.sql`.
