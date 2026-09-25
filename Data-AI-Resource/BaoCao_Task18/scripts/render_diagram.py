"""High-resolution architectural diagram renderer for Task 18.

Generates Picture_18_Detail.png at 3400x1900 (300 DPI equivalent) with
CyberSoft dark palette (#0F172A), matching Picture_17_Detail aesthetic.
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PNG = BASE_DIR / "Picture_18_Detail.png"

# Canvas dimensions
WIDTH = 3400
HEIGHT = 1900
SCALE = 2

# Fonts
WIN_FONTS = Path(os.environ.get("WINDIR", "C:\\Windows")) / "Fonts"
font_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 48)
font_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 28)
font_col_header = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 26)
font_col_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 22)
font_item_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 24)
font_item_desc = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 20)
font_kpi_val = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 32)
font_kpi_lbl = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 20)

# Colors
BG_COLOR = (15, 23, 42)  # Slate 900
CARD_BG = (30, 41, 59)  # Slate 800
ITEM_BG = (15, 23, 42)  # Dark inner
TEXT_WHITE = (248, 250, 252)  # Slate 50
TEXT_MUTED = (148, 163, 184)  # Slate 400
BORDER_COLOR = (51, 65, 85)  # Slate 700

# Theme accents
COLOR_CYAN = (56, 189, 248)  # Sky 400
COLOR_INDIGO = (129, 140, 248)  # Indigo 400
COLOR_PURPLE = (168, 85, 247)  # Purple 500
COLOR_AMBER = (245, 158, 11)  # Amber 500
COLOR_EMERALD = (16, 185, 129)  # Emerald 500
COLOR_PINK = (236, 72, 153)  # Pink 500


def draw_rounded_rect(draw, bbox, radius, fill, outline=None, width=1):
    x0, y0, x1, y1 = bbox
    draw.rounded_rectangle(
        [x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width
    )


def render():
    img = Image.new("RGBA", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # 1. Main Header
    title_text = (
        "CYBERSOFT RAG HYBRID SEARCH & CROSS-CONTEXT RERANKING ARCHITECTURE (TASK 18)"
    )
    sub_text = "Dual-Engine Architecture: BM25 Lexical + Dense L2 Vector → Reciprocal Rank Fusion (RRF) → Cross-Context Reranker → FastAPI Serving & IR Evaluation (Recall@5: 100%, Cost: $0.00)"

    draw.text(
        (WIDTH // 2, 60), title_text, font=font_title, fill=TEXT_WHITE, anchor="mm"
    )
    draw.text((WIDTH // 2, 120), sub_text, font=font_sub, fill=TEXT_MUTED, anchor="mm")

    # 2. Five Columns Configuration
    cols = [
        {
            "header": "1. CORPUS & TOKENIZER",
            "sub": "Input Chunks & Semantic Enrichment",
            "accent": COLOR_CYAN,
            "items": [
                ("91 Chunks Chuẩn Hóa", "Strategy B Header-Aware (Task 16 Chunks)"),
                ("Technical Tokenizer", "Preserve WSL2, CS-POL-003, CI/CD, Docker"),
                ("Semantic Text Enrichment", "Doc ID + Title + Breadcrumb + Text Body"),
                (
                    "Citation Lineage Metadata",
                    "doc_id, sec_id, file_path, char_offsets",
                ),
                ("Zero Data Leakage Split", "10 Train / 20 Test Independent Queries"),
                ("10 Adversarial Categories", "Full IR Failure Taxonomy Test Suite"),
            ],
        },
        {
            "header": "2. DUAL SEARCH ENGINES",
            "sub": "Parallel Lexical + Dense Vector",
            "accent": COLOR_INDIGO,
            "items": [
                ("Dense L2 Embedding Engine", "64-dim SVD Dense Basis | ||v||_2 = 1.0"),
                (
                    "Flat Cosine Vector Index",
                    "SIMD Dot Product | vector_index.npz (55KB)",
                ),
                ("Okapi BM25 Lexical Engine", "k1=1.5, b=0.75 | 1,554 Term Vocabulary"),
                (
                    "Document Length Normalization",
                    "B = 1 - b + b*(dl/avgdl) | avgdl=140.7",
                ),
                (
                    "Serialized Dual Artifacts",
                    "bm25_model.pkl (102KB) + SHA-256 Manifest",
                ),
                (
                    "Deterministic Local Indexing",
                    "100% Offline execution | Sub-ms encoding",
                ),
            ],
        },
        {
            "header": "3. HYBRID FUSION & FILTER",
            "sub": "Multi-Branch Rank Merging",
            "accent": COLOR_PURPLE,
            "items": [
                (
                    "Reciprocal Rank Fusion (RRF)",
                    "RRF(d) = Σ w_m / (k + rank_m(d)) | k=60",
                ),
                (
                    "Weighted Score Normalization",
                    "Score = α*Dense_norm + (1-α)*BM25_norm",
                ),
                (
                    "Metadata Query Filtering",
                    "Strict filtering by category & document_id",
                ),
                ("Candidate Pool Pruning", "Top-15 extraction feeding Reranker stage"),
                (
                    "Score Thresholding (min_score)",
                    "Filters irrelevant low-similarity noise",
                ),
                (
                    "Balanced Weights (0.5 / 0.5)",
                    "Harmonizes lexical exactness & semantics",
                ),
            ],
        },
        {
            "header": "4. CROSS-CONTEXT RERANKER",
            "sub": "Deep Interaction Re-scoring",
            "accent": COLOR_AMBER,
            "items": [
                (
                    "Title & Breadcrumb Match (25%)",
                    "Prioritizes exact section heading match",
                ),
                (
                    "Lexical Token Coverage (30%)",
                    "Fraction of query tokens matched in text",
                ),
                (
                    "Sequential Phrase Proximity (20%)",
                    "Bigram & phrase co-occurrence bonus",
                ),
                (
                    "Dense Semantic Alignment (25%)",
                    "Cosine similarity baseline feature input",
                ),
                (
                    "Sub-Millisecond Overhead",
                    "Latency overhead < 1.5ms per candidate set",
                ),
                (
                    "Subsection Disambiguation",
                    "Resolves preamble vs exact subsection clash",
                ),
            ],
        },
        {
            "header": "5. SERVING & EVALUATION",
            "sub": "FastAPI v0.2 & IR Harness",
            "accent": COLOR_EMERALD,
            "items": [
                (
                    "POST /api/v1/search Endpoint",
                    "5 Modes: dense, bm25, rrf, weighted, reranked",
                ),
                (
                    "Complete Citation Lineage",
                    "Full provenance DTO with content snippet",
                ),
                ("IR Evaluation Harness", "Recall@1/3/5, MRR, NDCG@5, Latency Bench"),
                ("Controlled A/B Experiment", "Baseline vs BM25 vs RRF vs Reranked"),
                ("10 Failure Modes Analyzer", "Root cause & remediation documentation"),
                ("Zero Hardcoded Paths Audit", "100% portable repo-relative paths"),
            ],
        },
    ]

    col_width = 590
    col_gap = 55
    start_x = 80
    top_y = 175
    col_height = 1180

    for i, col in enumerate(cols):
        cx = start_x + i * (col_width + col_gap)
        cy = top_y

        # Swimlane Header Box
        draw_rounded_rect(
            draw,
            (cx, cy, cx + col_width, cy + col_height),
            radius=16,
            fill=CARD_BG,
            outline=col["accent"],
            width=3,
        )
        draw_rounded_rect(
            draw, (cx, cy, cx + col_width, cy + 110), radius=16, fill=col["accent"]
        )
        # Square off bottom of header
        draw.rectangle((cx, cy + 90, cx + col_width, cy + 110), fill=col["accent"])

        draw.text(
            (cx + col_width // 2, cy + 40),
            col["header"],
            font=font_col_header,
            fill=TEXT_WHITE,
            anchor="mm",
        )
        draw.text(
            (cx + col_width // 2, cy + 80),
            col["sub"],
            font=font_col_sub,
            fill=(240, 240, 240),
            anchor="mm",
        )

        # Column Items
        item_y = cy + 130
        item_h = 155
        item_gap = 18

        for title, desc in col["items"]:
            draw_rounded_rect(
                draw,
                (cx + 25, item_y, cx + col_width - 25, item_y + item_h),
                radius=12,
                fill=ITEM_BG,
                outline=col["accent"],
                width=2,
            )
            draw.text(
                (cx + 45, item_y + 40), title, font=font_item_title, fill=col["accent"]
            )
            draw.text(
                (cx + 45, item_y + 85), desc, font=font_item_desc, fill=TEXT_MUTED
            )
            item_y += item_h + item_gap

        # Connecting arrow between columns
        if i < 4:
            arrow_x0 = cx + col_width + 8
            arrow_x1 = cx + col_width + col_gap - 8
            arrow_y = cy + 300
            draw.line(
                (arrow_x0, arrow_y, arrow_x1, arrow_y), fill=col["accent"], width=4
            )
            # Arrow head
            draw.polygon(
                [
                    (arrow_x1, arrow_y),
                    (arrow_x1 - 14, arrow_y - 10),
                    (arrow_x1 - 14, arrow_y + 10),
                ],
                fill=col["accent"],
            )

    # 3. Bottom KPI Strip (6 Cards)
    kpis = [
        (
            "91 Chunks",
            "Dual Index Artifacts (157 KB)\nSHA-256 Verified Manifest",
            COLOR_CYAN,
        ),
        (
            "Recall@5: 100.0%",
            "Test Split (20 Queries)\nDoD Standard: ≥ 70.0% (PASS)",
            COLOR_EMERALD,
        ),
        (
            "Recall@1: 100.0%",
            "MRR: 0.9667 — 1.0000\nDoc-Recall@5: 100.0% (PASS)",
            COLOR_EMERALD,
        ),
        (
            "10 Failure Modes",
            "Full IR Taxonomy Classified\nDoD: ≥ 10 Ca Lỗi (PASS)",
            COLOR_AMBER,
        ),
        (
            "Latency: 8.28 ms",
            "p50 SLA: < 20.0 ms (PASS)\nSub-millisecond Rerank",
            COLOR_INDIGO,
        ),
        (
            "Cost: $0.00 USD",
            "Zero Cloud API Lock-in\n100% Offline Local CPU SIMD",
            COLOR_PINK,
        ),
    ]

    kpi_w = 490
    kpi_gap = 50
    kpi_start_x = 80
    kpi_y = 1400
    kpi_h = 180

    for i, (val, lbl, accent) in enumerate(kpis):
        kx = kpi_start_x + i * (kpi_w + kpi_gap)
        draw_rounded_rect(
            draw,
            (kx, kpi_y, kx + kpi_w, kpi_y + kpi_h),
            radius=16,
            fill=CARD_BG,
            outline=accent,
            width=3,
        )
        draw.text(
            (kx + kpi_w // 2, kpi_y + 55),
            val,
            font=font_kpi_val,
            fill=accent,
            anchor="mm",
        )

        # Multiline label
        lines = lbl.split("\n")
        draw.text(
            (kx + kpi_w // 2, kpi_y + 115),
            lines[0],
            font=font_kpi_lbl,
            fill=TEXT_MUTED,
            anchor="mm",
        )
        if len(lines) > 1:
            draw.text(
                (kx + kpi_w // 2, kpi_y + 145),
                lines[1],
                font=font_kpi_lbl,
                fill=TEXT_MUTED,
                anchor="mm",
            )

    # 4. Save PNG
    img.save(OUTPUT_PNG, format="PNG", optimize=True)
    print(
        f"[+] Successfully rendered {OUTPUT_PNG} ({OUTPUT_PNG.stat().st_size} bytes, {WIDTH}x{HEIGHT})"
    )
    return 0


if __name__ == "__main__":
    render()
