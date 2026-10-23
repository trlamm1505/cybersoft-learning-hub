"""High-resolution architectural diagram renderer for Task 20.

Generates Picture_20_Detail.png at 3400x1900 (300 DPI equivalent) with
CyberSoft dark palette (#0F172A).
Features full relational arrows, BOTH internal column flows (Columns 1, 2, 3, 4, 5)
and inter-column pipelines, decision branches, zero badge overlap,
and unclipped exit code branches matching Picture_18_Detail aesthetic.
Also synchronizes Picture_20_Detail.drawio XML file.
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PNG = BASE_DIR / "Picture_20_Detail.png"
OUTPUT_DRAWIO = BASE_DIR / "Picture_20_Detail.drawio"

WIDTH = 3400
HEIGHT = 1900

WIN_FONTS = (
    Path(os.environ.get("WINDIR", os.environ.get("SystemRoot", "C:/Windows"))) / "Fonts"
)
font_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 42)
font_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 22)
font_col_header = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 22)
font_col_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 17)
font_item_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 19)
font_item_desc = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 15)
font_badge = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 13)
font_kpi_val = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 28)
font_kpi_lbl = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 16)
font_decision_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 21)
font_decision_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 15)

BG_COLOR = (15, 23, 42)
CARD_BG = (30, 41, 59)
ITEM_BG = (15, 23, 42)
TEXT_WHITE = (248, 250, 252)
TEXT_MUTED = (148, 163, 184)
BORDER_COLOR = (51, 65, 85)

COLOR_CYAN = (56, 189, 248)
COLOR_INDIGO = (129, 140, 248)
COLOR_PURPLE = (168, 85, 247)
COLOR_AMBER = (245, 158, 11)
COLOR_EMERALD = (16, 185, 129)
COLOR_ROSE = (244, 63, 94)


def draw_rounded_rect(draw, bbox, radius, fill, outline=None, width=1):
    x0, y0, x1, y1 = bbox
    draw.rounded_rectangle(
        [int(x0), int(y0), int(x1), int(y1)],
        radius=int(radius),
        fill=fill,
        outline=outline,
        width=int(width),
    )


def draw_arrow(
    draw, points, color, width=3, badge_text=None, badge_pos=None, badge_color=None
):
    """Draws orthogonal connector line with arrow head at end and optional custom badge position."""
    width = int(width)
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill=color, width=width)

    # Arrow head pointing in direction of last segment
    p_last = points[-1]
    p_prev = points[-2]
    dx = p_last[0] - p_prev[0]
    dy = p_last[1] - p_prev[1]

    if dx > 0:  # pointing right
        draw.polygon(
            [
                (p_last[0], p_last[1]),
                (p_last[0] - 11, p_last[1] - 6),
                (p_last[0] - 11, p_last[1] + 6),
            ],
            fill=color,
        )
    elif dx < 0:  # pointing left
        draw.polygon(
            [
                (p_last[0], p_last[1]),
                (p_last[0] + 11, p_last[1] - 6),
                (p_last[0] + 11, p_last[1] + 6),
            ],
            fill=color,
        )
    elif dy > 0:  # pointing down
        draw.polygon(
            [
                (p_last[0], p_last[1]),
                (p_last[0] - 6, p_last[1] - 11),
                (p_last[0] + 6, p_last[1] - 11),
            ],
            fill=color,
        )
    elif dy < 0:  # pointing up
        draw.polygon(
            [
                (p_last[0], p_last[1]),
                (p_last[0] - 6, p_last[1] + 11),
                (p_last[0] + 6, p_last[1] + 11),
            ],
            fill=color,
        )

    # Badge positioning
    if badge_text:
        if badge_pos is not None:
            mx, my = badge_pos
        else:
            mid_idx = len(points) // 2
            p_a = points[mid_idx - 1]
            p_b = points[mid_idx]
            mx = (p_a[0] + p_b[0]) // 2
            my = (p_a[1] + p_b[1]) // 2

        bbox = font_badge.getbbox(badge_text)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        bw = tw + 16
        bh = th + 10

        bcolor = badge_color or color
        draw_rounded_rect(
            draw,
            (mx - bw // 2, my - bh // 2, mx + bw // 2, my + bh // 2),
            6,
            fill=BG_COLOR,
            outline=bcolor,
            width=2,
        )
        draw.text(
            (mx - tw // 2, my - th // 2 - 1), badge_text, font=font_badge, fill=bcolor
        )


def render_png():
    img = Image.new("RGBA", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # 1. Main Header
    title_text = (
        "CYBERSOFT RAG EVALUATION HARNESS & CI QUALITY GATE ARCHITECTURE (TASK 20)"
    )
    sub_text = (
        "Lead AI Architect & Data Resource Engineer: Đào Trung Kiên | Tuần 4 — RAG & AI Tutor | "
        "Dual-Stage Evaluation (Rule-based & LLM-as-a-Judge) | Versioned Golden Dataset (30 Cases) | CI Quality Gate 7/7 Pass"
    )
    draw.text(
        (WIDTH // 2, 45), title_text, font=font_title, fill=TEXT_WHITE, anchor="mm"
    )
    draw.text((WIDTH // 2, 88), sub_text, font=font_sub, fill=COLOR_CYAN, anchor="mm")
    draw.line([(65, 125), (WIDTH - 65, 125)], fill=BORDER_COLOR, width=2)

    # 2. Symmetrical Geometry Configuration
    col_width = 515
    col_gap = 45
    start_x = 65
    top_y = 145
    col_height = 1240

    cols = [
        {
            "header": "1. GOLDEN EVALUATION SET",
            "sub": "Versioned Ground Truth (30 Cases)",
            "accent": COLOR_CYAN,
            "items": [
                (
                    "15 Standard Educational Queries",
                    "Bao phủ 15 văn bản quy chế, capstone, lập trình với ground truth.",
                ),
                (
                    "8 Unanswerable / OOD Queries",
                    "Câu hỏi ẩm thực, đời sống kích hoạt Cổng từ chối (Abstention Gate).",
                ),
                (
                    "4 Multi-hop & Ambiguous Queries",
                    "Tổng hợp đối chiếu liên văn bản giữa quy chế và công nghệ đào tạo.",
                ),
                (
                    "3 Adversarial & Injection Attacks",
                    "Mẫu tấn công DAN, rò rỉ prompt kích hoạt Guardrail phòng vệ.",
                ),
                (
                    "Version Controlled JSON Artifact",
                    "Lưu trữ golden_rag_eval_v1.json kèm mã băm SHA-256 toàn vẹn.",
                ),
            ],
        },
        {
            "header": "2. LIVE RAG INFERENCE",
            "sub": "Hybrid Retriever & AI Tutor",
            "accent": COLOR_INDIGO,
            "items": [
                (
                    "Dense Vector + Okapi BM25",
                    "Truy xuất Cosine 64D & từ khóa tần suất cao BM25 trên 91 chunks.",
                ),
                (
                    "Reciprocal Rank Fusion (RRF)",
                    "Hợp nhất bảng xếp hạng độc lập (k=60) cân bằng từ khóa và ngữ nghĩa.",
                ),
                (
                    "Cross-Context Reranker",
                    "Tái sắp xếp Top-K 4 chiều: Coverage, Title, Proximity, Alignment.",
                ),
                (
                    "AbstentionGate & Guardrails",
                    "Kiểm tra tương đồng tau < 0.35 & chặn 100% Prompt Injection.",
                ),
                (
                    "Extractive Grounded Synthesizer",
                    "Sinh câu trả lời trong thẻ context boundary, latency p50 26.11ms.",
                ),
            ],
        },
        {
            "header": "3. DUAL-STAGE EVALUATION",
            "sub": "Rule-based & LLM-as-a-Judge",
            "accent": COLOR_PURPLE,
            "items": [
                (
                    "Rule Citation Validator",
                    "Đối soát regex [Chunk-ID] với tập retrieved, 0 trích dẫn ma (100%).",
                ),
                (
                    "Deterministic Abstention Verifier",
                    "Xác thực cờ ABSTAIN / GUARD_BLOCKED cho 100% câu hỏi ngoài lề.",
                ),
                (
                    "LLM Judge: Faithfulness (1-5)",
                    "Chấm điểm trung thực ngữ nghĩa theo Rubric 5 mức độ (đạt 85.67%).",
                ),
                (
                    "LLM Judge: Answer Relevance (1-5)",
                    "Đo lường mức độ trả lời trực diện và đầy đủ câu hỏi (94.00%).",
                ),
                (
                    "LLM Judge: Context Relevance (1-5)",
                    "Đánh giá tỷ lệ tín hiệu trên nhiễu của retrieved chunks (84.00%).",
                ),
            ],
        },
        {
            "header": "4. REGRESSION ANALYTICS",
            "sub": "Delta Tracking vs Baseline v0.1",
            "accent": COLOR_AMBER,
            "items": [
                (
                    "Baseline Metrics Profiling",
                    "Lưu trữ mốc chuẩn v0.1 (Recall 81.25%, MRR 0.7241, 6 cites ma).",
                ),
                (
                    "Delta Calculation Engine",
                    "Tính toán biến thiên Delta (Recall +18.75%, MRR +0.2759, CP +12.46%).",
                ),
                (
                    "Statistical Latency Profiler",
                    "Đo lường phân vị chi tiết: p50 26.11ms, p95 36.98ms, p99 44.50ms.",
                ),
                (
                    "Inter-Rater Calibration Report",
                    "So sánh Judge vs Human Ground Truth, MAE=0.127, 100% agreement.",
                ),
                (
                    "Automated Markdown Output",
                    "Xuất bản reports/regression_comparison_report.md & metrics JSON.",
                ),
            ],
        },
        {
            "header": "5. CI QUALITY GATE",
            "sub": "7/7 Rules Pass / Exit Code 0",
            "accent": COLOR_EMERALD,
            "items": [
                (
                    "Rule 1 & 2: Retrieval Guards",
                    "Delta Recall >= -3.0% (đạt +18.75%), Delta MRR >= -0.05 -> PASS.",
                ),
                (
                    "Rule 3 & 4: Citation Integrity",
                    "Current CP >= 95.0% (96.67%) & 0 trích dẫn ma -> PASS.",
                ),
                (
                    "Rule 5 & 6: Groundedness & Abstain",
                    "Groundedness >= 85%, Abstention >= 90%; Đạt chuẩn an toàn -> PASS.",
                ),
                (
                    "Rule 7: Latency SLA Guard",
                    "Tail Latency p95 <= 100ms (36.98ms); p50 26.11ms -> PASS.",
                ),
                (
                    "CI Gate Status Decision",
                    "Tổng hợp 7 tiêu chuẩn kiểm định -> Quyết định Exit Code.",
                ),
            ],
        },
    ]

    card_coords = {}

    # Item card layout with 36px gap for clean vertical arrows & badges
    header_h = 80
    item_h = 195
    item_gap = 36

    for col_idx, col in enumerate(cols):
        cx = start_x + col_idx * (col_width + col_gap)
        draw_rounded_rect(
            draw,
            (cx, top_y, cx + col_width, top_y + col_height),
            16,
            fill=CARD_BG,
            outline=col["accent"],
            width=3,
        )

        # Header Box
        draw_rounded_rect(
            draw,
            (cx, top_y, cx + col_width, top_y + header_h),
            16,
            fill=(24, 33, 47),
            outline=col["accent"],
            width=1,
        )
        draw.text(
            (cx + 22, top_y + 16),
            col["header"],
            font=font_col_header,
            fill=col["accent"],
        )
        draw.text((cx + 22, top_y + 46), col["sub"], font=font_col_sub, fill=TEXT_MUTED)

        # Item cards
        item_y = top_y + header_h + 15

        for item_idx, (it_title, it_desc) in enumerate(col["items"]):
            card_box = (cx + 18, item_y, cx + col_width - 18, item_y + item_h)
            card_coords[(col_idx, item_idx)] = card_box
            draw_rounded_rect(
                draw, card_box, 10, fill=ITEM_BG, outline=BORDER_COLOR, width=1
            )

            # Left accent bar
            draw_rounded_rect(
                draw, (cx + 18, item_y, cx + 25, item_y + item_h), 3, fill=col["accent"]
            )
            draw.text(
                (cx + 36, item_y + 14), it_title, font=font_item_title, fill=TEXT_WHITE
            )

            # Description wrapping
            words = it_desc.split(" ")
            lines = []
            cur_line = []
            for w in words:
                cur_line.append(w)
                if len(" ".join(cur_line)) > 38:
                    lines.append(" ".join(cur_line))
                    cur_line = []
            if cur_line:
                lines.append(" ".join(cur_line))

            desc_y = item_y + 50
            for line_text in lines[:4]:
                draw.text(
                    (cx + 36, desc_y), line_text, font=font_item_desc, fill=TEXT_MUTED
                )
                desc_y += 24

            item_y += item_h + item_gap

    # ==============================================================================
    # 3. ĐƯỜNG DẪN NỘI BỘ (INTRA-COLUMN FLOWS) TRONG CẢ 5 CỘT: 1, 2, 3, 4, 5
    # ==============================================================================

    # --- NỘI BỘ CỘT 1 (DATASET COMPILATION CHAIN) ---
    c1_0 = card_coords[(0, 0)]
    c1_1 = card_coords[(0, 1)]
    c1_2 = card_coords[(0, 2)]
    c1_3 = card_coords[(0, 3)]
    c1_4 = card_coords[(0, 4)]
    mid_x_c1 = (c1_0[0] + c1_0[2]) // 2

    draw_arrow(
        draw,
        [(mid_x_c1, c1_0[3]), (mid_x_c1, c1_1[1])],
        COLOR_CYAN,
        width=2.5,
        badge_text="Standard Test Suite",
    )
    draw_arrow(
        draw,
        [(mid_x_c1, c1_1[3]), (mid_x_c1, c1_2[1])],
        COLOR_CYAN,
        width=2.5,
        badge_text="OOD Test Suite",
    )
    draw_arrow(
        draw,
        [(mid_x_c1, c1_2[3]), (mid_x_c1, c1_3[1])],
        COLOR_CYAN,
        width=2.5,
        badge_text="Multi-hop Suite",
    )
    draw_arrow(
        draw,
        [(mid_x_c1, c1_3[3]), (mid_x_c1, c1_4[1])],
        COLOR_CYAN,
        width=2.5,
        badge_text="Packaging SHA-256",
    )

    # --- NỘI BỘ CỘT 2 (RAG INFERENCE PIPELINE) ---
    c2_0 = card_coords[(1, 0)]
    c2_1 = card_coords[(1, 1)]
    c2_2 = card_coords[(1, 2)]
    c2_3 = card_coords[(1, 3)]
    c2_4 = card_coords[(1, 4)]
    mid_x_c2 = (c2_0[0] + c2_0[2]) // 2

    draw_arrow(
        draw,
        [(mid_x_c2, c2_0[3]), (mid_x_c2, c2_1[1])],
        COLOR_INDIGO,
        width=2.5,
        badge_text="Candidate Chunks",
    )
    draw_arrow(
        draw,
        [(mid_x_c2, c2_1[3]), (mid_x_c2, c2_2[1])],
        COLOR_INDIGO,
        width=2.5,
        badge_text="Top-20 Pool",
    )
    draw_arrow(
        draw,
        [(mid_x_c2, c2_2[3]), (mid_x_c2, c2_3[1])],
        COLOR_INDIGO,
        width=2.5,
        badge_text="Reranked Top-K",
    )
    draw_arrow(
        draw,
        [(mid_x_c2, c2_3[3]), (mid_x_c2, c2_4[1])],
        COLOR_INDIGO,
        width=2.5,
        badge_text="Cleaned Context",
    )

    # --- NỘI BỘ CỘT 3 (DUAL-STAGE EVALUATION PIPELINE) ---
    c3_0 = card_coords[(2, 0)]
    c3_1 = card_coords[(2, 1)]
    c3_2 = card_coords[(2, 2)]
    c3_3 = card_coords[(2, 3)]
    c3_4 = card_coords[(2, 4)]
    mid_x_c3 = (c3_0[0] + c3_0[2]) // 2

    draw_arrow(
        draw,
        [(mid_x_c3, c3_0[3]), (mid_x_c3, c3_1[1])],
        COLOR_PURPLE,
        width=2.5,
        badge_text="Stage 1: Citation Check",
    )
    draw_arrow(
        draw,
        [(mid_x_c3, c3_1[3]), (mid_x_c3, c3_2[1])],
        COLOR_PURPLE,
        width=2.5,
        badge_text="Pass is_abstained Flag",
    )
    draw_arrow(
        draw,
        [(mid_x_c3, c3_2[3]), (mid_x_c3, c3_3[1])],
        COLOR_PURPLE,
        width=2.5,
        badge_text="Stage 2: Faithfulness",
    )
    draw_arrow(
        draw,
        [(mid_x_c3, c3_3[3]), (mid_x_c3, c3_4[1])],
        COLOR_PURPLE,
        width=2.5,
        badge_text="Rubric 3D Triad",
    )

    # --- NỘI BỘ CỘT 4 (REGRESSION ANALYTICS PIPELINE) ---
    c4_0 = card_coords[(3, 0)]
    c4_1 = card_coords[(3, 1)]
    c4_2 = card_coords[(3, 2)]
    c4_3 = card_coords[(3, 3)]
    c4_4 = card_coords[(3, 4)]
    mid_x_c4 = (c4_0[0] + c4_0[2]) // 2

    draw_arrow(
        draw,
        [(mid_x_c4, c4_0[3]), (mid_x_c4, c4_1[1])],
        COLOR_AMBER,
        width=2.5,
        badge_text="v0.1 Baseline Anchor",
    )
    draw_arrow(
        draw,
        [(mid_x_c4, c4_1[3]), (mid_x_c4, c4_2[1])],
        COLOR_AMBER,
        width=2.5,
        badge_text="Quality Deltas",
    )
    draw_arrow(
        draw,
        [(mid_x_c4, c4_2[3]), (mid_x_c4, c4_3[1])],
        COLOR_AMBER,
        width=2.5,
        badge_text="Latency Benchmarks",
    )
    draw_arrow(
        draw,
        [(mid_x_c4, c4_3[3]), (mid_x_c4, c4_4[1])],
        COLOR_AMBER,
        width=2.5,
        badge_text="Consolidated Metrics",
    )

    # --- NỘI BỘ CỘT 5 (CI GATE VALIDATION CHAIN) ---
    c5_0 = card_coords[(4, 0)]
    c5_1 = card_coords[(4, 1)]
    c5_2 = card_coords[(4, 2)]
    c5_3 = card_coords[(4, 3)]
    c5_4 = card_coords[(4, 4)]
    mid_x_c5 = (c5_0[0] + c5_0[2]) // 2

    draw_arrow(
        draw,
        [(mid_x_c5, c5_0[3]), (mid_x_c5, c5_1[1])],
        COLOR_EMERALD,
        width=2.5,
        badge_text="Rule 1,2 Passed",
    )
    draw_arrow(
        draw,
        [(mid_x_c5, c5_1[3]), (mid_x_c5, c5_2[1])],
        COLOR_EMERALD,
        width=2.5,
        badge_text="Rule 3,4 Passed",
    )
    draw_arrow(
        draw,
        [(mid_x_c5, c5_2[3]), (mid_x_c5, c5_3[1])],
        COLOR_EMERALD,
        width=2.5,
        badge_text="Rule 5,6 Passed",
    )
    draw_arrow(
        draw,
        [(mid_x_c5, c5_3[3]), (mid_x_c5, c5_4[1])],
        COLOR_EMERALD,
        width=2.5,
        badge_text="All 7 Rules Verified",
    )

    # ==============================================================================
    # 4. ĐƯỜNG DẪN LIÊN CỘT (INTER-COLUMN RELATIONAL ARROWS)
    # ==============================================================================

    # --- LUỒNG TỪ CỘT 1 SANG CỘT 2 ---
    mid_gap_12 = (c1_0[2] + c2_0[0]) // 2

    # 1. 15 Standard QA (c1_0) -> Dual Search (c2_0)
    draw_arrow(
        draw,
        [(c1_0[2], c1_0[1] + 60), (c2_0[0], c2_0[1] + 60)],
        COLOR_CYAN,
        width=3,
        badge_text="Standard Q&A",
        badge_pos=(mid_gap_12, c1_0[1] + 60),
    )

    # 2. 8 OOD Queries (c1_1) -> AbstentionGate (c2_3)
    draw_arrow(
        draw,
        [
            (c1_1[2], c1_1[1] + 70),
            (mid_gap_12 - 14, c1_1[1] + 70),
            (mid_gap_12 - 14, c2_3[1] + 45),
            (c2_3[0], c2_3[1] + 45),
        ],
        COLOR_CYAN,
        width=3,
        badge_text="OOD Refusal",
        badge_pos=(mid_gap_12 - 14, (c1_1[1] + c2_3[1]) // 2),
    )

    # 3. 4 Multi-hop Queries (c1_2) -> Cross-Context Reranker (c2_2)
    draw_arrow(
        draw,
        [(c1_2[2], c1_2[1] + 70), (c2_2[0], c2_2[1] + 70)],
        COLOR_CYAN,
        width=3,
        badge_text="Multi-hop Queries",
        badge_pos=(mid_gap_12 + 10, c1_2[1] + 70),
    )

    # 4. 3 Adversarial Attacks (c1_3) -> AbstentionGate (c2_3)
    draw_arrow(
        draw,
        [(c1_3[2], c1_3[1] + 80), (c2_3[0], c2_3[1] + 80)],
        COLOR_CYAN,
        width=3,
        badge_text="Injection Attacks",
        badge_pos=(mid_gap_12, c1_3[1] + 80),
    )

    # --- LUỒNG TỪ CỘT 2 SANG CỘT 3 ---
    mid_gap_23 = (c2_0[2] + c3_0[0]) // 2

    # 5. Synthesizer (c2_4) -> Rule Citation Validator (c3_0)
    draw_arrow(
        draw,
        [
            (c2_4[2], c2_4[1] + 40),
            (mid_gap_23 - 16, c2_4[1] + 40),
            (mid_gap_23 - 16, c3_0[1] + 55),
            (c3_0[0], c3_0[1] + 55),
        ],
        COLOR_INDIGO,
        width=3,
        badge_text="Cited [Chunk-ID]",
        badge_pos=(mid_gap_23 - 16, (c2_4[1] + c3_0[1]) // 2 - 80),
    )

    # 6. AbstentionGate (c2_3) -> Strict Abstention Verifier (c3_1)
    draw_arrow(
        draw,
        [
            (c2_3[2], c2_3[1] + 60),
            (mid_gap_23 + 14, c2_3[1] + 60),
            (mid_gap_23 + 14, c3_1[1] + 65),
            (c3_1[0], c3_1[1] + 65),
        ],
        COLOR_INDIGO,
        width=3,
        badge_text="Refusal State",
        badge_pos=(mid_gap_23 + 14, (c2_3[1] + c3_1[1]) // 2),
    )

    # 7. Synthesizer (c2_4) -> LLM Judge Faithfulness (c3_2)
    draw_arrow(
        draw,
        [
            (c2_4[2], c2_4[1] + 80),
            (mid_gap_23, c2_4[1] + 80),
            (mid_gap_23, c3_2[1] + 70),
            (c3_2[0], c3_2[1] + 70),
        ],
        COLOR_INDIGO,
        width=3,
        badge_text="Context Bounds",
        badge_pos=(mid_gap_23, (c2_4[1] + c3_2[1]) // 2),
    )

    # 8. Synthesizer (c2_4) -> LLM Judge Answer Relevance (c3_3)
    draw_arrow(
        draw,
        [
            (c2_4[2], c2_4[1] + 120),
            (mid_gap_23 - 22, c2_4[1] + 120),
            (mid_gap_23 - 22, c3_3[1] + 70),
            (c3_3[0], c3_3[1] + 70),
        ],
        COLOR_INDIGO,
        width=3,
        badge_text="Query Match",
        badge_pos=(mid_gap_23 - 22, (c2_4[1] + c3_3[1]) // 2),
    )

    # 9. Dual Search (c2_0) -> LLM Judge Context Relevance (c3_4)
    draw_arrow(
        draw,
        [
            (c2_0[2], c2_0[1] + 100),
            (mid_gap_23 + 22, c2_0[1] + 100),
            (mid_gap_23 + 22, c3_4[1] + 70),
            (c3_4[0], c3_4[1] + 70),
        ],
        COLOR_INDIGO,
        width=3,
        badge_text="Retrieved Chunks",
        badge_pos=(mid_gap_23 + 22, (c2_0[1] + c3_4[1]) // 2 + 120),
    )

    # --- LUỒNG TỪ CỘT 3 SANG CỘT 4 ---
    mid_gap_34 = (c3_0[2] + c4_0[0]) // 2

    # 10. Citation Validator (c3_0) -> Delta Calculation Engine (c4_1)
    draw_arrow(
        draw,
        [
            (c3_0[2], c3_0[1] + 65),
            (mid_gap_34 - 16, c3_0[1] + 65),
            (mid_gap_34 - 16, c4_1[1] + 40),
            (c4_1[0], c4_1[1] + 40),
        ],
        COLOR_PURPLE,
        width=3,
        badge_text="Precision & Phantoms",
        badge_pos=(mid_gap_34 - 16, (c3_0[1] + c4_1[1]) // 2),
    )

    # 11. Abstention Verifier (c3_1) -> Delta Calculation Engine (c4_1)
    draw_arrow(
        draw,
        [
            (c3_1[2], c3_1[1] + 65),
            (mid_gap_34 + 16, c3_1[1] + 65),
            (mid_gap_34 + 16, c4_1[1] + 75),
            (c4_1[0], c4_1[1] + 75),
        ],
        COLOR_PURPLE,
        width=3,
        badge_text="Abstain Accuracy",
        badge_pos=(mid_gap_34 + 16, (c3_1[1] + c4_1[1]) // 2),
    )

    # 12. LLM Judge Faithfulness (c3_2) -> Delta Calculation Engine (c4_1)
    draw_arrow(
        draw,
        [
            (c3_2[2], c3_2[1] + 65),
            (mid_gap_34, c3_2[1] + 65),
            (mid_gap_34, c4_1[1] + 110),
            (c4_1[0], c4_1[1] + 110),
        ],
        COLOR_PURPLE,
        width=3,
        badge_text="Rubric 1-5 Scores",
        badge_pos=(mid_gap_34, (c3_2[1] + c4_1[1]) // 2),
    )

    # 13. Synthesizer Latency Trace -> Statistical Latency Profiler (c4_2)
    draw_arrow(
        draw,
        [
            (c2_4[2] - 70, c2_4[3]),
            (c2_4[2] - 70, top_y + col_height - 15),
            (c4_2[0] - 25, top_y + col_height - 15),
            (c4_2[0] - 25, c4_2[1] + 90),
            (c4_2[0], c4_2[1] + 90),
        ],
        COLOR_INDIGO,
        width=3,
        badge_text="Latency Profiling Traces",
        badge_pos=((c2_4[2] + c4_2[0]) // 2, top_y + col_height - 15),
    )

    # --- LUỒNG TỪ CỘT 4 SANG CỘT 5 ---
    mid_gap_45 = (c4_0[2] + c5_0[0]) // 2

    # 14. Delta Engine (c4_1) -> Rule 1 & 2 Retrieval Guards (c5_0)
    draw_arrow(
        draw,
        [
            (c4_1[2], c4_1[1] + 40),
            (mid_gap_45 - 16, c4_1[1] + 40),
            (mid_gap_45 - 16, c5_0[1] + 55),
            (c5_0[0], c5_0[1] + 55),
        ],
        COLOR_AMBER,
        width=3,
        badge_text="Delta Recall & MRR",
        badge_pos=(mid_gap_45 - 16, (c4_1[1] + c5_0[1]) // 2),
    )

    # 15. Delta Engine (c4_1) -> Rule 3 & 4 Citation Integrity (c5_1)
    draw_arrow(
        draw,
        [
            (c4_1[2], c4_1[1] + 80),
            (mid_gap_45 + 16, c4_1[1] + 80),
            (mid_gap_45 + 16, c5_1[1] + 65),
            (c5_1[0], c5_1[1] + 65),
        ],
        COLOR_AMBER,
        width=3,
        badge_text="CP & Phantoms",
        badge_pos=(mid_gap_45 + 16, (c4_1[1] + c5_1[1]) // 2),
    )

    # 16. Delta Engine (c4_1) -> Rule 5 & 6 Quality Floors (c5_2)
    draw_arrow(
        draw,
        [
            (c4_1[2], c4_1[1] + 120),
            (mid_gap_45, c4_1[1] + 120),
            (mid_gap_45, c5_2[1] + 70),
            (c5_2[0], c5_2[1] + 70),
        ],
        COLOR_AMBER,
        width=3,
        badge_text="Semantic Floors",
        badge_pos=(mid_gap_45, (c4_1[1] + c5_2[1]) // 2),
    )

    # 17. Latency Profiler (c4_2) -> Rule 7 Latency SLA Guard (c5_3)
    draw_arrow(
        draw,
        [(c4_2[2], c4_2[1] + 65), (c5_3[0], c5_3[1] + 65)],
        COLOR_AMBER,
        width=3,
        badge_text="p95 < 100ms",
        badge_pos=(mid_gap_45, c4_2[1] + 65),
    )

    # --- ĐƯỜNG LIÊN KẾT BOTTOM TOÀN CỤC (GROUND TRUTH AUDIT) ---
    draw_arrow(
        draw,
        [
            (c1_4[0] + 140, c1_4[3]),
            (c1_4[0] + 140, top_y + col_height - 35),
            (c4_3[0] + 140, top_y + col_height - 35),
            (c4_3[0] + 140, c4_3[3]),
        ],
        COLOR_CYAN,
        width=3,
        badge_text="30 Versioned Golden Ground-Truth Items",
        badge_pos=((c1_4[0] + c4_3[0]) // 2, top_y + col_height - 35),
    )

    # ==============================================================================
    # 5. HAI NHÁNH QUYẾT ĐỊNH EXIT CODE 0 / EXIT CODE 1 (DECISION NODES)
    # ==============================================================================
    box_dec = c5_4

    pass_x0 = 2895
    pass_w = 440
    pass_h = 80
    pass_y0 = box_dec[1] + 10

    # Nhánh Đạt: Exit Code 0 (Green)
    draw_rounded_rect(
        draw,
        (pass_x0, pass_y0, pass_x0 + pass_w, pass_y0 + pass_h),
        12,
        fill=(6, 78, 59),
        outline=COLOR_EMERALD,
        width=3,
    )
    draw.text(
        (pass_x0 + 18, pass_y0 + 14),
        "BUILD PASSED (Exit Code 0)",
        font=font_decision_title,
        fill=COLOR_EMERALD,
    )
    draw.text(
        (pass_x0 + 18, pass_y0 + 46),
        "7/7 Criteria Met -> Deploy Ready",
        font=font_decision_sub,
        fill=TEXT_WHITE,
    )
    draw_arrow(
        draw,
        [(box_dec[2], box_dec[1] + 45), (pass_x0, pass_y0 + 40)],
        COLOR_EMERALD,
        width=4,
        badge_text="7/7 Pass",
    )

    # Nhánh Chặn: Exit Code 1 (Red)
    fail_y0 = pass_y0 + pass_h + 20
    draw_rounded_rect(
        draw,
        (pass_x0, fail_y0, pass_x0 + pass_w, fail_y0 + pass_h),
        12,
        fill=(76, 5, 25),
        outline=COLOR_ROSE,
        width=3,
    )
    draw.text(
        (pass_x0 + 18, fail_y0 + 14),
        "BUILD BLOCKED (Exit Code 1)",
        font=font_decision_title,
        fill=COLOR_ROSE,
    )
    draw.text(
        (pass_x0 + 18, fail_y0 + 46),
        "Quality Regression Detected -> Halt",
        font=font_decision_sub,
        fill=TEXT_WHITE,
    )
    draw_arrow(
        draw,
        [(box_dec[2], box_dec[3] - 45), (pass_x0, fail_y0 + 40)],
        COLOR_ROSE,
        width=4,
        badge_text="Regression",
    )

    # ==============================================================================
    # 6. BOTTOM KPI SUMMARY CARDS (6 CARDS CHUẨN TASK 18)
    # ==============================================================================
    kpi_y = 1415
    kpi_h = 165
    kpi_w = 515
    kpi_gap = 36
    kpi_start_x = 65

    kpis = [
        (
            "RECALL@5: 100.0%",
            "Test Split (15/15 hits)\nDoD Standard: >= 70% (PASS)",
            COLOR_CYAN,
        ),
        (
            "MRR: 1.0000",
            "Top-1 Perfect Rank\nDelta vs Base: +0.2759 (PASS)",
            COLOR_INDIGO,
        ),
        (
            "CITATION PRECISION: 96.67%",
            "Zero Phantom Citations\n100% Real Chunks Verified",
            COLOR_EMERALD,
        ),
        (
            "GROUNDEDNESS: 85.67%",
            "5-Point Rubric Normalized\nInter-Rater MAE: 0.127",
            COLOR_PURPLE,
        ),
        (
            "ABSTENTION: 93.33%",
            "Safe Refusal on OOD & Attacks\nZero Evasion Eager Answers",
            COLOR_AMBER,
        ),
        (
            "TAIL LATENCY: 36.98 ms",
            "p95 SLA: < 100.0 ms (PASS)\n100% Offline Local CPU ($0.00)",
            COLOR_EMERALD,
        ),
    ]

    for i, (val, lbl, accent) in enumerate(kpis):
        kx = kpi_start_x + i * (kpi_w + kpi_gap)
        draw_rounded_rect(
            draw,
            (kx, kpi_y, kx + kpi_w, kpi_y + kpi_h),
            14,
            fill=CARD_BG,
            outline=accent,
            width=2.5,
        )
        draw.text(
            (kx + kpi_w // 2, kpi_y + 48),
            val,
            font=font_kpi_val,
            fill=accent,
            anchor="mm",
        )

        lines = lbl.split("\n")
        draw.text(
            (kx + kpi_w // 2, kpi_y + 102),
            lines[0],
            font=font_kpi_lbl,
            fill=TEXT_MUTED,
            anchor="mm",
        )
        if len(lines) > 1:
            draw.text(
                (kx + kpi_w // 2, kpi_y + 132),
                lines[1],
                font=font_kpi_lbl,
                fill=TEXT_WHITE,
                anchor="mm",
            )

    # 7. Footer Note
    footer_text = (
        "CyberSoft Data & AI Lab v1.0 — Production Ready Artifact | eval_rag CLI | CI Quality Gate 7/7 Criteria Passed (Exit Code 0) | "
        "Verified by Automated Pytest 25/25 PASS in 7.15s | 2026-09-28"
    )
    draw.text(
        (WIDTH // 2, HEIGHT - 50),
        footer_text,
        font=font_sub,
        fill=TEXT_MUTED,
        anchor="mm",
    )

    img.save(OUTPUT_PNG, format="PNG", optimize=True)
    print(
        f"[+] Successfully rendered {OUTPUT_PNG} ({OUTPUT_PNG.stat().st_size} bytes, {WIDTH}x{HEIGHT})"
    )


def render_drawio():
    """Generates complete Draw.io XML with 100% relational arrows, cards and exit code nodes."""
    col_w = 515
    col_gap = 45
    c1_x = 65
    c2_x = c1_x + (col_w + col_gap)  # 625
    c3_x = c1_x + 2 * (col_w + col_gap)  # 1185
    c4_x = c1_x + 3 * (col_w + col_gap)  # 1745
    c5_x = c1_x + 4 * (col_w + col_gap)  # 2305
    pass_x = 2895

    # Card heights & gaps
    header_h = 80
    item_h = 195
    item_gap = 36
    y_start = 145 + header_h + 15

    y_cards = [y_start + i * (item_h + item_gap) for i in range(5)]

    xml_content = f"""<mxfile host="Electron" modified="2026-09-28T07:00:00.000Z" agent="CyberSoft" version="21.0.0" type="device">
  <diagram id="rag_eval_task20_full" name="Task 20 Complete Architecture Flow">
    <mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="3400" pageHeight="1900" background="#0F172A">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- 1. HEADER SECTION -->
        <mxCell id="header_title" value="CYBERSOFT RAG EVALUATION HARNESS &amp; CI QUALITY GATE ARCHITECTURE (TASK 20)" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=40;fontStyle=1;fontColor=#F8FAFC;" vertex="1" parent="1">
          <mxGeometry x="65" y="35" width="3270" height="55" as="geometry" />
        </mxCell>
        <mxCell id="header_sub" value="Lead AI Architect &amp; Data Resource Engineer: Đào Trung Kiên | Tuần 4 — RAG &amp; AI Tutor | Dual-Stage Evaluation (Rule-based &amp; LLM Judge) | Versioned Golden Dataset | CI Quality Gate 7/7 Pass" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=22;fontColor=#94A3B8;" vertex="1" parent="1">
          <mxGeometry x="65" y="95" width="3270" height="35" as="geometry" />
        </mxCell>

        <!-- 2. FIVE ARCHITECTURE COLUMNS -->
        <!-- COLUMN 1: GOLDEN DATASET -->
        <mxCell id="col1" value="1. GOLDEN EVALUATION SET&#xa;Versioned Ground Truth (30 Cases)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#38BDF8;strokeWidth=3;fontColor=#F8FAFC;fontSize=20;fontStyle=1;verticalAlign=top;spacingTop=12;" vertex="1" parent="1">
          <mxGeometry x="{c1_x}" y="145" width="{col_w}" height="1240" as="geometry" />
        </mxCell>
        <mxCell id="c1_0" value="15 Standard Educational Queries&#xa;Bao phủ 15 văn bản quy chế, capstone, lập trình với ground truth" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#38BDF8;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c1_x + 18}" y="{y_cards[0]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c1_1" value="8 Unanswerable / OOD Queries&#xa;Câu hỏi đời sống, ẩm thực kích hoạt Cổng từ chối (Abstention Gate)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#38BDF8;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c1_x + 18}" y="{y_cards[1]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c1_2" value="4 Multi-hop &amp; Ambiguous Queries&#xa;Đòi hỏi tổng hợp đối chiếu liên văn bản giữa quy chế và công nghệ" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#38BDF8;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c1_x + 18}" y="{y_cards[2]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c1_3" value="3 Adversarial &amp; Injection Attacks&#xa;Mẫu tấn công bẻ khóa DAN, rò rỉ prompt kích hoạt Guardrail phòng vệ" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#38BDF8;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c1_x + 18}" y="{y_cards[3]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c1_4" value="Version Controlled Dataset Artifact&#xa;Lưu trữ golden_rag_eval_v1.json kèm bản kê khai mã băm SHA-256" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#38BDF8;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c1_x + 18}" y="{y_cards[4]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>

        <!-- COLUMN 2: LIVE RAG INFERENCE -->
        <mxCell id="col2" value="2. LIVE RAG INFERENCE&#xa;Hybrid Retriever &amp; AI Tutor" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#818CF8;strokeWidth=3;fontColor=#F8FAFC;fontSize=20;fontStyle=1;verticalAlign=top;spacingTop=12;" vertex="1" parent="1">
          <mxGeometry x="{c2_x}" y="145" width="{col_w}" height="1240" as="geometry" />
        </mxCell>
        <mxCell id="c2_0" value="Dense Vector + Okapi BM25&#xa;Truy xuất Cosine 64D &amp; từ khóa tần suất cao BM25 trên 91 chunks" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#818CF8;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c2_x + 18}" y="{y_cards[0]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c2_1" value="Reciprocal Rank Fusion (RRF k=60)&#xa;Hợp nhất bảng xếp hạng độc lập giữa từ khóa và ngữ nghĩa" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#818CF8;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c2_x + 18}" y="{y_cards[1]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c2_2" value="Cross-Context Reranker&#xa;Tái sắp xếp Top-K 4 chiều: Coverage, Title, Proximity, Alignment" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#818CF8;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c2_x + 18}" y="{y_cards[2]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c2_3" value="AbstentionGate &amp; Guardrails&#xa;Kiểm tra độ tương đồng tau &lt; 0.35 &amp; chặn đứng 100% Prompt Injection" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#818CF8;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c2_x + 18}" y="{y_cards[3]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c2_4" value="Extractive Grounded Synthesizer&#xa;Sinh câu trả lời gắn ranh giới context boundary, latency p50 26.11ms" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#818CF8;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c2_x + 18}" y="{y_cards[4]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>

        <!-- COLUMN 3: DUAL-STAGE EVALUATION -->
        <mxCell id="col3" value="3. DUAL-STAGE EVALUATION&#xa;Rule-based &amp; LLM-as-a-Judge" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#A855F7;strokeWidth=3;fontColor=#F8FAFC;fontSize=20;fontStyle=1;verticalAlign=top;spacingTop=12;" vertex="1" parent="1">
          <mxGeometry x="{c3_x}" y="145" width="{col_w}" height="1240" as="geometry" />
        </mxCell>
        <mxCell id="c3_0" value="Stage 1: Rule Citation Validator&#xa;Đối soát regex [Chunk-ID] với tập retrieved, 0 trích dẫn ma" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#A855F7;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c3_x + 18}" y="{y_cards[0]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c3_1" value="Stage 1: Strict Abstention Verifier&#xa;Xác thực cờ ABSTAIN / GUARD_BLOCKED cho 100% câu hỏi ngoài lề" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#A855F7;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c3_x + 18}" y="{y_cards[1]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c3_2" value="Stage 2: LLM Judge - Faithfulness (1-5)&#xa;Chấm điểm trung thực ngữ nghĩa theo Rubric 5 mức (85.67%)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#A855F7;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c3_x + 18}" y="{y_cards[2]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c3_3" value="Stage 2: LLM Judge - Answer Relevance (1-5)&#xa;Đo lường mức độ trả lời trực diện và đầy đủ câu hỏi (94.00%)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#A855F7;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c3_x + 18}" y="{y_cards[3]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c3_4" value="Stage 2: LLM Judge - Context Relevance (1-5)&#xa;Đánh giá tỷ lệ tín hiệu trên nhiễu của retrieved chunks (84.00%)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#A855F7;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c3_x + 18}" y="{y_cards[4]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>

        <!-- COLUMN 4: REGRESSION ANALYTICS -->
        <mxCell id="col4" value="4. REGRESSION ANALYTICS&#xa;Delta Tracking vs Baseline v0.1" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#F59E0B;strokeWidth=3;fontColor=#F8FAFC;fontSize=20;fontStyle=1;verticalAlign=top;spacingTop=12;" vertex="1" parent="1">
          <mxGeometry x="{c4_x}" y="145" width="{col_w}" height="1240" as="geometry" />
        </mxCell>
        <mxCell id="c4_0" value="Baseline Metrics Profiling&#xa;Lưu trữ mốc chuẩn v0.1 (Recall 81.25%, MRR 0.7241, 6 cites ma)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#F59E0B;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c4_x + 18}" y="{y_cards[0]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c4_1" value="Delta Calculation Engine&#xa;Tính toán biến thiên Delta (Recall +18.75%, MRR +0.2759, CP +12.46%)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#F59E0B;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c4_x + 18}" y="{y_cards[1]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c4_2" value="Statistical Latency SLA Profiler&#xa;Đo lường phân vị chi tiết: p50 26.11ms, p95 36.98ms, p99 44.50ms" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#F59E0B;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c4_x + 18}" y="{y_cards[2]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c4_3" value="Inter-Rater Calibration Report&#xa;So sánh Judge vs Human Ground Truth, MAE=0.127, 100% agreement" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#F59E0B;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c4_x + 18}" y="{y_cards[3]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c4_4" value="Automated Markdown &amp; JSON Output&#xa;Xuất bản reports/regression_comparison_report.md &amp; metrics JSON" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#F59E0B;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c4_x + 18}" y="{y_cards[4]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>

        <!-- COLUMN 5: CI QUALITY GATE -->
        <mxCell id="col5" value="5. CI QUALITY GATE&#xa;7/7 Rules Pass / Exit Code 0" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#10B981;strokeWidth=3;fontColor=#F8FAFC;fontSize=20;fontStyle=1;verticalAlign=top;spacingTop=12;" vertex="1" parent="1">
          <mxGeometry x="{c5_x}" y="145" width="{col_w}" height="1240" as="geometry" />
        </mxCell>
        <mxCell id="c5_0" value="Rule 1 &amp; 2: Retrieval Guards&#xa;Delta Recall &gt;= -3.0% (đạt +18.75%), Delta MRR &gt;= -0.05 -&gt; PASS" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#10B981;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c5_x + 18}" y="{y_cards[0]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c5_1" value="Rule 3 &amp; 4: Citation Integrity&#xa;Current CP &gt;= 95.0% (96.67%) &amp; 0 trích dẫn ma -&gt; PASS" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#10B981;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c5_x + 18}" y="{y_cards[1]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c5_2" value="Rule 5 &amp; 6: Groundedness &amp; Abstain&#xa;Groundedness &gt;= 85%, Abstention &gt;= 90%; Đạt chuẩn an toàn -&gt; PASS" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#10B981;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c5_x + 18}" y="{y_cards[2]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c5_3" value="Rule 7: Latency SLA Guard&#xa;Tail Latency p95 &lt;= 100ms (36.98ms); p50 26.11ms -&gt; PASS" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#10B981;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c5_x + 18}" y="{y_cards[3]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>
        <mxCell id="c5_4" value="CI Gate Status Decision&#xa;Tổng hợp 7 tiêu chuẩn kiểm định -&gt; Quyết định Exit Code" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#10B981;strokeWidth=1.5;fontColor=#F8FAFC;fontSize=16;align=left;spacingLeft=15;" vertex="1" parent="1">
          <mxGeometry x="{c5_x + 18}" y="{y_cards[4]}" width="{col_w - 36}" height="{item_h}" as="geometry" />
        </mxCell>

        <!-- 3. CONNECTORS / EDGES (COMPLETE RELATIONAL ARROWS) -->

        <!-- A. INTRA-COLUMN CONNECTORS (COLUMNS 1, 2, 3, 4, 5) -->
        <!-- Col 1 Internal -->
        <mxCell id="e_c1_0_c1_1" value="Standard Test Suite" edge="1" parent="1" source="c1_0" target="c1_1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#38BDF8;strokeWidth=2.5;fontColor=#38BDF8;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c1_1_c1_2" value="OOD Test Suite" edge="1" parent="1" source="c1_1" target="c1_2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#38BDF8;strokeWidth=2.5;fontColor=#38BDF8;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c1_2_c1_3" value="Multi-hop Suite" edge="1" parent="1" source="c1_2" target="c1_3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#38BDF8;strokeWidth=2.5;fontColor=#38BDF8;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c1_3_c1_4" value="Packaging SHA-256" edge="1" parent="1" source="c1_3" target="c1_4" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#38BDF8;strokeWidth=2.5;fontColor=#38BDF8;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- Col 2 Internal -->
        <mxCell id="e_c2_0_c2_1" value="Candidate Chunks" edge="1" parent="1" source="c2_0" target="c2_1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#818CF8;strokeWidth=2.5;fontColor=#818CF8;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c2_1_c2_2" value="Top-20 Pool" edge="1" parent="1" source="c2_1" target="c2_2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#818CF8;strokeWidth=2.5;fontColor=#818CF8;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c2_2_c2_3" value="Reranked Top-K" edge="1" parent="1" source="c2_2" target="c2_3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#818CF8;strokeWidth=2.5;fontColor=#818CF8;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c2_3_c2_4" value="Cleaned Context" edge="1" parent="1" source="c2_3" target="c2_4" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#818CF8;strokeWidth=2.5;fontColor=#818CF8;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- Col 3 Internal -->
        <mxCell id="e_c3_0_c3_1" value="Stage 1: Citation Check" edge="1" parent="1" source="c3_0" target="c3_1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#A855F7;strokeWidth=2.5;fontColor=#A855F7;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c3_1_c3_2" value="Pass is_abstained Flag" edge="1" parent="1" source="c3_1" target="c3_2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#A855F7;strokeWidth=2.5;fontColor=#A855F7;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c3_2_c3_3" value="Stage 2: Faithfulness" edge="1" parent="1" source="c3_2" target="c3_3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#A855F7;strokeWidth=2.5;fontColor=#A855F7;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c3_3_c3_4" value="Rubric 3D Triad" edge="1" parent="1" source="c3_3" target="c3_4" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#A855F7;strokeWidth=2.5;fontColor=#A855F7;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- Col 4 Internal -->
        <mxCell id="e_c4_0_c4_1" value="v0.1 Baseline Anchor" edge="1" parent="1" source="c4_0" target="c4_1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F59E0B;strokeWidth=2.5;fontColor=#F59E0B;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c4_1_c4_2" value="Quality Deltas" edge="1" parent="1" source="c4_1" target="c4_2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F59E0B;strokeWidth=2.5;fontColor=#F59E0B;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c4_2_c4_3" value="Latency Benchmarks" edge="1" parent="1" source="c4_2" target="c4_3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F59E0B;strokeWidth=2.5;fontColor=#F59E0B;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c4_3_c4_4" value="Consolidated Metrics" edge="1" parent="1" source="c4_3" target="c4_4" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F59E0B;strokeWidth=2.5;fontColor=#F59E0B;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- Col 5 Internal -->
        <mxCell id="e_c5_0_c5_1" value="Rule 1,2 Passed" edge="1" parent="1" source="c5_0" target="c5_1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#10B981;strokeWidth=2.5;fontColor=#10B981;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c5_1_c5_2" value="Rule 3,4 Passed" edge="1" parent="1" source="c5_1" target="c5_2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#10B981;strokeWidth=2.5;fontColor=#10B981;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c5_2_c5_3" value="Rule 5,6 Passed" edge="1" parent="1" source="c5_2" target="c5_3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#10B981;strokeWidth=2.5;fontColor=#10B981;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c5_3_c5_4" value="All 7 Rules Verified" edge="1" parent="1" source="c5_3" target="c5_4" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#10B981;strokeWidth=2.5;fontColor=#10B981;fontSize=13;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- B. INTER-COLUMN CONNECTORS -->
        <!-- Col 1 -> Col 2 -->
        <mxCell id="e_c1_0_c2_0" value="Standard Q&amp;A" edge="1" parent="1" source="c1_0" target="c2_0" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#38BDF8;strokeWidth=3;fontColor=#38BDF8;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c1_1_c2_3" value="OOD Refusal" edge="1" parent="1" source="c1_1" target="c2_3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#38BDF8;strokeWidth=3;fontColor=#38BDF8;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c1_2_c2_2" value="Multi-hop Queries" edge="1" parent="1" source="c1_2" target="c2_2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#38BDF8;strokeWidth=3;fontColor=#38BDF8;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c1_3_c2_3" value="Injection Attacks" edge="1" parent="1" source="c1_3" target="c2_3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#38BDF8;strokeWidth=3;fontColor=#38BDF8;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- Col 2 -> Col 3 -->
        <mxCell id="e_c2_4_c3_0" value="Cited [Chunk-ID]" edge="1" parent="1" source="c2_4" target="c3_0" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#818CF8;strokeWidth=3;fontColor=#818CF8;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c2_3_c3_1" value="Refusal State" edge="1" parent="1" source="c2_3" target="c3_1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#818CF8;strokeWidth=3;fontColor=#818CF8;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c2_4_c3_2" value="Context Bounds" edge="1" parent="1" source="c2_4" target="c3_2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#818CF8;strokeWidth=3;fontColor=#818CF8;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c2_4_c3_3" value="Query Match" edge="1" parent="1" source="c2_4" target="c3_3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#818CF8;strokeWidth=3;fontColor=#818CF8;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c2_0_c3_4" value="Retrieved Chunks" edge="1" parent="1" source="c2_0" target="c3_4" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#818CF8;strokeWidth=3;fontColor=#818CF8;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- Col 3 -> Col 4 -->
        <mxCell id="e_c3_0_c4_1" value="Precision &amp; Phantoms" edge="1" parent="1" source="c3_0" target="c4_1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#A855F7;strokeWidth=3;fontColor=#A855F7;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c3_1_c4_1" value="Abstain Accuracy" edge="1" parent="1" source="c3_1" target="c4_1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#A855F7;strokeWidth=3;fontColor=#A855F7;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c3_2_c4_1" value="Rubric 1-5 Scores" edge="1" parent="1" source="c3_2" target="c4_1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#A855F7;strokeWidth=3;fontColor=#A855F7;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- Col 4 -> Col 5 -->
        <mxCell id="e_c4_1_c5_0" value="Delta Recall &amp; MRR" edge="1" parent="1" source="c4_1" target="c5_0" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F59E0B;strokeWidth=3;fontColor=#F59E0B;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c4_1_c5_1" value="CP &amp; Phantoms" edge="1" parent="1" source="c4_1" target="c5_1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F59E0B;strokeWidth=3;fontColor=#F59E0B;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c4_1_c5_2" value="Semantic Floors" edge="1" parent="1" source="c4_1" target="c5_2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F59E0B;strokeWidth=3;fontColor=#F59E0B;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_c4_2_c5_3" value="p95 &lt; 100ms" edge="1" parent="1" source="c4_2" target="c5_3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F59E0B;strokeWidth=3;fontColor=#F59E0B;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- Exit Code Nodes -->
        <mxCell id="node_pass" value="BUILD PASSED (Exit Code 0)&#xa;7/7 Criteria Met -&gt; Deploy Ready" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#064E3B;strokeColor=#10B981;strokeWidth=3;fontColor=#34D399;fontSize=18;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="{pass_x}" y="{y_cards[4] + 10}" width="440" height="80" as="geometry" />
        </mxCell>
        <mxCell id="e_c5_4_pass" value="7/7 Pass" edge="1" parent="1" source="c5_4" target="node_pass" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#10B981;strokeWidth=4;fontColor=#10B981;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="node_fail" value="BUILD BLOCKED (Exit Code 1)&#xa;Quality Regression Detected -&gt; Halt" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#4C0519;strokeColor=#F43F5E;strokeWidth=3;fontColor=#FDA4AF;fontSize=18;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="{pass_x}" y="{y_cards[4] + 110}" width="440" height="80" as="geometry" />
        </mxCell>
        <mxCell id="e_c5_4_fail" value="Regression" edge="1" parent="1" source="c5_4" target="node_fail" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F43F5E;strokeWidth=4;fontColor=#F43F5E;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- Bottom Span Arrow -->
        <mxCell id="e_bottom_span" value="30 Versioned Golden Ground-Truth Items" edge="1" parent="1" source="c1_4" target="c4_3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#38BDF8;strokeWidth=3;fontColor=#38BDF8;fontSize=14;fontStyle=1;labelBackgroundColor=#0F172A;endArrow=block;endFill=1;">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="{c1_x + 200}" y="1380"/>
              <mxPoint x="{c4_x + 200}" y="1380"/>
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- KPI Strip -->
        <mxCell id="kpi1" value="RECALL@5: 100.0%&#xa;Test Split (15/15 hits)&#xa;DoD Standard: &gt;= 70% (PASS)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#38BDF8;strokeWidth=2.5;fontColor=#38BDF8;fontSize=17;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="65" y="1415" width="515" height="165" as="geometry" />
        </mxCell>
        <mxCell id="kpi2" value="MRR: 1.0000&#xa;Top-1 Perfect Rank&#xa;Delta vs Base: +0.2759 (PASS)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#818CF8;strokeWidth=2.5;fontColor=#818CF8;fontSize=17;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="616" y="1415" width="515" height="165" as="geometry" />
        </mxCell>
        <mxCell id="kpi3" value="CITATION PRECISION: 96.67%&#xa;Zero Phantom Citations&#xa;100% Real Chunks Verified" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#10B981;strokeWidth=2.5;fontColor=#10B981;fontSize=17;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1167" y="1415" width="515" height="165" as="geometry" />
        </mxCell>
        <mxCell id="kpi4" value="GROUNDEDNESS: 85.67%&#xa;5-Point Rubric Normalized&#xa;Inter-Rater MAE: 0.127" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#A855F7;strokeWidth=2.5;fontColor=#A855F7;fontSize=17;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1718" y="1415" width="515" height="165" as="geometry" />
        </mxCell>
        <mxCell id="kpi5" value="ABSTENTION: 93.33%&#xa;Safe Refusal on OOD &amp; Attacks&#xa;Zero Evasion Eager Answers" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#F59E0B;strokeWidth=2.5;fontColor=#F59E0B;fontSize=17;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="2269" y="1415" width="515" height="165" as="geometry" />
        </mxCell>
        <mxCell id="kpi6" value="TAIL LATENCY: 36.98 ms&#xa;p95 SLA: &lt; 100.0 ms (PASS)&#xa;100% Offline Local CPU ($0.00)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#10B981;strokeWidth=2.5;fontColor=#34D399;fontSize=17;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="2820" y="1415" width="515" height="165" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>"""
    with open(OUTPUT_DRAWIO, "w", encoding="utf-8") as f:
        f.write(xml_content)
    print(f"[+] Successfully rendered {OUTPUT_DRAWIO}")


def main():
    print(
        "Rendering high-resolution relational architectural diagram for Task 20 with internal flows..."
    )
    render_png()
    render_drawio()
    print("Completed diagram generation.")


if __name__ == "__main__":
    main()
