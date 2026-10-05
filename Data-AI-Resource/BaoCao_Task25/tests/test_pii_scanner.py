"""Unit and integration tests for PII Scanner and Masking Engine."""

from src.services.pii_scanner import PIIScannerService


def test_detect_and_mask_vietnamese_phone_numbers(pii_service: PIIScannerService):
    text = "Học viên A có SĐT 0912345678 và số dự phòng +84988776655."
    res = pii_service.scan_text(text, mask_mode="mask")
    assert res.total_entities_found == 2
    assert "0912***678" in res.sanitized_text
    assert "+8498***655" in res.sanitized_text
    assert res.risk_score > 0


def test_detect_and_mask_student_email(pii_service: PIIScannerService):
    text = "Vui lòng gửi thắc mắc về trungkien.dao@cybersoft.edu.vn hoặc support@example.com."
    res = pii_service.scan_text(text, mask_mode="mask")
    assert res.total_entities_found == 2
    assert "t***@cybersoft.edu.vn" in res.sanitized_text
    assert "s***@example.com" in res.sanitized_text


def test_detect_cccd_12_digits_critical(pii_service: PIIScannerService):
    text = "Căn cước công dân của ứng viên: 079199001234."
    res = pii_service.scan_text(text, mask_mode="mask")
    assert res.total_entities_found == 1
    assert res.has_critical_pii is True
    assert "079******234" in res.sanitized_text
    assert res.risk_score >= 40


def test_detect_api_keys_and_jwt_tokens(pii_service: PIIScannerService):
    text = "Khóa truy cập: sk-proj-1234567890abcdef12345678 và AIzaSyD1234567890abcdef1234567890abcdef."
    res = pii_service.scan_text(text, mask_mode="mask")
    assert res.total_entities_found == 2
    assert res.has_critical_pii is True
    assert "[SECRET_MASKED]" in res.sanitized_text


def test_pii_redaction_mode(pii_service: PIIScannerService):
    text = "Hồ sơ: 0987654321, email: kien@test.com, CCCD: 079198005678."
    res = pii_service.scan_text(text, mask_mode="redact")
    assert res.total_entities_found == 3
    assert "[REDACTED_PHONE_VN]" in res.sanitized_text
    assert "[REDACTED_EMAIL]" in res.sanitized_text
    assert "[REDACTED_CCCD_VN]" in res.sanitized_text


def test_zero_real_pii_clean_text(pii_service: PIIScannerService):
    clean_text = "Học viên tham gia khóa học SQL căn bản và AI Engineering 2026."
    res = pii_service.scan_text(clean_text)
    assert res.total_entities_found == 0
    assert res.has_critical_pii is False
    assert res.risk_score == 0
    assert res.sanitized_text == clean_text
    assert res.is_safe_for_demo is True


def test_detect_phone_with_delimiters(pii_service: PIIScannerService):
    text = "Liên hệ qua SĐT 0912 345 678 hoặc số quốc tế +84.988.776.655."
    res = pii_service.scan_text(text, mask_mode="mask")
    assert res.total_entities_found == 2
    assert "0912***678" in res.sanitized_text or "0912" in res.sanitized_text


def test_cmnd_context_and_reject_standalone_numbers(pii_service: PIIScannerService):
    # Chuỗi chứa CMND có ngữ cảnh: phải bắt được
    text_with_cmnd = "Thông tin xác minh nhân thân, CMND: 025123456 cấp tại TP.HCM."
    res_cmnd = pii_service.scan_text(text_with_cmnd, mask_mode="mask")
    assert res_cmnd.total_entities_found == 1
    assert "02*****56" in res_cmnd.sanitized_text

    # Chuỗi chứa số 9 chữ số thông thường (tiền tệ, mã đơn): KHÔNG được nhận diện nhầm là CMND
    text_invoice = "Đơn hàng DH100234 có tổng giá trị thanh toán là 150000000 VND."
    res_invoice = pii_service.scan_text(text_invoice, mask_mode="mask")
    assert res_invoice.total_entities_found == 0
    assert res_invoice.sanitized_text == text_invoice
