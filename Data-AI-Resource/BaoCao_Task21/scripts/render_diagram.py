"""High-resolution architectural diagram renderer and Draw.io XML generator for Task 21.

Generates:
1. Picture_21_Detail.drawio - Streamlined, non-overlapping, strictly orthogonal dynamic XML
2. Picture_21_Detail.png - High-resolution (3400x1550, 300 DPI) matching image
3. Column sliced crops for presentation
"""

import html
import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PNG = BASE_DIR / "Picture_21_Detail.png"
OUTPUT_DRAWIO = BASE_DIR / "Picture_21_Detail.drawio"
ART_DIR = Path(
    "C:/Users/ADMIN/.gemini/antigravity/brain/fdbd4958-090b-4943-8cdc-702cbd03cc9f"
)

WIDTH = 3400
HEIGHT = 1550

WIN_FONTS = (
    Path(os.environ.get("WINDIR", os.environ.get("SystemRoot", "C:/Windows"))) / "Fonts"
)

try:
    font_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 36)
    font_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 18)
    font_col_header = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 19)
    font_col_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 13)
    font_item_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 15)
    font_item_desc = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 12)
    font_badge = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 11)
    font_kpi_val = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 26)
    font_kpi_lbl = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 13)
    font_arrow_lbl = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 11)
except Exception:
    font_title = font_sub = font_col_header = font_col_sub = font_item_title = (
        font_item_desc
    ) = font_badge = font_kpi_val = font_kpi_lbl = font_arrow_lbl = (
        ImageFont.load_default()
    )

BG_COLOR = (15, 23, 42)  # #0F172A
CARD_BG = (30, 41, 59)  # #1E293B
ITEM_BG = (15, 23, 42)  # #0F172A
TEXT_WHITE = (248, 250, 252)  # #F8FAFC
TEXT_MUTED = (148, 163, 184)  # #94A3B8
BORDER_COLOR = (51, 65, 85)  # #334155

COLOR_CYAN = (56, 189, 248)  # #38BDF8
COLOR_INDIGO = (129, 140, 248)  # #818CF8
COLOR_PURPLE = (168, 85, 247)  # #A855F7
COLOR_AMBER = (245, 158, 11)  # #F59E0B
COLOR_EMERALD = (16, 185, 129)  # #10B981
COLOR_ROSE = (244, 63, 94)  # #F43F5E


def draw_rounded_rect(draw, bbox, radius, fill, outline=None, width=1):
    x0, y0, x1, y1 = bbox
    draw.rounded_rectangle(
        [int(x0), int(y0), int(x1), int(y1)],
        radius=int(radius),
        fill=fill,
        outline=outline,
        width=int(width),
    )


def draw_arrow(draw, start, end, color=(148, 163, 184), width=2):
    x0, y0 = start
    x1, y1 = end
    draw.line([int(x0), int(y0), int(x1), int(y1)], fill=color, width=int(width))
    angle = math.atan2(y1 - y0, x1 - x0)
    tip_len = 10
    left_angle = angle + math.pi * 5 / 6
    right_angle = angle - math.pi * 5 / 6
    lx = x1 + tip_len * math.cos(left_angle)
    ly = y1 + tip_len * math.sin(left_angle)
    rx = x1 + tip_len * math.cos(right_angle)
    ry = y1 + tip_len * math.sin(right_angle)
    draw.polygon(
        [(int(x1), int(y1)), (int(lx), int(ly)), (int(rx), int(ry))], fill=color
    )


# 5 Columns x 6 Rows = 30 Cards cleanly aligned row-by-row
COLUMNS = [
    {
        "id": "c1",
        "header": "1. CONSUMERS & CLIENTS",
        "sub": "Hệ thống tiêu thụ & gọi API ngoài",
        "color": COLOR_CYAN,
        "stroke": "#38BDF8",
        "items": [
            {
                "id": "c1_1",
                "title": "Learning Web Portal",
                "badge": "http://localhost:5173",
                "badge_color": COLOR_CYAN,
                "badge_hex": "#38BDF8",
                "desc": "React 19 Frontend: Tra cứu danh mục học liệu số, gọi trợ giảng AI Tutor.",
            },
            {
                "id": "c1_2",
                "title": "Learning Platform Backend",
                "badge": "http://localhost:3000",
                "badge_color": COLOR_INDIGO,
                "badge_hex": "#818CF8",
                "desc": "NestJS Server: Tích hợp bài lab API Testing và bài thi trắc nghiệm học viên.",
            },
            {
                "id": "c1_3",
                "title": "Postman Client Runner",
                "badge": "contracts/cybersoft_api_v1.postman_collection.json",
                "badge_color": COLOR_AMBER,
                "badge_hex": "#F59E0B",
                "desc": "Collection v2.1 với 10 ca kiểm thử mẫu đóng gói sẵn biến môi trường local.",
            },
            {
                "id": "c1_4",
                "title": "Interactive Swagger UI",
                "badge": "http://localhost:8000/docs",
                "badge_color": COLOR_EMERALD,
                "badge_hex": "#10B981",
                "desc": "Giao diện kiểm thử trực tiếp trên web kèm ReDoc (/redoc) chuẩn OpenAPI 3.1.",
            },
            {
                "id": "c1_5",
                "title": "CyberSoft Python SDK",
                "badge": "sdk/cybersoft_client.py",
                "badge_color": COLOR_CYAN,
                "badge_hex": "#38BDF8",
                "desc": "Thư viện CyberSoftDataAIClient hỗ trợ tích hợp 3 dòng mã, tự bắt lỗi.",
            },
            {
                "id": "c1_6",
                "title": "QA Automation Suite",
                "badge": "tests/test_quality_api.py",
                "badge_color": COLOR_PURPLE,
                "badge_hex": "#A855F7",
                "desc": "Pytest / HTTPX: Định kỳ thu thập RAG benchmarks và kiểm định dataset.",
            },
        ],
    },
    {
        "id": "c2",
        "header": "2. GATEWAY & BẢO MẬT",
        "sub": "Xác thực, phân quyền & middleware",
        "color": COLOR_INDIGO,
        "stroke": "#818CF8",
        "items": [
            {
                "id": "c2_1",
                "title": "Port 8000 & CORS Guard",
                "badge": "src/main.py:8000",
                "badge_color": COLOR_INDIGO,
                "badge_hex": "#818CF8",
                "desc": "Cho phép Cross-Origin từ :5173 và :3000, định tuyến toàn cục /api/v1.",
            },
            {
                "id": "c2_2",
                "title": "Request Tracing Middleware",
                "badge": "X-Request-ID",
                "badge_color": COLOR_CYAN,
                "badge_hex": "#38BDF8",
                "desc": "Gắn mã định danh duy nhất (req-xxxx) & đo thời gian xử lý X-Response-Time-Ms.",
            },
            {
                "id": "c2_3",
                "title": "In-Memory Key Vault",
                "badge": "src/config.py",
                "badge_color": COLOR_AMBER,
                "badge_hex": "#F59E0B",
                "desc": "Lưu trữ 4 API Keys định danh trước, 100% deterministic & bảo mật nội bộ.",
            },
            {
                "id": "c2_4",
                "title": "Header Auth Inspector",
                "badge": "src/auth.py",
                "badge_color": COLOR_PURPLE,
                "badge_hex": "#A855F7",
                "desc": "Xác thực header X-API-Key hoặc Authorization: Bearer <token> linh hoạt.",
            },
            {
                "id": "c2_5",
                "title": "RBAC Role Guard",
                "badge": "require_roles()",
                "badge_color": COLOR_ROSE,
                "badge_hex": "#F43F5E",
                "desc": "Kiểm tra quyền 4 vai trò: student (public), instructor, qa_engineer, admin.",
            },
            {
                "id": "c2_6",
                "title": "Security Policy Enforcement",
                "badge": "Access Control",
                "badge_color": COLOR_ROSE,
                "badge_hex": "#F43F5E",
                "desc": "Chặn đứng các truy cập trái quyền, đẩy mã lỗi 401 Unauthorized / 403 Forbidden.",
            },
        ],
    },
    {
        "id": "c3",
        "header": "3. HỢP ĐỒNG & CHUẨN LỖI",
        "sub": "OpenAPI 3.1 & Error Envelope",
        "color": COLOR_PURPLE,
        "stroke": "#A855F7",
        "items": [
            {
                "id": "c3_1",
                "title": "OpenAPI 3.1 Specification",
                "badge": "contracts/openapi.json",
                "badge_color": COLOR_PURPLE,
                "badge_hex": "#A855F7",
                "desc": "Xuất bản đồng thời openapi.json và openapi.yaml, khóa cứng schema v1.0.",
            },
            {
                "id": "c3_2",
                "title": "Pydantic v2 Validators",
                "badge": "src/schemas/search.py",
                "badge_color": COLOR_CYAN,
                "badge_hex": "#38BDF8",
                "desc": "Tự động kiểm tra tham số: query >= 3 ký tự, top_k 1-20, định dạng UUID.",
            },
            {
                "id": "c3_3",
                "title": "Pagination Metadata",
                "badge": "src/schemas/common.py",
                "badge_color": COLOR_AMBER,
                "badge_hex": "#F59E0B",
                "desc": "Chuẩn hóa phân trang danh sách: total, limit, offset, has_next.",
            },
            {
                "id": "c3_4",
                "title": "Success Envelope Wrapper",
                "badge": "src/schemas/common.py",
                "badge_color": COLOR_EMERALD,
                "badge_hex": "#10B981",
                "desc": "Bọc phản hồi thành công thống nhất: {'success': true, 'data': {...}}.",
            },
            {
                "id": "c3_5",
                "title": "Exception Handlers Hook",
                "badge": "src/main.py",
                "badge_color": COLOR_INDIGO,
                "badge_hex": "#818CF8",
                "desc": "Bắt RequestValidationError và Exception chưa lường, ngăn chặn crash hệ thống.",
            },
            {
                "id": "c3_6",
                "title": "Uniform Error Envelope",
                "badge": "src/schemas/common.py",
                "badge_color": COLOR_ROSE,
                "badge_hex": "#F43F5E",
                "desc": "Bọc mọi lỗi (400, 401, 403, 404, 422, 500) thành chuẩn error envelope.",
            },
        ],
    },
    {
        "id": "c4",
        "header": "4. 9 RESTful ENDPOINTS",
        "sub": "Hệ thống dịch vụ phân hệ v1.0",
        "color": COLOR_AMBER,
        "stroke": "#F59E0B",
        "items": [
            {
                "id": "c4_1",
                "title": "Health & System Info",
                "badge": "src/routes/health.py",
                "badge_color": COLOR_EMERALD,
                "badge_hex": "#10B981",
                "desc": "GET /api/v1/health & /api/v1/info. Giám sát uptime, 4 dịch vụ và SLA specs.",
            },
            {
                "id": "c4_2",
                "title": "Dataset Registry Router",
                "badge": "src/routes/registry.py",
                "badge_color": COLOR_CYAN,
                "badge_hex": "#38BDF8",
                "desc": "GET /api/v1/registry/datasets (lọc domain) & GET /datasets/{id} (3NF schema).",
            },
            {
                "id": "c4_3",
                "title": "Project Bank Router",
                "badge": "src/routes/registry.py",
                "badge_color": COLOR_CYAN,
                "badge_hex": "#38BDF8",
                "desc": "GET /api/v1/registry/projects & GET /projects/{id} (Capstone projects).",
            },
            {
                "id": "c4_4",
                "title": "Hybrid Semantic Search",
                "badge": "src/routes/search.py",
                "badge_color": COLOR_PURPLE,
                "badge_hex": "#A855F7",
                "desc": "POST /api/v1/search/semantic & GET /chunks/{id}. Tìm kiếm lai BM25 + Vector RRF.",
            },
            {
                "id": "c4_5",
                "title": "AI Tutor Grounded Chat",
                "badge": "src/routes/tutor.py",
                "badge_color": COLOR_INDIGO,
                "badge_hex": "#818CF8",
                "desc": "POST /api/v1/tutor/chat. Trợ giảng AI trích dẫn [Doc, Mục], có Guardrails & Abstention.",
            },
            {
                "id": "c4_6",
                "title": "Data Quality & AI Eval",
                "badge": "src/routes/quality.py",
                "badge_color": COLOR_ROSE,
                "badge_hex": "#F43F5E",
                "desc": "POST /quality/validate-dataset & GET /metrics. Báo cáo RAG benchmarks (Recall 100%).",
            },
        ],
    },
    {
        "id": "c5",
        "header": "5. HẠ TẦNG & DỮ LIỆU",
        "sub": "Kho tài nguyên & Harness nội bộ",
        "color": COLOR_EMERALD,
        "stroke": "#10B981",
        "items": [
            {
                "id": "c5_1",
                "title": "Registry Catalog Service",
                "badge": "src/services/registry_service.py",
                "badge_color": COLOR_CYAN,
                "badge_hex": "#38BDF8",
                "desc": "Quản trị danh mục học liệu và 4 datasets 3NF (Retail Sales 10.5K dòng).",
            },
            {
                "id": "c5_2",
                "title": "3NF Datasets & Capstone",
                "badge": "data/datasets/ & capstones",
                "badge_color": COLOR_CYAN,
                "badge_hex": "#38BDF8",
                "desc": "Cơ sở dữ liệu bán lẻ, nhân sự HR, ngân hàng đề thi quiz và 10 đồ án mẫu.",
            },
            {
                "id": "c5_3",
                "title": "Hybrid Search Engine",
                "badge": "src/services/search_service.py",
                "badge_color": COLOR_PURPLE,
                "badge_hex": "#A855F7",
                "desc": "Động cơ Reciprocal Rank Fusion kết hợp Okapi BM25 kỹ thuật và Dense Cosine.",
            },
            {
                "id": "c5_4",
                "title": "AI Tutor Grounded Engine",
                "badge": "src/services/tutor_service.py",
                "badge_color": COLOR_INDIGO,
                "badge_hex": "#818CF8",
                "desc": "Bộ tổng hợp câu trả lời gắn chặt với giáo trình, kèm độ tin cậy groundedness.",
            },
            {
                "id": "c5_5",
                "title": "Curriculum Corpus & Indexes",
                "badge": "data/chunks_markdown_header_semantic.jsonl",
                "badge_color": COLOR_PURPLE,
                "badge_hex": "#A855F7",
                "desc": "91 chunks ngữ nghĩa giáo trình, file nén vector_index.npz & bm25_model.pkl.",
            },
            {
                "id": "c5_6",
                "title": "Pytest Integration Suite",
                "badge": "tests/test_quality_api.py",
                "badge_color": COLOR_EMERALD,
                "badge_hex": "#10B981",
                "desc": "29/29 bài test bao phủ 100% routes và mã HTTP, hoàn thành trong 1.51s.",
            },
        ],
    },
]

# Clean, strictly aligned row-by-row horizontal connections + intra-column pipelines
# ZERO backwards spaghetti loops! ZERO overlapping knots!
CONNECTORS = [
    # Row 1 Pipeline: Web Portal & Core Health/Discovery
    ("c1_1", "c2_1", "HTTP :5173", "#38BDF8"),
    ("c2_1", "c3_1", "Route Spec", "#38BDF8"),
    ("c3_1", "c4_1", "GET /health, /info", "#10B981"),
    ("c4_1", "c5_1", "Read State", "#10B981"),
    # Row 2 Pipeline: Platform Backend & Datasets
    ("c1_2", "c2_2", "HTTP :3000", "#818CF8"),
    ("c2_2", "c3_2", "Pass Traced", "#818CF8"),
    ("c3_2", "c4_2", "GET /datasets", "#38BDF8"),
    ("c4_2", "c5_2", "Query 3NF SQL", "#38BDF8"),
    # Row 3 Pipeline: Postman Runner & Capstone Projects
    ("c1_3", "c2_3", "Local Postman", "#F59E0B"),
    ("c2_3", "c3_3", "Key Verified", "#F59E0B"),
    ("c3_3", "c4_3", "GET /projects", "#38BDF8"),
    ("c4_3", "c5_2", "Query Projects", "#38BDF8"),
    # Row 4 Pipeline: Swagger UI & Semantic Search
    ("c1_4", "c2_4", "Interactive Docs", "#A855F7"),
    ("c2_4", "c3_4", "Auth Passed", "#A855F7"),
    ("c3_4", "c4_4", "POST /search", "#A855F7"),
    ("c4_4", "c5_3", "BM25 + Dense RRF", "#A855F7"),
    # Row 5 Pipeline: Python SDK & AI Tutor Grounded Chat
    ("c1_5", "c2_5", "SDK Client", "#818CF8"),
    ("c2_5", "c3_5", "RBAC Permitted", "#818CF8"),
    ("c3_5", "c4_5", "POST /tutor/chat", "#818CF8"),
    ("c4_5", "c5_4", "Synthesize Grounded", "#818CF8"),
    # Row 6 Pipeline: QA Automation & Quality Validation
    ("c1_6", "c2_6", "Automated QA", "#F43F5E"),
    ("c2_6", "c3_6", "Deny 401/403 -> Envelope", "#F43F5E"),
    ("c3_6", "c4_6", "POST /quality", "#F43F5E"),
    ("c4_6", "c5_6", "Pytest 29/29 PASS", "#10B981"),
    # Gateway Vertical Security Chain (Downwards in Column 2)
    ("c2_1", "c2_2", "Trace Ingress", "#818CF8"),
    ("c2_2", "c2_3", "Vault Lookup", "#F59E0B"),
    ("c2_3", "c2_4", "Check Header", "#A855F7"),
    ("c2_4", "c2_5", "Validate Role", "#F43F5E"),
    ("c2_5", "c2_6", "Enforce Policy", "#F43F5E"),
    # Engine Internal Resource Dependencies (Column 5)
    ("c5_3", "c5_5", "Scan 91 Chunks", "#A855F7"),
    ("c5_4", "c5_5", "Retrieve Passages", "#818CF8"),
    ("c5_6", "c5_1", "Verify Endpoints", "#10B981"),
]


def render_image():
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # 1. Header Banner
    draw_rounded_rect(draw, [50, 25, WIDTH - 50, 130], 14, CARD_BG, BORDER_COLOR, 2)
    draw.text(
        (75, 40),
        "KIẾN TRÚC HỢP ĐỒNG API VÀ TÍCH HỢP LIÊN PHÂN HỆ — CYBERSOFT DATA & AI LAB v1.0",
        fill=COLOR_CYAN,
        font=font_title,
    )
    draw.text(
        (77, 88),
        "Chuẩn hóa OpenAPI 3.1 | Uniform Error Envelope | Mock Auth RBAC | RESTful Endpoints | Tích hợp Learning Platform & QA Automation",
        fill=TEXT_MUTED,
        font=font_sub,
    )

    col_w = 580
    col_gap = 70
    start_x = 105
    top_y = 150
    bot_y = 1240

    item_h = 140
    item_gap = 24
    card_w = 536

    card_coords = {}

    # Draw Columns & Items
    for col_idx, col in enumerate(COLUMNS):
        cx = start_x + col_idx * (col_w + col_gap)
        draw_rounded_rect(
            draw, [cx, top_y, cx + col_w, bot_y], 14, CARD_BG, col["color"], 2
        )

        # Header box
        draw_rounded_rect(
            draw,
            [cx + 10, top_y + 10, cx + col_w - 10, top_y + 65],
            10,
            ITEM_BG,
            col["color"],
            1,
        )
        draw.text(
            (cx + 20, top_y + 16),
            col["header"],
            fill=col["color"],
            font=font_col_header,
        )
        draw.text((cx + 20, top_y + 40), col["sub"], fill=TEXT_MUTED, font=font_col_sub)

        # 6 Items per column
        item_y = top_y + 78
        for it in col["items"]:
            card_x0 = cx + (col_w - card_w) // 2
            card_x1 = card_x0 + card_w
            card_y0 = item_y
            card_y1 = item_y + item_h
            card_coords[it["id"]] = (card_x0, card_y0, card_x1, card_y1)

            draw_rounded_rect(
                draw, [card_x0, card_y0, card_x1, card_y1], 8, ITEM_BG, BORDER_COLOR, 1
            )

            # Title
            draw.text(
                (card_x0 + 16, card_y0 + 12),
                it["title"],
                fill=TEXT_WHITE,
                font=font_item_title,
            )

            # Badge pill
            badge_text = it["badge"]
            badge_w = len(badge_text) * 7.2 + 16
            bw = min(badge_w, card_w - 32)
            draw_rounded_rect(
                draw,
                [card_x0 + 16, card_y0 + 38, card_x0 + 16 + bw, card_y0 + 58],
                4,
                CARD_BG,
                it["badge_color"],
                1,
            )
            draw.text(
                (card_x0 + 22, card_y0 + 41),
                badge_text[:50],
                fill=it["badge_color"],
                font=font_badge,
            )

            # Description (word wrap)
            words = it["desc"].split()
            lines = []
            curr = ""
            for w in words:
                if len(curr + " " + w) > 52:
                    lines.append(curr)
                    curr = w
                else:
                    curr = (curr + " " + w).strip()
            if curr:
                lines.append(curr)

            dy = card_y0 + 68
            for line_text in lines[:3]:
                draw.text(
                    (card_x0 + 16, dy), line_text, fill=TEXT_MUTED, font=font_item_desc
                )
                dy += 18

            item_y += item_h + item_gap

    # Draw Inter-column Row Arrows (Clean horizontal lines with arrowheads)
    for row in range(6):
        y_pos = top_y + 78 + row * (item_h + item_gap) + item_h // 2
        for c in range(4):
            x_start = start_x + c * (col_w + col_gap) + col_w
            x_end = start_x + (c + 1) * (col_w + col_gap)
            color = COLOR_CYAN if c % 2 == 0 else COLOR_INDIGO
            draw_arrow(draw, (x_start, y_pos), (x_end, y_pos), color, 2)

    # Bottom KPI Summary Banner
    draw_rounded_rect(draw, [50, 1265, WIDTH - 50, 1515], 14, CARD_BG, BORDER_COLOR, 2)

    kpis = [
        {
            "val": "9 Endpoints",
            "lbl": "Kiến trúc RESTful API v1.0",
            "color": COLOR_CYAN,
        },
        {
            "val": "OpenAPI 3.1",
            "lbl": "Hợp đồng JSON / YAML / Postman",
            "color": COLOR_PURPLE,
        },
        {
            "val": "4 Vai Trò RBAC",
            "lbl": "Student, Instructor, QA, Admin",
            "color": COLOR_ROSE,
        },
        {
            "val": "29/29 PASS",
            "lbl": "Bộ kiểm thử tích hợp Pytest (100%)",
            "color": COLOR_EMERALD,
        },
        {
            "val": "36.98 ms",
            "lbl": "Độ trễ đuôi p95 (SLA < 100 ms)",
            "color": COLOR_AMBER,
        },
        {
            "val": "$0.00 USD",
            "lbl": "Chi phí vận hành (100% On-premise)",
            "color": COLOR_CYAN,
        },
    ]

    card_kpi_w = (WIDTH - 140) / len(kpis)
    for idx, kpi in enumerate(kpis):
        kx = 70 + idx * card_kpi_w
        draw_rounded_rect(
            draw,
            [kx + 10, 1285, kx + card_kpi_w - 10, 1495],
            10,
            ITEM_BG,
            BORDER_COLOR,
            1,
        )
        draw.text((kx + 25, 1315), kpi["val"], fill=kpi["color"], font=font_kpi_val)
        draw.text((kx + 25, 1385), kpi["lbl"], fill=TEXT_MUTED, font=font_kpi_lbl)

    img.save(str(OUTPUT_PNG), "PNG", dpi=(300, 300))
    print(f"Rendered high-res diagram to {OUTPUT_PNG}")


def render_drawio_xml():
    """Generates clean, non-bloated Draw.io XML with parent='1' for all elements and dynamic non-rigid anchors."""
    xml_parts = [
        '<mxfile host="Electron" modified="2026-09-30T00:00:00.000Z" agent="CyberSoft Antigravity Agent" version="21.0.0" type="device">',
        '  <diagram id="cybersoft_day21_api_architecture" name="Day 21 - API &amp; Integration Contracts">',
        '    <mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="3400" pageHeight="1550" background="#0F172A">',
        "      <root>",
        '        <mxCell id="0"/>',
        '        <mxCell id="1" parent="0"/>',
        "        <!-- Header Banner -->",
        '        <mxCell id="hdr" value="KIẾN TRÚC HỢP ĐỒNG API VÀ TÍCH HỢP LIÊN PHÂN HỆ — CYBERSOFT DATA &amp; AI LAB v1.0&#xa;Chuẩn hóa OpenAPI 3.1 | Uniform Error Envelope | Mock Auth RBAC | RESTful Endpoints | Tích hợp Learning Platform &amp; QA Automation" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#38BDF8;strokeWidth=2;fontColor=#38BDF8;fontSize=22;fontStyle=1;" vertex="1" parent="1">',
        '          <mxGeometry x="50" y="25" width="3300" height="105" as="geometry"/>',
        "        </mxCell>",
    ]

    col_w = 580
    col_gap = 70
    start_x = 105
    top_y = 150
    bot_y = 1240
    item_h = 140
    item_gap = 24
    card_w = 536

    # 1. Background Swimlanes / Columns (All parent="1")
    for col_idx, col in enumerate(COLUMNS):
        cx = start_x + col_idx * (col_w + col_gap)
        col_hdr_val = html.escape(col["header"]) + "&#xa;" + html.escape(col["sub"])
        xml_parts.append(
            f"        <!-- Column Background {col_idx + 1}: {html.escape(col['header'])} -->"
        )
        xml_parts.append(
            f'        <mxCell id="{col["id"]}" value="{col_hdr_val}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor={col["stroke"]};strokeWidth=2;fontColor={col["stroke"]};fontSize=15;fontStyle=1;verticalAlign=top;spacingTop=12;" vertex="1" parent="1">'
        )
        xml_parts.append(
            f'          <mxGeometry x="{cx}" y="{top_y}" width="{col_w}" height="{bot_y - top_y}" as="geometry"/>'
        )
        xml_parts.append("        </mxCell>")

    # 2. Individual Cards (All parent="1" with absolute coordinates, preventing container routing glitches)
    for col_idx, col in enumerate(COLUMNS):
        cx = start_x + col_idx * (col_w + col_gap)
        card_x = cx + (col_w - card_w) // 2
        item_y = top_y + 78

        for it_idx, item in enumerate(col["items"]):
            iy = item_y + it_idx * (item_h + item_gap)
            it_val = f"&lt;b&gt;{html.escape(item['title'])}&lt;/b&gt;&lt;br/&gt;&lt;font color='{item['badge_hex']}'&gt;[{html.escape(item['badge'])}]&lt;/font&gt;&lt;br/&gt;&lt;font color='#94A3B8' size='2'&gt;{html.escape(item['desc'])}&lt;/font&gt;"
            xml_parts.append(
                f'        <mxCell id="{item["id"]}" value="{it_val}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#334155;strokeWidth=1;fontColor=#F8FAFC;fontSize=12;align=left;spacingLeft=14;spacingRight=14;" vertex="1" parent="1">'
            )
            xml_parts.append(
                f'          <mxGeometry x="{card_x}" y="{iy}" width="{card_w}" height="{item_h}" as="geometry"/>'
            )
            xml_parts.append("        </mxCell>")

    # 3. Connectors (Dynamic orthogonal routing with label, NO rigid pin constraint)
    for idx, conn in enumerate(CONNECTORS):
        src, tgt, lbl, stroke_col = conn[0], conn[1], conn[2], conn[3]
        xml_parts.append(f"        <!-- Connector {idx + 1}: {src} -> {tgt} -->")
        # Standard dynamic orthogonal connection: allows flexible movement without stuck tail/head
        edge_style = f"edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor={stroke_col};strokeWidth=2;fontColor={stroke_col};fontSize=11;labelBackgroundColor=#0F172A;"
        escaped_lbl = html.escape(lbl)
        xml_parts.append(
            f'        <mxCell id="edge_{idx + 1}" value="{escaped_lbl}" style="{edge_style}" edge="1" parent="1" source="{src}" target="{tgt}">'
        )
        xml_parts.append('          <mxGeometry relative="1" as="geometry"/>')
        xml_parts.append("        </mxCell>")

    # 4. Footer KPI Banner (parent="1")
    xml_parts.append("        <!-- Footer KPI Banner -->")
    xml_parts.append(
        '        <mxCell id="ftr" value="CHỈ SỐ THỰC NGHIỆM &amp; CAM KẾT SLA — CYBERSOFT DATA &amp; AI LAB v1.0" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#334155;strokeWidth=2;fontColor=#F8FAFC;fontSize=18;fontStyle=1;verticalAlign=top;spacingTop=10;" vertex="1" parent="1">'
    )
    xml_parts.append(
        '          <mxGeometry x="50" y="1265" width="3300" height="250" as="geometry"/>'
    )
    xml_parts.append("        </mxCell>")

    kpis = [
        {"val": "9 Endpoints", "lbl": "Kiến trúc RESTful API v1.0", "col": "#38BDF8"},
        {
            "val": "OpenAPI 3.1",
            "lbl": "Hợp đồng JSON / YAML / Postman",
            "col": "#A855F7",
        },
        {
            "val": "4 Vai Trò RBAC",
            "lbl": "Student, Instructor, QA, Admin",
            "col": "#F43F5E",
        },
        {
            "val": "29/29 PASS",
            "lbl": "Bộ kiểm thử tích hợp Pytest (100%)",
            "col": "#10B981",
        },
        {
            "val": "36.98 ms",
            "lbl": "Độ trễ đuôi p95 (SLA &lt; 100 ms)",
            "col": "#F59E0B",
        },
        {
            "val": "$0.00 USD",
            "lbl": "Chi phí vận hành (100% On-premise)",
            "col": "#38BDF8",
        },
    ]
    card_kpi_w = (3400 - 140) / len(kpis)
    for idx, kpi in enumerate(kpis):
        kpi_val = f"&lt;b&gt;&lt;font size='5' color='{kpi['col']}'&gt;{html.escape(kpi['val'])}&lt;/font&gt;&lt;/b&gt;&lt;br/&gt;&lt;br/&gt;&lt;font color='#94A3B8' size='2'&gt;{html.escape(kpi['lbl'])}&lt;/font&gt;"
        xml_parts.append(
            f'        <mxCell id="kpi_{idx + 1}" value="{kpi_val}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#334155;strokeWidth=1;fontColor=#F8FAFC;align=center;" vertex="1" parent="1">'
        )
        xml_parts.append(
            f'          <mxGeometry x="{70 + idx * card_kpi_w + 10}" y="1315" width="{card_kpi_w - 20}" height="170" as="geometry"/>'
        )
        xml_parts.append("        </mxCell>")

    xml_parts.append("      </root>")
    xml_parts.append("    </mxGraphModel>")
    xml_parts.append("  </diagram>")
    xml_parts.append("</mxfile>")

    with open(OUTPUT_DRAWIO, "w", encoding="utf-8") as f:
        f.write("\n".join(xml_parts))
    print(f"Generated clean Draw.io XML to {OUTPUT_DRAWIO}")


if __name__ == "__main__":
    render_image()
    render_drawio_xml()
