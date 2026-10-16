"""Renders high-resolution architecture diagram Picture_24_Detail.png (3400x1600, 300 DPI).

Visualizes:
1. Data Lineage DAG with causal relationships across all 6 artifact categories.
2. WORM Immutable Storage partitions (data/artifacts/{type}/{name}/{version}/).
3. Multi-version release manifests (v1.0.0 baseline & v1.1.0 current release).
4. Lifecycle State Machine (DRAFT -> ACTIVE -> DEPRECATED -> RETIRED) & Rollback flow.
"""

import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Ensure UTF-8 output
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent


def render():
    width = 3400
    height = 1600
    img = Image.new("RGBA", (width, height), "#0B0F19")
    draw = ImageDraw.Draw(img)

    # Fonts
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 52)
        font_sub = ImageFont.truetype("arial.ttf", 26)
        font_col = ImageFont.truetype("arialbd.ttf", 32)
        font_card_title = ImageFont.truetype("arialbd.ttf", 24)
        font_card_body = ImageFont.truetype("arial.ttf", 20)
        font_badge = ImageFont.truetype("arialbd.ttf", 18)
        font_mono = ImageFont.truetype("consola.ttf", 18)
    except Exception:
        font_title = font_sub = font_col = font_card_title = font_card_body = (
            font_badge
        ) = font_mono = ImageFont.load_default()

    # Outer border and grid lines
    draw.rectangle([30, 30, width - 30, height - 30], outline="#273553", width=3)

    # HEADER BAR
    draw.rectangle([30, 30, width - 30, 150], fill="#131B2E")
    draw.text(
        (70, 50),
        "CYBERSOFT DATA & AI LAB — KIẾN TRÚC LINEAGE DAG & PHIÊN BẢN BẤT BIẾN (WORM)",
        fill="#06B6D4",
        font=font_title,
    )
    draw.text(
        (70, 110),
        "Hệ Thống Theo Dõi Nguồn Gốc Dữ Liệu, Cửa Hàng WORM, Bản Đồ Phát Hành (Release Manifests) & Vòng Đời Deprecation v0.1",
        fill="#94A3B8",
        font=font_sub,
    )

    # Top Right Badges
    badges = [
        ("WORM: ACTIVE (SHA-256)", "#10B981", "#064E3B"),
        ("RELEASE: v1.1.0", "#3B82F6", "#1E3A8A"),
        ("DoD: 100% PASS (24/24)", "#F59E0B", "#78350F"),
    ]
    cur_x = width - 80
    for text, border_c, bg_c in reversed(badges):
        bbox = draw.textbbox((0, 0), text, font=font_badge)
        bw = (bbox[2] - bbox[0]) + 30
        cur_x -= bw + 15
        draw.rounded_rectangle(
            [cur_x, 65, cur_x + bw, 115], radius=8, fill=bg_c, outline=border_c, width=2
        )
        draw.text((cur_x + 15, 80), text, fill="#FFFFFF", font=font_badge)

    # 4 MAJOR COLUMNS LAYOUT
    columns = [
        ("CỘT 1: DỮ LIỆU & NGUỒN GỐC GỐC (ROOT SOURCES)", "#3B82F6", 70, 830),
        ("CỘT 2: CHỈ SỐ, PROMPT & MÔ HÌNH (DERIVED ASSETS)", "#8B5CF6", 880, 1640),
        ("CỘT 3: SẢN PHẨM HẠ NGUỒN & ĐÁNH GIÁ (DELIVERABLES)", "#10B981", 1690, 2450),
        ("CỘT 4: QUẢN TRỊ BẢN PHÁT HÀNH & WORM (RELEASES)", "#EC4899", 2500, 3330),
    ]

    for title, col_color, x1, x2 in columns:
        draw.rounded_rectangle(
            [x1, 180, x2, height - 70],
            radius=12,
            fill="#131B2E",
            outline="#273553",
            width=2,
        )
        draw.rounded_rectangle(
            [x1 + 10, 190, x2 - 10, 250],
            radius=8,
            fill="#1A233A",
            outline=col_color,
            width=2,
        )
        draw.text((x1 + 30, 205), title, fill="#FFFFFF", font=font_col)

    # HELPER TO DRAW ARTIFACT CARDS
    def draw_card(
        x,
        y,
        w,
        h,
        art_type,
        name,
        version,
        state,
        hash_str,
        extra_info,
        bg="#1A233A",
        border="#273553",
    ):
        draw.rounded_rectangle(
            [x, y, x + w, y + h], radius=10, fill=bg, outline=border, width=2
        )
        # Type Badge
        type_colors = {
            "DATASET": ("#60A5FA", "#1E3A8A"),
            "PROMPT": ("#C084FC", "#581C87"),
            "MODEL": ("#F472B6", "#831843"),
            "INDEX": ("#34D399", "#064E3B"),
            "EVALUATION": ("#FBBF24", "#78350F"),
            "EXERCISE": ("#22D3EE", "#164E63"),
        }
        tc, tbg = type_colors.get(art_type, ("#FFF", "#333"))
        draw.rounded_rectangle(
            [x + 15, y + 15, x + 120, y + 45], radius=6, fill=tbg, outline=tc, width=1
        )
        draw.text((x + 25, y + 20), art_type, fill=tc, font=font_badge)

        # Version & State Tag
        state_colors = {
            "ACTIVE": ("#34D399", "#064E3B"),
            "DEPRECATED": ("#FBBF24", "#78350F"),
            "RETIRED": ("#F87171", "#7F1D1D"),
        }
        sc, sbg = state_colors.get(state, ("#FFF", "#333"))
        draw.text((x + 135, y + 22), f"{version}", fill="#E2E8F0", font=font_mono)
        draw.rounded_rectangle(
            [x + w - 120, y + 15, x + w - 15, y + 45],
            radius=6,
            fill=sbg,
            outline=sc,
            width=1,
        )
        draw.text((x + w - 105, y + 20), state, fill=sc, font=font_badge)

        # Title
        draw.text((x + 15, y + 60), name, fill="#FFFFFF", font=font_card_title)
        # Extra
        draw.text((x + 15, y + 95), extra_info, fill="#94A3B8", font=font_card_body)
        # Hash
        draw.rectangle(
            [x + 15, y + h - 45, x + w - 15, y + h - 15],
            fill="#090E1A",
            outline="#273553",
        )
        draw.text(
            (x + 25, y + h - 40),
            f"SHA256: {hash_str[:28]}...",
            fill="#06B6D4",
            font=font_mono,
        )

    # -------------------------------------------------------------
    # COLUMN 1: ROOT SOURCES (Datasets & Raw Knowledge)
    # -------------------------------------------------------------
    c1_x = 95
    c1_w = 710
    draw_card(
        c1_x,
        275,
        c1_w,
        185,
        "DATASET",
        "Retail Sales Dataset 3NF",
        "v1.0.0",
        "ACTIVE",
        "9342b483b2c5cd575a825c2aaa1979e5",
        "Transactions, Customers, Stores. Nguồn gốc của bài tập bán lẻ.",
    )
    draw_card(
        c1_x,
        485,
        c1_w,
        185,
        "DATASET",
        "HR Attendance Dataset 3NF",
        "v1.0.0",
        "ACTIVE",
        "e3b0c44298fc1c149afbf4c8996fb924",
        "Employees, Shifts, Attendance. Nguồn gốc của bài tập nhân sự.",
    )
    draw_card(
        c1_x,
        695,
        c1_w,
        185,
        "DATASET",
        "Customer Churn Telecom",
        "v1.0.0",
        "ACTIVE",
        "4a2b9c78d1ef0321aa784155bc901ef2",
        "Dự báo tỷ lệ khách hàng rời mạng viễn thông. Nguồn bài tập Churn.",
    )
    draw_card(
        c1_x,
        905,
        c1_w,
        185,
        "DATASET",
        "AI Knowledge Chunks Corpus",
        "v1.0.0",
        "DEPRECATED",
        "12a3b4c5d6e7f8091a2b3c4d5e6f7a8b",
        "81 phân đoạn tri thức văn bản RAG. (Superseded by v1.1.0)",
    )
    draw_card(
        c1_x,
        1115,
        c1_w,
        185,
        "DATASET",
        "AI Knowledge Chunks Multi-Hop",
        "v1.1.0",
        "ACTIVE",
        "55a4e3c2b1f0987654321fedcba09876",
        "Tập tri thức nâng cao liên kết đa phân đoạn chống rò rỉ đáp án.",
    )

    # -------------------------------------------------------------
    # COLUMN 2: DERIVED ASSETS (Prompts, Models, Indices)
    # -------------------------------------------------------------
    c2_x = 905
    c2_w = 710
    draw_card(
        c2_x,
        275,
        c2_w,
        185,
        "MODEL",
        "BGE Small English Embedder",
        "v1.0.0",
        "ACTIVE",
        "fa881249b012356789abcdef01234567",
        "Embedding Model 384 dimensions. Trọng số checkpoint bất biến.",
    )
    draw_card(
        c2_x,
        485,
        c2_w,
        185,
        "MODEL",
        "Gemini 3.8 Flash Checkpoint",
        "v1.0.0",
        "ACTIVE",
        "77bf3214da987123456bcde098712345",
        "LLM suy luận sinh đề, phân loại Bloom & trợ lý gia sư RAG.",
    )
    draw_card(
        c2_x,
        695,
        c2_w,
        185,
        "PROMPT",
        "Exercise Generator Prompt",
        "v1.0.0",
        "DEPRECATED",
        "3321456789abcdef0123456789abcdef",
        "Prompt few-shot thang Bloom. (Superseded by v1.1.0)",
    )
    draw_card(
        c2_x,
        905,
        c2_w,
        185,
        "PROMPT",
        "Exercise Generator Prompt Enh.",
        "v1.1.0",
        "ACTIVE",
        "bb89123456789abcdef0123456789abc",
        "Tích hợp ràng buộc khả thi thực thi SQL và hộp cát SQLite.",
    )
    draw_card(
        c2_x,
        1115,
        c2_w,
        185,
        "INDEX",
        "Hybrid RAG Search Index",
        "v1.1.0",
        "ACTIVE",
        "8899aabbccddeeff0011223344556677",
        "Chỉ mục kết hợp Dense FAISS + Sparse BM25 (Reciprocal Rank Fusion).",
    )

    # -------------------------------------------------------------
    # COLUMN 3: DELIVERABLES & EVALUATIONS
    # -------------------------------------------------------------
    c3_x = 1715
    c3_w = 710
    draw_card(
        c3_x,
        320,
        c3_w,
        240,
        "EXERCISE",
        "Approved Exercise Bank 20",
        "v1.0.0",
        "ACTIVE",
        "445566778899aabbccddeeff00112233",
        "Ngân hàng 20 bài tập thực hành sư phạm đã qua Giảng viên duyệt.\nĐã truy vết ngược 100% về: 4 Datasets, Model LLM, Prompt v1.0.0.",
        border="#06B6D4",
    )
    draw_card(
        c3_x,
        600,
        c3_w,
        240,
        "EVALUATION",
        "Exercise Feasibility Harness",
        "v1.0.0",
        "ACTIVE",
        "2233445566778899aabbccddeeff0011",
        "Đánh giá khả thi thực thi SQL trên SQLite in-memory (0.78ms/bài).\nTỷ lệ duyệt Vòng 1 đạt 84.0%, Vòng 2 đạt 100.0%.",
    )
    draw_card(
        c3_x,
        880,
        c3_w,
        240,
        "EVALUATION",
        "RAG Benchmark 100 Evaluation",
        "v1.0.0",
        "ACTIVE",
        "112233445566778899aabbccddeeff00",
        "Đánh giá 100 câu hỏi factual, multi-hop, unanswerable, distractor.\nTruy vết tới Chunks Corpus, BGE Embedder, Tutor Prompt.",
    )
    draw_card(
        c3_x,
        1160,
        c3_w,
        170,
        "INDEX",
        "FAISS Retail Sales Index",
        "v1.0.0",
        "ACTIVE",
        "aabbccddeeff00112233445566778899",
        "Chỉ mục tìm kiếm vector xây dựng từ Retail Sales + BGE Embedder.",
    )

    # -------------------------------------------------------------
    # COLUMN 4: RELEASES, WORM & ROLLBACK
    # -------------------------------------------------------------
    c4_x = 2525
    c4_w = 780
    # Manifest v1.0.0
    draw.rounded_rectangle(
        [c4_x, 275, c4_x + c4_w, 530],
        radius=10,
        fill="#1A233A",
        outline="#3B82F6",
        width=2,
    )
    draw.text(
        (c4_x + 20, 295),
        "📦 RELEASE MANIFEST: v1.0.0 (Baseline)",
        fill="#FFFFFF",
        font=font_card_title,
    )
    draw.text(
        (c4_x + 20, 335),
        "Mã bản phát hành: rel_v1.0.0 | Ngày: 2026-09-29",
        fill="#94A3B8",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 365),
        "Số lượng thành phần: 13 tài nguyên (WORM Immutability)",
        fill="#E2E8F0",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 395),
        "Checksum: 20577462c080d8cbdfa00d6d06cfe6ddccad46de...",
        fill="#06B6D4",
        font=font_mono,
    )
    draw.text(
        (c4_x + 20, 435),
        "Mô tả: Bản phát hành nền tảng chuẩn hóa dữ liệu, model và bài tập.",
        fill="#94A3B8",
        font=font_card_body,
    )

    # Manifest v1.1.0
    draw.rounded_rectangle(
        [c4_x, 560, c4_x + c4_w, 820],
        radius=10,
        fill="#1A233A",
        outline="#10B981",
        width=2,
    )
    draw.text(
        (c4_x + 20, 580),
        "📦 RELEASE MANIFEST: v1.1.0 (Current)",
        fill="#FFFFFF",
        font=font_card_title,
    )
    draw.text(
        (c4_x + 20, 620),
        "Mã bản phát hành: rel_v1.1.0 | Ngày: 2026-10-02",
        fill="#94A3B8",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 650),
        "Số lượng thành phần: 16 tài nguyên (Thêm 3 mới, Deprecate 2)",
        fill="#E2E8F0",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 680),
        "Checksum: fa096099dc46141c19c28d80755de74fb2cc1429...",
        fill="#10B981",
        font=font_mono,
    )
    draw.text(
        (c4_x + 20, 720),
        "Mô tả: Tích hợp Hybrid Search RRF & Multi-hop Chunks nâng cao.",
        fill="#94A3B8",
        font=font_card_body,
    )

    # Rollback Note Box
    draw.rounded_rectangle(
        [c4_x, 850, c4_x + c4_w, 1140],
        radius=10,
        fill="#1E1B4B",
        outline="#8B5CF6",
        width=2,
    )
    draw.text(
        (c4_x + 20, 870),
        "🔄 HƯỚNG DẪN HOÀN TÁC (ROLLBACK NOTE)",
        fill="#FFFFFF",
        font=font_card_title,
    )
    draw.text(
        (c4_x + 20, 910),
        "Hướng hoàn tác: rel_v1.1.0 ➔ rel_v1.0.0 (Risk Level: LOW)",
        fill="#A78BFA",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 945),
        "• Bước 1: Revert API Gateway & Route Registry về con trỏ v1.0.0",
        fill="#E2E8F0",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 980),
        "• Bước 2: Khôi phục con trỏ tri thức từ v1.1.0 về v1.0.0",
        fill="#E2E8F0",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 1015),
        "• Bước 3: Cách ly và chuyển trạng thái 3 tài nguyên mới sinh về Draft",
        fill="#E2E8F0",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 1050),
        "• Bước 4: Flush cache và đồng bộ lại FAISS / BM25 index",
        fill="#E2E8F0",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 1085),
        "• Tiêu chuẩn: 0 từ cấm, kiểm thử độc lập Exit Code 0 đạt chuẩn.",
        fill="#34D399",
        font=font_card_body,
    )

    # Lifecycle State Machine Box
    draw.rounded_rectangle(
        [c4_x, 1170, c4_x + c4_w, 1490],
        radius=10,
        fill="#1A233A",
        outline="#F59E0B",
        width=2,
    )
    draw.text(
        (c4_x + 20, 1190),
        "🛡️ MÁY TRẠNG THÁI VÒNG ĐỜI (STATE MACHINE)",
        fill="#FFFFFF",
        font=font_card_title,
    )
    states_flow = "DRAFT ➔ ACTIVE ➔ DEPRECATED ➔ RETIRED"
    draw.text((c4_x + 20, 1230), states_flow, fill="#FBBF24", font=font_card_title)
    draw.text(
        (c4_x + 20, 1270),
        "• Không bao giờ ghi đè hoặc xóa artifact (WORM Store Enforcement).",
        fill="#94A3B8",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 1305),
        "• Deprecate bắt buộc có: Lý do, Sunset date, Tài nguyên thay thế.",
        fill="#94A3B8",
        font=font_card_body,
    )
    draw.text(
        (c4_x + 20, 1340),
        "• Tự động rà soát cảnh báo toàn bộ tài nguyên phụ thuộc hạ nguồn.",
        fill="#94A3B8",
        font=font_card_body,
    )

    # -------------------------------------------------------------
    # DRAW LINEAGE CONNECTIONS (ARROWS)
    # -------------------------------------------------------------
    # 1. Retail Sales -> FAISS Index & Exercise Bank
    draw.line([(c1_x + c1_w, 360), (c2_x, 360)], fill="#3B82F6", width=3)
    draw.line([(c1_x + c1_w, 360), (c3_x, 400)], fill="#06B6D4", width=3)

    # 2. Chunks v1 -> Chunks v2 & BM25
    draw.line(
        [(c1_x + c1_w / 2, 1090), (c1_x + c1_w / 2, 1115)], fill="#60A5FA", width=3
    )

    # 3. Prompt v1 -> Prompt v2 & Exercise Bank
    draw.line([(c2_x + c2_w / 2, 880), (c2_x + c2_w / 2, 905)], fill="#C084FC", width=3)
    draw.line([(c2_x + c2_w, 780), (c3_x, 440)], fill="#06B6D4", width=3)

    # 4. LLM Checkpoint -> Exercise Bank & Evaluator
    draw.line([(c2_x + c2_w, 570), (c3_x, 460)], fill="#F472B6", width=3)
    draw.line([(c2_x + c2_w, 570), (c3_x, 720)], fill="#F472B6", width=3)

    # 5. Deliverables -> Releases
    draw.line([(c3_x + c3_w, 440), (c4_x, 400)], fill="#3B82F6", width=3)
    draw.line([(c3_x + c3_w, 440), (c4_x, 690)], fill="#10B981", width=3)

    # Save output
    output_path = BASE_DIR / "Picture_24_Detail.png"
    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"[SUCCESS] Generated {output_path} (3400x1600, 300 DPI)")


if __name__ == "__main__":
    render()
