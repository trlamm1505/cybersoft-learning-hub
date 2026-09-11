# Ma trận Đối soát Ground-Truth Citations (100 Câu hỏi RAG Benchmark)

Tài liệu này đối chiếu chi tiết 100 câu hỏi trong bộ benchmark đánh giá RAG với các tài liệu và đoạn trích dẫn nguồn xác thực.

## Thống kê Phân bổ
- **Tổng số câu hỏi**: 100 câu.
- **Answerable - Single Hop**: 40 câu (Q001 - Q040) -> Ánh xạ 1-1 với 1 section cụ thể.
- **Answerable - Multi Hop**: 20 câu (Q041 - Q060) -> Ánh xạ tổng hợp từ 2 hoặc nhiều section/documents.
- **Unanswerable (Out-of-scope)**: 20 câu (Q061 - Q080) -> Citations rỗng `[]`, phản hồi thừa nhận thiếu thông tin.
- **Adversarial / Distractor**: 20 câu (Q081 - Q100) -> Trích dẫn minh chứng trực tiếp để đập tan giả định bẫy.

| Mã Câu Hỏi | Nhóm Câu Hỏi | Danh Mục | Phân Loại Logic | Số Trích Dẫn | Document IDs |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **Q001** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-001` |
| **Q002** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-001` |
| **Q003** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-001` |
| **Q004** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-001` |
| **Q005** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-001` |
| **Q006** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-002` |
| **Q007** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-002` |
| **Q008** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-002` |
| **Q009** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-002` |
| **Q010** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-003` |
| **Q011** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-003` |
| **Q012** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-003` |
| **Q013** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-003` |
| **Q014** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-004` |
| **Q015** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-004` |
| **Q016** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-004` |
| **Q017** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-004` |
| **Q018** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-005` |
| **Q019** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-005` |
| **Q020** | Answerable - Single Hop | Academic Policy | Direct Factual Retrieval | 1 | `CS-POL-005` |
| **Q021** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-001` |
| **Q022** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-001` |
| **Q023** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-001` |
| **Q024** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-001` |
| **Q025** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-002` |
| **Q026** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-002` |
| **Q027** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-002` |
| **Q028** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-003` |
| **Q029** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-003` |
| **Q030** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-003` |
| **Q031** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-004` |
| **Q032** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-004` |
| **Q033** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-004` |
| **Q034** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-005` |
| **Q035** | Answerable - Single Hop | Technical Guide | Direct Factual Retrieval | 1 | `CS-TEC-005` |
| **Q036** | Answerable - Single Hop | Curriculum | Direct Factual Retrieval | 1 | `CS-CRS-001` |
| **Q037** | Answerable - Single Hop | Curriculum | Direct Factual Retrieval | 1 | `CS-CRS-002` |
| **Q038** | Answerable - Single Hop | Curriculum | Direct Factual Retrieval | 1 | `CS-CRS-003` |
| **Q039** | Answerable - Single Hop | Curriculum | Direct Factual Retrieval | 1 | `CS-CRS-004` |
| **Q040** | Answerable - Single Hop | Curriculum | Direct Factual Retrieval | 1 | `CS-CRS-005` |
| **Q041** | Answerable - Multi Hop | Academic Policy | Cross-Section Synthesis | 2 | `CS-POL-001, CS-POL-001` |
| **Q042** | Answerable - Multi Hop | Academic Policy | Cross-Section Synthesis | 2 | `CS-POL-002, CS-POL-002` |
| **Q043** | Answerable - Multi Hop | Academic Policy | Cross-Section Synthesis | 2 | `CS-POL-003, CS-POL-004` |
| **Q044** | Answerable - Multi Hop | Academic Policy | Cross-Section Synthesis | 2 | `CS-POL-002, CS-POL-005` |
| **Q045** | Answerable - Multi Hop | Academic Policy | Cross-Section Synthesis | 2 | `CS-POL-005, CS-POL-005` |
| **Q046** | Answerable - Multi Hop | Technical Guide | Cross-Section Synthesis | 2 | `CS-TEC-002, CS-TEC-002` |
| **Q047** | Answerable - Multi Hop | Technical Guide | Cross-Section Synthesis | 2 | `CS-POL-003, CS-TEC-002` |
| **Q048** | Answerable - Multi Hop | Technical Guide | Cross-Section Synthesis | 2 | `CS-TEC-003, CS-TEC-003` |
| **Q049** | Answerable - Multi Hop | Technical Guide | Cross-Section Synthesis | 2 | `CS-TEC-004, CS-TEC-004` |
| **Q050** | Answerable - Multi Hop | Technical Guide | Cross-Section Synthesis | 3 | `CS-TEC-005, CS-TEC-005, CS-TEC-005` |
| **Q051** | Answerable - Multi Hop | Curriculum | Cross-Section Synthesis | 3 | `CS-CRS-001, CS-CRS-002, CS-CRS-002` |
| **Q052** | Answerable - Multi Hop | Curriculum | Cross-Section Synthesis | 2 | `CS-CRS-001, CS-CRS-002` |
| **Q053** | Answerable - Multi Hop | Curriculum | Cross-Section Synthesis | 2 | `CS-CRS-003, CS-CRS-003` |
| **Q054** | Answerable - Multi Hop | Curriculum | Cross-Section Synthesis | 2 | `CS-CRS-004, CS-CRS-004` |
| **Q055** | Answerable - Multi Hop | Curriculum | Cross-Section Synthesis | 2 | `CS-CRS-005, CS-CRS-005` |
| **Q056** | Answerable - Multi Hop | Academic FAQ | Cross-Section Synthesis | 1 | `CS-FAQ-001` |
| **Q057** | Answerable - Multi Hop | Academic FAQ | Cross-Section Synthesis | 1 | `CS-FAQ-002` |
| **Q058** | Answerable - Multi Hop | Academic FAQ | Cross-Section Synthesis | 2 | `CS-FAQ-003, CS-FAQ-003` |
| **Q059** | Answerable - Multi Hop | Academic FAQ | Cross-Section Synthesis | 2 | `CS-FAQ-004, CS-FAQ-004` |
| **Q060** | Answerable - Multi Hop | Academic FAQ | Cross-Section Synthesis | 1 | `CS-FAQ-005` |
| **Q061** | Unanswerable | Academic Policy | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q062** | Unanswerable | Academic FAQ | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q063** | Unanswerable | Academic FAQ | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q064** | Unanswerable | Academic Policy | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q065** | Unanswerable | Curriculum | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q066** | Unanswerable | Academic Policy | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q067** | Unanswerable | Academic Policy | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q068** | Unanswerable | Curriculum | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q069** | Unanswerable | Academic Policy | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q070** | Unanswerable | Academic FAQ | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q071** | Unanswerable | Academic FAQ | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q072** | Unanswerable | Academic Policy | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q073** | Unanswerable | Academic FAQ | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q074** | Unanswerable | Technical Guide | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q075** | Unanswerable | Curriculum | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q076** | Unanswerable | Academic Policy | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q077** | Unanswerable | Academic Policy | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q078** | Unanswerable | Academic FAQ | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q079** | Unanswerable | Curriculum | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q080** | Unanswerable | Academic FAQ | Out-of-Scope / Absence Detection | 0 | `None (Unanswerable)` |
| **Q081** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-001` |
| **Q082** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-001` |
| **Q083** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-003` |
| **Q084** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-004` |
| **Q085** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-004` |
| **Q086** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-002` |
| **Q087** | Adversarial / Distractor | Technical Guide | Trap Identification / Boundary Correction | 1 | `CS-TEC-004` |
| **Q088** | Adversarial / Distractor | Technical Guide | Trap Identification / Boundary Correction | 1 | `CS-TEC-002` |
| **Q089** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-005` |
| **Q090** | Adversarial / Distractor | Academic FAQ | Trap Identification / Boundary Correction | 1 | `CS-FAQ-002` |
| **Q091** | Adversarial / Distractor | Academic FAQ | Trap Identification / Boundary Correction | 1 | `CS-FAQ-002` |
| **Q092** | Adversarial / Distractor | Technical Guide | Trap Identification / Boundary Correction | 1 | `CS-TEC-005` |
| **Q093** | Adversarial / Distractor | Technical Guide | Trap Identification / Boundary Correction | 1 | `CS-TEC-005` |
| **Q094** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-005` |
| **Q095** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-001` |
| **Q096** | Adversarial / Distractor | Curriculum | Trap Identification / Boundary Correction | 2 | `CS-CRS-001, CS-CRS-005` |
| **Q097** | Adversarial / Distractor | Technical Guide | Trap Identification / Boundary Correction | 1 | `CS-TEC-003` |
| **Q098** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-003` |
| **Q099** | Adversarial / Distractor | Academic Policy | Trap Identification / Boundary Correction | 1 | `CS-POL-002` |
| **Q100** | Adversarial / Distractor | Academic FAQ | Trap Identification / Boundary Correction | 1 | `CS-FAQ-005` |
