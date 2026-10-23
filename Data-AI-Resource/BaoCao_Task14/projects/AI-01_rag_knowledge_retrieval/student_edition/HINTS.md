# HƯỚNG DẪN GỢI Ý & GIÀN GIÁO KỸ THUẬT (HINTS & SCAFFOLDING)
## CAPSTONE AI-01: CYBERSOFT ENTERPRISE RAG SYSTEM

Tài liệu này cung cấp giàn giáo gợi ý 3 cấp độ giúp bạn tháo gỡ các khó khăn kỹ thuật trong quá trình thực hiện dự án mà không làm mất đi tính chủ động và tư duy độc lập.

---

## CẤP ĐỘ 1: GỢI Ý KHÁI NIỆM & TƯ DUY KIẾN TRÚC (CONCEPTUAL HINTS)

### 1. Tại sao Retrieval Naive (chỉ dùng Dense Vector) thường thất bại với văn bản quy chế?
- Các văn bản quy chế có tính pháp lý cao, chứa nhiều từ khóa đặc thù như mã hiệu điều khoản (`SEC-POL-001-01`), số tiền cụ thể (`500.000 VNĐ`), tỷ lệ phần trăm (`80%`, `70%`), thời hạn chính xác (`07 ngày làm việc`).
- Các mô hình Dense Vector thông thường chuyển văn bản thành không gian ngữ nghĩa tổng quát, do đó dễ nhầm lẫn giữa "bảo lưu 06 tháng" và "hoàn phí trong 03 buổi", hoặc bỏ sót các mã quy chế chính xác.
- **Giải pháp**: Phối hợp tìm kiếm từ khóa chính xác (BM25 Lexical Search) với tìm kiếm ngữ nghĩa (Dense Vector Search) theo mô hình **Hybrid Search**.

### 2. Nguyên lý của Reciprocal Rank Fusion (RRF)
- Khi kết hợp hai bộ tìm kiếm có thang điểm khác nhau (ví dụ: BM25 trả về điểm từ 0 đến 25, trong khi Cosine similarity nằm trong khoảng -1 đến 1), việc cộng điểm trực tiếp sẽ bị lệch về bộ có thang điểm lớn hơn.
- RRF giải quyết vấn đề này bằng cách chỉ sử dụng **thứ hạng (rank)** của tài liệu trong mỗi danh sách:
  $$RRF\_Score(d) = \frac{1}{60 + rank_{BM25}(d)} + \frac{1}{60 + rank_{Dense}(d)}$$
- Tài liệu xuất hiện ở thứ hạng cao trong cả hai danh sách sẽ nhận điểm tổng hợp cao nhất.

---

## CẤP ĐỘ 2: GỢI Ý KỸ THUẬT & CÚ PHÁP (TECHNICAL IMPLEMENTATION)

### 1. Phân đoạn văn bản theo Section Markdown (Section-aware Chunking)
Thay vì cắt chuỗi thô theo số ký tự, hãy bóc tách văn bản dựa vào tiêu đề cấp 2 hoặc cấp 3 (`##`, `###`):
```python
import re

def parse_markdown_sections(doc_id, text):
    # Tách văn bản theo các đầu mục điều khoản (ví dụ: ## Điều 1: ...)
    sections = []
    pattern = r'(##+\s+([^\n]+))\n(.*?)(?=\n##+\s+|\Z)'
    matches = re.finditer(pattern, text, re.DOTALL)
    for m in matches:
        heading = m.group(2).strip()
        body = m.group(3).strip()
        # Trích xuất section_id nếu có trong văn bản (ví dụ SEC-POL-001-01)
        sec_match = re.search(r'SEC-[A-Z]+-\d+-\d+', heading + ' ' + body)
        sec_id = sec_match.group(0) if sec_match else f"{doc_id}_sec"
        
        sections.append({
            "doc_id": doc_id,
            "section_id": sec_id,
            "heading": heading,
            "content": f"{heading}\n{body}"
        })
    return sections
```

### 2. Thiết lập cơ chế Từ chối trả lời (Abstention Guardrail)
Để vượt qua 40 câu hỏi Unanswerable và Distractor:
```python
def should_abstain(top_chunks, threshold=0.35):
    # Nếu điểm tương đồng tối đa của top-1 chunk dưới ngưỡng
    if not top_chunks or top_chunks[0]['score'] < threshold:
        return True
    return False

# Trong prompt, chỉ thị rõ:
SYSTEM_PROMPT = """Bạn là Trợ lý Học vụ CyberSoft. CHỈ trả lời dựa vào ngữ cảnh được cung cấp.
Nếu ngữ cảnh không chứa thông tin để trả lời câu hỏi, BẮT BUỘC trả lời chính xác:
'OUT_OF_SCOPE: Không tìm thấy thông tin phù hợp trong tài liệu quy chế nội bộ CyberSoft.'
Tuyệt đối không bịa đặt hoặc suy diễn thông tin."""
```

---

## CẤP ĐỘ 3: CẢNH BÁO BẪY LỖI KINH ĐIỂN (PITFALL WARNINGS)

1. **Bẫy cắt đứt ngữ cảnh (Lost in Chunking)**:
   - Nếu bạn cắt đoạn cứng ở 500 ký tự, điều kiện "Học viên được hoàn 70% phí" có thể nằm ở Chunk 1, nhưng điều kiện loại trừ "Áp dụng trong vòng 3 buổi đầu" lại rơi sang Chunk 2. Khi đó câu trả lời sẽ bị sai lệch hoàn toàn.
2. **Bẫy định dạng trích dẫn sai**:
   - Máy chấm tự động kiểm tra cú pháp regex `\[(CS-[A-Z]+-\d{3})#(SEC-[A-Z]+-\d{3}-\d{2})\]`. Hãy chắc chắn trích dẫn đúng mã tài liệu và mã điều khoản, không viết tắt dạng `[CS-POL-001]` thiếu section id nếu câu hỏi yêu cầu chi tiết điều khoản.
3. **Bẫy bùng nổ độ trễ (Latency Inflation)**:
   - Nếu bạn nhồi nhét quá nhiều chunk vào context (ví dụ top 20 chunks), độ trễ P95 sẽ vượt quá 1.500 ms và chi phí token sẽ vượt ngưỡng 0.050 USD / 1,000 lượt hỏi, dẫn đến mất điểm ở nhóm tiêu chí Hiệu năng & Chi phí.
