---
document_id: CS-TEC-004
title: "Hướng dẫn sử dụng GPU Cloud & Google Colab trong huấn luyện mô hình"
category: Technical Guide
version: v1.7
effective_date: 2025-03-10
last_updated: 2025-10-25
author: "Phòng Nghiên cứu Ứng dụng Trí tuệ Nhân tạo"
tags: ["gpu", "cloud", "colab", "huggingface", "cuda"]
target_audience: "Học viên chuyên sâu Data Science & AI/ML"
---

# CS-TEC-004: Hướng dẫn sử dụng GPU Cloud & Google Colab trong huấn luyện mô hình

## SEC-TEC-004-01: Thiết lập môi trường phần cứng GPU trên Google Colab

Trong giao diện sổ tay Google Colab, học viên chuyển đổi bộ tăng tốc phần cứng bằng cách vào menu `Runtime` -> `Change runtime type` -> chọn `T4 GPU` (miễn phí) hoặc `A100 GPU` (Colab Pro). Kiểm tra tình trạng card đồ họa và phiên bản CUDA khả dụng bằng lệnh shell `!nvidia-smi`. Lưu ý rằng phiên bản Colab miễn phí giới hạn thời gian chạy liên tục tối đa 12 giờ và sẽ tự ngắt kết nối sau 90 phút nếu không có thao tác tương tác.

## SEC-TEC-004-02: Quản lý dữ liệu bền vững qua kết nối Google Drive

Vì ổ đĩa máy ảo của Colab là bộ nhớ tạm thời (ephemeral storage) sẽ bị xóa trắng sau khi phiên làm việc kết thúc, học viên bắt buộc phải mount tài khoản Google Drive để lưu trữ trọng số mô hình và checkpoint huấn luyện bằng đoạn mã: `from google.colab import drive; drive.mount('/content/drive')`. Mọi dữ liệu dataset lớn nên được giải nén trực tiếp vào ổ đĩa ảo `/content/` để đạt tốc độ đọc ghi I/O cao nhất.

## SEC-TEC-004-03: Tích hợp Hugging Face Hub và bảo mật Access Token

Khi tải hoặc fine-tune các mô hình ngôn ngữ lớn (LLMs), học viên sử dụng thư viện `huggingface_hub` và đăng nhập bằng token quyền Read/Write. Tuyệt đối không paste chuỗi token trực tiếp trong code notebook công khai; phải lưu token vào tính năng `Secrets` (biểu tượng chìa khóa ở thanh công cụ bên trái Colab) với tên biến `HF_TOKEN` và gọi qua thư viện `google.colab.userdata`.

## SEC-TEC-004-04: Tối ưu hóa bộ nhớ GPU với PyTorch và BitsAndBytes

Để tránh lỗi tràn bộ nhớ `CUDA out of memory (OOM)`, học viên áp dụng kỹ thuật lượng tử hóa 4-bit hoặc 8-bit bằng thư viện `bitsandbytes` khi nạp mô hình với `load_in_4bit=True`. Đồng thời, giải phóng bộ đệm GPU không dùng đến sau mỗi batch bằng cách gọi `torch.cuda.empty_cache()` và gán giá trị biến rác thành `None` kết hợp hàm `gc.collect()`.
