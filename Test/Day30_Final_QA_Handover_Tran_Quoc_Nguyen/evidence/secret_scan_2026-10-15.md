# Secret scan - repo hiện tại và lịch sử git
Thời điểm (UTC): 2026-10-15 12:18:59
Repo: D:\thuctap\clone\cybersoft-learning-hub; HEAD d804c49; số commit quét (--all): 389
Máy: Linux VM Cowork trên máy tester; git 2.34.1
Chỉ in file:dòng, KHÔNG in giá trị. Mẫu tìm: AWS AKIA, Google AIza, OpenAI/Anthropic sk-, GitHub ghp_/github_pat_, Slack xox, JWT, chuỗi kết nối Mongo/Postgres có mật khẩu, private key.

## 1. File .env đang được git theo dõi (trừ .example)
```
(không có)
```

## 2. File .env / khóa từng xuất hiện trong lịch sử (mọi nhánh)
```
(hết danh sách; trống = không có)
```

## 3. Mẫu secret trong cây hiện tại (file:dòng)
```
Data-AI-Resource/BaoCao_Task19/scripts/demo_day19_workflow.py:150
Data-AI-Resource/BaoCao_Task19/tests/test_guardrails.py:54
Data-AI-Resource/BaoCao_Task19/tests/test_guardrails.py:56
Data-AI-Resource/BaoCao_Task25/portal/app.js:6
learning-hub/BE/src/common/config/sandbox-env.spec.ts:10
learning-hub/BE/src/common/config/sandbox-env.spec.ts:20
learning-hub/BE/src/common/config/sandbox-env.spec.ts:34
learning-hub/BE/src/common/config/sandbox-env.spec.ts:37
learning-hub/BE/src/common/security/secret-patterns.spec.ts:26
learning-hub/BE/src/common/security/secret-patterns.spec.ts:65
learning-hub/BE/src/integration/dataset-integration.service.spec.ts:36
learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts:113
learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts:118
learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts:127
learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts:135
learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts:136
learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts:137
learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts:138
learning-hub/BE/src/modules-api/da-labs/sql-grader.service.spec.ts:27
learning-hub/FE/src/common/secretPatterns.test.ts:14
learning-hub/docs/day23/dapan.md:170
learning-hub/scripts/lib/setup-helpers.test.js:48
exit code git grep: 0
```

## 4. Lịch sử git: commit từng THÊM chuỗi khớp mẫu khóa thật (AIza, sk-ant, ghp_, AKIA, mongodb+srv có mật khẩu, private key)
```
0e49b92  Data-AI-Resource/BaoCao_Task25/portal/app.js
0e49b92  Data-AI-Resource/BaoCao_Task25/tests/test_pii_scanner.py
208e5ec  Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/PR_RULES.md
208e5ec  learning-hub/BE/src/common/security/secret-patterns.spec.ts
208e5ec  learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts
208e5ec  learning-hub/scripts/lib/setup-helpers.test.js
3185b2e  Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/PR_RULES.md
3185b2e  learning-hub/BE/src/common/security/secret-patterns.spec.ts
3185b2e  learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts
3185b2e  learning-hub/scripts/lib/setup-helpers.test.js
495f6d0  Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/PR_RULES.md
495f6d0  learning-hub/BE/src/common/security/secret-patterns.spec.ts
495f6d0  learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts
495f6d0  learning-hub/scripts/lib/setup-helpers.test.js
499f131  Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/PR_RULES.md
601a84f  Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/PR_RULES.md
601a84f  learning-hub/BE/src/common/security/secret-patterns.spec.ts
601a84f  learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts
601a84f  learning-hub/scripts/lib/setup-helpers.test.js
6ec1725  Data-AI-Resource/BaoCao_Task25/portal/app.js
874e44b  learning-hub/scripts/lib/setup-helpers.test.js
8e36ddd  learning-hub/BE/src/common/security/secret-patterns.spec.ts
93396c2  Data-AI-Resource/BaoCao_Task25/tests/test_pii_scanner.py
eb1b7c7  learning-hub/BE/src/modules-api/ai-labs/ai-lab-grader.service.spec.ts
exit code: 0
```

## 5. Phân loại (review thủ công từng dòng ở mục 3 và 4, không in giá trị)

| Nhóm | File | Kết luận |
|---|---|---|
| Chuỗi giả trong test/spec (giá trị mẫu kiểu AIzaSyA1..., AKIAIOSF..., sk-ant-api0..., ghp_abcd...) | `learning-hub/BE/src/**/*.spec.ts`, `FE/src/common/secretPatterns.test.ts`, `scripts/lib/setup-helpers.test.js` | Không phải secret thật; dùng để test bộ lọc secret |
| Chuỗi giả trong bài red-team/demo và tài liệu | `Data-AI-Resource/BaoCao_Task19/*`, `BaoCao_Task25/portal/app.js`, `BaoCao_Task25/tests/test_pii_scanner.py`, `learning-hub/docs/day23/dapan.md`, `Test/Day22.../PR_RULES.md` (mục 4: các commit lịch sử chỉ chứa các file này) | Mock có chủ đích (chứa chữ "fake"/"mock"); không phải secret thật |
| Mật khẩu mặc định local | `learning-hub/BE/src/common/config/sandbox-env.ts` (lab_reader), `docker-compose.yml` | Chỉ cho máy local; `docker-compose.prod.yml` bắt buộc đặt biến. Chấp nhận được cho dev |
| **API key cứng trong code thật** | `Data-AI-Resource/BaoCao_Task21/src/config.py` (`API_KEYS_STORE`, có key role admin; CORS `*`) | **RISK-07**: không khớp mẫu khóa nhà cung cấp nhưng là key xác thực thật của Data service dùng ở Ngày 27 |
| **Mật khẩu tài khoản mẫu** | `learning-hub/BE/src/data/initial-data.ts` (`INITIAL_USERS`: admin/teacher/student), ghi cả trong `learning-hub/README.md` | **RISK-06**: BE tự tạo khi NODE_ENV khác production |

## Kết luận
- Không thấy file `.env` bị theo dõi hay từng commit; không thấy khóa thật của nhà cung cấp (Google/OpenAI/Anthropic/GitHub/AWS) trong cây hiện tại và lịch sử.
- Còn 2 phát hiện cần owner xử lý: RISK-06, RISK-07.
- Giới hạn: chưa quét log runtime của BE (log in ra terminal, không lưu file); chưa chạy gitleaks. Kết luận đóng RISK-05 do người phê duyệt quyết định.
