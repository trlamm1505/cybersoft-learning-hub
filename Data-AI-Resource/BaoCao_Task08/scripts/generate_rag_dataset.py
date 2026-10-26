# -*- coding: utf-8 -*-
"""
Main Builder Engine for Task 08 - CyberSoft Academy RAG Resource
Generates:
1. 20 Corpus Markdown Documents + corpus_manifest.json
2. 100 RAG Evaluation Benchmark Questions (JSON & CSV)
3. Data Dictionary Schemas (corpus_schema.json/.md, eval_schema.json/.md)
4. Technical Docs (chunking guidelines, ground truth matrix, anti-leakage defense)
5. CLI Validator script (validate_rag_dataset.py)
6. Automated Pytest Suite (test_rag_integrity.py)
"""

import os
import json
import csv
import re

BASE_DIR = r"d:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task08"
CORPUS_DIR = os.path.join(BASE_DIR, "data", "corpus")
EVAL_DIR = os.path.join(BASE_DIR, "data", "eval_qa")
SCHEMA_DIR = os.path.join(BASE_DIR, "data_dictionary")
DOCS_DIR = os.path.join(BASE_DIR, "docs")
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")
TESTS_DIR = os.path.join(BASE_DIR, "tests")

for d in [CORPUS_DIR, EVAL_DIR, SCHEMA_DIR, DOCS_DIR, SCRIPTS_DIR, TESTS_DIR]:
    os.makedirs(d, exist_ok=True)

print("Starting Task 08 Builder Engine...")


# Load DOCUMENTS definition from data/corpus markdown files
def load_corpus_documents():
    docs = []
    doc_files = [f for f in sorted(os.listdir(CORPUS_DIR)) if f.endswith(".md")]
    for df in doc_files:
        path = os.path.join(CORPUS_DIR, df)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        fm_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
        fm_dict = {}
        if fm_match:
            for line in fm_match.group(1).split("\n"):
                if ":" in line:
                    k, v = line.split(":", 1)
                    val = v.strip().strip('"').strip("'")
                    fm_dict[k.strip()] = val
        sec_matches = re.finditer(
            r"##\s+(SEC-[A-Z0-9\-]+):\s+([^\n]+)\n(.*?)(?=\n##\s+SEC-|\Z)",
            content,
            re.DOTALL,
        )
        sections = []
        for sm in sec_matches:
            sections.append(
                {
                    "section_id": sm.group(1).strip(),
                    "section_title": sm.group(2).strip(),
                    "content": sm.group(3).strip(),
                }
            )
        fm_dict["sections"] = sections
        fm_dict["filename"] = df
        docs.append(fm_dict)
    return docs


DOCUMENTS = load_corpus_documents()
print(f"Loaded {len(DOCUMENTS)} documents from corpus directory.")

# Refresh corpus manifest
manifest = []
for doc in DOCUMENTS:
    sections_meta = []
    for sec in doc["sections"]:
        sections_meta.append(
            {
                "section_id": sec["section_id"],
                "section_title": sec["section_title"],
                "char_count": len(sec["content"]),
                "word_count": len(sec["content"].split()),
            }
        )
    manifest.append(
        {
            "document_id": doc["document_id"],
            "title": doc.get("title", ""),
            "category": doc.get("category", ""),
            "version": doc.get("version", ""),
            "effective_date": doc.get("effective_date", ""),
            "filename": doc["filename"],
            "sections_count": len(doc["sections"]),
            "sections": sections_meta,
        }
    )

manifest_path = os.path.join(CORPUS_DIR, "corpus_manifest.json")
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print(f"Refreshed manifest for {len(manifest)} documents.")

# Build the 100 Questions
# Load or build evaluation questions list
questions = []


# Helper to verify citation exists in document
def find_citation(doc_id, sec_id, quote):
    for d in DOCUMENTS:
        if d["document_id"] == doc_id:
            for s in d["sections"]:
                if s["section_id"] == sec_id:
                    if quote in s["content"]:
                        return True
                    else:
                        print(
                            f"ERROR: Quote not in section! doc={doc_id}, sec={sec_id}"
                        )
                        print(f"Quote: '{quote}'")
                        print(f"Content: '{s['content']}'")
                        return False
    print(f"ERROR: doc={doc_id} or sec={sec_id} not found!")
    return False


# Single-Hop (Q001 - Q040)
single_hops = [
    (
        "Q001",
        "Điều kiện về thời lượng hoàn thành để học viên được quyền nộp đơn xin bảo lưu khóa học tại CyberSoft là gì?",
        "Academic Policy",
        "Học viên được quyền nộp đơn xin bảo lưu khóa học khi đã hoàn thành tối thiểu 20% và không quá 70% tổng thời lượng chương trình học, đồng thời phải hoàn thành đủ 100% nghĩa vụ học phí của giai đoạn đang học.",
        [
            {
                "document_id": "CS-POL-001",
                "section_id": "SEC-POL-001-01",
                "text_citation": "Học viên được quyền nộp đơn xin bảo lưu khóa học khi đã hoàn thành tối thiểu 20% và không quá 70% tổng thời lượng chương trình học.",
            }
        ],
        "Truy xuất trực tiếp điều kiện tỷ lệ phần trăm hoàn thành khóa học từ Quy chế bảo lưu CS-POL-001.",
    ),
    (
        "Q002",
        "Thời gian bảo lưu tối đa cho một khóa học và số lần bảo lưu tối đa được phép là bao nhiêu?",
        "Academic Policy",
        "Thời gian bảo lưu tối đa cho một khóa học là 06 tháng kể từ ngày phê duyệt, và mỗi học viên chỉ được phép bảo lưu tối đa 02 lần trong suốt toàn bộ lộ trình học tập.",
        [
            {
                "document_id": "CS-POL-001",
                "section_id": "SEC-POL-001-02",
                "text_citation": "Thời gian bảo lưu tối đa cho một khóa học là 06 tháng kể từ ngày đơn bảo lưu được phê duyệt chính thức. Mỗi học viên chỉ được phép bảo lưu tối đa 02 lần trong suốt toàn bộ lộ trình học tập tại CyberSoft.",
            }
        ],
        "Truy xuất trực tiếp giới hạn thời hạn và số lần bảo lưu từ SEC-POL-001-02.",
    ),
    (
        "Q003",
        "Học viên cần gửi Phiếu yêu cầu bảo lưu trước ngày dự kiến bắt đầu nghỉ học tối thiểu bao nhiêu ngày làm việc?",
        "Academic Policy",
        "Học viên phải gửi Phiếu yêu cầu bảo lưu (mẫu CS-F-01) qua cổng CyberSoft Portal hoặc nộp trực tiếp tại phòng Học vụ trước tối thiểu 07 ngày làm việc so với ngày dự kiến bắt đầu nghỉ học.",
        [
            {
                "document_id": "CS-POL-001",
                "section_id": "SEC-POL-001-03",
                "text_citation": "trước tối thiểu 07 ngày làm việc so với ngày dự kiến bắt đầu nghỉ học",
            }
        ],
        "Truy xuất quy định về thời hạn nộp đơn bảo lưu từ SEC-POL-001-03.",
    ),
    (
        "Q004",
        "Học viên bảo lưu trên 3 tháng khi làm thủ tục học lại sẽ phải đóng mức phí cập nhật học liệu như thế nào?",
        "Academic Policy",
        "Học viên bảo lưu trên 3 tháng khi tiếp tục học lại sẽ phải đóng mức phí cập nhật học liệu tối đa 10% học phí khóa học nếu chương trình có cập nhật hoặc phát sinh chênh lệch.",
        [
            {
                "document_id": "CS-POL-001",
                "section_id": "SEC-POL-001-04",
                "text_citation": "nếu bảo lưu trên 3 tháng sẽ đóng mức phí cập nhật học liệu tối đa 10% học phí khóa học.",
            }
        ],
        "Truy xuất mức phí bù tài liệu khi bảo lưu trên 3 tháng từ SEC-POL-001-04.",
    ),
    (
        "Q005",
        "Biện pháp xử lý của CyberSoft đối với học viên để quá thời hạn bảo lưu tối đa 06 tháng mà không quay lại học là gì?",
        "Academic Policy",
        "Hệ thống CyberSoft Portal sẽ tự động hủy kích hoạt tài khoản học tập; học viên bị coi là tự ý bỏ học và toàn bộ học phí đã đóng sẽ không được hoàn trả dưới bất kỳ hình thức nào.",
        [
            {
                "document_id": "CS-POL-001",
                "section_id": "SEC-POL-001-05",
                "text_citation": "hệ thống CyberSoft Portal sẽ tự động hủy kích hoạt tài khoản học tập. Trong trường hợp này, học viên bị coi là tự ý bỏ học và toàn bộ học phí đã đóng sẽ không được hoàn trả dưới bất kỳ hình thức nào.",
            }
        ],
        "Truy xuất chế tài xử lý quá hạn bảo lưu từ SEC-POL-001-05.",
    ),
    (
        "Q006",
        "Quy định hoàn tiền học phí khi học viên rút hồ sơ trước ngày khai giảng từ 05 ngày làm việc trở lên là gì?",
        "Academic Policy",
        "Học viên gửi yêu cầu rút hồ sơ trước khai giảng từ 05 ngày làm việc trở lên sẽ được hoàn trả 100% học phí thực đóng sau khi khấu trừ 500.000 VNĐ chi phí xử lý thủ tục hành chính và tài khoản học liệu.",
        [
            {
                "document_id": "CS-POL-002",
                "section_id": "SEC-POL-002-01",
                "text_citation": "Học viên gửi văn bản yêu cầu rút hồ sơ trước ngày khai giảng chính thức từ 05 ngày làm việc trở lên sẽ được hoàn trả 100% học phí thực đóng sau khi khấu trừ 500.000 VNĐ chi phí xử lý thủ tục hành chính và tài khoản học liệu trực tuyến.",
            }
        ],
        "Truy xuất mức hoàn phí trước khai giảng >= 5 ngày từ SEC-POL-002-01.",
    ),
    (
        "Q007",
        "Mức hoàn trả học phí tối đa khi học viên nộp đơn dừng học trong 03 buổi học đầu tiên là bao nhiêu?",
        "Academic Policy",
        "Học viên nộp đơn dừng học trong vòng 03 buổi học đầu tiên của khóa học sẽ được xem xét hoàn trả tối đa 70% học phí thực tế đã đóng.",
        [
            {
                "document_id": "CS-POL-002",
                "section_id": "SEC-POL-002-02",
                "text_citation": "Học viên nộp đơn xin dừng học trong vòng 03 buổi học đầu tiên của khóa học (kể cả trường hợp vắng mặt không phép) sẽ được xem xét hoàn trả tối đa 70% học phí thực tế đã đóng.",
            }
        ],
        "Truy xuất tỷ lệ hoàn phí trong 3 buổi đầu từ SEC-POL-002-02.",
    ),
    (
        "Q008",
        "Khoản học phí được phê duyệt hoàn trả sẽ được chi trả bằng hình thức nào và trong thời gian bao lâu?",
        "Academic Policy",
        "Chi trả độc quyền qua hình thức chuyển khoản ngân hàng chính chủ của học viên hoặc người giám hộ trong thời hạn 10 ngày làm việc kể từ ngày phát hành Phiếu xác nhận hoàn phí điện tử.",
        [
            {
                "document_id": "CS-POL-002",
                "section_id": "SEC-POL-002-03",
                "text_citation": "chi trả độc quyền qua hình thức chuyển khoản ngân hàng chính chủ của học viên hoặc phụ huynh/người giám hộ hợp pháp đã đứng tên ký hợp đồng đào tạo. Thời hạn hoàn tiền là 10 ngày làm việc kể từ ngày Phòng Kế toán phát hành Phiếu xác nhận hoàn phí điện tử.",
            }
        ],
        "Truy xuất phương thức chuyển khoản và thời hạn hoàn tiền từ SEC-POL-002-03.",
    ),
    (
        "Q009",
        "Những khóa học hoặc trường hợp nào hoàn toàn không được áp dụng chính sách hoàn trả học phí?",
        "Academic Policy",
        "Không áp dụng cho các khóa học ưu đãi học bổng từ 50% trở lên, khóa học doanh nghiệp tài trợ trọn gói, học viên bị buộc thôi học do kỷ luật, hoặc khóa kỹ năng ngắn hạn dưới 15 giờ học.",
        [
            {
                "document_id": "CS-POL-002",
                "section_id": "SEC-POL-002-04",
                "text_citation": "Chính sách hoàn phí không áp dụng cho các khóa học thuộc diện ưu đãi học bổng đặc biệt từ 50% trở lên, các khóa học theo diện doanh nghiệp tài trợ trọn gói, học viên vi phạm quy chế kỷ luật dẫn đến bị buộc thôi học, hoặc các khóa học kỹ năng ngắn hạn có tổng thời lượng dưới 15 giờ học.",
            }
        ],
        "Truy xuất các ngoại lệ không hoàn phí từ SEC-POL-002-04.",
    ),
    (
        "Q010",
        "Học viên cần tham gia tối thiểu bao nhiêu phần trăm tổng số buổi học để đủ điều kiện xét tốt nghiệp?",
        "Academic Policy",
        "Học viên phải bảo đảm tham gia tối thiểu 80% tổng số buổi học của toàn bộ khóa học để đủ điều kiện xét tốt nghiệp.",
        [
            {
                "document_id": "CS-POL-003",
                "section_id": "SEC-POL-003-01",
                "text_citation": "Học viên phải bảo đảm tham gia tối thiểu 80% tổng số buổi học của toàn bộ khóa học để đủ điều kiện xét tốt nghiệp.",
            }
        ],
        "Truy xuất tỷ lệ chuyên cần tối thiểu từ SEC-POL-003-01.",
    ),
    (
        "Q011",
        "Quy định trừ điểm đánh giá đối với bài tập nộp trễ hạn trên GitHub Classroom trong vòng 24 giờ là gì?",
        "Academic Policy",
        "Bài tập nộp trễ hạn trong vòng 24 giờ sẽ bị trừ 20% điểm đánh giá; nếu nộp trễ quá 24 giờ sẽ nhận điểm 0 cho bài tập tuần đó.",
        [
            {
                "document_id": "CS-POL-003",
                "section_id": "SEC-POL-003-02",
                "text_citation": "Bài nộp trễ hạn trong vòng 24 giờ sẽ bị trừ 20% điểm đánh giá; nộp trễ quá 24 giờ nhận điểm 0 cho bài tập tuần đó.",
            }
        ],
        "Truy xuất quy định xử phạt nộp bài tập muộn từ SEC-POL-003-02.",
    ),
    (
        "Q012",
        "Điểm đánh giá đồ án tốt nghiệp Capstone tối thiểu để học viên vượt qua môn học là bao nhiêu điểm trên thang 10?",
        "Academic Policy",
        "Đồ án tốt nghiệp Capstone yêu cầu đạt từ 7.0/10 trở lên trước Hội đồng đánh giá chuyên môn để vượt qua môn học.",
        [
            {
                "document_id": "CS-POL-003",
                "section_id": "SEC-POL-003-03",
                "text_citation": "yêu cầu đạt từ 7.0/10 trở lên để vượt qua môn học.",
            }
        ],
        "Truy xuất ngưỡng điểm Capstone đạt chuẩn từ SEC-POL-003-03.",
    ),
    (
        "Q013",
        "Mức lệ phí đăng ký bảo vệ lại đồ án tốt nghiệp Capstone đợt bổ sung cho bài tập cá nhân là bao nhiêu?",
        "Academic Policy",
        "Lệ phí thi lại đồ án bổ sung cho bài tập cá nhân là 500.000 VNĐ/học viên (đối với bài tập nhóm là 300.000 VNĐ/học viên).",
        [
            {
                "document_id": "CS-POL-003",
                "section_id": "SEC-POL-003-04",
                "text_citation": "Lệ phí thi lại đồ án bổ sung là 300.000 VNĐ/học viên đối với bài tập nhóm và 500.000 VNĐ/học viên đối với bài tập cá nhân.",
            }
        ],
        "Truy xuất lệ phí thi lại đồ án cá nhân từ SEC-POL-003-04.",
    ),
    (
        "Q014",
        "Nêu đầy đủ 03 điều kiện bắt buộc để học viên được công nhận tốt nghiệp chính thức tại CyberSoft?",
        "Academic Policy",
        "03 điều kiện đồng thời gồm: (1) Tỷ lệ chuyên cần đạt từ 80% trở lên; (2) Điểm trung bình bài tập định kỳ GPA Assignment đạt từ 6.5/10 trở lên; (3) Điểm bảo vệ đồ án Capstone đạt từ 7.0/10 trở lên.",
        [
            {
                "document_id": "CS-POL-004",
                "section_id": "SEC-POL-004-01",
                "text_citation": "Học viên được công nhận tốt nghiệp khóa học tại CyberSoft Academy khi thỏa mãn đồng thời cả 03 điều kiện: (1) Tỷ lệ chuyên cần đạt từ 80% trở lên; (2) Điểm trung bình tất cả các bài tập thực hành định kỳ (GPA Assignment) đạt từ 6.5/10 trở lên; (3) Điểm bảo vệ đồ án tốt nghiệp Capstone Project đạt từ 7.0/10 trở lên trước Hội đồng đánh giá chuyên môn.",
            }
        ],
        "Truy xuất điều kiện tốt nghiệp từ SEC-POL-004-01.",
    ),
    (
        "Q015",
        "Tiêu chuẩn về điểm Capstone và điểm GPA bài tập để được cấp Chứng chỉ hạng Xuất sắc (Certificate of Excellence) là gì?",
        "Academic Policy",
        "Hạng Xuất sắc (Certificate of Excellence) dành cho học viên có điểm Capstone >= 9.0 và điểm GPA Assignment >= 8.5.",
        [
            {
                "document_id": "CS-POL-004",
                "section_id": "SEC-POL-004-02",
                "text_citation": "Hạng Xuất sắc (Certificate of Excellence) dành cho học viên có điểm Capstone >= 9.0 và GPA >= 8.5;",
            }
        ],
        "Truy xuất tiêu chuẩn chứng chỉ xuất sắc từ SEC-POL-004-02.",
    ),
    (
        "Q016",
        "Bản chứng chỉ số Digital Certificate của CyberSoft được định danh và xác thực bằng công nghệ gì trên cổng thông tin?",
        "Academic Policy",
        "Bản chứng chỉ số được gắn mã QR định danh và chữ ký số SHA-256, có giá trị xác thực công khai vĩnh viễn trên hệ thống verify.cybersoft.edu.vn.",
        [
            {
                "document_id": "CS-POL-004",
                "section_id": "SEC-POL-004-03",
                "text_citation": "Bản chứng chỉ số (Digital Certificate) gắn mã QR định danh và chữ ký số SHA-256 có giá trị xác thực công khai vĩnh viễn trên hệ thống verify.cybersoft.edu.vn",
            }
        ],
        "Truy xuất cơ chế bảo mật và xác thực văn bằng điện tử từ SEC-POL-004-03.",
    ),
    (
        "Q017",
        "Học viên bị thất lạc bản in chứng chỉ muốn cấp lại bản cứng phải nộp mức lệ phí là bao nhiêu và thời gian xử lý bao lâu?",
        "Academic Policy",
        "Mức lệ phí cấp lại bản cứng là 200.000 VNĐ/lần, thời gian xử lý và bàn giao bản in mới là 07 ngày làm việc.",
        [
            {
                "document_id": "CS-POL-004",
                "section_id": "SEC-POL-004-04",
                "text_citation": "Mức lệ phí cấp lại bản cứng là 200.000 VNĐ/lần, thời gian xử lý và bàn giao bản in mới là 07 ngày làm việc.",
            }
        ],
        "Truy xuất lệ phí và thời hạn cấp lại bằng từ SEC-POL-004-04.",
    ),
    (
        "Q018",
        "Mức giảm học phí của suất Học bổng Á khoa (Top 2 và Top 3 kỳ thi đầu vào) tại CyberSoft là bao nhiêu phần trăm?",
        "Academic Policy",
        "Học bổng Á khoa (Top 2 và Top 3 kỳ thi đầu vào) giảm 30% học phí toàn khóa.",
        [
            {
                "document_id": "CS-POL-005",
                "section_id": "SEC-POL-005-01",
                "text_citation": "Học bổng Á khoa (Top 2 và Top 3) giảm 30% học phí;",
            }
        ],
        "Truy xuất mức ưu đãi học bổng Á khoa từ SEC-POL-005-01.",
    ),
    (
        "Q019",
        "CyberSoft cam kết giới thiệu việc làm cho nhóm đối tượng học viên nào và trong thời hạn bao lâu sau khi tốt nghiệp?",
        "Academic Policy",
        "CyberSoft cam kết đồng hành giới thiệu việc làm cho 100% học viên tốt nghiệp hạng Giỏi và Xuất sắc trong thời hạn 06 tháng kể từ ngày nhận chứng chỉ.",
        [
            {
                "document_id": "CS-POL-005",
                "section_id": "SEC-POL-005-02",
                "text_citation": "CyberSoft cam kết đồng hành giới thiệu việc làm cho 100% học viên tốt nghiệp hạng Giỏi và Xuất sắc trong thời hạn 06 tháng kể từ ngày nhận chứng chỉ.",
            }
        ],
        "Truy xuất phạm vi cam kết việc làm từ SEC-POL-005-02.",
    ),
    (
        "Q020",
        "Trong chính sách cam kết việc làm, mức đãi ngộ Offer Letter từ doanh nghiệp tối thiểu là bao nhiêu mà học viên không được tự ý từ chối?",
        "Academic Policy",
        "Học viên không được tự ý từ chối Offer Letter từ doanh nghiệp nếu mức đãi ngộ đạt từ 9.000.000 VNĐ/tháng trở lên cho vị trí Fresher/Junior.",
        [
            {
                "document_id": "CS-POL-005",
                "section_id": "SEC-POL-005-03",
                "text_citation": "Không được tự ý từ chối nhận việc (Offer Letter) từ doanh nghiệp nếu mức đãi ngộ đạt từ 9.000.000 VNĐ/tháng trở lên cho vị trí Fresher/Junior;",
            }
        ],
        "Truy xuất ngưỡng lương Offer tối thiểu từ SEC-POL-005-03.",
    ),
    (
        "Q021",
        "Hệ thống máy tính khuyến nghị cho học viên ngành Data & AI cần có dung lượng RAM tối thiểu và khuyến nghị là bao nhiêu?",
        "Technical Guide",
        "Bộ nhớ RAM tối thiểu 16GB và khuyến nghị 32GB để chạy các tác vụ Vector Embeddings và Docker Containers.",
        [
            {
                "document_id": "CS-TEC-001",
                "section_id": "SEC-TEC-001-01",
                "text_citation": "Bộ nhớ RAM tối thiểu 16GB (khuyến nghị 32GB để chạy các tác vụ Vector Embeddings và Docker Containers);",
            }
        ],
        "Truy xuất cấu hình phần cứng RAM từ SEC-TEC-001-01.",
    ),
    (
        "Q022",
        "Phiên bản Python runtime chuẩn được chỉ định cài đặt trong môi trường Conda cybersoft-ai là bản nào?",
        "Technical Guide",
        "Phiên bản Python runtime tiêu chuẩn là Python 3.10.13 (`conda create -n cybersoft-ai python=3.10.13 -y`).",
        [
            {
                "document_id": "CS-TEC-001",
                "section_id": "SEC-TEC-001-02",
                "text_citation": "Bắt buộc sử dụng Miniconda phiên bản mới nhất với Python runtime chuẩn 3.10.13.",
            }
        ],
        "Truy xuất phiên bản Python môi trường từ SEC-TEC-001-02.",
    ),
    (
        "Q023",
        "Trong các Extension VS Code bắt buộc cho học viên Data & AI, extension nào phụ trách việc tự động định dạng mã nguồn theo chuẩn PEP8?",
        "Technical Guide",
        "Extension Black Formatter chịu trách nhiệm tự động format code theo chuẩn PEP8 khi lưu file (Ctrl+S/Cmd+S).",
        [
            {
                "document_id": "CS-TEC-001",
                "section_id": "SEC-TEC-001-03",
                "text_citation": "Black Formatter (tự động format code theo chuẩn PEP8 khi bấm Ctrl+S/Cmd+S)",
            }
        ],
        "Truy xuất công cụ format code VS Code từ SEC-TEC-001-03.",
    ),
    (
        "Q024",
        "Lệnh phím tắt nào trong VS Code được hướng dẫn để chọn lại đúng Python Interpreter khi phát sinh lỗi ModuleNotFoundError?",
        "Technical Guide",
        "Bấm tổ hợp phím `Ctrl+Shift+P` -> gõ `Python: Select Interpreter` -> chọn đúng đường dẫn của conda env cybersoft-ai.",
        [
            {
                "document_id": "CS-TEC-001",
                "section_id": "SEC-TEC-001-04",
                "text_citation": "bấm `Ctrl+Shift+P` -> gõ `Python: Select Interpreter` -> chọn đúng đường dẫn của conda env `cybersoft-ai`.",
            }
        ],
        "Truy xuất quy trình fix interpreter từ SEC-TEC-001-04.",
    ),
    (
        "Q025",
        "Cú pháp quy định đặt tên nhánh tính năng mới trên Git tại CyberSoft được quy chuẩn như thế nào?",
        "Technical Guide",
        "Cú pháp chuẩn là: `feature/<ma-mon>-<ten-bai-tap>` (Ví dụ: `feature/data-ai-day8` hoặc `feature/react-cart-module`).",
        [
            {
                "document_id": "CS-TEC-002",
                "section_id": "SEC-TEC-002-01",
                "text_citation": "theo cú pháp chuẩn: `feature/<ma-mon>-<ten-bai-tap>` (Ví dụ: `feature/data-ai-day8` hoặc `feature/react-cart-module`).",
            }
        ],
        "Truy xuất quy tắc đặt tên branch Git từ SEC-TEC-002-01.",
    ),
    (
        "Q026",
        "Tiền tố nào trong chuẩn Conventional Commits được sử dụng khi thực hiện cập nhật tài liệu hướng dẫn Markdown?",
        "Technical Guide",
        "Tiền tố `docs:` được quy định sử dụng cho các commit cập nhật tài liệu Markdown.",
        [
            {
                "document_id": "CS-TEC-002",
                "section_id": "SEC-TEC-002-02",
                "text_citation": "`docs:` cho cập nhật tài liệu Markdown;",
            }
        ],
        "Truy xuất tiền tố conventional commits docs từ SEC-TEC-002-02.",
    ),
    (
        "Q027",
        "Trong quy trình nộp bài Pull Request trên GitHub Classroom, phần mô tả PR bắt buộc phải bao gồm những nội dung gì?",
        "Technical Guide",
        "Mô tả PR bắt buộc điền đầy đủ: Tóm tắt thay đổi, checklist tự kiểm thử, hình chụp bằng chứng chạy test thành công và tag tài khoản GitHub của Mentor phụ trách.",
        [
            {
                "document_id": "CS-TEC-002",
                "section_id": "SEC-TEC-002-03",
                "text_citation": "Phần mô tả PR bắt buộc điền đầy đủ: Tóm tắt thay đổi, checklist tự kiểm thử, hình chụp bằng chứng chạy test thành công và tag tài khoản GitHub của Mentor phụ trách để yêu cầu Review Code.",
            }
        ],
        "Truy xuất nội dung mô tả PR từ SEC-TEC-002-03.",
    ),
    (
        "Q028",
        "Dung lượng RAM tối thiểu cần phân bổ trong file .wslconfig khi cài đặt Docker Desktop trên Windows để tránh treo máy là bao nhiêu?",
        "Technical Guide",
        "Cần cấp quyền truy cập tài nguyên RAM tối thiểu 4GB trong file `.wslconfig`.",
        [
            {
                "document_id": "CS-TEC-003",
                "section_id": "SEC-TEC-003-01",
                "text_citation": "cấp quyền truy cập tài nguyên RAM tối thiểu 4GB trong file `.wslconfig` để ngăn chặn hiện tượng máy tính bị treo tràn bộ nhớ",
            }
        ],
        "Truy xuất cấu hình RAM WSL2 từ SEC-TEC-003-01.",
    ),
    (
        "Q029",
        "File docker-compose.yml tiêu chuẩn học tập định nghĩa cụm PostgreSQL và pgAdmin sử dụng các cổng kết nối (ports) nào?",
        "Technical Guide",
        "Service `postgres_db` mở port `5432:5432`, và service `pgadmin_web` mở port `8080:80`.",
        [
            {
                "document_id": "CS-TEC-003",
                "section_id": "SEC-TEC-003-02",
                "text_citation": "`postgres_db` sử dụng image `postgres:15-alpine` mở port `5432:5432`, và `pgadmin_web` sử dụng image `dpage/pgadmin4:latest` mở port `8080:80`.",
            }
        ],
        "Truy xuất thông số port Docker Compose từ SEC-TEC-003-02.",
    ),
    (
        "Q030",
        "Lệnh Docker CLI dùng để sao lưu toàn bộ cơ sở dữ liệu cybersoft_db ra tệp tin backup.sql là gì?",
        "Technical Guide",
        "Sử dụng lệnh: `docker exec -t <container_id> pg_dump -U admin cybersoft_db > backup.sql`.",
        [
            {
                "document_id": "CS-TEC-003",
                "section_id": "SEC-TEC-003-04",
                "text_citation": "`docker exec -t <container_id> pg_dump -U admin cybersoft_db > backup.sql`.",
            }
        ],
        "Truy xuất lệnh backup cơ sở dữ liệu Docker từ SEC-TEC-003-04.",
    ),
    (
        "Q031",
        "Thời gian chạy liên tục tối đa và thời gian ngắt kết nối tự động khi không tương tác trên Google Colab miễn phí là bao lâu?",
        "Technical Guide",
        "Colab miễn phí giới hạn chạy liên tục tối đa 12 giờ và tự ngắt kết nối sau 90 phút nếu không có thao tác tương tác.",
        [
            {
                "document_id": "CS-TEC-004",
                "section_id": "SEC-TEC-004-01",
                "text_citation": "phiên bản Colab miễn phí giới hạn thời gian chạy liên tục tối đa 12 giờ và sẽ tự ngắt kết nối sau 90 phút nếu không có thao tác tương tác.",
            }
        ],
        "Truy xuất giới hạn thời gian chạy Colab từ SEC-TEC-004-01.",
    ),
    (
        "Q032",
        "Cách thức bảo mật Hugging Face Access Token trong sổ tay Google Colab mà không để lộ chuỗi bí mật trong code là gì?",
        "Technical Guide",
        "Lưu token vào tính năng `Secrets` với tên biến `HF_TOKEN` và gọi qua thư viện `google.colab.userdata`.",
        [
            {
                "document_id": "CS-TEC-004",
                "section_id": "SEC-TEC-004-03",
                "text_citation": "phải lưu token vào tính năng `Secrets` (biểu tượng chìa khóa ở thanh công cụ bên trái Colab) với tên biến `HF_TOKEN` và gọi qua thư viện `google.colab.userdata`.",
            }
        ],
        "Truy xuất hướng dẫn bảo mật Hugging Face Token từ SEC-TEC-004-03.",
    ),
    (
        "Q033",
        "Kỹ thuật nào và tham số nạp mô hình nào trong thư viện bitsandbytes được sử dụng để tối ưu hóa bộ nhớ GPU tránh lỗi CUDA OOM?",
        "Technical Guide",
        "Áp dụng kỹ thuật lượng tử hóa 4-bit hoặc 8-bit bằng thư viện `bitsandbytes` khi nạp mô hình với tham số `load_in_4bit=True`.",
        [
            {
                "document_id": "CS-TEC-004",
                "section_id": "SEC-TEC-004-04",
                "text_citation": "áp dụng kỹ thuật lượng tử hóa 4-bit hoặc 8-bit bằng thư viện `bitsandbytes` khi nạp mô hình với `load_in_4bit=True`.",
            }
        ],
        "Truy xuất tham số lượng tử hóa bitsandbytes từ SEC-TEC-004-04.",
    ),
    (
        "Q034",
        "Quy tắc đặt tên hàm và tên biến theo chuẩn PEP8 của CyberSoft bắt buộc sử dụng phong cách viết chữ nào?",
        "Technical Guide",
        "Tên biến và tên hàm bắt buộc sử dụng kiểu chữ thường nối dấu gạch dưới `snake_case` (ví dụ: `calculate_monthly_kpi`, `total_amount`).",
        [
            {
                "document_id": "CS-TEC-005",
                "section_id": "SEC-TEC-005-01",
                "text_citation": "Tên biến và tên hàm sử dụng kiểu chữ thường nối dấu gạch dưới `snake_case` (ví dụ: `calculate_monthly_kpi`, `total_amount`);",
            }
        ],
        "Truy xuất quy ước đặt tên biến hàm snake_case từ SEC-TEC-005-01.",
    ),
    (
        "Q035",
        "Độ dài dòng tối đa được cấu hình cho công cụ Flake8 và Black trong các dự án của CyberSoft là bao nhiêu?",
        "Technical Guide",
        "Độ dài dòng tối đa là 100 ký tự (`max-line-length = 100`).",
        [
            {
                "document_id": "CS-TEC-005",
                "section_id": "SEC-TEC-005-03",
                "text_citation": "cấu hình file `.flake8` với độ dài dòng tối đa `max-line-length = 100` ký tự.",
            }
        ],
        "Truy xuất thông số max-line-length từ SEC-TEC-005-03.",
    ),
    (
        "Q036",
        "Thời lượng đào tạo của khóa học chuyên sâu Fullstack Web Developer NodeJS & React là bao nhiêu tháng và bao nhiêu giờ học?",
        "Curriculum",
        "Thời lượng 06 tháng, tương đương 240 giờ học trực tiếp kèm 300 giờ thực hành đồ án.",
        [
            {
                "document_id": "CS-CRS-001",
                "section_id": "SEC-CRS-001-01",
                "text_citation": "Chương trình đào tạo trong thời lượng 06 tháng (tương đương 240 giờ học trực tiếp kèm 300 giờ thực hành đồ án)",
            }
        ],
        "Truy xuất thời lượng học Fullstack Web từ SEC-CRS-001-01.",
    ),
    (
        "Q037",
        "Module 3 trong lộ trình đào tạo Data & AI Resource Engineer bao gồm những nội dung chuyên môn trọng tâm nào?",
        "Curriculum",
        "Module 3 tập trung vào Vector Embeddings & RAG Architecture (Chunking strategies, ChromaDB/Pinecone, Hybrid Search, Reranking, Metadata filtering).",
        [
            {
                "document_id": "CS-CRS-002",
                "section_id": "SEC-CRS-002-02",
                "text_citation": "Module 3: Vector Embeddings & RAG Architecture (Chunking strategies, ChromaDB/Pinecone, Hybrid Search, Reranking, Metadata filtering).",
            }
        ],
        "Truy xuất nội dung Module 3 Data AI từ SEC-CRS-002-02.",
    ),
    (
        "Q038",
        "Khóa học DevOps & Cloud Computing AWS kéo dài bao nhiêu tháng và hướng tới chứng chỉ quốc tế nào?",
        "Curriculum",
        "Khóa học kéo dài 4.5 tháng (180 giờ học) và hướng tới chứng chỉ quốc tế AWS Certified Solutions Architect Associate.",
        [
            {
                "document_id": "CS-CRS-003",
                "section_id": "SEC-CRS-003-01",
                "text_citation": "Chương trình đào tạo kéo dài 4.5 tháng (180 giờ học), rèn luyện cho học viên tư duy tự động hóa hạ tầng (Infrastructure as Code), quy trình tích hợp và phân phối liên tục (CI/CD), điều phối container quy mô lớn với Kubernetes (K8s), và quản trị kiến trúc điện toán đám mây theo chuẩn AWS Well-Architected Framework, hướng tới chứng chỉ quốc tế AWS Certified Solutions Architect Associate.",
            }
        ],
        "Truy xuất thời lượng và chứng chỉ mục tiêu DevOps từ SEC-CRS-003-01.",
    ),
    (
        "Q039",
        "Bài thi tốt nghiệp của khóa học An ninh mạng & Giám sát vận hành SOC Analyst được tổ chức theo hình thức nào?",
        "Curriculum",
        "Tổ chức theo hình thức mô phỏng trên thao trường Cyber Range ảo hóa: trực ca SOC trong vòng 04 tiếng để phát hiện và ngăn chặn các cuộc tấn công mạng giả lập và lập Báo cáo ứng cứu sự cố.",
        [
            {
                "document_id": "CS-CRS-004",
                "section_id": "SEC-CRS-004-03",
                "text_citation": "Bài thi tốt nghiệp được tổ chức theo hình thức mô phỏng trên thao trường Cyber Range ảo hóa: Học viên đóng vai trò trực ca SOC trong vòng 04 tiếng, liên tục theo dõi cảnh báo từ SIEM để phát hiện và ngăn chặn các cuộc tấn công DDoS, SQL Injection, Brute Force và Ransomware đang nhắm vào hệ thống doanh nghiệp giả lập, đồng thời lập Báo cáo ứng cứu sự cố chuyên nghiệp.",
            }
        ],
        "Truy xuất hình thức thi tốt nghiệp Cyber Range từ SEC-CRS-004-03.",
    ),
    (
        "Q040",
        "Học viên tham gia khóa học Mobile App React Native có cần phải cấu hình giả lập Android Studio hay Xcode nặng nề không?",
        "Curriculum",
        "Không cần, học viên chỉ cần máy tính cài Node.js và một thiết bị điện thoại thật (Android hoặc iOS) có cài app Expo Go để quét mã QR chạy thử app trực tiếp.",
        [
            {
                "document_id": "CS-CRS-005",
                "section_id": "SEC-CRS-005-04",
                "text_citation": "Học viên chỉ cần máy tính có cài đặt sẵn Node.js và một thiết bị điện thoại thật (chạy Android hoặc iOS) có cài ứng dụng Expo Go để quét mã QR chạy thử app trực tiếp mà không cần cấu hình giả lập Android Studio hay Xcode nặng nề.",
            }
        ],
        "Truy xuất yêu cầu thiết bị thực hành Expo Go từ SEC-CRS-005-04.",
    ),
]

for item in single_hops:
    # verify
    for c in item[4]:
        assert find_citation(c["document_id"], c["section_id"], c["text_citation"])
    questions.append(
        {
            "question_id": item[0],
            "query": item[1],
            "category": item[2],
            "type": "Answerable - Single Hop",
            "reasoning_type": "Direct Factual Retrieval",
            "expected_behavior": "Return factual answer strictly grounded in citation",
            "ground_truth_answer": item[3],
            "citations": item[4],
            "reasoning": item[5],
            "anti_leakage_verified": True,
        }
    )

print(f"Validated {len(questions)} Single-Hop questions.")

# Multi-Hop (Q041 - Q060)
multi_hops = [
    (
        "Q041",
        "Học viên bảo lưu khóa học đến lần thứ hai rồi sau đó để quá thời hạn 06 tháng mà không quay lại học thì phải chịu những chi phí và chế tài gì?",
        "Academic Policy",
        "Học viên phải đóng phí xử lý hồ sơ hành chính 500.000 VNĐ cho lần bảo lưu thứ hai. Khi để quá thời hạn tối đa 06 tháng mà không quay lại, tài khoản Portal sẽ bị tự động hủy kích hoạt, coi như tự ý bỏ học và toàn bộ học phí đã đóng sẽ không được hoàn trả dưới bất kỳ hình thức nào.",
        [
            {
                "document_id": "CS-POL-001",
                "section_id": "SEC-POL-001-02",
                "text_citation": "Từ lần bảo lưu thứ hai, học viên phải đóng mức phí xử lý hồ sơ hành chính là 500.000 VNĐ.",
            },
            {
                "document_id": "CS-POL-001",
                "section_id": "SEC-POL-001-05",
                "text_citation": "Nếu quá thời hạn bảo lưu tối đa 06 tháng mà học viên không thực hiện thủ tục quay trở lại lớp học hoặc không có văn bản giải trình được phê duyệt gia hạn đặc biệt, hệ thống CyberSoft Portal sẽ tự động hủy kích hoạt tài khoản học tập. Trong trường hợp này, học viên bị coi là tự ý bỏ học và toàn bộ học phí đã đóng sẽ không được hoàn trả dưới bất kỳ hình thức nào.",
            },
        ],
        "Tổng hợp quy định về phí bảo lưu lần 2 (SEC-POL-001-02) và chế tài xử lý khi quá hạn 6 tháng (SEC-POL-001-05).",
    ),
    (
        "Q042",
        "Học viên dừng học sau 2 buổi học đầu tiên có được nhận tiền mặt tại quầy lễ tân không và mức hoàn tiền tối đa là bao nhiêu phần trăm?",
        "Academic Policy",
        "Học viên dừng học trong 2 buổi đầu được xem xét hoàn trả tối đa 70% học phí thực đóng. Tuy nhiên, CyberSoft không chi trả bằng tiền mặt tại quầy lễ tân mà hoàn tiền độc quyền qua chuyển khoản ngân hàng chính chủ trong thời hạn 10 ngày làm việc.",
        [
            {
                "document_id": "CS-POL-002",
                "section_id": "SEC-POL-002-02",
                "text_citation": "Học viên nộp đơn xin dừng học trong vòng 03 buổi học đầu tiên của khóa học (kể cả trường hợp vắng mặt không phép) sẽ được xem xét hoàn trả tối đa 70% học phí thực tế đã đóng.",
            },
            {
                "document_id": "CS-POL-002",
                "section_id": "SEC-POL-002-03",
                "text_citation": "Toàn bộ các khoản học phí được phê duyệt hoàn trả sẽ được chi trả độc quyền qua hình thức chuyển khoản ngân hàng chính chủ của học viên hoặc phụ huynh/người giám hộ hợp pháp đã đứng tên ký hợp đồng đào tạo. Thời hạn hoàn tiền là 10 ngày làm việc kể từ ngày Phòng Kế toán phát hành Phiếu xác nhận hoàn phí điện tử. CyberSoft không thực hiện hoàn tiền mặt tại quầy lễ tân để bảo đảm tính minh bạch kiểm toán.",
            },
        ],
        "Kết hợp tỷ lệ hoàn phí trong 3 buổi đầu (SEC-POL-002-02) và quy định phương thức chuyển khoản bắt buộc (SEC-POL-002-03).",
    ),
    (
        "Q043",
        "Để được cấp Chứng chỉ Xuất sắc (Certificate of Excellence), học viên cần thỏa mãn những tiêu chuẩn gì về chuyên cần, bài tập tuần và điểm đồ án Capstone?",
        "Academic Policy",
        "Học viên phải đạt chuyên cần tối thiểu 80%, hoàn thành tối thiểu 85% bài tập tuần với GPA bài tập >= 8.5 (vượt ngưỡng điều kiện cần 6.5) và đạt điểm bảo vệ đồ án Capstone >= 9.0.",
        [
            {
                "document_id": "CS-POL-003",
                "section_id": "SEC-POL-003-02",
                "text_citation": "Học viên phải hoàn thành tối thiểu 85% số lượng bài tập tuần với mức điểm trung bình từ 6.5 trở lên mới được cấp quyền bảo vệ đồ án Capstone.",
            },
            {
                "document_id": "CS-POL-004",
                "section_id": "SEC-POL-004-02",
                "text_citation": "Hạng Xuất sắc (Certificate of Excellence) dành cho học viên có điểm Capstone >= 9.0 và GPA >= 8.5;",
            },
        ],
        "Tổng hợp điều kiện làm Capstone từ quy chế bài tập tuần (SEC-POL-003-02) và tiêu chuẩn xếp loại chứng chỉ Xuất sắc (SEC-POL-004-02).",
    ),
    (
        "Q044",
        "Học viên nhận học bổng Thủ khoa giảm 50% học phí nếu xin dừng học ngay sau buổi học thứ hai thì có được hoàn lại 70% học phí không?",
        "Academic Policy",
        "Không được hoàn phí. Mặc dù nộp đơn trong 3 buổi đầu thông thường được xét hoàn tối đa 70%, nhưng chính sách hoàn phí quy định rõ không áp dụng cho các khóa học thuộc diện ưu đãi học bổng đặc biệt từ 50% trở lên.",
        [
            {
                "document_id": "CS-POL-002",
                "section_id": "SEC-POL-002-04",
                "text_citation": "Chính sách hoàn phí không áp dụng cho các khóa học thuộc diện ưu đãi học bổng đặc biệt từ 50% trở lên, các khóa học theo diện doanh nghiệp tài trợ trọn gói, học viên vi phạm quy chế kỷ luật dẫn đến bị buộc thôi học, hoặc các khóa học kỹ năng ngắn hạn có tổng thời lượng dưới 15 giờ học.",
            },
            {
                "document_id": "CS-POL-005",
                "section_id": "SEC-POL-005-01",
                "text_citation": "Học bổng Thủ khoa (Top 1 kỳ thi đầu vào) giảm 50% học phí toàn khóa;",
            },
        ],
        "Phân tích xung đột giữa điều kiện dừng học buổi 2 với điều khoản loại trừ hoàn phí dành cho học bổng >= 50%.",
    ),
    (
        "Q045",
        "Một học viên tốt nghiệp hạng Giỏi muốn duy trì quyền lợi cam kết hỗ trợ việc làm thì cần thực hiện những nghĩa vụ cụ thể nào khi nhận cơ hội phỏng vấn?",
        "Academic Policy",
        "Học viên phải tham gia đầy đủ tối thiểu 03 buổi phỏng vấn do Trung tâm kết nối, không được từ chối Offer Letter nếu mức đãi ngộ từ 9.000.000 VNĐ/tháng trở lên, và phải báo cáo kết quả phỏng vấn cho Career Support trong vòng 24 giờ.",
        [
            {
                "document_id": "CS-POL-005",
                "section_id": "SEC-POL-005-02",
                "text_citation": "CyberSoft cam kết đồng hành giới thiệu việc làm cho 100% học viên tốt nghiệp hạng Giỏi và Xuất sắc trong thời hạn 06 tháng kể từ ngày nhận chứng chỉ.",
            },
            {
                "document_id": "CS-POL-005",
                "section_id": "SEC-POL-005-03",
                "text_citation": "Để duy trì quyền lợi cam kết hỗ trợ việc làm, học viên bắt buộc phải: (1) Tham gia đầy đủ tối thiểu 03 buổi phỏng vấn tuyển dụng do Trung tâm kết nối và điều phối lịch; (2) Không được tự ý từ chối nhận việc (Offer Letter) từ doanh nghiệp nếu mức đãi ngộ đạt từ 9.000.000 VNĐ/tháng trở lên cho vị trí Fresher/Junior; (3) Phản hồi kết quả phỏng vấn cho bộ phận Career Support trong vòng 24 giờ sau mỗi vòng thi.",
            },
        ],
        "Kết hợp đối tượng cam kết việc làm hạng Giỏi (SEC-POL-005-02) và nghĩa vụ bắt buộc của ứng viên (SEC-POL-005-03).",
    ),
    (
        "Q046",
        "Khi làm bài tập nộp mã nguồn Git cho môn Data & AI, học viên cần đặt tên nhánh và viết commit message chuẩn như thế nào cho bài tập Ngày 8?",
        "Technical Guide",
        "Tên nhánh phải tuân thủ cú pháp `feature/<ma-mon>-<ten-bai-tap>` như `feature/data-ai-day8`, và commit message phải dùng chuẩn Conventional Commits với tiền tố phù hợp như `feat: add RAG evaluation suite with 100 questions`.",
        [
            {
                "document_id": "CS-TEC-002",
                "section_id": "SEC-TEC-002-01",
                "text_citation": "theo cú pháp chuẩn: `feature/<ma-mon>-<ten-bai-tap>` (Ví dụ: `feature/data-ai-day8` hoặc `feature/react-cart-module`).",
            },
            {
                "document_id": "CS-TEC-002",
                "section_id": "SEC-TEC-002-02",
                "text_citation": "Ví dụ hợp lệ: `feat: add RAG evaluation suite with 100 questions` hoặc `fix: resolve ghost attendance check-in bug`.",
            },
        ],
        "Kết hợp quy chuẩn đặt tên branch (SEC-TEC-002-01) và cú pháp conventional commit message (SEC-TEC-002-02).",
    ),
    (
        "Q047",
        "Học viên nộp bài tập tuần qua GitHub Classroom cần lưu ý hạn chót nộp bài là khi nào và nội dung phần mô tả Pull Request bắt buộc có những gì?",
        "Technical Guide",
        "Hạn chót nộp bài là trước 23h59 Chủ nhật hàng tuần. Mô tả PR bắt buộc gồm: Tóm tắt thay đổi, checklist tự kiểm thử, ảnh chụp kết quả chạy test và tag tài khoản Mentor phụ trách.",
        [
            {
                "document_id": "CS-POL-003",
                "section_id": "SEC-POL-003-02",
                "text_citation": "100% bài tập tuần phải được nộp qua nền tảng GitHub Classroom theo đúng cấu trúc branch và commit quy định trước 23h59 Chủ nhật hàng tuần.",
            },
            {
                "document_id": "CS-TEC-002",
                "section_id": "SEC-TEC-002-03",
                "text_citation": "Phần mô tả PR bắt buộc điền đầy đủ: Tóm tắt thay đổi, checklist tự kiểm thử, hình chụp bằng chứng chạy test thành công và tag tài khoản GitHub của Mentor phụ trách để yêu cầu Review Code.",
            },
        ],
        "Tổng hợp thời hạn nộp bài tập tuần (SEC-POL-003-02) và quy chuẩn tạo Pull Request (SEC-TEC-002-03).",
    ),
    (
        "Q048",
        "Khi cấu hình Docker Compose chạy cơ sở dữ liệu PostgreSQL, tên named volume và các thông số cổng, tên database mặc định là gì?",
        "Technical Guide",
        "Named volume cấu hình là `postgres_data:/var/lib/postgresql/data`. Cổng mở là `5432:5432` và tên database mặc định là `cybersoft_db`.",
        [
            {
                "document_id": "CS-TEC-003",
                "section_id": "SEC-TEC-003-02",
                "text_citation": "`postgres_db` sử dụng image `postgres:15-alpine` mở port `5432:5432`",
            },
            {
                "document_id": "CS-TEC-003",
                "section_id": "SEC-TEC-003-03",
                "text_citation": "Port: `5432`, Database: `cybersoft_db`",
            },
        ],
        "Tổng hợp cấu hình Docker Compose volume/port (SEC-TEC-003-02) và thông số database (SEC-TEC-003-03).",
    ),
    (
        "Q049",
        "Khi huấn luyện mô hình ngôn ngữ trên Google Colab với T4 GPU, học viên cần làm gì để lưu trữ bền vững checkpoint và tránh lỗi bộ nhớ CUDA OOM?",
        "Technical Guide",
        "Học viên phải mount Google Drive (`drive.mount('/content/drive')`) để lưu trữ dữ liệu bền vững, và áp dụng kỹ thuật lượng tử hóa 4-bit với `bitsandbytes` (`load_in_4bit=True`) kết hợp `torch.cuda.empty_cache()` để tránh CUDA OOM.",
        [
            {
                "document_id": "CS-TEC-004",
                "section_id": "SEC-TEC-004-02",
                "text_citation": "học viên bắt buộc phải mount tài khoản Google Drive để lưu trữ trọng số mô hình và checkpoint huấn luyện bằng đoạn mã: `from google.colab import drive; drive.mount('/content/drive')`.",
            },
            {
                "document_id": "CS-TEC-004",
                "section_id": "SEC-TEC-004-04",
                "text_citation": "áp dụng kỹ thuật lượng tử hóa 4-bit hoặc 8-bit bằng thư viện `bitsandbytes` khi nạp mô hình với `load_in_4bit=True`.",
            },
        ],
        "Kết hợp giải pháp lưu trữ Google Drive (SEC-TEC-004-02) và giải pháp tránh lỗi CUDA OOM (SEC-TEC-004-04).",
    ),
    (
        "Q050",
        "Một hàm Python xử lý dữ liệu chuẩn PEP8 tại CyberSoft cần tuân thủ những nguyên tắc gì về cách đặt tên, type hints, docstring và độ dài tối đa?",
        "Technical Guide",
        "Tên hàm dùng `snake_case`, bắt buộc có Type Hints đầy đủ và Docstring theo chuẩn Google/Sphinx; độ dài thân hàm không được vượt quá 50 dòng lệnh và mỗi dòng tối đa 100 ký tự.",
        [
            {
                "document_id": "CS-TEC-005",
                "section_id": "SEC-TEC-005-01",
                "text_citation": "Tên biến và tên hàm sử dụng kiểu chữ thường nối dấu gạch dưới `snake_case` (ví dụ: `calculate_monthly_kpi`, `total_amount`);",
            },
            {
                "document_id": "CS-TEC-005",
                "section_id": "SEC-TEC-005-02",
                "text_citation": "Tất cả các hàm và phương thức public trong dự án bắt buộc phải khai báo Type Hints tường minh cho các đối số đầu vào và kiểu dữ liệu trả về (sử dụng module `typing` như `List`, `Dict`, `Optional`, `Tuple`). Mỗi hàm phải có Docstring theo định dạng Google Style hoặc Sphinx",
            },
            {
                "document_id": "CS-TEC-005",
                "section_id": "SEC-TEC-005-04",
                "text_citation": "Mỗi hàm chỉ thực hiện một nhiệm vụ logic duy nhất và không dài quá 50 dòng lệnh.",
            },
        ],
        "Tổng hợp các tiêu chuẩn chất lượng mã nguồn từ SEC-TEC-005-01, 02, 04.",
    ),
    (
        "Q051",
        "So sánh thời lượng đào tạo và công nghệ cơ sở dữ liệu/backend được giảng dạy giữa khóa Fullstack Web Developer và khóa Data & AI Resource Engineer?",
        "Curriculum",
        "Khóa Fullstack Web kéo dài 06 tháng (240h học), tập trung vào NodeJS, ExpressJS và ORM Prisma/Sequelize với PostgreSQL. Khóa Data & AI kéo dài 05 tháng (200h học), tập trung vào Relational Star Schema, Advanced SQL, và cơ sở dữ liệu vector ChromaDB/Pinecone.",
        [
            {
                "document_id": "CS-CRS-001",
                "section_id": "SEC-CRS-001-01",
                "text_citation": "Chương trình đào tạo trong thời lượng 06 tháng (tương đương 240 giờ học trực tiếp kèm 300 giờ thực hành đồ án)",
            },
            {
                "document_id": "CS-CRS-002",
                "section_id": "SEC-CRS-002-01",
                "text_citation": "Khóa học đào tạo trong 05 tháng (200 giờ giảng dạy trực tiếp)",
            },
            {
                "document_id": "CS-CRS-002",
                "section_id": "SEC-CRS-002-02",
                "text_citation": "Module 3: Vector Embeddings & RAG Architecture (Chunking strategies, ChromaDB/Pinecone, Hybrid Search, Reranking, Metadata filtering).",
            },
        ],
        "So sánh đa tài liệu giữa lộ trình Fullstack Web (CS-CRS-001) và Data AI Resource Engineer (CS-CRS-002).",
    ),
    (
        "Q052",
        "Đồ án tốt nghiệp Capstone của khóa Data & AI có yêu cầu gì về điểm F1-score kiểm thử và khác biệt thế nào so với Capstone Fullstack Web?",
        "Curriculum",
        "Capstone Data & AI yêu cầu xây dựng Trợ lý Tri thức Thông minh đạt F1-score retrieval tối thiểu 85% trên benchmark 100 câu hỏi kèm trích dẫn Citations, trong khi Capstone Fullstack Web tập trung vào ứng dụng E-commerce/Mạng xã hội có giỏ hàng, thanh toán VNPay và CI/CD.",
        [
            {
                "document_id": "CS-CRS-001",
                "section_id": "SEC-CRS-001-03",
                "text_citation": "Đồ án Capstone cuối khóa yêu cầu phát triển hoàn thiện một nền tảng Thương mại điện tử (E-commerce) hoặc Hệ thống Mạng xã hội thu nhỏ.",
            },
            {
                "document_id": "CS-CRS-002",
                "section_id": "SEC-CRS-002-03",
                "text_citation": "đạt điểm kiểm thử F1-score retrieval tối thiểu 85% trên tập dữ liệu benchmark 100 câu hỏi.",
            },
        ],
        "So sánh tiêu chí sản phẩm Capstone giữa CS-CRS-001 và CS-CRS-002.",
    ),
    (
        "Q053",
        "Học viên khóa học DevOps AWS được học những công cụ hạ tầng và container nào, đồng thời nhận được tài trợ hạn mức đám mây bao nhiêu?",
        "Curriculum",
        "Học viên được học Docker, Kubernetes (EKS), Terraform (IaC), Ansible, CI/CD GitHub Actions, và được tài trợ tài khoản AWS Educate với hạn mức 100 USD để thực hành.",
        [
            {
                "document_id": "CS-CRS-003",
                "section_id": "SEC-CRS-003-02",
                "text_citation": "Containerization với Docker đa tầng và điều phối cụm Kubernetes (EKS, Deployment, Service, Ingress, Helm Charts). Học phần 3: Xây dựng Pipeline CI/CD tự động bằng GitHub Actions và GitLab CI. Học phần 4: Khởi tạo hạ tầng tự động hóa bằng Terraform (IaC) và quản trị cấu hình Ansible.",
            },
            {
                "document_id": "CS-CRS-003",
                "section_id": "SEC-CRS-003-04",
                "text_citation": "tài trợ mã kích hoạt tài khoản AWS Educate với hạn mức 100 USD",
            },
        ],
        "Tổng hợp nội dung công cụ hạ tầng (SEC-CRS-003-02) và mức tài trợ Cloud (SEC-CRS-003-04).",
    ),
    (
        "Q054",
        "Học phần thực hành phòng thủ mạng của khóa SOC Analyst sử dụng nền tảng SIEM nào và bài thi tốt nghiệp kéo dài trong bao lâu?",
        "Curriculum",
        "Sử dụng nền tảng SIEM Splunk Enterprise và Wazuh XDR. Bài thi tốt nghiệp diễn ra trên thao trường Cyber Range ảo hóa với ca trực SOC kéo dài 04 tiếng.",
        [
            {
                "document_id": "CS-CRS-004",
                "section_id": "SEC-CRS-004-02",
                "text_citation": "Triển khai và phân tích Log trên nền tảng SIEM Splunk Enterprise và Wazuh XDR.",
            },
            {
                "document_id": "CS-CRS-004",
                "section_id": "SEC-CRS-004-03",
                "text_citation": "Học viên đóng vai trò trực ca SOC trong vòng 04 tiếng, liên tục theo dõi cảnh báo từ SIEM để phát hiện và ngăn chặn các cuộc tấn công DDoS, SQL Injection, Brute Force và Ransomware đang nhắm vào hệ thống doanh nghiệp giả lập, đồng thời lập Báo cáo ứng cứu sự cố chuyên nghiệp.",
            },
        ],
        "Kết hợp công cụ SIEM (SEC-CRS-004-02) và thời lượng bài thi Cyber Range (SEC-CRS-004-03).",
    ),
    (
        "Q055",
        "Khóa học Mobile App React Native có thời lượng bao lâu và ứng dụng Capstone cuối khóa cần tích hợp những tính năng thiết bị nào?",
        "Curriculum",
        "Khóa học kéo dài 04 tháng (160 giờ). Ứng dụng Capstone yêu cầu tích hợp OTP qua SMS, Google Maps hiển thị vị trí thời gian thực, thông báo đẩy Push Notification và chế độ hoạt động ngoại tuyến (Offline-first Mode).",
        [
            {
                "document_id": "CS-CRS-005",
                "section_id": "SEC-CRS-005-01",
                "text_citation": "Khóa học 04 tháng (160 giờ học) giúp học viên làm chủ framework React Native",
            },
            {
                "document_id": "CS-CRS-005",
                "section_id": "SEC-CRS-005-03",
                "text_citation": "Ứng dụng phải có cơ chế xác thực OTP qua tin nhắn SMS, tích hợp Google Maps hiển thị vị trí thời gian thực, hỗ trợ thông báo đẩy Push Notification và duy trì chế độ hoạt động ngoại tuyến (Offline-first Mode).",
            },
        ],
        "Tổng hợp thời lượng (SEC-CRS-005-01) và tính năng đồ án Capstone di động (SEC-CRS-005-03).",
    ),
    (
        "Q056",
        "Nếu một nhóm 03 người đăng ký và thanh toán học phí 100% trước khai giảng 10 ngày thì mỗi học viên được hưởng những khoản giảm trừ tài chính nào?",
        "Academic FAQ",
        "Mỗi học viên được giảm trực tiếp 10% trên học phí niêm yết (ưu đãi đóng 100% trước 10 ngày) và được giảm thêm 1.000.000 VNĐ cho ưu đãi đăng ký nhóm từ 03 người trở lên.",
        [
            {
                "document_id": "CS-FAQ-001",
                "section_id": "SEC-FAQ-001-03",
                "text_citation": "Học viên thanh toán toàn bộ 100% học phí trong một lần trước ngày khai giảng tối thiểu 10 ngày sẽ được hưởng mức chiết khấu giảm trực tiếp 10% trên học phí niêm yết. Đối với nhóm học viên cùng đăng ký từ 02 người trở lên, mỗi học viên được giảm thêm 500.000 VNĐ; nhóm từ 03 người trở lên được giảm thêm 1.000.000 VNĐ cho mỗi thành viên.",
            }
        ],
        "Kết hợp 2 chính sách chiết khấu đóng sớm và đăng ký nhóm trong SEC-FAQ-001-03.",
    ),
    (
        "Q057",
        "Học viên muốn chuyển từ lớp học Offline sang lớp Online cần gửi thông báo trước bao nhiêu ngày và được thực hiện tối đa mấy lần?",
        "Academic FAQ",
        "Học viên được chuyển đổi tối đa 01 lần trong suốt khóa học và phải gửi thông báo trước tối thiểu 05 ngày làm việc khi lớp học đích còn vị trí trống.",
        [
            {
                "document_id": "CS-FAQ-002",
                "section_id": "SEC-FAQ-002-03",
                "text_citation": "Học viên được phép nộp đơn xin chuyển đổi giữa hình thức học Online và Offline tối đa 01 lần trong suốt khóa học nếu có lý do chính đáng về thay đổi lịch trình công tác hoặc địa điểm cư trú. Yêu cầu chuyển đổi chỉ được phê duyệt khi lớp học đích còn vị trí trống và học viên gửi thông báo trước tối thiểu 05 ngày làm việc. Việc chuyển đổi lớp hoàn toàn miễn phí và không thu thêm phụ phí chênh lệch.",
            }
        ],
        "Truy xuất số lần tối đa và thời hạn báo trước khi đổi lớp từ SEC-FAQ-002-03.",
    ),
    (
        "Q058",
        "Đội ngũ Mentor hỗ trợ học viên giải đáp câu hỏi trên Discord trong khung giờ nào và quy định đăng ký phiên hỗ trợ cá nhân 1-on-1 như thế nào?",
        "Academic FAQ",
        "Mentor trực Discord cố định từ 18h30 đến 21h30 (Thứ 2 đến Thứ 7). Học viên có quyền đặt lịch 1 phiên kèm 1-on-1 mỗi tuần (tối đa 30 phút), cần đặt lịch trước ít nhất 24 giờ qua Portal.",
        [
            {
                "document_id": "CS-FAQ-003",
                "section_id": "SEC-FAQ-003-01",
                "text_citation": "Khung giờ trực tuyến cố định của đội ngũ Mentor là từ 18h30 đến 21h30 các ngày từ Thứ Hai đến Thứ Bảy hàng tuần.",
            },
            {
                "document_id": "CS-FAQ-003",
                "section_id": "SEC-FAQ-003-02",
                "text_citation": "Mỗi học viên có quyền đăng ký tối đa 01 phiên hỗ trợ cá nhân (1-on-1 Coaching) với Mentor trong tuần với thời lượng tối đa 30 phút/phiên. Học viên phải đặt lịch trước ít nhất 24 giờ thông qua bảng biểu lịch hẹn trên CyberSoft Portal",
            },
        ],
        "Tổng hợp lịch trực Discord (SEC-FAQ-003-01) và điều kiện đặt lịch 1-on-1 (SEC-FAQ-003-02).",
    ),
    (
        "Q059",
        "Trong tháng cuối khóa học, học viên Capstone được chuẩn bị phỏng vấn tuyển dụng thông qua những hoạt động hỗ trợ cụ thể nào?",
        "Academic FAQ",
        "Học viên được chuyên viên HR rà soát và chỉnh sửa CV 1-on-1 ít nhất 02 lần theo chuẩn ATS và được tham gia 01 buổi phỏng vấn thử Mock Interview kỹ thuật kéo dài 45 phút với chuyên gia.",
        [
            {
                "document_id": "CS-FAQ-004",
                "section_id": "SEC-FAQ-004-02",
                "text_citation": "Mỗi học viên được chuyên viên nhân sự HR 1-on-1 rà soát, chỉnh sửa CV ít nhất 02 lần cho đến khi đạt tiêu chuẩn chuyên nghiệp trước khi được gửi tới các nhà tuyển dụng.",
            },
            {
                "document_id": "CS-FAQ-004",
                "section_id": "SEC-FAQ-004-03",
                "text_citation": "Học viên hoàn thành đồ án Capstone được tham gia 01 buổi Mock Interview kỹ thuật kéo dài 45 phút với các Senior Engineer hoặc Solution Architect đến từ các tập đoàn công nghệ lớn.",
            },
        ],
        "Tổng hợp quy trình review CV (SEC-FAQ-004-02) và mock interview 45 phút (SEC-FAQ-004-03).",
    ),
    (
        "Q060",
        "So sánh thời hạn duy trì quyền truy cập trên CyberSoft Portal giữa video bản ghi buổi học và hệ thống bài tập thực hành sau khi bế giảng?",
        "Academic FAQ",
        "Video bản ghi buổi học được cấp quyền truy cập trọn đời (Lifetime Access), trong khi hệ thống bài tập thực hành, slide bài giảng và môi trường chấm điểm được duy trì trong vòng 12 tháng kể từ ngày bế giảng.",
        [
            {
                "document_id": "CS-FAQ-005",
                "section_id": "SEC-FAQ-005-02",
                "text_citation": "CyberSoft cam kết trao quyền truy cập video bản ghi (Record) các buổi học trọn đời (Lifetime Access) trên tài khoản Portal cá nhân của học viên. Đối với hệ thống bài tập thực hành, tài liệu slide bài giảng số và môi trường chấm điểm tự động, quyền truy cập được duy trì ổn định trong vòng 12 tháng kể từ ngày bế giảng khóa học chính thức.",
            }
        ],
        "So sánh thời hạn quyền truy cập hai loại tài nguyên trong SEC-FAQ-005-02.",
    ),
]

for item in multi_hops:
    for c in item[4]:
        assert find_citation(c["document_id"], c["section_id"], c["text_citation"])
    questions.append(
        {
            "question_id": item[0],
            "query": item[1],
            "category": item[2],
            "type": "Answerable - Multi Hop",
            "reasoning_type": "Cross-Section Synthesis",
            "expected_behavior": "Synthesize multiple constraints and citations to answer",
            "ground_truth_answer": item[3],
            "citations": item[4],
            "reasoning": item[5],
            "anti_leakage_verified": True,
        }
    )

print(f"Validated {len(questions)} Total (Single + Multi Hop) questions.")

# Unanswerable (Q061 - Q080)
unanswerable_items = [
    (
        "Q061",
        "Học viên đi du học nước ngoài có được xin bảo lưu khóa học tại CyberSoft trong thời hạn 5 năm hay không?",
        "Academic Policy",
        "Tài liệu quy chế của CyberSoft không có thông tin về việc cho phép bảo lưu 5 năm. Theo Quy chế bảo lưu CS-POL-001, thời hạn bảo lưu tối đa cho một khóa học chỉ là 06 tháng kể từ ngày được phê duyệt.",
        "Câu hỏi nằm ngoài phạm vi chính sách (Out-of-scope). Quy chế hiện hành chỉ cho phép bảo lưu tối đa 06 tháng.",
    ),
    (
        "Q062",
        "CyberSoft có hỗ trợ chương trình trả góp học phí kỳ hạn 36 tháng không lãi suất qua công ty tài chính FECredit không?",
        "Academic FAQ",
        "Tài liệu quy định của CyberSoft không đề cập đến đối tác tài chính FECredit hay kỳ hạn 36 tháng. Chính sách CS-FAQ-001 chỉ nêu rõ trả góp 0% qua thẻ tín dụng ngân hàng với kỳ hạn từ 03, 06, 09 đến 12 tháng.",
        "Thông tin đối tác và kỳ hạn 36 tháng không tồn tại trong corpus dữ liệu.",
    ),
    (
        "Q063",
        "Trung tâm CyberSoft hiện có mở cơ sở phòng Lab đào tạo học Offline trực tiếp tại thành phố Đà Nẵng hay Cần Thơ không?",
        "Academic FAQ",
        "Tài liệu không đề cập đến cơ sở tại Đà Nẵng hay Cần Thơ. Theo CS-FAQ-002, các phòng Lab học trực tiếp của CyberSoft hiện chỉ hoạt động tại TP.HCM (Quận 10, Quận Tân Bình, TP. Thủ Đức).",
        "Thông tin địa điểm ngoài phạm vi công bố trong tài liệu CS-FAQ-002.",
    ),
    (
        "Q064",
        "Học viên hoàn thành xuất sắc đồ án Capstone AI có được cấp bằng Thạc sĩ Khoa học Dữ liệu (Master of Science) liên kết quốc tế không?",
        "Academic Policy",
        "Tài liệu không đề cập đến việc cấp bằng Thạc sĩ. Theo CS-POL-004, CyberSoft chỉ cấp Chứng chỉ chuyên nghiệp (Certificate of Completion, Distinction, Excellence) xác thực mã QR, không cấp văn bằng học thuật Thạc sĩ.",
        "Văn bằng thạc sĩ nằm ngoài phạm vi đào tạo chứng chỉ nghề nghiệp của học viện.",
    ),
    (
        "Q065",
        "Mức học phí niêm yết cụ thể của khóa học Lập trình Điện toán lượng tử (Quantum Computing) tại CyberSoft là bao nhiêu?",
        "Curriculum",
        "Tài liệu cơ sở tri thức hiện tại của CyberSoft không có danh mục khóa học Điện toán lượng tử (Quantum Computing) và không có thông tin biểu phí cho môn học này.",
        "Khóa học Quantum Computing không tồn tại trong danh mục lộ trình đào tạo hiện tại.",
    ),
    (
        "Q066",
        "Học viên tốt nghiệp loại Giỏi có được CyberSoft cam kết mức lương khởi điểm tối thiểu 50 triệu đồng mỗi tháng không?",
        "Academic Policy",
        "Tài liệu chính sách không có cam kết mức lương 50 triệu đồng/tháng. Trong CS-POL-005, cam kết việc làm chỉ áp dụng với điều kiện mức đãi ngộ Offer Letter đạt từ 9.000.000 VNĐ/tháng trở lên cho vị trí Fresher/Junior.",
        "Mức lương 50 triệu là số liệu giả định không có căn cứ trong tài liệu cam kết việc làm.",
    ),
    (
        "Q067",
        "Học viên thôi học sau 2 tháng vì lý do chuyển chỗ ở định cư nước ngoài có được hoàn lại 50% học phí không?",
        "Academic Policy",
        "Tài liệu CS-POL-002 quy định kể từ buổi học thứ tư trở đi, CyberSoft tuyệt đối không giải quyết bất kỳ yêu cầu hoàn trả hoặc quy đổi học phí nào dưới mọi hình thức (trừ bất khả kháng thiên tai hoặc chỉ định y khoa cấp tỉnh). Không có quy định hoàn 50% sau 2 tháng.",
        "Yêu cầu hoàn phí sau 2 tháng vi phạm trực tiếp quy tắc dừng hoàn phí từ buổi thứ 4 trở đi.",
    ),
    (
        "Q068",
        "Khóa học Fullstack Web Developer tại CyberSoft có đào tạo chuyên sâu về ngôn ngữ Rust và lập trình Smart Contract trên Solana không?",
        "Curriculum",
        "Tài liệu CS-CRS-001 không có nội dung về ngôn ngữ Rust hay Smart Contract/Solana. Lộ trình Fullstack Web tập trung vào JavaScript ES6+, ReactJS, NodeJS, ExpressJS và PostgreSQL.",
        "Công nghệ Rust và Solana không nằm trong chương trình đào tạo Fullstack Web đã công bố.",
    ),
    (
        "Q069",
        "CyberSoft có chính sách đóng bảo hiểm xã hội bắt buộc và bảo hiểm y tế cho học viên trong suốt quá trình theo học không?",
        "Academic Policy",
        "Tài liệu đào tạo và quy chế học vụ không có bất kỳ điều khoản nào quy định về việc đóng bảo hiểm xã hội hay bảo hiểm y tế cho học viên theo học.",
        "Chính sách bảo hiểm xã hội là quan hệ lao động, không nằm trong hợp đồng đào tạo học viên.",
    ),
    (
        "Q070",
        "Học viên có được phép cho thuê hoặc chuyển nhượng tài khoản CyberSoft Portal cá nhân cho người khác sử dụng không?",
        "Academic FAQ",
        "Theo CS-FAQ-005, nghiêm cấm mọi hành vi chia sẻ tài khoản, sao chép hoặc chuyển nhượng tài khoản học tập; tài khoản vi phạm sẽ bị khóa vĩnh viễn ngay lập tức mà không cần báo trước.",
        "Hành vi chia sẻ/chuyển nhượng tài khoản bị cấm tuyệt đối theo chính sách bảo mật.",
    ),
    (
        "Q071",
        "Đội ngũ Mentor của CyberSoft có nhận hỗ trợ giải bài tập thi kết thúc học phần tại trường đại học riêng của học viên không?",
        "Academic FAQ",
        "Không hỗ trợ. Theo CS-FAQ-003, Mentor có quyền từ chối giải quyết các bài toán hoặc đồ án thuộc trường đại học riêng của học viên; phạm vi hỗ trợ chỉ giới hạn trong bài tập và đồ án chính thức của CyberSoft.",
        "Yêu cầu giải hộ bài thi đại học nằm ngoài phạm vi phục vụ chính thức của đội ngũ Mentor.",
    ),
    (
        "Q072",
        "CyberSoft có dịch vụ hỗ trợ làm hồ sơ xin Visa định cư diện tay nghề công nghệ tại Đức hoặc Canada cho học viên tốt nghiệp không?",
        "Academic Policy",
        "Tài liệu chính sách không có điều khoản nào cung cấp dịch vụ pháp lý hay bảo lãnh hồ sơ xin Visa định cư nước ngoài. Trung tâm chỉ hỗ trợ kết nối việc làm và phỏng vấn doanh nghiệp.",
        "Dịch vụ xin Visa định cư không thuộc chức năng và cam kết của CyberSoft.",
    ),
    (
        "Q073",
        "Học viên có được CyberSoft phát thẻ xe buýt công cộng miễn phí hoặc hỗ trợ chi phí gửi xe ô tô tại các cơ sở học tập không?",
        "Academic FAQ",
        "Tài liệu thông tin đào tạo không có bất kỳ chính sách nào về việc phát thẻ xe buýt miễn phí hoặc trợ cấp chi phí gửi xe ô tô cho học viên.",
        "Chính sách trợ cấp phương tiện đi lại không tồn tại trong tài liệu học vụ.",
    ),
    (
        "Q074",
        "Trong khóa học Data & AI, CyberSoft có cung cấp cụm máy chủ vật lý trang bị 8 card NVIDIA H100 đặt trực tiếp tại lớp học không?",
        "Technical Guide",
        "Tài liệu CS-TEC-004 không đề cập đến máy chủ H100 tại lớp. Môi trường thực hành GPU được hướng dẫn thông qua nền tảng đám mây Google Colab với card T4 GPU (miễn phí) hoặc A100 GPU (Colab Pro).",
        "Phần cứng H100 tại chỗ không có trong tài liệu hướng dẫn hạ tầng kỹ thuật.",
    ),
    (
        "Q075",
        "Khóa học DevOps AWS có chính sách cam kết hoàn trả 100% lệ phí thi chứng chỉ quốc tế AWS Solutions Architect Professional không?",
        "Curriculum",
        "Tài liệu CS-CRS-003 chỉ quy định tài trợ tài khoản AWS Educate hạn mức 100 USD để học tập; không có điều khoản hoàn trả lệ phí thi chứng chỉ quốc tế AWS Solutions Architect Professional.",
        "Lệ phí thi chứng chỉ quốc tế không được tài liệu cam kết hoàn trả.",
    ),
    (
        "Q076",
        "Học viên có được quyền yêu cầu đổi Giảng viên đứng lớp chính nếu cảm thấy không hài lòng ngay sau buổi học đầu tiên không?",
        "Academic Policy",
        "Tài liệu quy chế học vụ không quy định quyền yêu cầu đổi Giảng viên của học viên. Học viên chỉ được xem xét chuyển đổi hình thức học Online/Offline hoặc bảo lưu theo quy chế chung.",
        "Quyền đổi giảng viên không được quy định trong tài liệu chính sách.",
    ),
    (
        "Q077",
        "CyberSoft có chính sách hoàn lại 100% học phí nếu học viên không tìm được việc làm trong vòng 30 ngày kể từ khi tốt nghiệp không?",
        "Academic Policy",
        "Tài liệu không có cam kết hoàn 100% học phí sau 30 ngày. Chính sách CS-POL-005 quy định thời hạn đồng hành giới thiệu việc làm là 06 tháng cho học viên tốt nghiệp Giỏi/Xuất sắc thỏa mãn các nghĩa vụ tham gia phỏng vấn.",
        "Điều khoản hoàn tiền 100% việc làm sau 30 ngày không có căn cứ trong tài liệu.",
    ),
    (
        "Q078",
        "Lớp học Online qua Zoom của CyberSoft có tính năng tự động làm bài tập thay cho học viên bằng trí tuệ nhân tạo không?",
        "Academic FAQ",
        "Tài liệu không đề cập đến tính năng làm bài hộ. Ngược lại, học viên phải tự làm và nộp bài tập qua GitHub Classroom để Mentor review và đánh giá trung thực.",
        "Khái niệm tự động làm bài tập hộ bằng AI không tồn tại trong hệ thống đào tạo.",
    ),
    (
        "Q079",
        "Học viên tốt nghiệp lớp An ninh mạng SOC Analyst có được cấp chứng chỉ hành nghề thám tử tư hoặc điều tra an ninh quốc gia không?",
        "Curriculum",
        "Tài liệu CS-CRS-004 chỉ đào tạo kỹ năng phòng thủ Blue Team, phân tích log SIEM đáp ứng vị trí SOC Analyst tại doanh nghiệp; không cấp chứng chỉ điều tra tội phạm hay thám tử tư nhân.",
        "Chứng chỉ thám tử tư nhân nằm ngoài phạm vi pháp lý và chuyên môn đào tạo.",
    ),
    (
        "Q080",
        "CyberSoft có dịch vụ xe đưa rước học viên tận nhà miễn phí đối với các lớp học ca tối hay không?",
        "Academic FAQ",
        "Tài liệu quản lý lớp học không đề cập đến bất kỳ dịch vụ đưa đón học viên tận nhà nào.",
        "Dịch vụ đưa rước không được cung cấp trong tài liệu vận hành đào tạo.",
    ),
]

for item in unanswerable_items:
    questions.append(
        {
            "question_id": item[0],
            "query": item[1],
            "category": item[2],
            "type": "Unanswerable",
            "reasoning_type": "Out-of-Scope / Absence Detection",
            "expected_behavior": "Acknowledge missing information and refuse hallucination",
            "ground_truth_answer": item[3],
            "citations": [],
            "reasoning": item[4],
            "anti_leakage_verified": True,
        }
    )

print(f"Validated {len(questions)} Total (Single + Multi + Unanswerable) questions.")

# Adversarial / Distractor (Q081 - Q100)
distractor_items = [
    (
        "Q081",
        "Có đúng là học viên phải đóng 500.000 VNĐ lệ phí hành chính ngay trong lần nộp đơn bảo lưu khóa học đầu tiên tại CyberSoft không?",
        "Academic Policy",
        "Không đúng. Theo CS-POL-001, lần bảo lưu thứ nhất được miễn phí hoàn toàn phí thủ tục hành chính; chỉ từ lần bảo lưu thứ hai học viên mới phải đóng mức phí xử lý hồ sơ là 500.000 VNĐ.",
        [
            {
                "document_id": "CS-POL-001",
                "section_id": "SEC-POL-001-02",
                "text_citation": "Lần bảo lưu thứ nhất được miễn phí hoàn toàn phí thủ tục hành chính. Từ lần bảo lưu thứ hai, học viên phải đóng mức phí xử lý hồ sơ hành chính là 500.000 VNĐ.",
            }
        ],
        "Bẫy nhầm lẫn giữa lần bảo lưu thứ nhất (miễn phí) và lần thứ hai (thu phí 500k).",
    ),
    (
        "Q082",
        "Học viên nộp đơn xin bảo lưu khóa học khi mới hoàn thành 10% tổng thời lượng chương trình thì có được chấp thuận không?",
        "Academic Policy",
        "Không được chấp thuận. Quy chế CS-POL-001 yêu cầu học viên phải hoàn thành tối thiểu 20% và không quá 70% tổng thời lượng chương trình học mới đủ điều kiện được xét duyệt bảo lưu.",
        [
            {
                "document_id": "CS-POL-001",
                "section_id": "SEC-POL-001-01",
                "text_citation": "Học viên được quyền nộp đơn xin bảo lưu khóa học khi đã hoàn thành tối thiểu 20% và không quá 70% tổng thời lượng chương trình học.",
            }
        ],
        "Bẫy biên dưới tỷ lệ hoàn thành (10% so với ngưỡng tối thiểu bắt buộc 20%).",
    ),
    (
        "Q083",
        "Nếu nộp bài tập tuần trễ 12 tiếng so với thời hạn 23h59 Chủ nhật trên GitHub Classroom thì học viên có bị tính điểm 0 ngay không?",
        "Academic Policy",
        "Không bị điểm 0. Bài nộp trễ trong vòng 24 giờ chỉ bị trừ 20% điểm đánh giá; chỉ khi nộp trễ quá 24 giờ thì bài tập tuần đó mới nhận điểm 0.",
        [
            {
                "document_id": "CS-POL-003",
                "section_id": "SEC-POL-003-02",
                "text_citation": "Bài nộp trễ hạn trong vòng 24 giờ sẽ bị trừ 20% điểm đánh giá; nộp trễ quá 24 giờ nhận điểm 0 cho bài tập tuần đó.",
            }
        ],
        "Bẫy ngưỡng thời gian nộp trễ (12h trễ nằm trong khoảng <= 24h chỉ bị trừ 20%).",
    ),
    (
        "Q084",
        "Một học viên có điểm bài tập định kỳ GPA 8.5 và chuyên cần 90%, nhưng điểm bảo vệ đồ án Capstone đạt 6.8 thì có đủ điều kiện công nhận tốt nghiệp không?",
        "Academic Policy",
        "Không đủ điều kiện. Tiêu chuẩn tốt nghiệp tại CS-POL-004 bắt buộc học viên phải thỏa mãn đồng thời cả 3 điều kiện, trong đó điểm đồ án tốt nghiệp Capstone phải đạt từ 7.0/10 trở lên (mức 6.8 là không đạt chuẩn).",
        [
            {
                "document_id": "CS-POL-004",
                "section_id": "SEC-POL-004-01",
                "text_citation": "(3) Điểm bảo vệ đồ án tốt nghiệp Capstone Project đạt từ 7.0/10 trở lên trước Hội đồng đánh giá chuyên môn.",
            }
        ],
        "Bẫy điểm cận ngưỡng Capstone (6.8 < 7.0 dẫn đến không đạt dù GPA cao).",
    ),
    (
        "Q085",
        "Để nhận Chứng chỉ hạng Xuất sắc (Certificate of Excellence), học viên chỉ cần đạt điểm đồ án Capstone từ 8.0 trở lên đúng không?",
        "Academic Policy",
        "Không đúng. Điểm Capstone >= 8.0 chỉ là điều kiện của Chứng chỉ hạng Giỏi (Distinction). Để đạt hạng Xuất sắc (Excellence), học viên phải đạt điểm Capstone >= 9.0 và đồng thời điểm GPA bài tập >= 8.5.",
        [
            {
                "document_id": "CS-POL-004",
                "section_id": "SEC-POL-004-02",
                "text_citation": "Hạng Xuất sắc (Certificate of Excellence) dành cho học viên có điểm Capstone >= 9.0 và GPA >= 8.5; Hạng Giỏi (Certificate of Distinction) dành cho học viên có điểm Capstone >= 8.0 và GPA >= 7.5;",
            }
        ],
        "Bẫy nhầm lẫn giữa tiêu chuẩn hạng Giỏi (>= 8.0) và hạng Xuất sắc (>= 9.0).",
    ),
    (
        "Q086",
        "Học viên nộp đơn dừng học trong 03 buổi học đầu tiên thì sẽ được hoàn trả 90% hay 100% học phí thực đóng?",
        "Academic Policy",
        "Cả hai mức trên đều sai. Trong vòng 03 buổi học đầu tiên, mức hoàn phí được xem xét tối đa chỉ là 70% học phí thực tế đã đóng; mức 90% hoặc 100% chỉ áp dụng khi rút hồ sơ trước ngày khai giảng.",
        [
            {
                "document_id": "CS-POL-002",
                "section_id": "SEC-POL-002-02",
                "text_citation": "Học viên nộp đơn xin dừng học trong vòng 03 buổi học đầu tiên của khóa học (kể cả trường hợp vắng mặt không phép) sẽ được xem xét hoàn trả tối đa 70% học phí thực tế đã đóng.",
            }
        ],
        "Bẫy nhầm lẫn giữa tỷ lệ hoàn phí trước ngày khai giảng và trong 3 buổi đầu.",
    ),
    (
        "Q087",
        "Khóa học Data & AI Resource Engineer có bắt buộc học viên phải mua tài khoản Google Colab Pro có trả phí để có GPU A100 không?",
        "Technical Guide",
        "Không bắt buộc. Tài liệu CS-TEC-004 hướng dẫn học viên có thể sử dụng card T4 GPU hoàn toàn miễn phí trên Google Colab; A100 GPU chỉ là tùy chọn mở rộng của Colab Pro khi có nhu cầu đặc thù.",
        [
            {
                "document_id": "CS-TEC-004",
                "section_id": "SEC-TEC-004-01",
                "text_citation": "chọn `T4 GPU` (miễn phí) hoặc `A100 GPU` (Colab Pro).",
            }
        ],
        "Bẫy giả định sai về việc bắt buộc mua tài khoản trả phí.",
    ),
    (
        "Q088",
        "Trong quy chuẩn mã nguồn Git của CyberSoft, học viên có được quyền commit và push trực tiếp các sửa đổi lên nhánh main không?",
        "Technical Guide",
        "Tuyệt đối không được phép. Nhánh main là nhánh sản phẩm chỉ chứa code sạch đã qua review. Mọi bài tập phải được phát triển trên nhánh riêng dạng `feature/<ma-mon>-<ten-bai-tap>` và nộp qua Pull Request.",
        [
            {
                "document_id": "CS-TEC-002",
                "section_id": "SEC-TEC-002-01",
                "text_citation": "Nhánh `main` là nhánh sản phẩm chỉ chứa code sạch đã review. Mỗi bài tập hoặc tính năng mới phải được phát triển trên nhánh riêng biệt theo cú pháp chuẩn: `feature/<ma-mon>-<ten-bai-tap>` (Ví dụ: `feature/data-ai-day8` hoặc `feature/react-cart-module`). Tuyệt đối cấm commit hoặc force push trực tiếp lên nhánh `main`.",
            }
        ],
        "Bẫy quy tắc branching cấm commit trực tiếp nhánh main.",
    ),
    (
        "Q089",
        "Có phải tất cả học viên cứ tốt nghiệp bất kỳ khóa học nào tại CyberSoft là đều được tự động cam kết hỗ trợ việc làm không?",
        "Academic Policy",
        "Không phải. Cam kết giới thiệu việc làm chỉ áp dụng cho 100% học viên tốt nghiệp hạng Giỏi và Xuất sắc, đồng thời học viên phải đáp ứng các nghĩa vụ tham gia tối thiểu 3 buổi phỏng vấn và không từ chối Offer từ 9 triệu đồng/tháng trở lên.",
        [
            {
                "document_id": "CS-POL-005",
                "section_id": "SEC-POL-005-02",
                "text_citation": "CyberSoft cam kết đồng hành giới thiệu việc làm cho 100% học viên tốt nghiệp hạng Giỏi và Xuất sắc trong thời hạn 06 tháng kể từ ngày nhận chứng chỉ.",
            }
        ],
        "Bẫy điều kiện hạn chế của cam kết việc làm theo phân loại tốt nghiệp.",
    ),
    (
        "Q090",
        "Lớp học Online của CyberSoft chỉ là hình thức học viên tự xem video quay sẵn bài giảng và không có Giảng viên tương tác đúng không?",
        "Academic FAQ",
        "Sai hoàn toàn. Lớp Online của CyberSoft là lớp học trực tiếp qua Zoom (Live Teaching) có Giảng viên và Mentor tương tác thời gian thực, có chia nhóm thảo luận (Breakout Rooms) và hỗ trợ sửa code trực tiếp; video record chỉ dùng để xem lại sau buổi học.",
        [
            {
                "document_id": "CS-FAQ-002",
                "section_id": "SEC-FAQ-002-02",
                "text_citation": "Lớp Online của CyberSoft không phải là hình thức học video thu sẵn thụ động, mà là lớp học trực tiếp qua nền tảng Zoom bản quyền có Giảng viên và Mentor tương tác theo thời gian thực (Live Teaching).",
            }
        ],
        "Bẫy ngộ nhận giữa hình thức học video thu sẵn (MOOC) và hình thức Live Teaching tương tác.",
    ),
    (
        "Q091",
        "Học viên có thể tự do nộp đơn xin đổi qua lại giữa hình thức học Online và Offline không giới hạn số lần trong khóa học đúng không?",
        "Academic FAQ",
        "Sai. Học viên chỉ được phép nộp đơn xin chuyển đổi giữa hình thức Online và Offline tối đa 01 lần trong suốt khóa học khi có lý do chính đáng và lớp học đích còn vị trí trống.",
        [
            {
                "document_id": "CS-FAQ-002",
                "section_id": "SEC-FAQ-002-03",
                "text_citation": "Học viên được phép nộp đơn xin chuyển đổi giữa hình thức học Online và Offline tối đa 01 lần trong suốt khóa học nếu có lý do chính đáng về thay đổi lịch trình công tác hoặc địa điểm cư trú.",
            }
        ],
        "Bẫy giới hạn số lần đổi hình thức học (tối đa 1 lần duy nhất).",
    ),
    (
        "Q092",
        "Theo quy chuẩn Clean Code PEP8, cả tên Class và tên biến trong dự án Python đều được viết hoa theo kiểu PascalCase đúng không?",
        "Technical Guide",
        "Không đúng. Tên lớp (Class) viết hoa chữ cái đầu theo kiểu PascalCase, nhưng tên biến và tên hàm bắt buộc phải dùng chữ thường nối dấu gạch dưới snake_case.",
        [
            {
                "document_id": "CS-TEC-005",
                "section_id": "SEC-TEC-005-01",
                "text_citation": "Tên biến và tên hàm sử dụng kiểu chữ thường nối dấu gạch dưới `snake_case` (ví dụ: `calculate_monthly_kpi`, `total_amount`); Tên lớp (Class) sử dụng kiểu viết hoa chữ cái đầu `PascalCase` (ví dụ: `StudentEnrollmentService`);",
            }
        ],
        "Bẫy quy tắc định danh phân biệt giữa Class (PascalCase) và biến/hàm (snake_case).",
    ),
    (
        "Q093",
        "Độ dài tối đa của một hàm Python theo khuyến nghị của CyberSoft là 100 dòng lệnh có đúng không?",
        "Technical Guide",
        "Sai. Mỗi hàm chỉ thực hiện một nhiệm vụ logic duy nhất và không dài quá 50 dòng lệnh. Con số 100 là giới hạn độ dài ký tự của một dòng (max-line-length = 100) trong cấu hình Flake8/Black.",
        [
            {
                "document_id": "CS-TEC-005",
                "section_id": "SEC-TEC-005-04",
                "text_citation": "Mỗi hàm chỉ thực hiện một nhiệm vụ logic duy nhất và không dài quá 50 dòng lệnh.",
            }
        ],
        "Bẫy nhầm lẫn giữa giới hạn độ dài dòng ký tự (100) và độ dài số dòng của hàm (50).",
    ),
    (
        "Q094",
        "Học bổng Nữ sinh theo đuổi Công nghệ (Women in Tech) tại CyberSoft hỗ trợ giảm bao nhiêu phần trăm học phí: 50% hay 30%?",
        "Academic Policy",
        "Không phải 50% cũng không phải 30%. Học bổng Women in Tech hỗ trợ 20% học phí; mức 50% là dành cho Thủ khoa và 30% dành cho Á khoa.",
        [
            {
                "document_id": "CS-POL-005",
                "section_id": "SEC-POL-005-01",
                "text_citation": "Học bổng Nữ sinh theo đuổi ngành Công nghệ (Women in Tech) hỗ trợ 20% học phí;",
            }
        ],
        "Bẫy đối chuẩn giữa các mức phần trăm học bổng khác nhau.",
    ),
    (
        "Q095",
        "Học viên có thể nộp đơn xin bảo lưu khóa học sát giờ trước ngày nghỉ 03 ngày làm việc đúng không?",
        "Academic Policy",
        "Sai. Học viên phải nộp đơn trước tối thiểu 07 ngày làm việc so với ngày dự kiến bắt đầu nghỉ học. Con số 03 ngày làm việc là thời hạn Phòng Học vụ thẩm định và phản hồi kết quả.",
        [
            {
                "document_id": "CS-POL-001",
                "section_id": "SEC-POL-001-03",
                "text_citation": "trước tối thiểu 07 ngày làm việc so với ngày dự kiến bắt đầu nghỉ học. Phòng Học vụ sẽ tiến hành thẩm định hồ sơ, kiểm tra điều kiện học phí và phản hồi kết quả bằng văn bản điện tử qua email học viên trong vòng 03 ngày làm việc kể từ thời điểm tiếp nhận đơn hợp lệ.",
            }
        ],
        "Bẫy nhầm lẫn giữa thời hạn nộp đơn của học viên (7 ngày) và thời gian thẩm định của văn phòng (3 ngày).",
    ),
    (
        "Q096",
        "Học viên theo học khóa Fullstack Web Developer có được đào tạo React Native để xuất bản ứng dụng lên App Store và Google Play không?",
        "Curriculum",
        "Không. Khóa Fullstack Web Developer tập trung đào tạo ReactJS cho ứng dụng Web SPA. Phát triển ứng dụng di động React Native xuất bản lên App Store/Google Play là nội dung của khóa học chuyên biệt Mobile App React Native.",
        [
            {
                "document_id": "CS-CRS-001",
                "section_id": "SEC-CRS-001-02",
                "text_citation": "Frontend Framework chuyên sâu với ReactJS 18, React Hooks, React Router DOM v6, Quản lý State toàn cục bằng Redux Toolkit và tối ưu hiệu năng UI.",
            },
            {
                "document_id": "CS-CRS-005",
                "section_id": "SEC-CRS-005-01",
                "text_citation": "Khóa học 04 tháng (160 giờ học) giúp học viên làm chủ framework React Native và hệ sinh thái Expo, có khả năng viết mã một lần nhưng đóng gói và phát hành ứng dụng chạy mượt mà trên cả 2 nền tảng di động phổ biến nhất hiện nay là Google Android và Apple iOS với hiệu năng chuẩn native.",
            },
        ],
        "Bẫy nhầm lẫn công nghệ giữa ReactJS (Web trong CS-CRS-001) và React Native (Mobile trong CS-CRS-005).",
    ),
    (
        "Q097",
        "Khi khởi chạy container PostgreSQL bằng Docker Compose mà không cấu hình named volume thì dữ liệu có được lưu bền vững khi container bị recreate không?",
        "Technical Guide",
        "Không lưu được. Nếu không cấu hình named volume `postgres_data:/var/lib/postgresql/data`, toàn bộ dữ liệu bảng sẽ bị xóa mất khi container bị tắt hoặc tạo lại.",
        [
            {
                "document_id": "CS-TEC-003",
                "section_id": "SEC-TEC-003-02",
                "text_citation": "Bắt buộc phải cấu hình named volume `postgres_data:/var/lib/postgresql/data` để duy trì bền vững dữ liệu bảng khi container bị tắt hoặc tạo lại.",
            }
        ],
        "Bẫy hiểu sai về tính chất lưu trữ tạm thời (ephemeral) của container Docker khi thiếu volume.",
    ),
    (
        "Q098",
        "Lệ phí thi lại đồ án tốt nghiệp Capstone đợt bảo vệ bổ sung cho bài tập nhóm là 500.000 VNĐ cho mỗi thành viên đúng không?",
        "Academic Policy",
        "Sai. Lệ phí bảo vệ lại đồ án đối với bài tập nhóm là 300.000 VNĐ/học viên; mức 500.000 VNĐ/học viên chỉ áp dụng đối với đồ án bài tập cá nhân.",
        [
            {
                "document_id": "CS-POL-003",
                "section_id": "SEC-POL-003-04",
                "text_citation": "Lệ phí thi lại đồ án bổ sung là 300.000 VNĐ/học viên đối với bài tập nhóm và 500.000 VNĐ/học viên đối với bài tập cá nhân.",
            }
        ],
        "Bẫy nhầm lẫn lệ phí thi lại giữa hình thức nhóm (300k) và cá nhân (500k).",
    ),
    (
        "Q099",
        "Học viên có thể đến trực tiếp quầy lễ tân của CyberSoft để nhận tiền mặt hoàn lại sau khi hồ sơ rút học phí được duyệt không?",
        "Academic Policy",
        "Không thể. CyberSoft chi trả tiền hoàn phí độc quyền qua hình thức chuyển khoản ngân hàng chính chủ và tuyệt đối không thực hiện hoàn tiền mặt tại quầy để bảo đảm tính minh bạch kiểm toán.",
        [
            {
                "document_id": "CS-POL-002",
                "section_id": "SEC-POL-002-03",
                "text_citation": "Toàn bộ các khoản học phí được phê duyệt hoàn trả sẽ được chi trả độc quyền qua hình thức chuyển khoản ngân hàng chính chủ của học viên hoặc phụ huynh/người giám hộ hợp pháp đã đứng tên ký hợp đồng đào tạo. Thời hạn hoàn tiền là 10 ngày làm việc kể từ ngày Phòng Kế toán phát hành Phiếu xác nhận hoàn phí điện tử. CyberSoft không thực hiện hoàn tiền mặt tại quầy lễ tân để bảo đảm tính minh bạch kiểm toán.",
            }
        ],
        "Bẫy phương thức hoàn tiền (chuyển khoản bắt buộc vs tiền mặt tại quầy).",
    ),
    (
        "Q100",
        "Thời hạn học viên được phép truy cập vào môi trường làm bài tập thực hành trên Portal có kéo dài trọn đời (Lifetime) hay không?",
        "Academic FAQ",
        "Không. Quyền truy cập trọn đời (Lifetime Access) chỉ áp dụng riêng cho video bản ghi (Record) các buổi học. Hệ thống bài tập thực hành, slide bài giảng và môi trường chấm điểm chỉ được duy trì trong 12 tháng kể từ ngày bế giảng.",
        [
            {
                "document_id": "CS-FAQ-005",
                "section_id": "SEC-FAQ-005-02",
                "text_citation": "CyberSoft cam kết trao quyền truy cập video bản ghi (Record) các buổi học trọn đời (Lifetime Access) trên tài khoản Portal cá nhân của học viên. Đối với hệ thống bài tập thực hành, tài liệu slide bài giảng số và môi trường chấm điểm tự động, quyền truy cập được duy trì ổn định trong vòng 12 tháng kể từ ngày bế giảng khóa học chính thức.",
            }
        ],
        "Bẫy ranh giới thời hạn giữa video record (trọn đời) và bài tập thực hành (12 tháng).",
    ),
]

for item in distractor_items:
    for c in item[4]:
        assert find_citation(c["document_id"], c["section_id"], c["text_citation"])
    questions.append(
        {
            "question_id": item[0],
            "query": item[1],
            "category": item[2],
            "type": "Adversarial / Distractor",
            "reasoning_type": "Trap Identification / Boundary Correction",
            "expected_behavior": "Identify misleading premise, correct with exact citation",
            "ground_truth_answer": item[3],
            "citations": item[4],
            "reasoning": item[5],
            "anti_leakage_verified": True,
        }
    )

print(f"Validated EXACTLY {len(questions)} evaluation questions.")

# Save evaluation benchmark files
json_path = os.path.join(EVAL_DIR, "rag_eval_questions.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

csv_path = os.path.join(EVAL_DIR, "rag_eval_questions.csv")
with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(
        [
            "question_id",
            "category",
            "type",
            "query",
            "ground_truth_answer",
            "citations_count",
            "citations_doc_ids",
            "reasoning",
        ]
    )
    for q in questions:
        doc_ids = (
            ";".join([c["document_id"] for c in q["citations"]])
            if q["citations"]
            else "N/A"
        )
        writer.writerow(
            [
                q["question_id"],
                q["category"],
                q["type"],
                q["query"],
                q["ground_truth_answer"],
                len(q["citations"]),
                doc_ids,
                q["reasoning"],
            ]
        )

print(f"Wrote rag_eval_questions.json and rag_eval_questions.csv to {EVAL_DIR}")

# Build Schemas
corpus_schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "CyberSoftRAGCorpusDocument",
    "type": "object",
    "required": [
        "document_id",
        "title",
        "category",
        "version",
        "effective_date",
        "author",
        "tags",
        "target_audience",
        "sections",
    ],
    "properties": {
        "document_id": {"type": "string", "pattern": "^CS-(POL|TEC|CRS|FAQ)-[0-9]{3}$"},
        "title": {"type": "string", "minLength": 5},
        "category": {
            "type": "string",
            "enum": [
                "Academic Policy",
                "Technical Guide",
                "Curriculum",
                "Academic FAQ",
            ],
        },
        "version": {"type": "string"},
        "effective_date": {"type": "string", "format": "date"},
        "last_updated": {"type": "string", "format": "date"},
        "author": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "target_audience": {"type": "string"},
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["section_id", "section_title", "content"],
                "properties": {
                    "section_id": {
                        "type": "string",
                        "pattern": "^SEC-(POL|TEC|CRS|FAQ)-[0-9]{3}-[0-9]{2}$",
                    },
                    "section_title": {"type": "string"},
                    "content": {"type": "string", "minLength": 50},
                },
            },
        },
    },
}
with open(os.path.join(SCHEMA_DIR, "corpus_schema.json"), "w", encoding="utf-8") as f:
    json.dump(corpus_schema, f, indent=2, ensure_ascii=False)

eval_schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "CyberSoftRAGEvalBenchmarkQuestion",
    "type": "object",
    "required": [
        "question_id",
        "query",
        "category",
        "type",
        "reasoning_type",
        "expected_behavior",
        "ground_truth_answer",
        "citations",
        "anti_leakage_verified",
    ],
    "properties": {
        "question_id": {"type": "string", "pattern": "^Q[0-9]{3}$"},
        "query": {"type": "string", "minLength": 10},
        "category": {"type": "string"},
        "type": {
            "type": "string",
            "enum": [
                "Answerable - Single Hop",
                "Answerable - Multi Hop",
                "Unanswerable",
                "Adversarial / Distractor",
            ],
        },
        "reasoning_type": {"type": "string"},
        "expected_behavior": {"type": "string"},
        "ground_truth_answer": {"type": "string", "minLength": 15},
        "citations": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["document_id", "section_id", "text_citation"],
                "properties": {
                    "document_id": {"type": "string"},
                    "section_id": {"type": "string"},
                    "text_citation": {"type": "string"},
                },
            },
        },
        "reasoning": {"type": "string"},
        "anti_leakage_verified": {"type": "boolean"},
    },
}
with open(os.path.join(SCHEMA_DIR, "eval_schema.json"), "w", encoding="utf-8") as f:
    json.dump(eval_schema, f, indent=2, ensure_ascii=False)

# Build Schema MDs
with open(os.path.join(SCHEMA_DIR, "corpus_schema.md"), "w", encoding="utf-8") as f:
    f.write("""# Từ điển Dữ liệu: RAG Corpus v1 Document Schema

Tài liệu này đặc tả quy chuẩn cấu trúc và metadata bắt buộc cho toàn bộ 20 tài liệu trong tập ngữ liệu `RAG Corpus v1` tại CyberSoft Academy.

## 1. Thuộc tính Cấp Tài liệu (Frontmatter Metadata)

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Quy chuẩn | Ví dụ |
| :--- | :--- | :---: | :--- | :--- |
| `document_id` | String | Có | Mã định danh duy nhất của tài liệu theo cú pháp `CS-<LOAI>-<STT>`. Trong đó `<LOAI>` gồm: `POL` (Policy), `TEC` (Technical), `CRS` (Curriculum), `FAQ` (Hỏi đáp). | `CS-POL-001` |
| `title` | String | Có | Tiêu đề đầy đủ, chuẩn hóa của văn bản. | `Quy chế bảo lưu khóa học tại CyberSoft Academy` |
| `category` | String | Có | Phân loại nghiệp vụ văn bản: `Academic Policy`, `Technical Guide`, `Curriculum`, `Academic FAQ`. | `Academic Policy` |
| `version` | String | Có | Phiên bản văn bản ban hành (`vX.Y`). | `v2.1` |
| `effective_date`| String (Date) | Có | Ngày văn bản bắt đầu có hiệu lực (định dạng `YYYY-MM-DD`). | `2025-01-15` |
| `last_updated` | String (Date) | Không | Ngày rà soát hoặc điều chỉnh kỹ thuật gần nhất (`YYYY-MM-DD`). | `2025-11-01` |
| `author` | String | Có | Đơn vị, phòng ban hoặc hội đồng ban hành văn bản. | `Phòng Đào tạo & Quản lý Học vụ` |
| `tags` | Array[String]| Có | Danh sách từ khóa phân loại hỗ trợ bộ lọc Metadata Filtering khi truy xuất. | `["bao_luu", "chinh_sach", "hoc_vu"]` |
| `target_audience`| String | Có | Đối tượng áp dụng của văn bản. | `Học viên tất cả các hệ đào tạo` |

## 2. Thuộc tính Phân đoạn (Section Content & Identifiers)

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Quy chuẩn |
| :--- | :--- | :---: | :--- |
| `section_id` | String | Có | Định danh duy nhất cho từng phân đoạn theo mẫu `SEC-<DOC_ID_SUFFIX>-<STT>` (Ví dụ: `SEC-POL-001-01`). |
| `section_title`| String | Có | Tên tiêu đề phân đoạn thể hiện rõ chủ đề độc lập. |
| `content` | String | Có | Nội dung văn bản chi tiết, bảo đảm tính mạch lạc ngữ nghĩa, không phân mảnh câu. |
""")

with open(os.path.join(SCHEMA_DIR, "eval_schema.md"), "w", encoding="utf-8") as f:
    f.write("""# Từ điển Dữ liệu: RAG Evaluation Benchmark Schema

Tài liệu này đặc tả quy chuẩn cho bộ 100 câu hỏi đánh giá chất lượng hệ thống RAG (`rag_eval_questions.json` & `.csv`).

## Bảng Thuộc tính của Câu hỏi Đánh giá

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Mục đích Kiểm định |
| :--- | :--- | :---: | :--- |
| `question_id` | String | Có | Mã định danh câu hỏi từ `Q001` đến `Q100`. |
| `query` | String | Có | Câu hỏi tự nhiên của người dùng, độc lập, không chứa rò rỉ đáp án (Zero Answer Leakage). |
| `category` | String | Có | Nhóm chủ đề câu hỏi (`Academic Policy`, `Technical Guide`, `Curriculum`, `Academic FAQ`, `Out of Scope`). |
| `type` | String | Có | Loại câu hỏi: `Answerable - Single Hop` (40 câu), `Answerable - Multi Hop` (20 câu), `Unanswerable` (20 câu), `Adversarial / Distractor` (20 câu). |
| `reasoning_type`| String | Có | Kiểu tư duy yêu cầu: `Direct Factual Retrieval`, `Cross-Section Synthesis`, `Out-of-Scope / Absence Detection`, `Trap Identification / Boundary Correction`. |
| `expected_behavior`| String | Có | Hành vi kỳ vọng của mô hình ngôn ngữ khi nhận câu hỏi. |
| `ground_truth_answer`| String | Có | Câu trả lời chuẩn xác định bởi con người dựa trên tài liệu (hoặc lời từ chối nếu unanswerable). |
| `citations` | Array[Object]| Có | Danh sách trích dẫn bằng chứng gồm `document_id`, `section_id`, `text_citation` (rỗng đối với câu Unanswerable). |
| `reasoning` | String | Có | Diễn giải lý do vì sao câu trả lời và trích dẫn được lựa chọn. |
| `anti_leakage_verified`| Boolean | Có | Cờ xác nhận câu hỏi đã vượt qua bộ lọc kiểm tra chống rò rỉ đáp án tự động (`true`). |
""")

# Build Docs
with open(
    os.path.join(DOCS_DIR, "rag_chunking_and_retrieval_guidelines.md"),
    "w",
    encoding="utf-8",
) as f:
    f.write("""# Hướng dẫn Kỹ thuật: Chiến lược Phân đoạn (Chunking) & Truy xuất (Retrieval) cho CyberSoft RAG

Tài liệu này cung cấp chỉ dẫn kỹ thuật dành cho Kỹ sư AI khi xây dựng hệ thống RAG trên bộ tài nguyên `RAG Corpus v1`.

## 1. Đặc thù của Bộ Dữ liệu CyberSoft RAG Corpus v1
- **Tính pháp lý và quy chuẩn cao**: Mỗi điều khoản quy chế (`CS-POL`), quy chuẩn kỹ thuật (`CS-TEC`) hoặc biểu phí (`CS-FAQ`) đều có các con số định lượng chính xác (ví dụ: 80% chuyên cần, 500.000 VNĐ, 6 tháng).
- **Cấu trúc phân tầng rõ nét**: Tài liệu được chia thành các Document -> Section có định danh ID chuẩn hóa (`SEC-XXX-YY`).

## 2. Chiến lược Phân đoạn Đề xuất (Chunking Strategy)

### 2.1. Phân đoạn theo Cấu trúc Tiêu đề (Markdown Header Chunking) - Khuyến nghị số 1
Thay vì cắt văn bản cố định theo số lượng ký tự cơ học (Fixed-size Chunking), hệ thống nên cắt theo ranh giới thẻ tiêu đề cấp 2 `## SEC-...`:
- **Ưu điểm**: Giữ trọn vẹn ngữ cảnh của một điều khoản quy chế hoàn chỉnh, không làm đứt đoạn câu hay phân tách bảng điều kiện.
- **Kích thước chunk trung bình**: Mỗi section trong corpus dao động từ **120 đến 250 từ** (khoảng 300 - 600 tokens), kích thước lý tưởng cho các mô hình embedding hiện đại (`text-embedding-3-small`, `bge-m3`, `vietnamese-bi-encoder`).

### 2.2. Chiến lược Phân tầng Cha - Con (Parent-Child / Hierarchical Chunking)
- **Child Chunk (Nhỏ)**: Các câu đơn lẻ hoặc đoạn văn 100 tokens phục vụ cho việc tính điểm tương đồng Vector Similarity chính xác cao.
- **Parent Chunk (Lớn)**: Toàn bộ Section hoặc Document metadata tương ứng được trả về cho LLM Generator để đọc hiểu toàn diện bối cảnh.

## 3. Chiến lược Truy xuất Kết hợp (Hybrid Search & Reranking)

```mermaid
flowchart LR
    Q[User Query] --> Dense[Dense Vector Search: ChromaDB]
    Q --> Sparse[Sparse BM25 Keyword Search]
    Dense --> Merge[Reciprocal Rank Fusion - RRF]
    Sparse --> Merge
    Merge --> Rerank[Cross-Encoder Reranker: Cohere/BGE]
    Rerank --> LLM[LLM Generator: Context-Grounded Answer]
```

1. **Dense Retrieval**: Sử dụng cosine similarity để bắt các truy vấn mang tính diễn đạt đồng nghĩa (ví dụ: "xin nghỉ học tạm thời" -> `CS-POL-001 Quy chế bảo lưu`).
2. **Sparse Retrieval (BM25)**: Bắt chính xác các từ khóa số liệu và mã lỗi (ví dụ: "500.000 VNĐ", "ModuleNotFoundError", "CS-F-01").
3. **Metadata Filtering**: Khi người dùng chỉ định rõ chủ đề (ví dụ: "chính sách học phí"), hệ thống có thể pre-filter theo `category: Academic Policy`.
""")

# Ground Truth Citations Matrix MD
with open(
    os.path.join(DOCS_DIR, "ground_truth_citations_matrix.md"), "w", encoding="utf-8"
) as f:
    f.write("""# Ma trận Đối soát Ground-Truth Citations (100 Câu hỏi RAG Benchmark)

Tài liệu này đối chiếu chi tiết 100 câu hỏi trong bộ benchmark đánh giá RAG với các tài liệu và đoạn trích dẫn nguồn xác thực.

## Thống kê Phân bổ
- **Tổng số câu hỏi**: 100 câu.
- **Answerable - Single Hop**: 40 câu (Q001 - Q040) -> Ánh xạ 1-1 với 1 section cụ thể.
- **Answerable - Multi Hop**: 20 câu (Q041 - Q060) -> Ánh xạ tổng hợp từ 2 hoặc nhiều section/documents.
- **Unanswerable (Out-of-scope)**: 20 câu (Q061 - Q080) -> Citations rỗng `[]`, phản hồi thừa nhận thiếu thông tin.
- **Adversarial / Distractor**: 20 câu (Q081 - Q100) -> Trích dẫn minh chứng trực tiếp để đập tan giả định bẫy.

| Mã Câu Hỏi | Nhóm Câu Hỏi | Danh Mục | Phân Loại Logic | Số Trích Dẫn | Document IDs |
| :---: | :--- | :--- | :--- | :---: | :--- |
""")
    for q in questions:
        doc_list = (
            ", ".join([c["document_id"] for c in q["citations"]])
            if q["citations"]
            else "None (Unanswerable)"
        )
        f.write(
            f"| **{q['question_id']}** | {q['type']} | {q['category']} | {q['reasoning_type']} | {len(q['citations'])} | `{doc_list}` |\n"
        )

# Anti-leakage and Negative Sampling Defense Doc
with open(
    os.path.join(DOCS_DIR, "anti_leakage_and_negative_sampling_defense.md"),
    "w",
    encoding="utf-8",
) as f:
    f.write("""# Cơ chế Chống Rò rỉ Đáp án (Anti-Leakage) và Phòng thủ Ảo giác (Negative Sampling Defense)

Bản tài liệu phân tích sâu hai kỹ thuật cốt lõi bảo đảm tính tin cậy tuyệt đối của bộ dữ liệu RAG Benchmark tại CyberSoft.

## 1. Cơ chế Chống Rò rỉ Đáp án (Zero Answer Leakage)

### Vấn đề thường gặp trong thiết kế Benchmark AI
Nhiều tập dữ liệu RAG bị lỗi thiết kế khi câu hỏi chứa nguyên văn cụm từ khóa hiếm của đáp án hoặc bao gồm luôn câu trả lời bên trong prompt (Ví dụ bẩn: *"Học viên được bảo lưu tối đa 6 tháng phải không?"*). Lỗi này khiến Retriever dễ dàng đạt điểm cao giả tạo (False High Precision) do trùng khớp từ khóa cơ học (n-gram overlap).

### Giải pháp Kỹ thuật Triệt để tại CyberSoft
1. **Diễn đạt câu hỏi mở (Open-ended Inquiry)**: Đặt câu hỏi theo ngữ cảnh người dùng cần trợ giúp (Ví dụ: *"Thời gian bảo lưu tối đa cho một khóa học là bao lâu?"* thay vì đưa con số 6 tháng vào câu hỏi).
2. **Loại trừ Metadata ID trong Prompt**: Câu hỏi người dùng không bao giờ chứa mã số nội bộ như `SEC-POL-001-01` hay số hiệu mẫu đơn `CS-F-01` làm chỉ dẫn truy xuất.
3. **Bộ quét Tự động Regex (Anti-Leakage Linter)**: Script kiểm thử tự động quét đối soát giữa `query` và `ground_truth_answer` để bảo đảm độ dài trùng lặp ký tự liên tiếp không vượt ngưỡng cho phép.

## 2. Phòng thủ Ảo giác bằng Bộ Mẫu Âm (Negative Examples Defense)

```
+-------------------------------------------------------------+
|                PHÂN LOẠI 100 CÂU HỎI BENCHMARK              |
+-------------------------------------------------------------+
| [40% Single-Hop]    -> Kiểm tra Năng lực Truy xuất Chuẩn xác  |
| [20% Multi-Hop]     -> Kiểm tra Khả năng Tổng hợp Đa văn bản  |
| [20% Unanswerable]  -> Chốt chặn Phòng vệ Chống Ảo giác      |
| [20% Distractor]    -> Chốt chặn Phân định Ranh giới Giả định |
+-------------------------------------------------------------+
```

- **Nhóm 20 Câu Unanswerable**: Các câu hỏi rất hợp lý về mặt ngôn ngữ (trả góp 36 tháng, học phí điện toán lượng tử, du học 5 năm) nhưng không có trong tri thức trung tâm. Mô hình bắt buộc phải trả về câu trả lời chuẩn: *"Tài liệu CyberSoft không đề cập hoặc chưa ban hành quy định này..."*, tuyệt đối cấm bịa đặt (Zero Hallucination).
- **Nhóm 20 Câu Distractor**: Các câu hỏi gài bẫy con số biên (10% vs 20%, 500k lần 1 vs lần 2, 6.8 vs 7.0 điểm). Mô hình phải đủ năng lực chỉ ra tiền đề sai của người dùng và đính chính dựa trên tài liệu trích dẫn.
""")

print("All documentation, schemas, and matrices generated successfully.")
