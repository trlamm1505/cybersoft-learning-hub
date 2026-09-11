---
document_id: CS-TEC-002
title: "Quy chuẩn quản lý mã nguồn Git và nộp bài trên GitHub Classroom"
category: Technical Guide
version: v2.1
effective_date: 2025-01-10
last_updated: 2025-08-30
author: "Đội ngũ Kỹ thuật DevOps & Trợ giảng"
tags: ["git", "github", "classroom", "conventional_commits", "branching"]
target_audience: "Toàn thể học viên các khóa lập trình"
---

# CS-TEC-002: Quy chuẩn quản lý mã nguồn Git và nộp bài trên GitHub Classroom

## SEC-TEC-002-01: Quy tắc đặt tên nhánh làm việc theo tính năng (Branching Strategy)

Tất cả học viên phải tuân thủ nghiêm ngặt chiến lược nhánh Git Feature Branch. Nhánh `main` là nhánh sản phẩm chỉ chứa code sạch đã review. Mỗi bài tập hoặc tính năng mới phải được phát triển trên nhánh riêng biệt theo cú pháp chuẩn: `feature/<ma-mon>-<ten-bai-tap>` (Ví dụ: `feature/data-ai-day8` hoặc `feature/react-cart-module`). Tuyệt đối cấm commit hoặc force push trực tiếp lên nhánh `main`.

## SEC-TEC-002-02: Quy chuẩn thông điệp Commit (Conventional Commits)

Thông điệp commit phải viết bằng tiếng Anh hoặc tiếng Việt rõ nghĩa, tuân thủ chuẩn Conventional Commits với tiền tố phân loại: `feat:` cho tính năng mới; `fix:` cho sửa lỗi; `docs:` cho cập nhật tài liệu Markdown; `test:` cho bổ sung kiểm thử tự động; `refactor:` cho tái cấu trúc mã nguồn không làm đổi tính năng. Ví dụ hợp lệ: `feat: add RAG evaluation suite with 100 questions` hoặc `fix: resolve ghost attendance check-in bug`.

## SEC-TEC-002-03: Quy trình tạo Pull Request và nộp bài GitHub Classroom

Khi hoàn thành bài tập, học viên push nhánh tính năng lên repository cá nhân trên GitHub Classroom và tạo Pull Request (PR) hướng về nhánh `main`. Tiêu đề PR phải ghi rõ họ tên và mã số học viên. Phần mô tả PR bắt buộc điền đầy đủ: Tóm tắt thay đổi, checklist tự kiểm thử, hình chụp bằng chứng chạy test thành công và tag tài khoản GitHub của Mentor phụ trách để yêu cầu Review Code.

## SEC-TEC-002-04: Xử lý xung đột mã nguồn (Merge Conflicts)

Khi gặp xung đột mã nguồn giữa nhánh tính năng và nhánh main, học viên không được tự ý ghi đè mà phải checkout về nhánh tính năng và thực thi `git merge origin/main` hoặc `git rebase origin/main`. Sử dụng công cụ Merge Editor tích hợp trong VS Code để đối soát từng dòng code xung đột, chạy lại toàn bộ unit test trước khi hoàn tất merge commit.
