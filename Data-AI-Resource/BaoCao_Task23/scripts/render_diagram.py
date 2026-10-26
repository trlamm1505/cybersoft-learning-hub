"""High-resolution architectural diagram renderer for Task 23: AI Exercise Generator v0.1.

Generates:
Picture_23_Detail.png - High-resolution (3400x1600, 300 DPI) Dark Theme Architecture & Pipeline Workflow.
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PNG = BASE_DIR / "Picture_23_Detail.png"

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
        "CYBERSOFT DATA & AI LAB — HỆ THỐNG AI GỢI Ý BÀI TẬP THEO DATASET (TASK 23)",
        fill=TEXT_WHITE,
        font=font_title,
    )
    draw.text(
        (90, 105),
        "Kiến trúc Phân tầng Pipeline 3 Lớp (Deduplication, Bloom Calibration, Feasibility Runner) & Human-in-the-loop Gatekeeper",
        fill=COLOR_CYAN,
        font=font_sub,
    )

    # Status Badges in Header
    draw.rounded_rectangle(
        [(WIDTH - 550, 65), (WIDTH - 390, 125)],
        radius=10,
        fill=(6, 78, 59),
        outline=COLOR_EMERALD,
        width=2,
    )
    draw.text((WIDTH - 530, 75), "TRẠNG THÁI", fill=TEXT_MUTED, font=font_badge)
    draw.text((WIDTH - 530, 95), "HOÀN THÀNH", fill=COLOR_EMERALD, font=font_badge)

    draw.rounded_rectangle(
        [(WIDTH - 370, 65), (WIDTH - 90, 125)],
        radius=10,
        fill=(12, 74, 110),
        outline=COLOR_CYAN,
        width=2,
    )
    draw.text((WIDTH - 350, 75), "TIÊU CHÍ DoD", fill=TEXT_MUTED, font=font_badge)
    draw.text((WIDTH - 350, 95), "100% PASS (20 BÀI)", fill=COLOR_CYAN, font=font_badge)

    # 2. Four Architectural Columns
    col_width = (WIDTH - 120 - 90) // 4
    col_y_start = 180
    col_height = 1150

    columns_meta = [
        (
            "1. TẦNG DỮ LIỆU & SCHEMA",
            "Dataset & Metadata Extraction Layer",
            COLOR_CYAN,
            [
                (
                    "retail_sales_v1 (Retail)",
                    "Dữ liệu đơn hàng, doanh thu, thanh toán\n7 cột 3NF, 10 bản ghi mẫu",
                    "CSV / 3NF",
                ),
                (
                    "hr_attendance_v1 (HR Ops)",
                    "Dữ liệu ca làm việc, chấm công, giờ làm\n8 cột 3NF, trạng thái OnTime / Late",
                    "CSV / 3NF",
                ),
                (
                    "customer_churn_v1 (ML)",
                    "Thuê bao viễn thông, cước phí, hợp đồng\n6 cột, nhãn mục tiêu churn_label",
                    "CSV / ML",
                ),
                (
                    "ai_knowledge_chunks_v1",
                    "Kho tri thức kỹ thuật RAG, số token, heading\n6 cột, phân đoạn văn bản chuẩn",
                    "CSV / RAG",
                ),
                (
                    "SchemaReader Service",
                    "Trích xuất tự động: Tên cột, kiểu dữ liệu,\nnon-null counts, sample values & metadata",
                    "Core Reader",
                ),
            ],
        ),
        (
            "2. SINH BÀI TẬP CÓ KIỂM SOÁT",
            "Structured Prompt & Schema Compliance",
            COLOR_INDIGO,
            [
                (
                    "Few-Shot Prompt Grounding",
                    "Tiêm trực tiếp cấu trúc schema & sample values\nNgăn chặn tuyệt đối hiện tượng hallucination",
                    "Prompt Engine",
                ),
                (
                    "Project Schema Enforcement",
                    "Ràng buộc JSON Pydantic: title, description,\nstarter_code, solution_code, test_cases",
                    "Pydantic v2",
                ),
                (
                    "Mandatory Learning Outcomes",
                    "Bắt buộc >= 1 chuẩn đầu ra hành động\nĐo lường năng lực học viên theo chuẩn Bloom",
                    "DoD Rule #2",
                ),
                (
                    "Strict Draft State (Pending)",
                    "Mặc định status = 'draft_pending_review'\nTuyệt đối không tự publish nếu chưa duyệt",
                    "DoD Rule #1",
                ),
                (
                    "Multi-Domain Generator Engine",
                    "Tự động sinh đa dạng bài tập SQL, Python\nbao phủ 4 domain bài giảng trọng yếu",
                    "Engine v0.1",
                ),
            ],
        ),
        (
            "3. PIPELINE KIỂM ĐỊNH 3 LỚP",
            "3-Step Quality Assurance Pipeline",
            COLOR_AMBER,
            [
                (
                    "Lớp 1: Deduplication Guard",
                    "So khớp N-gram Jaccard & Token Overlap\nCảnh báo trùng lặp nếu similarity >= 70%",
                    "Jaccard < 0.70",
                ),
                (
                    "Lớp 2: Bloom Calibrator",
                    "Phân loại Thang đo Bloom (Remember -> Evaluate)\nĐối soát độ khó và độ phức tạp mã giải pháp",
                    "Taxonomy Sync",
                ),
                (
                    "Lớp 3: Feasibility Sandbox",
                    "Nạp CSV vào SQLite in-memory tự động\nThực thi câu truy vấn và đối soát test cases",
                    "SQLite Runner",
                ),
                (
                    "Assertion Matching",
                    "Kiểm tra row_count, column_match, exact_value\nXác nhận 100% test cases pass trên dữ liệu thật",
                    "Test Runner",
                ),
                (
                    "Prompt & Eval Log Trace",
                    "Lưu vết toàn diện: template, prompt, token,\nscores, review rounds và reviewer feedback",
                    "Audit Log",
                ),
            ],
        ),
        (
            "4. CỔNG DUYỆT & XUẤT BẢN",
            "Human Gatekeeper & DoD Delivery",
            COLOR_EMERALD,
            [
                (
                    "Strict Access Gatekeeper",
                    "Chặn cURL / Script gọi publish trái phép\nNém lỗi HTTP 403 Forbidden (AUTO_PUBLISH_BLOCKED)",
                    "Gatekeeper 403",
                ),
                (
                    "Two-Round Review Engine",
                    "Vòng 1: 84.0% pass rate (vượt ngưỡng >= 80% DoD)\nVòng 2: 100% pass sau khi hiệu chuẩn sư phạm",
                    "Review Engine",
                ),
                (
                    "Teacher Review Workspace",
                    "Web SPA trực quan: Xem schema, chạy thử SQLite,\nbấm Duyệt / Yêu cầu sửa / Xuất bản 1 chạm",
                    "Web Portal v0.1",
                ),
                (
                    "20 Approved Exercises Bank",
                    "Bàn giao 20 bài tập chất lượng cao đã duyệt\nLưu tại approved_exercises_20.json",
                    "DoD Delivery",
                ),
                (
                    "RESTful API & Swagger UI",
                    "Endpoints /generate, /exercises, /test, /review\nChuẩn hóa OpenAPI 3.1 & Uniform Envelopes",
                    "FastAPI REST",
                ),
            ],
        ),
    ]

    for c_idx, (c_title, c_sub, c_color, items) in enumerate(columns_meta):
        x = 60 + c_idx * (col_width + 30)

        # Column background
        draw.rectangle(
            [(x, col_y_start), (x + col_width, col_y_start + col_height)],
            fill=CARD_BG,
            outline=BORDER_COLOR,
            width=2,
        )

        # Column Header Top Bar
        draw.rectangle(
            [(x, col_y_start), (x + col_width, col_y_start + 65)], fill=c_color
        )
        draw.text(
            (x + 20, col_y_start + 12),
            c_title,
            fill=(15, 23, 42),
            font=font_col_header,
        )
        draw.text(
            (x + 20, col_y_start + 38),
            c_sub,
            fill=(30, 41, 59),
            font=font_col_sub,
        )

        # Render 5 Cards in each column
        card_y = col_y_start + 85
        card_h = 190

        for it_title, it_desc, it_badge in items:
            draw.rectangle(
                [(x + 15, card_y), (x + col_width - 15, card_y + card_h)],
                fill=ITEM_BG,
                outline=BORDER_COLOR,
                width=1,
            )

            # Left accent stripe
            draw.rectangle([(x + 15, card_y), (x + 20, card_y + card_h)], fill=c_color)

            # Title & Badge
            draw.text(
                (x + 32, card_y + 16), it_title, fill=TEXT_WHITE, font=font_item_title
            )

            badge_w = len(it_badge) * 8 + 16
            draw.rounded_rectangle(
                [
                    (x + col_width - badge_w - 25, card_y + 14),
                    (x + col_width - 25, card_y + 36),
                ],
                radius=6,
                fill=(30, 41, 59),
                outline=c_color,
                width=1,
            )
            draw.text(
                (x + col_width - badge_w - 17, card_y + 18),
                it_badge,
                fill=c_color,
                font=font_badge,
            )

            # Description (multi-line)
            draw.text(
                (x + 32, card_y + 55), it_desc, fill=TEXT_MUTED, font=font_item_desc
            )

            card_y += card_h + 20

    # 3. Bottom Metrics KPI Strip
    kpi_y = col_y_start + col_height + 25
    kpi_h = 110
    draw.rectangle(
        [(60, kpi_y), (WIDTH - 60, kpi_y + kpi_h)],
        fill=CARD_BG,
        outline=BORDER_COLOR,
        width=2,
    )

    kpis = [
        (
            "BÀI TẬP ĐÃ DUYỆT (DoD)",
            "20 / 20 BÀI",
            COLOR_EMERALD,
            "100% Đạt Chuẩn Sư Phạm",
        ),
        (
            "TỶ LỆ PASS REVIEW VÒNG 1",
            "84.0%",
            COLOR_CYAN,
            "Chỉ tiêu DoD ≥ 80.0%",
        ),
        (
            "TỶ LỆ PASS SAU VÒNG 2",
            "100.0%",
            COLOR_CYAN,
            "Hiệu chuẩn Bloom & Hints",
        ),
        (
            "CHẶN AUTO-PUBLISH (DoD)",
            "100.0%",
            COLOR_ROSE,
            "Mã HTTP 403 Forbidden",
        ),
        (
            "ĐỘ TRỄ FEASIBILITY RUNNER",
            "1.2 ms",
            COLOR_AMBER,
            "SQLite In-Memory Engine",
        ),
        (
            "CHI PHÍ VẬN HÀNH AI",
            "$0.00 USD",
            COLOR_INDIGO,
            "On-Premise CPU Engine",
        ),
    ]

    kpi_w = (WIDTH - 120) // len(kpis)
    for k_idx, (k_lbl, k_val, k_clr, k_sub) in enumerate(kpis):
        kx = 60 + k_idx * kpi_w
        if k_idx > 0:
            draw.line(
                [(kx, kpi_y + 15), (kx, kpi_y + kpi_h - 15)],
                fill=BORDER_COLOR,
                width=1,
            )

        draw.text((kx + 25, kpi_y + 18), k_lbl, fill=TEXT_MUTED, font=font_kpi_lbl)
        draw.text((kx + 25, kpi_y + 42), k_val, fill=k_clr, font=font_kpi_val)
        draw.text((kx + 25, kpi_y + 78), k_sub, fill=TEXT_MUTED, font=font_badge)

    OUTPUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUTPUT_PNG, dpi=(300, 300))
    print(
        f"[SUCCESS] Architectural Diagram rendered successfully at:\n          {OUTPUT_PNG}"
    )


if __name__ == "__main__":
    render()
