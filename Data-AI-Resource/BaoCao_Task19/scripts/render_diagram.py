"""High-resolution architectural diagram renderer for Task 19.

Generates Picture_19_Detail.png at 3400x1900 (300 DPI equivalent) with
CyberSoft dark palette (#0F172A), matching Picture_18_Detail aesthetic.
Also generates Picture_19_Detail.drawio XML file.
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PNG = BASE_DIR / "Picture_19_Detail.png"
OUTPUT_DRAWIO = BASE_DIR / "Picture_19_Detail.drawio"

WIDTH = 3400
HEIGHT = 1900

WIN_FONTS = Path(os.environ.get("WINDIR", "C:\\Windows")) / "Fonts"
font_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 46)
font_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 26)
font_col_header = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 24)
font_col_sub = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 20)
font_item_title = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 22)
font_item_desc = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 18)
font_kpi_val = ImageFont.truetype(str(WIN_FONTS / "segoeuib.ttf"), 32)
font_kpi_lbl = ImageFont.truetype(str(WIN_FONTS / "segoeui.ttf"), 19)

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
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)


def render_png():
    img = Image.new("RGBA", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # 1. Header
    title_text = (
        "CYBERSOFT AI TUTOR GROUNDED GENERATION & ABSTENTION ARCHITECTURE (TASK 19)"
    )
    draw.text((80, 50), title_text, font=font_title, fill=COLOR_CYAN)

    sub_text = (
        "Lead AI Architect & Data Resource Engineer: Đào Trung Kiên | Tuần 4 — RAG & AI Tutor | "
        "6-Stage Defense & Grounded Generation Pipeline | Mandatory Citations | 20 Adversarial Tests (100% Defense)"
    )
    draw.text((80, 115), sub_text, font=font_sub, fill=TEXT_MUTED)
    draw.line([(80, 165), (WIDTH - 80, 165)], fill=BORDER_COLOR, width=2)

    # 2. Six Column Architecture
    margin_x = 80
    top_y = 195
    bot_y = 1530
    total_w = WIDTH - 2 * margin_x
    spacing_x = 24
    num_cols = 6
    col_w = (total_w - (num_cols - 1) * spacing_x) // num_cols

    columns = [
        {
            "num": "01",
            "name": "INPUT GUARDRAIL",
            "sub": "Lớp Phòng Vệ Tầng Vào",
            "color": COLOR_ROSE,
            "items": [
                (
                    "Direct Injection Shield",
                    "Bẻ gãy lệnh 'Ignore previous instructions' & 'Bỏ qua chỉ dẫn'",
                ),
                (
                    "Jailbreak Filter",
                    "Ngăn chặn DAN mode, EvilTutor & giả định vũ trụ song song",
                ),
                (
                    "System Prompt Probe",
                    "Chặn đứng hành vi đòi in template hoặc secret API keys",
                ),
                (
                    "Obfuscation Detector",
                    "Quét ký tự gạch nối ngụy trang (i-g-n-o-r-e) & Base64",
                ),
                (
                    "Input Normalizer",
                    "Làm sạch thẻ HTML script XSS & chuẩn hóa khoảng trắng",
                ),
            ],
        },
        {
            "num": "02",
            "name": "HYBRID RETRIEVAL",
            "sub": "Động Cơ Tìm Kiếm Kép",
            "color": COLOR_CYAN,
            "items": [
                (
                    "Dual Engine Indexing",
                    "91 chunks học liệu: BM25 Okapi + Dense Vector Flat Cosine",
                ),
                (
                    "Reciprocal Rank Fusion",
                    "Hợp nhất thứ hạng RRF (k=60) cân bằng từ khóa và ngữ nghĩa",
                ),
                (
                    "Cross-Context Reranker",
                    "Tái xếp hạng 4 đặc trưng: Coverage, Title, Proximity, Semantic",
                ),
                (
                    "Top-K Candidate Pool",
                    "Trích xuất Top-3 chunks phù hợp nhất với câu hỏi học viên",
                ),
                (
                    "Provenance Lineage",
                    "Bảo toàn nguyên vẹn mã tài liệu, tiêu đề mục và file path",
                ),
            ],
        },
        {
            "num": "03",
            "name": "ABSTENTION GATE",
            "sub": "Cổng Kiểm Soát Từ Chối",
            "color": COLOR_AMBER,
            "items": [
                (
                    "Threshold Evaluation",
                    "Kiểm định ngưỡng tin cậy tương đồng (Threshold = 0.35)",
                ),
                (
                    "Domain Classifier",
                    "Phát hiện câu hỏi ngoài lề: Ẩm thực, Cổ phiếu, Địa lý thế giới",
                ),
                (
                    "Hallucination Bait Gate",
                    "Phát hiện khái niệm giả mạo (Hyper-Quantum Docker, học bổng 1 tỷ)",
                ),
                (
                    "Empty Retrieval Handler",
                    "Kích hoạt từ chối an toàn khi corpus không có dữ kiện liên quan",
                ),
                (
                    "Pedagogical Refusal",
                    "Phản hồi từ chối lịch sự, nêu rõ lý do & gợi ý gặp Mentor",
                ),
            ],
        },
        {
            "num": "04",
            "name": "GROUNDED SYNTHESIS",
            "sub": "Động Cơ Sinh Có Căn Cứ",
            "color": COLOR_PURPLE,
            "items": [
                (
                    "Extractive Synthesizer",
                    "Sinh câu trả lời thuần túy từ văn bản gốc của retrieved chunks",
                ),
                (
                    "Prompt Version v3.0",
                    "Ràng buộc nghiêm ngặt trong thẻ <context_boundary>",
                ),
                (
                    "Sentence Word Overlap",
                    "Thuật toán chọn câu bằng chứng có mật độ từ khóa cao nhất",
                ),
                (
                    "In-text Citation Tags",
                    "Tự động gán mã trích dẫn [chunk_id] vào cuối câu trả lời",
                ),
                (
                    "Zero Hallucination Rule",
                    "Không bịa đặt dữ kiện, không suy đoán ngoài phạm vi học liệu",
                ),
            ],
        },
        {
            "num": "05",
            "name": "OUTPUT GUARDRAIL",
            "sub": "Thẩm Định & Khử Rò Rỉ",
            "color": COLOR_EMERALD,
            "items": [
                (
                    "Citation Verifier",
                    "Đối soát mọi chunk_id trích dẫn với tập context thực tế",
                ),
                (
                    "Fake Citation Purge",
                    "Loại bỏ triệt để các nguồn trích dẫn ma không tồn tại",
                ),
                (
                    "Secret Sanitizer",
                    "Quét regex che giấu API keys (sk-*, AIza*), Bearer tokens",
                ),
                (
                    "PII & Password Mask",
                    "Lọc mật khẩu cấu hình, email cá nhân trong traces",
                ),
                (
                    "Pydantic DTO Contract",
                    "Đóng gói JSON Schema chuẩn: status, answer, citations, confidence",
                ),
            ],
        },
        {
            "num": "06",
            "name": "API & INTERACTION",
            "sub": "Dịch Vụ & Giao Diện v0.1",
            "color": COLOR_INDIGO,
            "items": [
                (
                    "FastAPI REST Endpoints",
                    "POST /api/v1/tutor/chat, POST /evaluate-adversarial, GET /health",
                ),
                (
                    "Interactive Web UI",
                    "Giao diện chat trực quan với badge trạng thái & card trích dẫn",
                ),
                (
                    "Adversarial Test Suite",
                    "Harness kiểm thử tự động 20/20 ca tấn công đối kháng",
                ),
                (
                    "Privacy Audit Logs",
                    "Nhật ký truy vết sạch 100% không chứa dữ liệu nhạy cảm",
                ),
                (
                    "Sub-10ms Latency SLA",
                    "Vận hành offline trên CPU cục bộ, chi phí $0.00 USD",
                ),
            ],
        },
    ]

    for col_idx, col in enumerate(columns):
        col_x = margin_x + col_idx * (col_w + spacing_x)
        draw_rounded_rect(
            draw,
            [col_x, top_y, col_x + col_w, bot_y],
            radius=16,
            fill=CARD_BG,
            outline=col["color"],
            width=2,
        )

        # Header tag
        tag_w = 46
        tag_h = 32
        draw_rounded_rect(
            draw,
            [col_x + 16, top_y + 16, col_x + 16 + tag_w, top_y + 16 + tag_h],
            radius=6,
            fill=col["color"],
        )
        draw.text(
            (col_x + 24, top_y + 20), col["num"], font=font_col_sub, fill=BG_COLOR
        )

        draw.text(
            (col_x + 72, top_y + 18), col["name"], font=font_col_header, fill=TEXT_WHITE
        )
        draw.text(
            (col_x + 72, top_y + 48), col["sub"], font=font_col_sub, fill=col["color"]
        )
        draw.line(
            [(col_x + 16, top_y + 82), (col_x + col_w - 16, top_y + 82)],
            fill=BORDER_COLOR,
            width=1,
        )

        # Item cards
        item_y = top_y + 98
        item_spacing = 22
        item_h = 210

        for item_idx, (it_title, it_desc) in enumerate(col["items"]):
            card_bbox = [col_x + 16, item_y, col_x + col_w - 16, item_y + item_h]
            draw_rounded_rect(
                draw, card_bbox, radius=10, fill=ITEM_BG, outline=BORDER_COLOR, width=1
            )

            draw_rounded_rect(
                draw,
                [col_x + 26, item_y + 16, col_x + 32, item_y + 40],
                radius=3,
                fill=col["color"],
            )
            draw.text(
                (col_x + 42, item_y + 15),
                it_title,
                font=font_item_title,
                fill=TEXT_WHITE,
            )

            # Description wrapping
            words = it_desc.split()
            lines = []
            curr = ""
            for w in words:
                test = f"{curr} {w}".strip()
                if len(test) <= 30:
                    curr = test
                else:
                    lines.append(curr)
                    curr = w
            if curr:
                lines.append(curr)

            for line_idx, line in enumerate(lines[:5]):
                draw.text(
                    (col_x + 28, item_y + 54 + line_idx * 28),
                    line,
                    font=font_item_desc,
                    fill=TEXT_MUTED,
                )

            item_y += item_h + item_spacing

    # 3. KPI Cards Bottom Bar
    kpi_y = 1560
    kpi_h = 175
    kpi_spacing = 20
    kpi_w = (total_w - 5 * kpi_spacing) // 6

    kpis = [
        ("CITATION PRECISION", "100.0%", "Zero Hallucination", COLOR_EMERALD),
        ("ADVERSARIAL DEFENSE", "20/20 PASS", "100% Attack Neutralized", COLOR_ROSE),
        ("ABSTENTION ACCURACY", "100.0%", "Safe Refusal on Out-of-Scope", COLOR_AMBER),
        ("LATENCY SLA (p50)", "3.25 ms", "Sub-10ms Real-time Target", COLOR_CYAN),
        ("SECRET LEAKAGE", "0.00%", "Zero API Keys/PII in Logs", COLOR_INDIGO),
        ("OPERATIONAL COST", "$0.00 USD", "100% Offline Local CPU", COLOR_PURPLE),
    ]

    for k_idx, (k_lbl, k_val, k_sub, k_col) in enumerate(kpis):
        kx = margin_x + k_idx * (kpi_w + kpi_spacing)
        draw_rounded_rect(
            draw,
            [kx, kpi_y, kx + kpi_w, kpi_y + kpi_h],
            radius=14,
            fill=CARD_BG,
            outline=k_col,
            width=2,
        )

        draw.text((kx + 20, kpi_y + 18), k_lbl, font=font_kpi_lbl, fill=TEXT_MUTED)
        draw.text((kx + 20, kpi_y + 52), k_val, font=font_kpi_val, fill=k_col)
        draw.text((kx + 20, kpi_y + 106), k_sub, font=font_item_desc, fill=TEXT_WHITE)

    # 4. Footer Note
    footer_text = "CyberSoft Academy Data & AI Lab — Task 19 Architecture Specification — Strict DoD Compliance: 100% Grounded, 100% Abstention, 100% Guardrail Defense"
    draw.text(
        (margin_x, HEIGHT - 50), footer_text, font=font_item_desc, fill=TEXT_MUTED
    )

    img.save(OUTPUT_PNG, "PNG")
    print(f"[+] Successfully rendered diagram to: {OUTPUT_PNG} (3400x1900)")


def render_drawio():
    drawio_xml = """<mxfile host="Electron" modified="2026-09-25T16:00:00.000Z" agent="CyberSoft" version="21.0.0" type="device">
  <diagram id="cybersoft_tutor_arch" name="CyberSoft AI Tutor Architecture">
    <mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="3400" pageHeight="1900" background="#0F172A">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="title" value="CYBERSOFT AI TUTOR GROUNDED GENERATION &amp; ABSTENTION ARCHITECTURE (TASK 19)" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=32;fontColor=#38BDF8;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="80" y="40" width="1800" height="50" as="geometry"/>
        </mxCell>
        <mxCell id="sub" value="Tuần 4 — RAG &amp; AI Tutor | 6-Stage Defense &amp; Grounded Generation Pipeline | Mandatory Citations" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=18;fontColor=#94A3B8;" vertex="1" parent="1">
          <mxGeometry x="80" y="90" width="1400" height="30" as="geometry"/>
        </mxCell>
        <mxCell id="col1" value="TẦNG 1: INPUT GUARDRAIL&#xa;Injection &amp; Jailbreak Filter" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#F43F5E;strokeWidth=2;fontColor=#F8FAFC;fontSize=16;fontStyle=1;verticalAlign=top;spacingTop=10;" vertex="1" parent="1">
          <mxGeometry x="80" y="150" width="500" height="1200" as="geometry"/>
        </mxCell>
        <mxCell id="col2" value="TẦNG 2: HYBRID RETRIEVAL&#xa;BM25 + Dense + RRF + Reranker" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#38BDF8;strokeWidth=2;fontColor=#F8FAFC;fontSize=16;fontStyle=1;verticalAlign=top;spacingTop=10;" vertex="1" parent="1">
          <mxGeometry x="620" y="150" width="500" height="1200" as="geometry"/>
        </mxCell>
        <mxCell id="col3" value="TẦNG 3: ABSTENTION GATE&#xa;Thresholding &amp; Domain Guard" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#F59E0B;strokeWidth=2;fontColor=#F8FAFC;fontSize=16;fontStyle=1;verticalAlign=top;spacingTop=10;" vertex="1" parent="1">
          <mxGeometry x="1160" y="150" width="500" height="1200" as="geometry"/>
        </mxCell>
        <mxCell id="col4" value="TẦNG 4: GROUNDED SYNTHESIS&#xa;Extractive Zero-Hallucination" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#A855F7;strokeWidth=2;fontColor=#F8FAFC;fontSize=16;fontStyle=1;verticalAlign=top;spacingTop=10;" vertex="1" parent="1">
          <mxGeometry x="1700" y="150" width="500" height="1200" as="geometry"/>
        </mxCell>
        <mxCell id="col5" value="TẦNG 5: OUTPUT GUARDRAIL&#xa;Citation Verifier &amp; Secret Mask" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#10B981;strokeWidth=2;fontColor=#F8FAFC;fontSize=16;fontStyle=1;verticalAlign=top;spacingTop=10;" vertex="1" parent="1">
          <mxGeometry x="2240" y="150" width="500" height="1200" as="geometry"/>
        </mxCell>
        <mxCell id="col6" value="TẦNG 6: API &amp; UI SERVING&#xa;FastAPI REST &amp; Web Dashboard" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1E293B;strokeColor=#818CF8;strokeWidth=2;fontColor=#F8FAFC;fontSize=16;fontStyle=1;verticalAlign=top;spacingTop=10;" vertex="1" parent="1">
          <mxGeometry x="2780" y="150" width="500" height="1200" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>"""
    with open(OUTPUT_DRAWIO, "w", encoding="utf-8") as f:
        f.write(drawio_xml)
    print(f"[+] Successfully generated drawio file to: {OUTPUT_DRAWIO}")


def main():
    render_png()
    render_drawio()


if __name__ == "__main__":
    main()
