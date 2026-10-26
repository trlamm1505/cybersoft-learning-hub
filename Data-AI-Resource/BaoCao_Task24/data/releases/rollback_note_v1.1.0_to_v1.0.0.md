# TÀI LIỆU HƯỚNG DẪN HOÀN TÁC (ROLLBACK NOTE): v1.1.0 ➔ v1.0.0

**Mã kế hoạch**: `PLN-ROLLBACK-v1.1.0-v1.0.0`  
**Người thực hiện**: Đào Trung Kiên - Data & AI Resource Engineer  
**Lý do thực hiện**: Kế hoạch hoàn tác dự phòng khi phát hiện xung đột không tương thích trên môi trường vận hành hạ nguồn.  
**Mức độ rủi ro**: LOW (Do toàn bộ tài nguyên được lưu trữ bất biến theo cơ chế WORM)  
**Phiên bản hiện tại**: `v1.1.0` (`rel_v1.1.0`)  
**Phiên bản đích**: `v1.0.0` (`rel_v1.0.0`)  
**Mã kiểm tra toàn vẹn đích**: `20577462c080d8cbdfa00d6d06cfe6ddccad46deedb52bf2280551558e48dfb0`  

---

## 1. Kiểm tra Tiên quyết (Pre-flight Checklist)

- [ ] Xác thực tính toàn vẹn của Release Manifest đích: 20577462c080d8cbdfa00d6d06cfe6ddccad46deedb52bf2280551558e48dfb0
- [ ] Xác nhận toàn bộ 13 tài nguyên mục tiêu vẫn nguyên vẹn trong WORM store
- [ ] Đảm bảo không có tiến trình huấn luyện hoặc đánh giá nào đang ghi dữ liệu
- [ ] Sao lưu snapshot trạng thái cấu hình hiện tại của v1.1.0

## 2. Các Bước Thực Thi Khôi Phục (Execution Steps)

| Bước | Thành Phần | Hành Động | Chi Tiết | Phiên Bản Đích | Lệnh Kiểm Chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | API Gateway & Route Registry | `revert_pointer` | Chuyển con trỏ định tuyến hệ thống từ phiên bản v1.1.0 về v1.0.0. | `v1.0.0` | `curl -s http://localhost:8000/api/v1/releases/manifests/rel_v1.0.0` |
| 2 | Dataset: AI Knowledge Chunks Corpus Multi-Hop | `demote_to_draft` | Cách ly và chuyển trạng thái tài nguyên mới sinh dataset_ai_knowledge_chunks_corpus_multi_hop_v1.1.0 về chế độ dự phòng. | `quarantine` | `python scripts/run_lineage_eval.py --check-quarantine dataset_ai_knowledge_chunks_corpus_multi_hop_v1.1.0` |
| 3 | Index: Hybrid RAG Search Index | `demote_to_draft` | Cách ly và chuyển trạng thái tài nguyên mới sinh index_hybrid_rag_search_index_v1.1.0 về chế độ dự phòng. | `quarantine` | `python scripts/run_lineage_eval.py --check-quarantine index_hybrid_rag_search_index_v1.1.0` |
| 4 | Prompt: Exercise Generator System Prompt Enhanced | `demote_to_draft` | Cách ly và chuyển trạng thái tài nguyên mới sinh prompt_exercise_generator_system_prompt_enhanced_v1.1.0 về chế độ dự phòng. | `quarantine` | `python scripts/run_lineage_eval.py --check-quarantine prompt_exercise_generator_system_prompt_enhanced_v1.1.0` |
| 5 | Vector Index & Query Cache | `flush_and_sync` | Đồng bộ lại chỉ mục tìm kiếm và xóa cache bộ nhớ tạm tương thích với bản phát hành v1.0.0. | `v1.0.0` | `pytest tests/test_provenance_trace.py -v` |

## 3. Kiểm Thử Nghiệm Thu Sau Hoàn Tác (Post-Rollback Verification)

- [ ] Chạy kiểm thử hợp đồng API trên bản v1.0.0
- [ ] Kiểm tra tính truy vết nguồn gốc (backtrace) 100% đến dataset nguồn
- [ ] Xác nhận tỷ lệ phản hồi HTTP 200 OK trên các cổng tra cứu tài nguyên
