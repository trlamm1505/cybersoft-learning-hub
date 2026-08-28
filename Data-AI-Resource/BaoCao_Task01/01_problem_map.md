# 01. BẢN ĐỒ BÀI TOÁN VÀ NHU CẦU TÀI NGUYÊN DATA & AI LAB

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 01 - Xác định bài toán và người dùng  
**Phiên bản**: v1.1  
**Ngày thực hiện**: 2026-08-28  

---

## 1. Problem Statement (Tuyên bố bài toán)

CyberSoft hiện đang gặp tình trạng tài nguyên đào tạo bị phân mảnh, thiếu các dataset thực tế đa bảng có sẵn phiên bản Clean/Dirty để học viên Data Analyst thực hành sát với doanh nghiệp. Đồng thời, giảng viên tốn nhiều thời gian soạn bài và chấm đồ án thủ công do thiếu Project Bank chuẩn hóa kèm Rubric 100 điểm chi tiết. Trong mảng AI Engineer, các bài thực hành RAG chưa có corpus chuẩn và evaluation harness tự động, khiến việc kiểm soát lỗi bịa thông tin (*hallucination*) và trích dẫn nguồn chỉ dừng ở mức cảm tính. Vì vậy, việc xây dựng Data & AI Lab là cần thiết để tập trung hóa tài nguyên, áp dụng data quality gate tự động và chuẩn hóa hạ tầng đo lường chất lượng cho toàn bộ chương trình học.

---

## 2. Nhóm người dùng mục tiêu (User Personas)

| ID | Nhóm User | Họ là ai? | Họ cần gì? |
| :--- | :--- | :--- | :--- |
| **USR-01** | **Giảng viên Data Analyst (Mentor DA)** | Giảng viên, trợ giảng phụ trách các lớp phân tích dữ liệu tại CyberSoft. | Cần các bộ dataset thực tế đa bảng có sẵn phiên bản Clean/Dirty kèm Data Dictionary, và Project Bank có Rubric 100 điểm + đáp án đối soát để tiết kiệm thời gian soạn bài và chấm đồ án. |
| **USR-02** | **Giảng viên AI Engineer (Mentor AI)** | Giảng viên, chuyên gia hướng dẫn các chuyên đề AI, NLP và RAG. | Cần corpus tài liệu chuẩn, bộ câu hỏi Ground Truth và framework đánh giá định lượng (Evaluation Harness) để kiểm thử pipeline RAG, đo độ chính xác trích nguồn và tỷ lệ từ chối (*abstain*). |
| **USR-03** | **Học viên (DA & AI Learners)** | Học viên đang theo học các chương trình Data Analyst và AI Engineer tại CyberSoft. | Cần dữ liệu thực tế doanh nghiệp để luyện kỹ năng làm sạch dữ liệu/mô hình hóa, các bài lab phân cấp độ rõ ràng, và trợ lý AI Tutor giải đáp thắc mắc có trích dẫn nguồn chuẩn xác 24/7. |
| **USR-04** | **Ban Quản lý / Đội ngũ QA** | Đội ngũ quản lý chất lượng đào tạo và vận hành học vụ. | Cần Dashboard theo dõi chất lượng kho tài nguyên và công cụ Data Quality Gate tự động để kiểm soát chuẩn đầu ra trước khi phát hành. |

---

## 3. Điểm đau của người dùng (Pain Points)

### 1. Giảng viên Data Analyst (Mentor DA)
* **Pain point 1: Tốn nhiều thời gian tự tạo và làm sạch dataset giảng dạy.**  
  Dataset trên mạng thường là dữ liệu đơn bảng, quá sạch (*toy data*) hoặc thiếu ngữ cảnh doanh nghiệp, khiến giảng viên phải tự tay tạo lỗi, chỉnh sửa bảng quan hệ và viết từ điển dữ liệu (*data dictionary*) rất mất công.
* **Pain point 2: Tốn hàng chục giờ chấm đồ án thủ công và dễ bị cảm tính.**  
  Thiếu ngân hàng đề bài chuẩn hóa có sẵn bảng tiêu chí chấm điểm (*Rubric 100 điểm*) và đáp án đối soát (*ground truth*), dẫn đến việc đánh giá bài làm của học viên kéo dài và khó đồng nhất giữa các giảng viên/trợ giảng.

### 2. Giảng viên AI Engineer (Mentor AI)
* **Pain point 1: Khó đo lường và đánh giá chất lượng của các bài lab RAG.**  
  Không có bộ tài liệu (*corpus*) chuẩn và bộ 100 câu hỏi đối soát (*ground truth*), khiến giảng viên không thể chấm điểm định lượng xem pipeline RAG của học viên đạt độ chính xác bao nhiêu % hay đang bị hiện tượng bịa thông tin (*hallucination*).
* **Pain point 2: Thiếu công cụ kiểm thử hồi quy (Regression Test) tự động.**  
  Mỗi khi học viên thay đổi câu prompt, cấu hình chunking hoặc model embedding, giảng viên không có công cụ tự động (*Eval Harness*) để đo lường xem hệ thống tốt lên hay bị suy giảm chất lượng ở các ca kiểm thử cũ.

### 3. Học viên (DA & AI Learners)
* **Pain point 1: Bị hổng kỹ năng xử lý dữ liệu bẩn thực tế khi đi làm.**  
  Chỉ được thực hành trên dữ liệu quá lý tưởng nên khi gặp dữ liệu thực tế tại doanh nghiệp (bị null, duplicate, sai định dạng ngày tháng, vi phạm khóa ngoại, v.v.), học viên lúng túng và mất nhiều thời gian xử lý.
* **Pain point 2: Trợ lý học tập/tài liệu tự học hay cung cấp câu trả lời sai lệch.**  
  Khi tự học hoặc hỏi đáp kiến thức, học viên gặp tình trạng chatbot AI trả lời chung chung, không có trích dẫn nguồn cụ thể từ tài liệu bài giảng của trung tâm hoặc tự bịa ra thông tin không chính xác.

---

## 4. Danh mục 15 Nhu cầu tài nguyên (Resource Backlog)

| ID | Nhóm phân loại | Nhóm user | Vấn đề hiện tại | Đầu ra kỳ vọng (Artifact bàn giao) | Người hưởng lợi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Dataset | Giảng viên DA | Thiếu dataset bán hàng đa bảng chuẩn quan hệ. | Dataset Sales đa bảng (Phiên bản Clean + Dirty + Data Dictionary). | Học viên DA, Giảng viên DA |
| **REQ-02** | Bài tập | Giảng viên DA | Học viên thiếu bài tập thực hành xử lý và làm sạch dữ liệu có lỗi. | Bộ bài tập dữ liệu Clean/Dirty với nhiều loại lỗi dữ liệu và đáp án đối soát. | Học viên DA |
| **REQ-03** | Chấm bài / Project | Giảng viên DA | Tốn nhiều giờ chấm bài đồ án cuối khóa thủ công. | Capstone Project Sales kèm Rubric 100 điểm chi tiết và barem chấm. | Giảng viên DA, Học viên DA |
| **REQ-04** | Dataset | Giảng viên DA | Thiếu dữ liệu thực tế về quản trị và vận hành doanh nghiệp. | Dataset HR & Vận hành (>5.000 bản ghi, 5 bảng quan hệ chuẩn hóa). | Học viên DA, Giảng viên DA |
| **REQ-05** | Project | Giảng viên DA | Đề bài đồ án thiếu các tình huống ngoại lệ (edge cases). | Capstone Inventory kèm 8 kịch bản ngoại lệ nghiệp vụ để đối soát. | Học viên DA |
| **REQ-06** | Dataset / RAG | Giảng viên AI | Thiếu bộ tài liệu chuẩn để test và benchmark RAG pipeline. | Corpus giả lập 20+ tài liệu chính sách/FAQ được phân mục rõ ràng. | Học viên AI, Giảng viên AI |
| **REQ-07** | RAG / Chấm bài | Giảng viên AI | Khó đo lường định lượng độ chính xác của chatbot RAG. | Bộ 100 câu hỏi Ground Truth (phân loại rõ answerable / unanswerable). | Học viên AI, Giảng viên AI |
| **REQ-08** | Project / Chấm bài | Giảng viên AI | Chưa có khung đánh giá định lượng đồ án RAG của học viên. | Capstone AI RAG kèm tiêu chí đánh giá riêng Retrieval và Generation. | Giảng viên AI |
| **REQ-09** | RAG | Học viên AI | Chatbot RAG hay bịa thông tin (hallucination) khi thiếu ngữ cảnh. | Cơ chế RAG Tutor trích dẫn nguồn (citation) và biết từ chối (abstain). | Học viên AI |
| **REQ-10** | RAG / Dashboard | Học viên AI | Thiếu công cụ đo lường regression sau mỗi lần đổi prompt/model. | CLI `eval_rag` tự động chạy kiểm thử và xuất báo cáo so sánh phiên bản. | Học viên AI, Giảng viên AI |
| **REQ-11** | Dataset / Quản trị | Giảng viên chung | Không có nơi tập trung lưu trữ, quản lý metadata và version hóa dataset. | Dataset Registry & Catalog phân loại theo Level / Skill / Domain. | Giảng viên, QA |
| **REQ-12** | Chấm bài / Kiểm định | Giảng viên chung | Mất thời gian kiểm tra định dạng và tính hợp lệ của file dữ liệu học viên nộp. | CLI `validate_data` tự động kiểm tra 7 nhóm lỗi dữ liệu phổ biến. | Giảng viên DA, QA |
| **REQ-13** | Dashboard / Tra cứu | Giảng viên chung | Khó tìm kiếm nhanh tài nguyên phù hợp cho từng buổi học cụ thể. | Giao diện Resource Portal cho phép tìm kiếm/lọc tài nguyên trong < 60 giây. | Giảng viên DA & AI |
| **REQ-14** | Bài tập / AI | Giảng viên chung | Tốn thời gian biên soạn các câu hỏi và đa dạng hóa bài tập thực hành mới theo từng tuần. | Công cụ AI hỗ trợ sinh bài tập nháp theo schema chuẩn, kèm cơ chế giảng viên kiểm tra và phê duyệt. | Giảng viên DA |
| **REQ-15** | Dashboard | Ban Quản lý / QA | Không nắm được chất lượng và độ phủ kiểm thử của kho tài nguyên. | Dashboard Streamlit theo dõi Data Quality Score và Test Regression Status. | Quản trị viên, QA |

---

## 5. Ma trận Đánh giá Impact / Effort (Toàn bộ 15 Reqs)

| ID | Tên Nhu cầu (Đầu ra kỳ vọng) | Impact (1–5) | Effort (1–5) | Lý do đánh giá |
| :--- | :--- | :---: | :---: | :--- |
| **REQ-01** | Dataset Sales đa bảng (Clean + Dirty + Data Dictionary) | **5** | **3** | Tài nguyên nền tảng cốt lõi cho học viên DA luyện modeling và cleaning. |
| **REQ-02** | Bộ bài tập dữ liệu Clean/Dirty với nhiều loại lỗi & đáp án | **4** | **2** | Tác động nhanh giúp học viên luyện tập xử lý các lỗi dữ liệu cụ thể; effort thấp. |
| **REQ-03** | Capstone Project Sales kèm Rubric 100 điểm & barem chấm | **5** | **3** | Chuẩn hóa đồ án tốt nghiệp DA, giảm tải nhiều giờ chấm bài cho giảng viên. |
| **REQ-04** | Dataset HR & Vận hành (>5.000 bản ghi, 5 bảng quan hệ) | **4** | **3** | Đa dạng hóa bài toán phân tích nhân sự/vận hành sát thực tế doanh nghiệp. |
| **REQ-05** | Capstone Inventory kèm 8 kịch bản ngoại lệ đối soát | **4** | **3** | Giúp học viên rèn luyện xử lý các ca biên nghiệp vụ (*edge cases*) phức tạp. |
| **REQ-06** | Corpus giả lập 20+ tài liệu chính sách/FAQ phân mục rõ ràng | **5** | **2** | Nguồn tri thức nền tảng bắt buộc để xây dựng và test mọi pipeline RAG. |
| **REQ-07** | Bộ 100 câu hỏi Ground Truth (answerable / unanswerable) | **5** | **3** | Thước đo chuẩn để benchmark và đánh giá định lượng hệ thống RAG. |
| **REQ-08** | Capstone AI RAG kèm tiêu chí đánh giá Retrieval & Generation | **4** | **3** | Chuẩn hóa tiêu chí đánh giá năng lực học viên AI theo chuẩn kỹ thuật. |
| **REQ-09** | Cơ chế RAG Tutor trích dẫn nguồn (citation) & từ chối (abstain) | **5** | **4** | Giải quyết lỗi bịa tin (*hallucination*), hỗ trợ học viên 24/7 với độ tin cậy cao. |
| **REQ-10** | CLI `eval_rag` tự động kiểm thử & xuất báo cáo regression | **4** | **4** | Tự động hóa đo lường sau mỗi lần đổi model/prompt; cần xử lý logic eval phức tạp. |
| **REQ-11** | Dataset Registry & Catalog phân loại Level / Skill / Domain | **5** | **3** | Quản lý tập trung, version hóa và tái sử dụng tài nguyên giữa các lớp học. |
| **REQ-12** | CLI `validate_data` kiểm tra tự động 7 nhóm lỗi dữ liệu | **5** | **3** | Quality Gate tự động cho toàn lab; chấm bài và kiểm soát dữ liệu trong vài giây. |
| **REQ-13** | Giao diện Resource Portal tìm kiếm/lọc tài nguyên $< 60$s | **4** | **3** | Tối ưu trải nghiệm tra cứu, giúp giảng viên tìm đúng tài nguyên giảng dạy nhanh. |
| **REQ-14** | Công cụ AI hỗ trợ sinh bài tập nháp kèm cơ chế phê duyệt | **3** | **4** | Hữu ích nhưng cần kiểm soát nghiêm ngặt Human-in-the-loop để tránh sai sót. |
| **REQ-15** | Dashboard Streamlit theo dõi Data Quality Score & Regression | **3** | **3** | Giúp QA/Quản lý giám sát tổng thể kho tài nguyên; có thể hoàn thiện sau MVP. |

---

## 6. Đề xuất Phạm vi MVP 30 Ngày (Scope & Priority)

Dựa trên ma trận Impact / Effort, đề xuất phạm vi thực hiện chia theo 3 nhóm mức độ ưu tiên:

### Nhóm 1: Quick Wins (Impact cao $\ge 4$, Effort thấp $\le 2$) — Ưu tiên thực hiện ngay trong Tuần 1 - 2:
* **REQ-02**: Bộ bài tập dữ liệu Clean/Dirty với danh mục lỗi và đáp án đối soát.
* **REQ-06**: Corpus giả lập 20+ tài liệu chính sách/FAQ chuẩn cấu trúc.

### Nhóm 2: Core MVP / Strategic Focus (Impact cao $\ge 4$, Effort trung bình 3–4) — Trọng tâm 30 ngày:
* **REQ-01**: Dataset Sales đa bảng (Clean/Dirty/Data Dictionary).
* **REQ-03**: Capstone Project Sales kèm Rubric 100 điểm chi tiết.
* **REQ-04**: Dataset HR & Vận hành (>5.000 records, 5 bảng quan hệ).
* **REQ-05**: Capstone Inventory với 8 kịch bản ngoại lệ nghiệp vụ.
* **REQ-07**: Bộ 100 câu hỏi Ground Truth (answerable / unanswerable).
* **REQ-08**: Capstone AI RAG kèm tiêu chí chấm định lượng.
* **REQ-09**: Module RAG Tutor có trích dẫn nguồn (citation) và từ chối (abstain).
* **REQ-10**: CLI `eval_rag` kiểm thử tự động và xuất báo cáo regression.
* **REQ-11**: Dataset Registry & Schema metadata chuẩn quản lý tài nguyên.
* **REQ-12**: CLI `validate_data` tự động kiểm tra 7 nhóm lỗi dữ liệu phổ biến.
* **REQ-13**: Giao diện Resource Portal tìm kiếm/tải tài nguyên.

### Nhóm 3: Post-MVP / Tối ưu mở rộng (Impact trung bình 3, Effort 3–4) — Triển khai sau khi MVP hoàn tất:
* **REQ-14**: AI Exercise Generator sinh bài tập nháp (cần tinh chỉnh guardrail).
* **REQ-15**: Dashboard Streamlit theo dõi Quality Score nâng cao.

---

## 7. Chỉ số Đo lường Thành công (Success Metrics)

Xác định các chỉ số định lượng để nghiệm thu sản phẩm sau 30 ngày:

### 1. Về Chất lượng Dữ liệu (Data Quality):
* **100%** các dataset xuất bản (Sales, HR) phải vượt qua kiểm tra của CLI `validate_data` với 0 lỗi schema/critical.
* Bản Dirty phải chứa đúng và đủ danh mục lỗi đã thiết kế theo ma trận kiểm thử (null, duplicate, wrong format, outlier, foreign key mismatch).

### 2. Về Hệ thống AI & RAG (RAG Precision & Groundedness):
* **Citation Accuracy**: Tỷ lệ trích dẫn đúng nguồn tài liệu đạt $\ge 85\%$.
* **Abstention Rate**: Tỷ lệ từ chối trả lời chính xác đối với các câu hỏi unanswerable (thiếu ngữ cảnh/ngoài phạm vi) đạt $\ge 90\%$.
* **Zero Critical Hallucination**: Không xảy ra tình trạng AI tự bịa thông tin đối với các câu hỏi đã có ground truth.

### 3. Về Hiệu quả Vận hành & Trải nghiệm (Operational Value):
* Giảng viên tìm kiếm và tải được tài nguyên giảng dạy phù hợp trong vòng $< 60$ giây qua Resource Portal.
* Giảm thời gian chấm đồ án thủ công của giảng viên ước tính $\ge 50\%$ nhờ bộ Rubric 100 điểm và barem đáp án rõ ràng.
* Người khác có thể setup và chạy lại toàn bộ repository trên máy sạch trong $< 10$ phút theo hướng dẫn `SETUP.md`.
