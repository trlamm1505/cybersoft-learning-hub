# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 01

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 01 - Xác định bài toán và người dùng  
**Vai trò**: Data & AI Resource Engineer  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO DOD**  

---

## 📂 1. Cấu trúc Thư mục Bàn giao

```text
Data-AI-Resource/
└── BaoCao_Task01/
    ├── README.md               # Hướng dẫn tổng quan & chỉ mục bàn giao
    ├── 01_problem_map.md       # Bản đồ bài toán, 4 Personas, 15 Reqs, Ma trận Impact/Effort, MVP & Metrics
    ├── AI_WORKLOG.md           # Nhật ký AI-Native, Pre-AI baseline, Diffs, Thẩm định con người & Lệnh test
    ├── DEFENSE_SCRIPT.md       # Kịch bản bảo vệ 3 phút trước Quản lý/Giảng viên
    └── scripts/
        └── validate_day01.py   # Script kiểm thử tự động độc lập kiểm tra DoD
```

---

## ⚡ 2. Hướng dẫn Chạy Kiểm thử Độc lập (Quick Start)

Bất kỳ ai clone repository này về máy sạch đều có thể kiểm tra tính toàn vẹn và điều kiện nghiệm thu DoD chỉ với **1 lệnh duy nhất**:

```powershell
python Data-AI-Resource/BaoCao_Task01/scripts/validate_day01.py
```

### Kết quả kỳ vọng:
```text
==================================================
CYBERSOFT DATA & AI LAB - DAY 01 VALIDATION HARNESS
==================================================
[PASS] Target file exists: .../01_problem_map.md
[PASS] Problem Statement section detected
[PASS] User Personas section detected (Count: 4 >= 3)
[PASS] Backlog Table detected with 15 valid rows (Required: 15)
[PASS] Impact/Effort Matrix section detected with 15 items
[PASS] MVP Scope section detected (3-tier priority)
[PASS] Success Metrics section detected
--------------------------------------------------
SUCCESS: All Day 01 DoD requirements passed!
==================================================
```

---

## ✅ 3. Bảng Kiểm Tra Điều Kiện Nghiệm Thu (Definition of Done)

- [x] **Mã nguồn/tài nguyên đúng thư mục**: Toàn bộ file đặt tại `Data-AI-Resource/BaoCao_Task01/`, không chứa secret hay PII.
- [x] **Có README hướng dẫn sử dụng**: Đầy đủ mục tiêu, sơ đồ thư mục và lệnh chạy.
- [x] **Có kiểm thử tự động**: Script `validate_day01.py` kiểm định 100% tiêu chí markdown.
- [x] **Ghi rõ phần AI và sự làm chủ của con người**: Thể hiện minh bạch trong `AI_WORKLOG.md`.
- [x] **Sẵn sàng Defense**: Kịch bản 3 phút được chuẩn bị chu đáo trong `DEFENSE_SCRIPT.md`.
