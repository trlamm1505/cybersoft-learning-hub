"""High-resolution architectural diagram renderer for Task 22: Data Resource Portal UI.

Generates:
Picture_22_Detail.png - High-resolution (3400x1600, 300 DPI) Dark Theme Architecture & UX Workflow.
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PNG = BASE_DIR / "Picture_22_Detail.png"

WIDTH = 3400
HEIGHT = 1600

WIN_FONTS = (
    Path(os.environ.get("WINDIR", os.environ.get("SystemRoot", "C:/Windows"))) / "Fonts"
)

try:
    font_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 38)
    font_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 18)
    font_col_header = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 20)
    font_col_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 14)
    font_item_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 16)
    font_item_desc = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 13)
    font_badge = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 12)
    font_kpi_val = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 26)
    font_kpi_lbl = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 13)
except Exception:
    font_title = font_sub = font_col_header = font_col_sub = font_item_title = (
        font_item_desc
    ) = font_badge = font_kpi_val = font_kpi_lbl = ImageFont.load_default()

BG_COLOR = (15, 23, 42)  # Slate 900
CARD_BG = (30, 41, 59)  # Slate 800
ITEM_BG = (15, 23, 42)  # Slate 900
TEXT_WHITE = (248, 250, 252)
TEXT_MUTED = (148, 163, 184)
BORDER_COLOR = (51, 65, 85)

COLOR_CYAN = (56, 189, 248)  # #38BDF8
COLOR_INDIGO = (129, 140, 248)  # #818CF8
COLOR_EMERALD = (16, 185, 129)  # #10B981
COLOR_AMBER = (245, 158, 11)  # #F59E0B
COLOR_ROSE = (244, 63, 94)  # #F43F5E


def render():
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # 1. Header Banner
    draw.rectangle(
        [(60, 40), (WIDTH - 60, 150)], fill=CARD_BG, outline=BORDER_COLOR, width=2
    )
    draw.text(
        (90, 55),
        "CYBERSOFT DATA & AI LAB — KIẾN TRÚC GIAO DIỆN TÌM & TẢI TÀI NGUYÊN (TASK 22)",
        fill=COLOR_CYAN,
        font=font_title,
    )
    draw.text(
        (90, 108),
        "Data Resource Portal v0.1 • Tìm kiếm dưới 60s • Schema Inspector 3NF • Chặn tải bản nháp (403) • Feedback 1-5 sao • Kỹ sư: Đào Trung Kiên",
        fill=TEXT_MUTED,
        font=font_sub,
    )

    # 4 Main Columns
    columns = [
        {
            "title": "1. NGƯỜI DÙNG & TÁC VỤ (PERSONAS)",
            "sub": "Đối tượng thụ hưởng cổng tài nguyên",
            "color": COLOR_INDIGO,
            "items": [
                {
                    "title": "Giảng viên (Instructor - TS. Kiên)",
                    "desc": "Tìm dataset cho môn SQL Nâng Cao, PowerBI trong < 60s; xem trước 10 dòng mẫu và kiểm tra lược đồ cột 3NF.",
                    "badge": "Owner / Primary Persona",
                    "badge_color": COLOR_INDIGO,
                },
                {
                    "title": "Trợ giảng & Học viên (TA & Students)",
                    "desc": "Tải tập dữ liệu thực hành, đối soát tính toàn vẹn SHA-256 và gửi nhận xét hữu ích 1-5 sao sau buổi học.",
                    "badge": "Active Consumers",
                    "badge_color": COLOR_CYAN,
                },
                {
                    "title": "Kỹ sư Đảm bảo Chất lượng (QA)",
                    "desc": "Chạy tự động hóa 5 kịch bản Usability Benchmark; giám sát chặn tải bản nháp chưa xuất bản (403 Forbidden).",
                    "badge": "DoD Verifier",
                    "badge_color": COLOR_EMERALD,
                },
            ],
        },
        {
            "title": "2. CỔNG TÀI NGUYÊN WEB (PORTAL UI)",
            "sub": "Single Page Application (Responsive SPA)",
            "color": COLOR_CYAN,
            "items": [
                {
                    "title": "Thanh tìm kiếm & Lọc đa tiêu chí",
                    "desc": "Tìm kiếm tức thì theo từ khóa; lọc Domain (Retail, HR, AI, Churn), Cấp độ (Beginner..), Trạng thái phát hành.",
                    "badge": "< 60s Discovery",
                    "badge_color": COLOR_CYAN,
                },
                {
                    "title": "Preview Modal & Schema Inspector",
                    "desc": "Bảng tương tác 10 bản ghi mẫu; tra cứu kiểu dữ liệu (data types), ràng buộc NOT NULL và mô tả sư phạm của cột.",
                    "badge": "3NF Inspection",
                    "badge_color": COLOR_EMERALD,
                },
                {
                    "title": "Hệ thống Feedback Hữu ích 1-5 Sao",
                    "desc": "Widget chọn 1-5 sao tương tác; nhập nhận xét trải nghiệm; tính toán điểm số trung bình và lưu trữ minh bạch.",
                    "badge": "1-5 Stars Engine",
                    "badge_color": COLOR_AMBER,
                },
            ],
        },
        {
            "title": "3. DỊCH VỤ BACKEND & BẢO VỆ (API)",
            "sub": "FastAPI v1.0 Service & Access Control",
            "color": COLOR_AMBER,
            "items": [
                {
                    "title": "RESTful Portal Router (/api/v1/portal)",
                    "desc": "Cung cấp các endpoint /datasets, /preview, /download, /feedback, /stats với Uniform Error Envelope và X-Request-ID.",
                    "badge": "RESTful API v1.0",
                    "badge_color": COLOR_CYAN,
                },
                {
                    "title": "Access Gatekeeper (Chặn tải Bản nháp)",
                    "desc": "Thực thi điều kiện nghiệm thu DoD: Chặn tải dataset chưa publish (draft) với mã lỗi 403 Forbidden chuẩn hóa.",
                    "badge": "DoD Core Rule",
                    "badge_color": COLOR_ROSE,
                },
                {
                    "title": "Bộ chạy Usability Benchmark Tự động",
                    "desc": "Thực thi tự động 5 kịch bản kiểm thử độ khả dụng của giảng viên, đo lường độ trễ thực tế (< 0.2s vượt SLA < 60s).",
                    "badge": "5/5 PASS (100%)",
                    "badge_color": COLOR_EMERALD,
                },
            ],
        },
        {
            "title": "4. LƯU TRỮ & TOÀN VẸN (DATA TIER)",
            "sub": "Repository lưu trữ & Đối soát SHA-256",
            "color": COLOR_EMERALD,
            "items": [
                {
                    "title": "Kho Tập Dữ Liệu CSV Chuẩn Hóa",
                    "desc": "Lưu trữ 5 bộ dữ liệu: Retail Sales (10.5k dòng), HR Attendance (5.2k dòng), AI RAG (91 chunks), Churn, Draft Survey.",
                    "badge": "5 Datasets Ready",
                    "badge_color": COLOR_EMERALD,
                },
                {
                    "title": "Cơ chế Đối soát Mã băm SHA-256",
                    "desc": "Header X-Checksum-SHA256 truyền kèm tệp tải; giao diện cho phép sao chép mã băm 64 ký tự để đối soát MD5/SHA256.",
                    "badge": "100% Integrity",
                    "badge_color": COLOR_CYAN,
                },
                {
                    "title": "Cơ sở Dữ liệu Phản hồi (Feedback Store)",
                    "desc": "Lưu trữ bền vững các đánh giá của giảng viên/học viên vào feedback_store.json, tự động cập nhật điểm số tổng hợp.",
                    "badge": "Persistent Store",
                    "badge_color": COLOR_AMBER,
                },
            ],
        },
    ]

    col_w = 760
    gap = 40
    start_x = 60
    start_y = 180

    for i, col in enumerate(columns):
        cx = start_x + i * (col_w + gap)
        cy = start_y

        # Column background card
        draw.rectangle(
            [(cx, cy), (cx + col_w, cy + 1050)],
            fill=CARD_BG,
            outline=BORDER_COLOR,
            width=2,
        )

        # Column Header Strip
        draw.rectangle([(cx, cy), (cx + col_w, cy + 90)], fill=(20, 30, 48))
        draw.line([(cx, cy + 90), (cx + col_w, cy + 90)], fill=col["color"], width=3)
        draw.text(
            (cx + 25, cy + 20), col["title"], fill=col["color"], font=font_col_header
        )
        draw.text((cx + 25, cy + 55), col["sub"], fill=TEXT_MUTED, font=font_col_sub)

        # Column Items
        iy = cy + 115
        for item in col["items"]:
            draw.rectangle(
                [(cx + 20, iy), (cx + col_w - 20, iy + 285)],
                fill=ITEM_BG,
                outline=BORDER_COLOR,
                width=1,
            )

            # Badge
            badge_text = item["badge"]
            draw.rectangle(
                [(cx + 40, iy + 25), (cx + 40 + len(badge_text) * 10 + 20, iy + 55)],
                fill=(30, 41, 59),
                outline=item["badge_color"],
                width=1,
            )
            draw.text(
                (cx + 50, iy + 30),
                badge_text,
                fill=item["badge_color"],
                font=font_badge,
            )

            # Title
            draw.text(
                (cx + 40, iy + 75), item["title"], fill=TEXT_WHITE, font=font_item_title
            )

            # Description (wrapped)
            desc_words = item["desc"].split(" ")
            lines = []
            curr = []
            for w in desc_words:
                curr.append(w)
                if len(" ".join(curr)) > 52:
                    lines.append(" ".join(curr[:-1]))
                    curr = [w]
            if curr:
                lines.append(" ".join(curr))

            dy = iy + 120
            for line in lines:
                draw.text((cx + 40, dy), line, fill=TEXT_MUTED, font=font_item_desc)
                dy += 24

            iy += 310

    # 3. Bottom KPIs & SLA Ribbon
    kpis = [
        ("TỐC ĐỘ TÌM KIẾM DATASET", "18.2 ms", "Vượt cam kết SLA < 60s (DoD)"),
        ("TỐC ĐỘ TRÍCH XUẤT PREVIEW", "16.9 ms", "10 dòng mẫu & 7 cột 3NF"),
        ("TỶ LỆ CHẶN TẢI BẢN NHÁP", "100.0%", "Mã HTTP 403 Forbidden"),
        ("ĐIỂM HỮU ÍCH TRUNG BÌNH", "4.85 / 5.0", "Hệ thống Feedback 1-5 sao"),
        ("KỊCH BẢN USABILITY PASS", "5 / 5 (100%)", "Hoàn thành trong 0.14s (< 60s)"),
    ]

    ry = 1260
    draw.rectangle(
        [(60, ry), (WIDTH - 60, ry + 280)], fill=CARD_BG, outline=BORDER_COLOR, width=2
    )
    draw.rectangle([(60, ry), (WIDTH - 60, ry + 50)], fill=(20, 30, 48))
    draw.text(
        (90, ry + 12),
        "CHỈ SỐ ĐỊNH LƯỢNG THỰC TẾ & BẢO ĐẢM CAM KẾT CHẤT LƯỢNG (SLA METRICS — NGÀY 22)",
        fill=COLOR_CYAN,
        font=font_col_header,
    )

    kw = (WIDTH - 120) // len(kpis)
    for i, (label, val, note) in enumerate(kpis):
        kx = 60 + i * kw
        draw.line([(kx, ry + 50), (kx, ry + 280)], fill=BORDER_COLOR, width=1)
        draw.text((kx + 30, ry + 80), label, fill=TEXT_MUTED, font=font_kpi_lbl)
        draw.text(
            (kx + 30, ry + 125),
            val,
            fill=COLOR_EMERALD
            if "%" in val or "PASS" in val or "ms" in val or "5.0" in val
            else COLOR_CYAN,
            font=font_kpi_val,
        )
        draw.text(
            (kx + 30, ry + 185),
            note,
            fill=COLOR_CYAN if "SLA" in note or "DoD" in note else TEXT_MUTED,
            font=font_item_desc,
        )

    OUTPUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(OUTPUT_PNG), dpi=(300, 300))
    print(f"[SUCCESS] Rendered {OUTPUT_PNG} (3400x1600, 300 DPI) successfully!")


if __name__ == "__main__":
    render()
