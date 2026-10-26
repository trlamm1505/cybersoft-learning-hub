"""Renders high-resolution architecture diagram Picture_25_Detail.png (3400x1600, 300 DPI).

Visualizes:
1. PII & Privacy Engineering Layer (Phone, Email, CCCD, Token, Masking & Zero Real PII)
2. Prompt Injection Defense Layer (Direct Override, DAN Jailbreak, System Prompt Probe, Delimiters)
3. File Security & Sandboxing Layer (Path Traversal, Safe Sandbox, Magic Bytes, Zip Slip)
4. STRIDE Threat Model & Security Quality Gate (10 Threats, DREAD Matrix, Hard Block on High/Critical)
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
    except Exception:
        font_title = font_sub = font_col = font_card_title = font_card_body = (
            font_badge
        ) = ImageFont.load_default()

    # Outer border and grid lines
    draw.rectangle([30, 30, width - 30, height - 30], outline="#273553", width=3)

    # HEADER BAR
    draw.rectangle([30, 30, width - 30, 150], fill="#131B2E")
    draw.text(
        (70, 50),
        "CYBERSOFT DATA & AI LAB — KIẾN TRÚC PHÒNG VỆ AN TOÀN & BẢO VỆ DỮ LIỆU RIÊNG TƯ",
        fill="#06B6D4",
        font=font_title,
    )
    draw.text(
        (70, 110),
        "Hệ Thống Quét PII, Phòng Vệ Prompt Injection, Sandbox Tệp Tin & Chốt Chặn Security Quality Gate (Task 25)",
        fill="#94A3B8",
        font=font_sub,
    )

    # 4 COLUMNS SETUP
    col_width = 780
    gap = 40
    start_x = 70
    start_y = 180
    col_height = 1260

    columns_data = [
        {
            "num": "TRỤ CỘT 1",
            "title": "BẢO VỆ DỮ LIỆU RIÊNG TƯ (PII)",
            "sub": "Privacy Scanner & Masking Engine v0.1",
            "color": "#38BDF8",
            "cards": [
                {
                    "title": "Nhận Diện Dữ Liệu Định Danh Cá Nhân",
                    "badge": "REGEX ENGINE",
                    "badge_bg": "#0369A1",
                    "lines": [
                        "• SĐT VN (+84, 09x, hỗ trợ dấu cách & dấu chấm)",
                        "• Email học viên: RFC 5322 regex validation",
                        "• CCCD 12 số & CMND 9 số (Context Capturing Group)",
                        "• Chống bắt nhầm số tiền 150000000 VND thành CMND",
                    ],
                },
                {
                    "title": "Chống Lộ Bí Mật & API Tokens",
                    "badge": "SECRET SHIELD",
                    "badge_bg": "#BE185D",
                    "lines": [
                        "• OpenAI API Key: sk-proj-[A-Za-z0-9_-]{24,}",
                        "• Google Gemini Key: AIza[0-9A-Za-z-_]{35}",
                        "• JWT Bearer Token: eyJ... header & signature",
                        "• Quét trước khi commit và trước khi release",
                    ],
                },
                {
                    "title": "Chế Độ Khử Nhiễm (Sanitization)",
                    "badge": "ZERO REAL PII",
                    "badge_bg": "#047857",
                    "lines": [
                        "• Masking: 0912***678 | t***@cybersoft.edu.vn",
                        "• Redaction: [REDACTED_CCCD] | [REDACTED_KEY]",
                        "• 100% Demo sử dụng dữ liệu giả lập tổng hợp",
                        "• Cam kết: Tuyệt đối không rò rỉ PII thật ra ngoài",
                    ],
                },
            ],
        },
        {
            "num": "TRỤ CỘT 2",
            "title": "PHÒNG VỆ PROMPT INJECTION",
            "sub": "AI Guardrails & Jailbreak Defense v0.1",
            "color": "#F43F5E",
            "cards": [
                {
                    "title": "Chặn Chỉ Thị Ghi Đè Trực Tiếp",
                    "badge": "DIRECT OVERRIDE",
                    "badge_bg": "#B91C1C",
                    "lines": [
                        "• Chặn 'ignore previous instructions' / 'disregard'",
                        "• Song ngữ Tiếng Việt: 'Bỏ qua mọi chỉ thị trước đó'",
                        "• Chặn chỉ thị trích xuất system prompt và khóa bí mật",
                        "• Hành động: BLOCK lập tức với rủi ro Critical/High",
                    ],
                },
                {
                    "title": "Vô Hiệu Hóa Vượt Rào (Jailbreak)",
                    "badge": "ROLEPLAY JAILBREAK",
                    "badge_bg": "#C2410C",
                    "lines": [
                        "• Chặn mẫu tấn công DAN (Do Anything Now)",
                        "• Chặn yêu cầu 'đóng vai hacker', 'act as unrestricted'",
                        "• Chặn Developer Mode & Evil Confidant",
                        "• Bảo vệ toàn vẹn Trợ giảng AI trước thao túng vai",
                    ],
                },
                {
                    "title": "Bảo Vệ System Prompt & Delimiters",
                    "badge": "LEAK & EXFIL FILTER",
                    "badge_bg": "#7C3AED",
                    "lines": [
                        "• Chặn probe ép in system instructions ẩn",
                        "• Lọc ký tự phân tách: <|im_start|>, [SYSTEM]",
                        "• Lọc mã Markdown exfiltration: ![ping](http...)",
                        "• False Positive Rate = 0% trên câu hỏi học tập",
                    ],
                },
            ],
        },
        {
            "num": "TRỤ CỘT 3",
            "title": "AN TOÀN TỆP & SANDBOX",
            "sub": "Path Traversal & Upload Security v0.1",
            "color": "#10B981",
            "cards": [
                {
                    "title": "Cách Ly Thư Mục (Sandbox Jail)",
                    "badge": "PATH TRAVERSAL DEFENSE",
                    "badge_bg": "#047857",
                    "lines": [
                        "• Chặn chuỗi vượt cấp: ../, ..\\, %2e%2e, %2f",
                        "• Chặn Null Byte: \\x00, \\u0000, \\0, %00",
                        "• validate_safe_path() đối soát trong Safe Root",
                        "• Trả mã HTTP 403 PATH_TRAVERSAL_BLOCKED",
                    ],
                },
                {
                    "title": "Kiểm Soát Tải Lên & Extension Whitelist",
                    "badge": "MIME & EXT GUARD",
                    "badge_bg": "#1D4ED8",
                    "lines": [
                        "• Whitelist nghiêm ngặt: .json, .csv, .md, .parquet",
                        "• Cấm tuyệt đối: .exe, .sh, .bat, .php, .py, .dll",
                        "• Chặn tấn công phần mở rộng kép (.csv.exe)",
                        "• Giới hạn dung lượng cứng: 10MB (chống DoS)",
                    ],
                },
                {
                    "title": "Phân Tích Magic Bytes & Zip Slip",
                    "badge": "BINARY INTEGRITY",
                    "badge_bg": "#D97706",
                    "lines": [
                        "• Phát hiện header PE (MZ), ELF giả dạng .json",
                        "• Chặn shell script có shebang #!/bin/sh",
                        "• Zip Slip: Duyệt ZipFile chặn mọi entry có '..'",
                        "• Đảm bảo môi trường máy chủ không bị ghi đè",
                    ],
                },
            ],
        },
        {
            "num": "TRỤ CỘT 4",
            "title": "RELEASE SCANNER & QUALITY GATE",
            "sub": "Task 24 Audit & Release Decision v0.1",
            "color": "#A855F7",
            "cards": [
                {
                    "title": "Thẩm Định Gói Phát Hành Task 24",
                    "badge": "TASK 24 AUDIT",
                    "badge_bg": "#6D28D9",
                    "lines": [
                        "• Đối soát SHA-256 của 16 Artifacts Task 24",
                        "• Quét PII trên Churn CSV & Injection trên Chunks",
                        "• Gói v1.1.0: 16/16 Khớp Hash 100% -> PASSED",
                        "• Gói giả mạo tampered: Khóa cứng BLOCKED",
                    ],
                },
                {
                    "title": "Ma Trận STRIDE & Thang Điểm DREAD",
                    "badge": "10 THREATS MAPPED",
                    "badge_bg": "#4338CA",
                    "lines": [
                        "• 10/10 Mối đe dọa đã vá mã nguồn & giảm thiểu",
                        "• Phân loại: Spoofing, Tampering, Info Disclosure...",
                        "• 0 Lỗ hổng Critical / High còn mở trong hệ thống",
                        "• Đảm bảo tiêu chuẩn an ninh trước khi tích hợp",
                    ],
                },
                {
                    "title": "Chốt Chặn Phát Hành (Security Quality Gate)",
                    "badge": "GATE: PASSED",
                    "badge_bg": "#059669",
                    "lines": [
                        "• Điều kiện: 0 High/Crit mở & 16/16 Artifacts toàn vẹn",
                        "• Trạng thái hiện tại: PASSED (Release Allowed)",
                        "• 73/73 Pytest Tests PASS 100% trong 1.11 giây",
                        "• Đủ điều kiện bàn giao Tuần 6 (Platform Integration)",
                    ],
                },
            ],
        },
    ]

    for i, col in enumerate(columns_data):
        cx = start_x + i * (col_width + gap)
        cy = start_y

        # Column background card
        draw.rectangle(
            [cx, cy, cx + col_width, cy + col_height],
            fill="#111827",
            outline="#273553",
            width=2,
        )

        # Column Header Bar
        draw.rectangle([cx, cy, cx + col_width, cy + 90], fill="#162032")
        draw.text((cx + 24, cy + 16), col["num"], fill=col["color"], font=font_badge)
        draw.text((cx + 24, cy + 42), col["title"], fill="#FFFFFF", font=font_col)
        draw.text((cx + 24, cy + 78), col["sub"], fill="#94A3B8", font=font_sub)

        # Cards inside column
        card_y = cy + 120
        card_height = 340
        card_gap = 25

        for card in col["cards"]:
            draw.rectangle(
                [cx + 20, card_y, cx + col_width - 20, card_y + card_height],
                fill="#1A2438",
                outline="#2F3E5E",
                width=1,
            )

            # Card Header
            draw.text(
                (cx + 40, card_y + 24),
                card["title"],
                fill="#F8FAFC",
                font=font_card_title,
            )

            # Card Badge
            b_text = card["badge"]
            draw.rectangle(
                [cx + 40, card_y + 60, cx + 40 + len(b_text) * 11 + 24, card_y + 88],
                fill=card["badge_bg"],
            )
            draw.text((cx + 52, card_y + 64), b_text, fill="#FFFFFF", font=font_badge)

            # Card Body Lines
            line_y = card_y + 110
            for line in card["lines"]:
                draw.text((cx + 40, line_y), line, fill="#CBD5E1", font=font_card_body)
                line_y += 42

            card_y += card_height + card_gap

    # FOOTER BAR
    foot_y = 1490
    draw.rectangle([30, foot_y, width - 30, height - 30], fill="#131B2E")
    draw.text(
        (70, foot_y + 25),
        "CyberSoft Data & AI Lab © 2026 — Đào Trung Kiên (Data & AI Resource Engineer)",
        fill="#94A3B8",
        font=font_card_body,
    )
    draw.text(
        (width - 850, foot_y + 25),
        "73/73 Tests Passed | 0 Open Critical/High | Task 24 Verified | Zero Real PII",
        fill="#38BDF8",
        font=font_card_title,
    )

    out_file = BASE_DIR / "Picture_25_Detail.png"
    img.save(out_file, dpi=(300, 300))
    print(f"[SUCCESS] Đã tạo thành công ảnh sơ đồ kiến trúc: {out_file}")


if __name__ == "__main__":
    render()
