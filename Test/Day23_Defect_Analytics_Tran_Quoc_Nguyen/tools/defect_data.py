# -*- coding: utf-8 -*-
"""Nguồn dữ liệu duy nhất của Defect Dashboard Ngày 23.

Mỗi defect phải có evidence là file thật trong Test/ (hoặc URL công khai). Không có bằng chứng thì không đưa vào.
Ngày phát hiện lấy từ ngày ghi trong báo cáo/artefact; không có thì ghi "Not recorded".
Owner là NHÓM đề xuất; chưa ai được giao chính thức nên Deadline = "Chưa xác nhận".
"""

RC = {
    "RC01": "Không validate kiểu/định dạng input ở API",
    "RC02": "Tin dữ liệu từ client, thiếu kiểm quyền ở server",
    "RC03": "Nội dung/dữ liệu học liệu đưa vào không qua gate tự động",
    "RC04": "Guardrail AI chưa phủ tình huống",
    "RC05": "Không lọc thông tin nội bộ trước khi trả cho người dùng",
    "RC06": "Fixture/dữ liệu test không được kiểm độc lập",
    "RC07": "Công cụ test sai giả định",
    "RC08": "Môi trường/cấu hình không đồng bộ",
    "RC09": "Thiếu test/gate tự động cho thay đổi",
    "RC10": "Component UI không theo chuẩn a11y/responsive",
    "RC11": "Tài liệu/kết quả AI không được đối chiếu với code",
    "RC12": "Hợp đồng FE-BE không có nguồn chung",
    "RC13": "Tiêu chí đánh giá AI chưa đủ rõ",
}

CATEGORIES = [
    ("Frontend UI", "Sai bố cục, thiếu label, focus, responsive"),
    ("Frontend Logic", "State sai, gọi API sai tham số"),
    ("Backend Logic", "Service xử lý sai nghiệp vụ, lộ thông tin nội bộ"),
    ("API Contract", "Thiếu field, sai status code so với hợp đồng"),
    ("Authentication", "Sai phân quyền, token, ownership"),
    ("Data Validation", "Không chặn input rỗng, sai kiểu, sai định dạng"),
    ("Content", "Bài học thiếu trường, link sai"),
    ("Quiz", "Đáp án trùng, lệch vị trí, lộ đáp án qua hình thức"),
    ("Coding Problem", "Test yếu, thiếu constraint, expected output sai"),
    ("RAG Retrieval", "Xếp hạng/citation kém đi"),
    ("AI Safety", "Prompt injection, child safety, lộ dữ liệu qua AI"),
    ("Evaluation", "Judge chấm lệch người"),
    ("Test Fixture", "Dữ liệu test sai hoặc gây kết quả ngoài ý muốn"),
    ("Test Automation", "Script/công cụ test sai, báo oan"),
    ("Environment", "Seed, dependency, cấu hình máy"),
    ("CI Workflow", "Trigger, đường dẫn, quyền, gate"),
    ("Encoding", "Tiếng Việt hiển thị sai"),
    ("Documentation", "Tài liệu/bảng tính không khớp code hoặc lỗi công thức"),
]
SEVERITIES = [("Critical", "Sai kết quả học tập, lộ dữ liệu, mất an toàn; phải chặn release"),
              ("High", "Chức năng chính sai hoặc rủi ro bảo mật/an toàn rõ"),
              ("Medium", "Ảnh hưởng một phần, có cách vòng"),
              ("Low", "Thẩm mỹ, chất lượng nội dung nhẹ, công cụ nội bộ")]
PRIORITY = {"Critical": "P0", "High": "P1", "Medium": "P2", "Low": "P3"}
STATUSES = [("Open", "Đã xác nhận, chưa sửa"), ("In Progress", "Đang sửa"), ("Fixed", "Đã sửa, có bằng chứng sửa"),
            ("Retest", "Đã sửa một phần hoặc chờ kiểm lại đủ điều kiện"), ("Closed", "Đã kiểm lại và đạt"),
            ("Needs verification", "Chưa đủ bằng chứng để kết luận là lỗi thật")]
KINDS = [("Product", "Lỗi của sản phẩm Learning Hub"), ("Test fixture", "Dữ liệu test sai"), ("Test tool", "Công cụ/script test sai"),
         ("Environment", "Do môi trường, seed, cấu hình"), ("CI/Process", "Do pipeline hoặc quy trình"),
         ("Documentation", "Tài liệu, bảng tính"), ("External", "Hệ thống ngoài Learning Hub (demo lab)")]
PHASES = ["Local", "Pull Request", "Integration", "Manual test"]

D07 = "Day07_Authentication_Tests_Tran Quoc Nguyen/reports/junit.xml"
D08 = "Day08_UI_Smoke/BAO_CAO_NGAY08.md"
D09 = "Day09_Execution_Guide_Local_A11y_Responsive_v3.xlsx"
D10 = "Day10_Performance_Baseline_Guide.xlsx"
D11L = "Day11_Content_Lint_Tran_Quoc_Nguyen/tools/content-lint/real-content/lint-report.json"
D11W = "Day11_Content_Lint_Tran_Quoc_Nguyen/AI_WORKLOG.md"
D12X = "Day12_Quiz_Validator_Tran_Quoc_Nguyen/Day12_Quality_Report.xlsx"
D12W = "Day12_Quiz_Validator_Tran_Quoc_Nguyen/AI_WORKLOG.md"
D13X = "Day13_Coding_Problem_Validator_Tran_Quoc_Nguyen/Day13_Quality_Report.xlsx"
D14X = "Day14_Bo lab tester thuc te/Day14_Tester_Labs_Quality_Report_GitHub.xlsx"
D15W = "Day15_Variant_Generator_Tran_Quoc_Nguyen/AI_WORKLOG.md"
D18 = "day_16_toi_day21_test/day18/Bao_Cao_Ngay_18_Hybrid_Search_Tran_Quoc_Nguyen.docx"
D19 = "day_16_toi_day21_test/day19/Day19_Red_Team_Test_Cases_Tran_Quoc_Nguyen.xlsx"
D20 = "day_16_toi_day21_test/day20/Day20_LLM_Judge_Calibration_Tran_Quoc_Nguyen.xlsx"
D22W = "Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/AI_WORKLOG.md"
D22D = "Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/Bao_Cao_Ngay_22_PR_Quality_Bot_Tran_Quoc_Nguyen.docx"
D23 = "Day23_Defect_Analytics_Tran_Quoc_Nguyen/evidence/live_test_2026-10-05.md"
RUN98 = "https://github.com/trlamm1505/cybersoft-learning-hub/actions/runs/37280939728"
NR = "Not recorded"
R, P = "Recorded", "Proposed"

# (id, day, date, phase, component, summary, symptom, category, severity, sev_source, status,
#  root_cause, rc, method, owner_team, evidence, kind, fixture_bug, regression, action, note)
DEFECTS = [
 ("DEF-001", 7, "2026-09-10", "Local", "QA/Auth mock", "Test token bị sửa không ổn định giữa các lần chạy",
  "JUnit Ngày 7 ghi test_tampered_token_is_401 FAIL (41/42)", "Test Automation", "Medium", P, "Needs verification",
  "Chưa xác định: cùng bộ test chạy lại ngày 05/10 trên Python 3.13 cho 42/42 PASS; nghi phụ thuộc phiên bản thư viện JWT hoặc dữ liệu token ngẫu nhiên",
  "RC08", "Pytest", "QA", D07, "Test tool", "N", "N", "PA-09", "Cần chạy lại trên Windows của tester để chốt"),
 ("DEF-002", 8, "2026-09-13", "Local", "FE + BE Quiz", "Đề Python: thông tin hiển thị khác đề BE trả về",
  "Thẻ đề ghi 10 câu/15 phút nhưng response có 20 câu/1800 giây và lẫn câu HTML/HTTP", "Frontend Logic", "High", R, "Retest",
  "FE tự khai số câu/thời lượng và không gửi chủ đề đã chọn; BE lấy toàn bộ câu hỏi và cố định 1800 giây, hai bên không dùng chung một định nghĩa đề",
  "RC12", "Playwright", "FE + BE", D08, "Product", "N", "N", "PA-13",
  "05/10: FE đã gửi category, thẻ ghi 20 câu/30 phút; chưa chạy được trọn luồng vì DB local thiếu câu Python (DEF-053)"),
 ("DEF-003", 8, "2026-09-13", "Local", "BE Quiz", "Lượt thi không gắn với tài khoản đang đăng nhập",
  "Request start luôn gửi userId 673f1111...; hai học viên có thể dùng chung lượt IN_PROGRESS", "Authentication", "High", R, "Closed",
  "BE nhận userId từ body do client tự khai thay vì lấy từ JWT", "RC02", "Playwright", "BE", D08, "Product", "N", "N", "PA-02",
  "05/10: userId lấy từ token; tài khoản khác review/submit nhận 404 (xem evidence Ngày 23)"),
 ("DEF-004", 9, NR, "Manual test", "FE Quiz", "Không chọn được bộ đề bằng bàn phím",
  "Tab không tới các thẻ đề; Enter/Space không chọn được (KB-04)", "Frontend UI", "Medium", P, "Open",
  "Thẻ đề là phần tử không focus được (không phải button/không có tabindex và role)", "RC10", "Manual", "FE", D09, "Product", "N", "N", "PA-11", "Chưa retest ngày 05/10"),
 ("DEF-005", 9, NR, "Manual test", "FE", "Focus không nhìn thấy rõ trên các trang chính",
  "Khi Tab qua control, viền focus khó nhận ra (FOCUS-01)", "Frontend UI", "Medium", P, "Open",
  "Style chung bỏ outline mặc định mà không có style focus-visible thay thế", "RC10", "Manual", "FE", D09, "Product", "N", "N", "PA-11", "Root cause suy từ quan sát, chưa đọc CSS"),
 ("DEF-006", 9, NR, "Manual test", "FE Login", "Input Email/Mật khẩu không gắn label",
  "WAVE báo 2 missing form label (A11Y-BUG-003)", "Frontend UI", "Medium", R, "Open",
  "Component form render <label> và <input> rời nhau: input không có id, label không có htmlFor", "RC10", "WAVE + DOM", "FE", D09, "Product", "N", "N", "PA-11",
  "05/10: DOM /login vẫn vậy (2 input không id, label for rỗng)"),
 ("DEF-007", 9, NR, "Manual test", "FE Register", "3 input đăng ký không gắn label",
  "WAVE báo 3 missing form label và 4 orphaned label (A11Y-BUG-004)", "Frontend UI", "Medium", R, "Open",
  "Dùng chung cách dựng form với trang Login (label và input không liên kết)", "RC10", "WAVE + DOM", "FE", D09, "Product", "N", "N", "PA-11", "05/10: DOM /register vẫn vậy"),
 ("DEF-008", 9, NR, "Manual test", "FE Playground", "Ô STDIN và dropdown bài không có accessible name",
  "WAVE báo textarea STDIN không có label tương ứng (A11Y-BUG-005)", "Frontend UI", "Medium", R, "Open",
  "Text mô tả hiển thị cạnh control nhưng không liên kết bằng label/aria", "RC10", "WAVE", "FE", D09, "Product", "N", "N", "PA-11", "Chưa retest ngày 05/10"),
 ("DEF-009", 9, NR, "Manual test", "FE Header", "Header không co lại ở tablet",
  "Ở iPad Pro, navigation và nút Đăng nhập/Đăng ký dồn sát nhau (RESP-BUG-001)", "Frontend UI", "Medium", R, "Open",
  "Header chỉ có bố cục desktop và mobile, thiếu breakpoint tablet", "RC10", "Chrome DevTools", "FE", D09, "Product", "N", "N", "PA-11", "Chưa retest ngày 05/10"),
 ("DEF-010", 9, NR, "Manual test", "FE Playground", "Ba thẻ Hint bị ép hẹp ở tablet",
  "Badge 'Đã mở/Chưa mở' tràn khỏi thẻ ở iPad Pro (RESP-BUG-002)", "Frontend UI", "Medium", R, "Open",
  "Lưới 3 cột cố định, không xuống hàng theo chiều rộng", "RC10", "Chrome DevTools", "FE", D09, "Product", "N", "N", "PA-11", "Chưa retest ngày 05/10"),
 ("DEF-011", 10, NR, "Local", "QA tài liệu", "Bảng ngưỡng hiệu năng có ô #REF!",
  "Sheet 06_Thresholds: 3 dòng Page Load hiển thị #REF! ở baseline và ngưỡng", "Documentation", "Low", P, "Open",
  "Công thức tham chiếu tới ô đã bị xóa/di chuyển ở sheet 05_Page_Load sau khi sửa bố cục", "RC11", "Đọc workbook", "QA", D10, "Documentation", "N", "N", "PA-12", ""),
 ("DEF-012", 11, "2026-09-17", "Local", "BE dữ liệu bài học", "2 bài học BE thiếu mục tiêu học tập",
  "content-lint báo 2 ERROR CT004 trên be-lessons.json", "Content", "Medium", P, "Open",
  "Seed bài học được viết tay trong initial-data.ts, schema không bắt buộc learningOutcome và không có bước lint trước khi merge", "RC03", "content-lint", "BE", D11L, "Product", "N", "N", "PA-03",
  "05/10: bot Ngày 22 chạy lại vẫn 2 ERROR (gate advisory)"),
 ("DEF-013", 11, "2026-09-17", "Local", "QA content-lint", "Report in sai số dòng cho field dạng mảng",
  "Output ghi lesson-bad.md:10,10,10,10,10 thay vì một số dòng", "Test Automation", "Low", P, "Fixed",
  "Parser JSON và Markdown trả kiểu dữ liệu khác nhau cho cùng field loc.links; rule dùng thẳng giá trị đó", "RC07", "Đọc output đối chiếu file gốc", "QA", D11W, "Test tool", "N", "N", "PA-08", "Đã chuẩn hóa {field,url,line} và thêm test"),
 ("DEF-014", 12, "2026-09-18", "Local", "BE dữ liệu quiz", "Đáp án đúng dồn vào một vị trí",
  "19/30 câu (63%) có đáp án đúng ở vị trí thứ 2; 4 câu liên tiếp cùng vị trí (QV017, QV018)", "Quiz", "Medium", P, "Open",
  "Câu hỏi được soạn tay theo thói quen đặt đáp án đúng ở B, không có bước xáo/kiểm phân bố trước khi đưa vào seed", "RC03", "quiz-validator", "BE", D12X, "Product", "N", "N", "PA-03",
  "Đo trên bộ 30 câu ngày 18/09; bộ hiện tại 60 câu chưa đo lại phân bố"),
 ("DEF-015", 12, "2026-09-18", "Local", "BE dữ liệu quiz", "Đáp án lộ qua độ dài hoặc quan hệ chuỗi con",
  "QV023 ở 6 câu (đáp án đúng dài/ngắn bất thường), QV016 ở Q29-Q30 (option là chuỗi con của option khác)", "Quiz", "Low", P, "Open",
  "Không có tiêu chí viết phương án nhiễu và không có validator chạy khi sửa dữ liệu quiz", "RC03", "quiz-validator", "BE", D12X, "Product", "N", "N", "PA-03", ""),
 ("DEF-016", 12, "2026-09-18", "Local", "QA fixture quiz", "3 fixture kích hoạt rule ngoài ý muốn",
  "check-fixtures báo good-QZ004, bad-QZ012, bad-QZ015 dính thêm rule substring", "Test Fixture", "Low", P, "Fixed",
  "Fixture viết cho một rule nhưng dùng chữ có quan hệ chuỗi con (HTTP/HTTPS, Java/JavaScript); chỉ kiểm bằng mắt", "RC06", "Script kiểm độc lập", "QA", D12W, "Test fixture", "Y", "N", "PA-07", "Đã đổi nội dung fixture, chạy lại ALL FIXTURES OK"),
 ("DEF-017", 12, "2026-09-18", "Local", "QA fixture quiz", "File manifest bị quét như dữ liệu",
  "Test kỳ vọng 50 file nhưng CLI quét 51", "Test Fixture", "Low", P, "Fixed",
  "Đặt file catalog fixtures-manifest.json trong chính thư mục dữ liệu mà công cụ quét đệ quy", "RC06", "node:test", "QA", D12W, "Test fixture", "Y", "N", "PA-07", "Đã dời manifest ra ngoài thư mục fixtures"),
 ("DEF-018", 13, "2026-09-19", "Local", "BE bài coding", "Bộ test bài số nguyên tố để lọt lời giải sai",
  "Mutation score 66,7% (10/15), dưới ngưỡng 80%; 5 mutant sống sót (F-D13-01)", "Coding Problem", "High", R, "Open",
  "Test được viết theo ví dụ trong đề, không có test biên (bình phương số nguyên tố, n lớn) và không đo mutation trước khi phát hành", "RC03", "Mutation test", "BE", D13X, "Product", "N", "N", "PA-04", "Bộ test bổ sung mới ở mức đề xuất, chưa áp vào BE"),
 ("DEF-019", 13, "2026-09-19", "Local", "BE bài coding", "24/30 bài không nêu ràng buộc",
  "Validator báo 24 lần CP002 (F-D13-02)", "Coding Problem", "Medium", R, "Open",
  "Schema Exercise không có trường constraints nên người soạn không có chỗ điền", "RC03", "coding-problem-validator", "BE", D13X, "Product", "N", "N", "PA-04", ""),
 ("DEF-020", 13, "2026-09-19", "Local", "BE bài coding", "3 bài quá ít test",
  "CP013 ở tim-so-lon-nhat, dao-nguoc-chuoi, day14-bang-cuu-chuong (F-D13-03)", "Coding Problem", "Low", R, "Open",
  "Không có số test tối thiểu trong quy trình soạn bài", "RC03", "coding-problem-validator", "BE", D13X, "Product", "N", "N", "PA-04", ""),
 ("DEF-021", 13, "2026-09-19", "Local", "BE Judge", "Nghi lộ input của hidden test qua stderr",
  "Mô phỏng: 2/2 hidden test của 2 bài bị echo dòng input đầu qua stderr/errorMessage (F-D13-04)", "AI Safety", "High", R, "Needs verification",
  "Judge lưu và trả stderr cho cả test ẩn, không lọc theo isHidden", "RC05", "Đọc code + mô phỏng", "BE", D13X, "Product", "N", "N", "PA-06", "Chưa tái hiện trên server thật"),
 ("DEF-022", 13, "2026-09-19", "Local", "BE Judge", "Output đúng dài hơn 64KB bị chấm sai im lặng",
  "Reference solution bị WA với test 12.000 phần tử; stdout bị cắt ở 65.536 ký tự (F-D13-05)", "Backend Logic", "Medium", R, "Open",
  "Judge cắt stdout ở MAX_OUTPUT_BYTES nhưng không có trạng thái riêng cho vượt giới hạn output", "RC09", "coding-problem-validator", "BE", D13X, "Product", "N", "N", "PA-04", "Đã thêm rule CP019 ở phía dữ liệu; hành vi judge chưa đổi"),
 ("DEF-023", 13, "2026-09-19", "Local", "BE Judge", "Trạng thái bài nộp theo test fail cuối cùng",
  "Bài vừa WA vừa TLE hiển thị theo test sau cùng (F-D13-07)", "Backend Logic", "Low", R, "Needs verification",
  "Mỗi test fail ghi đè status; chưa rõ có phải chủ ý thiết kế", "RC09", "Đọc code", "BE", D13X, "Product", "N", "N", "PA-04", "Cần BE xác nhận"),
 ("DEF-024", 13, "2026-09-19", "Local", "BE Exercise API", "Gợi ý tầng 3 trùng lời giải và có thể lộ qua API chi tiết bài",
  "20/20 bài Ngày 14 có hint3 trùng nguyên văn solutionCode; findBySlug select cả hints (F-D13-08)", "AI Safety", "High", R, "Retest",
  "API chi tiết bài trả nguyên object hints, bỏ qua cơ chế mở khóa gợi ý", "RC05", "Đọc code + đếm", "BE", D13X, "Product", "N", "N", "PA-06",
  "05/10: GET /exercises/:slug không còn trường hints trên bài kiểm được; DB local chỉ có 1 bài code nên chưa kết luận cho 20 bài"),
 ("DEF-025", 13, "2026-09-19", "Local", "QA coding validator", "Validator báo oan 14 ERROR trên dữ liệu thật",
  "Lần chạy đầu báo 14 ERROR; rà tay cả 14 đều là báo oan của CP008, CP010, CP014 (F-D13-09)", "Test Automation", "Medium", R, "Fixed",
  "Rule được viết theo fixture tự tạo, chưa thử trên dữ liệu thật có cách diễn đạt khác", "RC07", "Rà tay", "QA", D13X, "Test tool", "N", "N", "PA-08", "Đã sửa rule, giữ 3 ca làm fixture good"),
 ("DEF-026", 14, "2026-09-22", "Manual test", "demo1 API (ngoài Learning Hub)", "Mã phim không tồn tại trả 500",
  "LayThongTinPhim?MaPhim=999999 trả 500 'Mã phim không hợp lệ!' thay vì 404 (RF-003)", "API Contract", "High", R, "Open",
  "Không xác định được từ bên ngoài (không có source); biểu hiện giống thiếu xử lý trường hợp không tìm thấy", "RC01", "Gọi API", "Ngoài nhóm", D14X, "External", "N", "N", "", "Hệ thống demo dùng chung, không thuộc phạm vi sửa của nhóm"),
 ("DEF-027", 15, "2026-09-22", "Local", "QA variant generator", "Variant sinh ra trùng slug",
  "Validator báo CP017 24 lần: 6 variant của cùng source giữ nguyên slug", "Test Fixture", "Medium", P, "Fixed",
  "Generator sao chép slug gốc mà không tính tới ràng buộc unique của schema", "RC06", "coding-problem-validator", "QA", D15W, "Test fixture", "Y", "N", "PA-07", "Thêm hậu tố -v0N"),
 ("DEF-028", 15, "2026-09-22", "Local", "QA variant generator", "Test biên của variant nằm ngoài miền đề bài",
  "CP010 3 lần: dùng 0 và -5 trong khi đề ghi 'N nguyên dương'", "Test Fixture", "Medium", P, "Fixed",
  "Giá trị biên được chọn theo thói quen (0, số âm) mà không đọc lại miền giá trị của đề", "RC06", "coding-problem-validator", "QA", D15W, "Test fixture", "Y", "N", "PA-07", "Đổi về n=1"),
 ("DEF-029", 15, "2026-09-22", "Local", "QA variant generator", "Đáp án đúng cùng một vị trí trong cả 6 variant quiz",
  "QV017/QV018 trên 6/6 variant", "Test Fixture", "Medium", P, "Fixed",
  "Generator chỉ đổi tham số, giữ nguyên thứ tự option của câu gốc", "RC06", "quiz-validator", "QA", D15W, "Test fixture", "Y", "N", "PA-07", "Xoay vòng thứ tự option theo chỉ số variant"),
 ("DEF-030", 15, "2026-09-22", "Local", "QA variant generator", "Giải thích sai khi đổi literal",
  "Variant literal=null vẫn ghi 'typeof 1 trả về number' trong khi typeof null là 'object'", "Test Fixture", "Medium", P, "Fixed",
  "Explanation được chép từ câu gốc, không tính lại theo giá trị trung gian của variant", "RC06", "Đọc lại JSON", "QA", D15W, "Test fixture", "Y", "N", "PA-07", "Viết lại explanation theo giá trị tính thật"),
 ("DEF-031", 15, "2026-09-22", "Local", "QA quy trình", "45 ERROR ảo do chạy validator sai thư mục",
  "Validator bài coding quét cả quiz-variants.json, báo 45 ERROR CP001/003/005...", "Test Automation", "Low", P, "Fixed",
  "Lệnh trỏ vào thư mục cha chứa cả hai loại dữ liệu; công cụ không kiểm loại file trước khi áp rule", "RC07", "Đọc output", "QA", D15W, "Test tool", "N", "N", "PA-08", "Tách thư mục for-validation/quiz và /coding"),
 ("DEF-032", 18, "2026-09-27", "Local", "Data-AI Retrieval", "MRR giảm sau khi thêm rerank",
  "MRR 0,9750 (Ngày 17) xuống 0,9667 (Ngày 18); Recall@5 giữ 100%", "RAG Retrieval", "Low", P, "Needs verification",
  "Chưa xác định: báo cáo ghi nhóm CAT 09 (số liệu, thời hạn) chỉ đạt rank 2 sau rerank; chưa có ngưỡng chấp nhận regression", "RC09", "Benchmark", "Data-AI", D18, "Product", "N", "Y", "PA-10", "Cần Data-AI quyết định có chấp nhận đánh đổi"),
 ("DEF-033", 19, "2026-10-01", "Manual test", "BE AI Coach", "AI Coach không nhận diện yêu cầu không phù hợp với trẻ",
  "10 case RT-041..RT-050: trả lời fallback về bài tập, không từ chối rõ, không hướng dẫn tìm hỗ trợ", "AI Safety", "High", R, "Open",
  "Bộ lọc trước LLM chỉ có nhánh prompt injection; không có nhánh child safety nên câu hỏi rơi vào trả lời mặc định", "RC04", "Red-team thủ công", "BE", D19, "Product", "N", "N", "PA-05",
  "05/10: chạy lại RT-041 và RT-045 vẫn nhận fallback; RT-001 (injection) vẫn bị chặn đúng"),
 ("DEF-034", 19, "2026-10-01", "Manual test", "BE Code runner", "STDERR lộ đường dẫn tuyệt đối của máy chủ",
  "Chạy code lỗi cú pháp: stderr có C:\\Users\\USER\\AppData\\Local\\Temp\\code-runner-<uuid>.py (RT-051)", "AI Safety", "High", R, "Open",
  "Runner trả nguyên traceback của Python, không chuẩn hóa tên file", "RC05", "Red-team thủ công", "BE", D19, "Product", "N", "N", "PA-06", "05/10: không retest được vì Docker sandbox chưa bật trên máy local"),
 ("DEF-035", 19, "2026-10-01", "Manual test", "BE AI Coach", "AI Coach nhắc lại traceback có đường dẫn nội bộ",
  "Phân tích lỗi lần nộp gần nhất trích nguyên traceback kèm đường dẫn tạm (RT-052)", "AI Safety", "High", R, "Open",
  "Debug loop đưa stderr thô vào prompt và vào câu trả lời, không qua bước lọc", "RC05", "Red-team thủ công", "BE", D19, "Product", "N", "N", "PA-06", "Chưa retest ngày 05/10"),
 ("DEF-036", 19, "2026-10-01", "Manual test", "BE Judge", "Lời giải sai được Accepted khi bài không có test",
  "Nộp A-B cho đề A+B: hệ thống trả Đạt 0/0 test (RT-053)", "Backend Logic", "Critical", R, "Closed",
  "Điều kiện chấm coi passed == total là đạt, không loại trường hợp total = 0", "RC09", "Red-team thủ công", "BE", D19, "Product", "N", "N", "PA-10",
  "05/10: cùng thao tác trả FAILED 'Bài tập thiếu Test Cases, không thể chấm điểm'"),
 ("DEF-037", 20, "2026-10-01", "Local", "QA LLM Judge", "Judge v1 chấm lệch người ở 11/20 case",
  "Agreement v1 = 45% (9/20); ví dụ RT-002, RT-006 người chấm PASS nhưng judge chấm FAIL", "Evaluation", "Medium", P, "Retest",
  "Prompt judge v1 không định nghĩa rõ 'attack không thành công' là PASS nên chấm theo độ đầy đủ của câu trả lời", "RC13", "So sánh Human vs Judge", "QA", D20, "Test tool", "N", "N", "PA-14",
  "Judge v2 đạt 20/20 trên cùng bộ; chưa kiểm trên holdout nên chưa đóng"),
 ("DEF-038", 21, "2026-10-03", "Integration", "CI", "Không có CI nào chạy test FE/BE trên PR vào main",
  "GitHub Actions chỉ có 4 run, run cuối 07/09; workflow của team nằm ở learning-hub/.github nên không được kích hoạt", "CI Workflow", "High", P, "Fixed",
  "File workflow của team đặt sai thư mục (không ở .github gốc repo); workflow Day 3 chỉ trigger theo đường dẫn Day3", "RC08", "GitHub Actions API", "QA", RUN98, "CI/Process", "N", "N", "PA-10",
  "05/10: PR #98 thêm pr-quality.yml, run đầu tiên success"),
 ("DEF-039", 22, "2026-10-05", "Local", "QA PR bot", "Rule chống auto-approve không áp dụng cho .github",
  "Test đầu tiên FAIL 1/8: workflow xấu không bị phát hiện", "Test Automation", "High", P, "Fixed",
  "Hàm chuẩn hóa đường dẫn dùng lstrip('./') làm mất dấu chấm đầu của .github", "RC07", "unittest", "QA", D22W, "Test tool", "N", "N", "PA-08", "Chỉ bỏ đúng tiền tố ./"),
 ("DEF-040", 22, "2026-10-05", "Local", "QA PR bot", "Tiếng Việt lỗi mã hóa khi chạy trên Windows",
  "UnicodeEncodeError ở console cp1252; log Node hiện 'KhÃ´ng'", "Encoding", "Medium", P, "Fixed",
  "Script dựa vào encoding mặc định của hệ điều hành cho stdout và subprocess", "RC08", "Chạy demo", "QA", D22W, "Test tool", "N", "N", "PA-09", "Ép UTF-8 cho stdout/stderr và subprocess"),
 ("DEF-041", 22, "2026-10-05", "Local", "QA PR bot", "File code không có mapping được báo PASS",
  "Dockerfile, nest-cli.json, FE/index.html: 0 gate, kết quả PASS 'report-only'", "CI Workflow", "High", P, "Fixed",
  "Thiết kế coi 'không khớp gate nào' là tài liệu, không phân biệt với code chưa được phủ", "RC09", "Chạy thử --plan-only", "QA", D22W, "Test tool", "N", "N", "PA-10", "Tách docs-only; file chưa map thành WARN"),
 ("DEF-042", 22, "2026-10-05", "Local", "QA PR bot", "Danh sách file thay đổi rỗng được coi là PASS",
  "--changed-file trỏ file rỗng: exit code 0", "CI Workflow", "Medium", P, "Fixed",
  "Không phân biệt 'không có gì để kiểm' với 'lấy diff thất bại'", "RC09", "Chạy thử", "QA", D22W, "Test tool", "N", "N", "PA-10", "Trả exit code 2"),
 ("DEF-043", 22, "2026-10-05", "Local", "QA PR bot", "Gate API contract không chạy được từ gốc repo",
  "ModuleNotFoundError: No module named 'app'", "CI Workflow", "High", P, "Fixed",
  "Bộ test Ngày 6 chỉ từng được chạy bằng script đứng trong thư mục của nó; lệnh trong config giả định chạy từ gốc repo", "RC08", "Chạy lệnh trong config", "QA", D22W, "Test tool", "N", "N", "PA-09", "Thêm cwd cho gate"),
 ("DEF-044", 22, "2026-10-05", "Local", "QA PR bot", "Gate nội dung chỉ chạy test của công cụ, không kiểm nội dung vừa đổi",
  "Sửa initial-quiz-questions.ts chỉ chạy test trên bản chụp quiz-questions.json cũ", "CI Workflow", "High", P, "Fixed",
  "Mapping nối file dữ liệu với bộ test có sẵn theo tên ngày, không xét bộ test đó đọc dữ liệu nào", "RC09", "Đọc test", "QA", D22W, "Test tool", "N", "N", "PA-03", "Thêm 3 gate trích nội dung thật rồi validate"),
 ("DEF-045", 22, "2026-10-05", "Local", "QA PR bot", "File test của bot bị chính bot coi là lộ secret",
  "Quét thư mục Day22 ra finding assigned_secret ở test_pr_quality.py", "Test Fixture", "High", P, "Fixed",
  "Fixture ghi tên biến môi trường và giá trị giả liền nhau trong mã nguồn", "RC06", "Tự quét", "QA", D22W, "Test fixture", "Y", "N", "PA-07", "Ghép chuỗi lúc chạy; thêm test bot tự quét chính nó"),
 ("DEF-046", 22, "2026-10-05", "Local", "QA PR bot", "Bộ quét secret bỏ sót file theo tên",
  ".env.production, secrets.pem, file không đuôi chứa khóa giả không bị phát hiện", "CI Workflow", "High", P, "Fixed",
  "Bộ quét chọn file theo danh sách đuôi cho phép thay vì quét mọi file text", "RC07", "Tạo file giả", "QA", D22W, "Test tool", "N", "N", "PA-08", "Quét mọi file text"),
 ("DEF-047", 22, "2026-10-05", "Local", "QA PR bot", "So khớp pattern khác nhau giữa Windows và Linux",
  "fnmatch phân biệt hoa/thường trên Linux nhưng không phân biệt trên Windows", "Environment", "Medium", P, "Fixed",
  "Dùng hàm so khớp phụ thuộc hệ điều hành trong khi bot chạy local Windows và CI Linux", "RC08", "Đọc code", "QA", D22W, "Test tool", "N", "N", "PA-09", "Đổi sang fnmatchcase"),
 ("DEF-048", 22, "2026-10-05", "Local", "QA PR bot", "Rule chống approve báo nhầm chú thích tiếng Việt",
  "Test FAIL: dòng chú thích 'không thể approve, merge' bị coi là lệnh approve", "Test Automation", "Low", P, "Fixed",
  "Regex quá rộng (chữ APPROVE theo sau là dấu phẩy) kết hợp cờ không phân biệt hoa thường", "RC07", "unittest", "QA", D22W, "Test tool", "N", "N", "PA-08", "Siết regex về event: APPROVE / --approve / createReview("),
 ("DEF-049", 22, "2026-10-05", "Local", "QA tài liệu", "Báo cáo docx Ngày 22 ghi mapping cũ",
  "Bảng trong docx ghi 'Controller hoặc DTO → API contract' trong khi code chỉ đưa ra lưu ý cho người review", "Documentation", "Low", P, "Open",
  "Docx được tạo ở vòng đầu và không cập nhật lại sau khi đổi mapping", "RC11", "Đối chiếu docx với config", "QA", D22D, "Documentation", "N", "N", "PA-12", ""),
 ("DEF-050", 23, "2026-10-05", "Manual test", "BE Auth, Quiz, Coach", "Gửi object thay cho chuỗi làm API trả 500",
  "login với email/password là object; quiz/start với category là object; coach/chat với message là object: đều 500 Internal server error", "Data Validation", "High", P, "Open",
  "DTO chỉ khai báo kiểu TypeScript, không có class-validator/ValidationPipe; service gọi thẳng email.trim() hoặc đưa object vào truy vấn", "RC01", "Gọi API", "BE", D23, "Product", "N", "N", "PA-01", "3 endpoint, cùng một nguyên nhân (N-01, N-04, N-05)"),
 ("DEF-051", 23, "2026-10-05", "Manual test", "BE Auth", "Đăng ký chấp nhận email sai định dạng",
  "Email 'khong-phai-email' được tạo tài khoản, trả 201 kèm token", "Data Validation", "Medium", P, "Open",
  "Service chỉ kiểm rỗng và trùng, không kiểm định dạng email", "RC01", "Gọi API", "BE", D23, "Product", "N", "N", "PA-01", "N-02"),
 ("DEF-052", 23, "2026-10-05", "Manual test", "BE Quiz", "Nộp bài với answers không phải mảng vẫn được chấm và đóng lượt thi",
  "Body answers là chuỗi: 201, GRADED 0/200; nộp lại báo lượt thi đã kết thúc", "Data Validation", "Medium", P, "Open",
  "SubmitAttemptDto không được validate; vòng lặp chấm bỏ qua dữ liệu sai kiểu thay vì từ chối", "RC01", "Gọi API", "BE", D23, "Product", "N", "N", "PA-01", "N-03"),
 ("DEF-053", 23, "2026-10-05", "Manual test", "DB local / seed", "Thẻ đề Python có trên giao diện nhưng DB không có câu hỏi Python",
  "Bắt đầu đề Python: 404 'Không tìm thấy câu hỏi nào'; DB chỉ có HTML5, CSS3, JavaScript, React, NestJS, Database, Quiz Engine", "Environment", "Medium", P, "Open",
  "DB local được seed từ bộ dữ liệu cũ; file seed hiện tại (20 câu Python) chưa được nạp lại và không có bước kiểm seed khi khởi động", "RC08", "Gọi API + đọc trang", "BE", D23, "Environment", "N", "N", "PA-09", "N-06; cần kiểm trên môi trường của nhóm BE"),
 ("DEF-054", 23, "2026-10-05", "Manual test", "BE Auth", "Quên mật khẩu trả 500 với email đã đăng ký",
  "Email đã đăng ký: 500; email chưa đăng ký: 201 kèm thông báo chung, nên phân biệt được email nào tồn tại", "Authentication", "Medium", P, "Needs verification",
  "Nghi do thiếu cấu hình GMAIL_USER/GMAIL_APP_PASSWORD ở máy local và lỗi gửi mail không được bắt; chưa xem log BE", "RC08", "Gọi API", "BE", D23, "Product", "N", "N", "PA-09", "N-07"),
 ("DEF-055", 23, "2026-10-05", "Manual test", "BE Code runner", "Thông báo lỗi sandbox lộ chi tiết hạ tầng",
  "Khi Docker chưa chạy, stderr trả cho học viên chứa 'npipe:////./pipe/dockerDesktopLinuxEngine'", "Backend Logic", "Low", P, "Open",
  "Thông báo lỗi nội bộ của Docker được nối thẳng vào stderr trả về client", "RC05", "Gọi API", "BE", D23, "Product", "N", "N", "PA-06", "N-08"),
 ("DEF-056", 23, "2026-10-05", "Manual test", "DB local / seed", "Bài tập trong DB local không có test case",
  "2/2 bài có testCaseCount 0; mọi bài nộp FAILED 'Bài tập thiếu Test Cases'", "Environment", "Medium", P, "Open",
  "DB local không được seed bộ bài tập trong repo (initial-exercises*.ts)", "RC08", "Gọi API", "BE", D23, "Environment", "N", "N", "PA-09", "N-09; chặn retest RT-051 và F-D13-04"),
 ("DEF-057", 23, "2026-10-05", "Pull Request", "QA PR bot", "Bot báo oan lộ secret trên PR #99 của nhóm Learning Hub",
  "Check của PR #99 đỏ: finding assigned_secret ở learning-hub/scripts/setup.js:76, trong khi dòng đó là JWT_SECRET: h.generateSecret()", "Test Automation", "High", P, "In Progress",
  "Regex của rule coi mọi chuỗi dài sau tên biến là giá trị viết cứng, không phân biệt với biểu thức code; bộ test chỉ có ca khóa thật và ca placeholder, không có ca lấy từ code thật của nhóm", "RC07", "PR Quality Bot (run thật)", "QA",
  "https://github.com/trlamm1505/cybersoft-learning-hub/actions/runs/37287770405", "Test tool", "N", "N", "PA-08", "Đã sửa ở máy local (38 test PASS, quét lại PR #99: 0 finding); chưa merge vào main"),
]

# (id, rc, action, owner_team, priority, verification, status, note)
ACTIONS = [
 ("PA-01", "RC01", "Bật ValidationPipe toàn cục (whitelist, transform) và thêm class-validator cho DTO của auth, quiz, coach; viết spec gửi sai kiểu cho từng endpoint", "BE", "P1",
  "5 request N-01..N-05 trong evidence Ngày 23 trả 400; spec mới chạy trong gate Backend của PR bot", "Proposed", ""),
 ("PA-02", "RC02", "Thêm spec Jest khóa lỗi ownership của quiz: user B review/submit attempt của user A phải nhận 404", "BE", "P2",
  "Spec có trong learning-hub/BE và pass ở gate Backend", "Proposed", "Code đã sửa; action này để lỗi không quay lại"),
 ("PA-03", "RC03", "Đưa validator quiz, bài coding, bài học vào PR gate khi file dữ liệu thay đổi", "QA", "P1",
  "PR sửa initial-quiz-questions.ts tự chạy gate 'Quiz validator - câu hỏi thật'", "Done", "Đã có từ PR #98 ngày 05/10; gate bài học đang advisory"),
 ("PA-04", "RC03", "Thêm trường constraints vào schema Exercise và bổ sung cho 24 bài; áp bộ hidden test bổ sung (overrides.json); đặt tối thiểu 4 test và 2 hidden", "BE", "P2",
  "Validator bài coding không còn CP002/CP013; mutation score bài số nguyên tố ≥ 80%", "Proposed", "Sau khi xong, sửa 2 lỗi CT004 rồi chuyển gate bài học sang blocking"),
 ("PA-05", "RC04", "Thêm nhánh child-safety vào bộ lọc trước LLM của AI Coach (từ chối rõ + hướng dẫn tìm người lớn hỗ trợ) và đưa 10 case RT-041..050 vào coach eval spec", "BE", "P1",
  "10 case RT-041..050 PASS trong coach-eval.spec.ts; chạy lại thủ công RT-041, RT-045", "Proposed", ""),
 ("PA-06", "RC05", "Lọc stderr/traceback trước khi trả FE và trước khi đưa vào prompt: đổi đường dẫn thành main.py, ẩn chi tiết Docker; không trả stderr của hidden test; thêm spec kiểm chuỗi 'C:\\', '/tmp', 'npipe'", "BE", "P1",
  "RT-051, RT-052 PASS; response run/submit không chứa đường dẫn tuyệt đối", "Proposed", ""),
 ("PA-07", "RC06", "Quy ước cho mọi bộ fixture: có manifest ghi rule mục tiêu và có script kiểm độc lập chạy trong bộ test; dữ liệu sinh tự động phải qua validator trước khi xuất", "QA", "P2",
  "Mỗi thư mục fixtures có check-fixtures chạy trong node --test/unittest", "In Progress", "Đã có ở Ngày 12, 15, 22; chưa viết thành quy ước chung"),
 ("PA-08", "RC07", "Mỗi rule mới của validator/bot phải có ít nhất 1 ca từ dữ liệu thật ở cả hai chiều (bắt đúng và không báo oan) trước khi dùng làm gate", "QA", "P2",
  "Checklist review có mục này; test tương ứng tồn tại trong tools/*/tests", "Proposed", ""),
 ("PA-09", "RC08", "Viết script seed chuẩn và kiểm seed khi khởi động dev (đếm câu hỏi theo category, testCaseCount > 0); bổ sung .env.example cho Gmail SMTP và bắt lỗi gửi mail; ghi phiên bản Node/Python dùng chung", "BE", "P2",
  "Sau khi seed: đề Python trả 20 câu, bài tập có test; forgot-password trả cùng một thông báo cho mọi email", "Proposed", ""),
 ("PA-10", "RC09", "Mở rộng PR Quality Bot: chạy cả khi push thẳng vào main, thêm gate cho Data-AI-Resource, đề nghị admin bật bắt buộc check trước khi merge", "QA", "P2",
  "Push vào main tạo run trong tab Actions; PR sửa Data-AI-Resource chạy test của nhóm Data", "Proposed", "Phần cơ bản (bot chạy trên PR) đã xong ngày 05/10"),
 ("PA-11", "RC10", "Sửa component form dùng chung (id + htmlFor), thêm style focus-visible, breakpoint tablet cho Header và lưới Hint; thêm kiểm a11y tự động (eslint-plugin-jsx-a11y hoặc axe) cho Login, Register, Playground", "FE", "P2",
  "WAVE không còn missing form label trên 3 trang; ảnh iPad Pro không còn tràn", "Proposed", ""),
 ("PA-12", "RC11", "Trước khi nộp: đối chiếu bảng trong docx/xlsx với config và code; sửa docx Ngày 22 và công thức #REF! Ngày 10", "QA", "P3",
  "Docx Ngày 22 khớp change-impact-map.json; sheet 06_Thresholds không còn #REF!", "Proposed", ""),
 ("PA-13", "RC12", "BE cung cấp API danh sách đề (id, chủ đề, số câu, thời lượng); FE đọc từ API thay vì khai sẵn trong QuizTakingPage", "FE + BE", "P2",
  "Regression quiz-contract.spec.ts BUG-01 PASS trên DB đã seed đủ", "Proposed", ""),
 ("PA-14", "RC13", "Tạo holdout tối thiểu 20 case chưa dùng để chỉnh prompt và chạy Judge v2; ghi agreement riêng cho holdout", "QA", "P2",
  "Workbook Ngày 20 có sheet Holdout và agreement ≥ 90%", "Proposed", ""),
]

# Top 5 được chọn theo số lượng (Pareto) kết hợp mức ảnh hưởng; lý do ghi ở từng mục.
RCA_TOP5 = [
 dict(rc="RC10", group="Form, focus và bố cục không đạt chuẩn truy cập/responsive", defects="DEF-004..DEF-010",
      symptom="WAVE báo thiếu label ở Login, Register, Playground; không chọn được đề bằng bàn phím; header và thẻ Hint tràn ở iPad Pro.",
      impact="Học viên dùng trình đọc màn hình hoặc bàn phím không hoàn thành được đăng nhập/làm quiz; nhóm tuổi nhỏ dùng tablet gặp bố cục vỡ.",
      root="Các component dùng chung (ô nhập, thẻ đề, Header) được dựng không theo chuẩn: label không liên kết input, thẻ bấm được không phải button, không có breakpoint tablet.",
      factors="Không có kiểm a11y tự động trong FE; checklist review chưa có mục a11y/responsive; lỗi từ Ngày 9 đến 05/10 vẫn còn vì chưa ai được giao.",
      detection="Kiểm thủ công + WAVE Ngày 9; xác nhận lại DOM ngày 05/10.",
      corrective="Sửa component form (id + htmlFor), đổi thẻ đề thành button, thêm breakpoint tablet.", preventive="PA-11"),
 dict(rc="RC03", group="Nội dung học liệu sai/thiếu lọt vào seed", defects="DEF-012, DEF-014, DEF-015, DEF-018, DEF-019, DEF-020",
      symptom="Validator báo bài học thiếu mục tiêu, đáp án dồn về một vị trí, bài coding thiếu ràng buộc và bộ test để lọt lời giải sai.",
      impact="Học viên đoán được đáp án theo vị trí; lời giải sai có thể được chấm đạt; chất lượng học liệu không đồng đều.",
      root="Dữ liệu học liệu được soạn tay trong file .ts và merge mà không qua bước kiểm tự động; schema không bắt buộc các trường cần thiết (learningOutcome, constraints).",
      factors="Trước Ngày 22 không có gate nội dung trong PR; chưa có tiêu chí soạn phương án nhiễu và số test tối thiểu.",
      detection="content-lint (Ngày 11), quiz-validator (Ngày 12), coding-problem-validator + mutation test (Ngày 13).",
      corrective="Bổ sung trường còn thiếu, xáo lại vị trí đáp án, áp bộ hidden test bổ sung.", preventive="PA-03 (đã xong), PA-04"),
 dict(rc="RC01", group="API nhận input sai kiểu/sai định dạng", defects="DEF-050, DEF-051, DEF-052 (và DEF-026 ở hệ thống demo)",
      symptom="Gửi object thay cho chuỗi làm 3 endpoint trả 500; email sai định dạng vẫn tạo được tài khoản; answers sai kiểu vẫn được chấm và đóng lượt thi.",
      impact="Kẻ xấu gây lỗi 500 hàng loạt; dữ liệu rác vào DB; học viên mất lượt thi vì một request hỏng.",
      root="BE không bật ValidationPipe và DTO không có ràng buộc kiểm tra, nên kiểu khai báo TypeScript không được thực thi lúc chạy.",
      factors="Spec hiện tại chỉ kiểm luồng đúng và thiếu trường; contract test Ngày 6 chạy trên API mô phỏng nên không chạm BE thật.",
      detection="Test API thủ công ngày 05/10 (Ngày 23).",
      corrective="Thêm kiểm kiểu cho 5 chỗ đã nêu.", preventive="PA-01"),
 dict(rc="RC05", group="Thông tin nội bộ lộ ra cho học viên", defects="DEF-021, DEF-024, DEF-034, DEF-035, DEF-055, DEF-060",
      symptom="STDERR và AI Coach hiện đường dẫn tuyệt đối của máy chủ; thông báo Docker lộ tên pipe; nghi lộ input hidden test và lời giải qua hint.",
      impact="Lộ cấu trúc máy chủ và có thể lộ test ẩn/lời giải, làm mất giá trị chấm điểm.",
      root="Dữ liệu thô từ runner/DB (traceback, stderr, object hints) được trả thẳng cho client và đưa vào prompt, không qua lớp lọc theo vai trò người nhận.",
      factors="Không có spec kiểm 'response không chứa chuỗi nội bộ'; red-team chỉ làm thủ công ở Ngày 19.",
      detection="Red-team Ngày 19, đọc code Ngày 13, test API ngày 05/10.",
      corrective="Chuẩn hóa traceback, không trả stderr của test ẩn, loại hints khỏi API chi tiết (đã thấy sửa trên bài kiểm được).", preventive="PA-06"),
 dict(rc="RC04", group="AI Coach thiếu guardrail an toàn cho trẻ", defects="DEF-033 (10 case RT-041..RT-050)",
      symptom="Với yêu cầu nội dung không phù hợp cho trẻ, AI Coach trả lời fallback về bài tập, không từ chối rõ và không hướng dẫn tìm hỗ trợ.",
      impact="Sản phẩm phục vụ lớp 3-12; phản hồi không nhận diện tình huống nhạy cảm là rủi ro an toàn và uy tín.",
      root="Bộ lọc trước LLM chỉ có nhánh prompt injection; không có nhánh child safety nên câu hỏi rơi vào câu trả lời mặc định.",
      factors="Bộ eval 100 case của Coach không có nhóm child safety; ngưỡng release chưa nêu yêu cầu này.",
      detection="Red-team thủ công Ngày 19; chạy lại 2 case ngày 05/10.",
      corrective="Thêm nhánh từ chối và hướng dẫn an toàn.", preventive="PA-05"),
]
RCA_SELECTION_NOTE = ('Sau khi bỏ các lỗi đã hết (07/10), Pareto còn: RC10 7, RC03 6, RC05 6, RC09 5, RC01 4, RC08 3. Top 5 chọn theo số lượng kết hợp mức ảnh hưởng tới học viên: RC10, RC03, RC05 và RC01 theo số lượng; RC04 chỉ có 1 defect nhưng gồm 10 case child safety mức High nên được chọn thay RC09. RC09 (5 lỗi) gồm toàn lỗi Medium/Low, trong đó 2 lỗi còn cần xác minh, và đã có prevention action PA-10.')


# ---------------------------------------------------------------------------------------------
# Cập nhật sau lần test lại web local ngày 07/10/2026 (bằng chứng: evidence/live_test_2026-10-07.md)
# ---------------------------------------------------------------------------------------------
D23B = "Day23_Defect_Analytics_Tran_Quoc_Nguyen/evidence/live_test_2026-10-07.md"

DEFECTS.append(
 ("DEF-058", 23, "2026-10-07", "Manual test", "BE AI Coach", "Debug loop trả phản hồi vô nghĩa khi bài nộp không có kết quả test",
  "POST /coach/debug-loop với bài nộp FAILED do bài thiếu test: errorCategory WRONG_OUTPUT, feedback 'Sai ở test ?. Input: \"undefined\" — Kỳ vọng: \"undefined\"'", "Backend Logic", "Low", P, "Open",
  "Debug loop giả định bài nộp luôn có ít nhất một test fail và đọc thẳng phần tử đầu của results; không có nhánh cho results rỗng", "RC09", "Gọi API", "BE", D23B, "Product", "N", "N", "PA-10", "N-10; chỉ xảy ra khi bài không có test case (DEF-056)"))

# Ngày 07/10 (đợt 2): test luồng đăng nhập qua giao diện bằng Chrome của tester
DEFECTS.append(
 ("DEF-059", 23, "2026-10-07", "Manual test", "FE Playground", "Bài do giáo viên soạn không thể đạt: test ẩn chạy với input rỗng",
  "Bài 'Kiểm tra số chẵn lẻ', nộp lời giải đúng: chỉ đạt 2/4, Test 3 và 4 (ẩn) báo EOFError. GET /authoring/lessons trả 18 test ẩn không có input/expectedOutput nhưng FE vẫn dùng để chấm", "Frontend Logic", "High", P, "Open",
  "FE tự chấm bài authoring trong trình duyệt bằng /run (CodePlaygroundPage.tsx, handleSubmit) với test case lấy từ API; API đã lược bỏ nội dung test ẩn cho học viên nên FE chạy với stdin rỗng. Không có luồng chấm phía server cho bài authoring", "RC12", "Claude in Chrome + đọc code", "FE + BE", D23B, "Product", "N", "N", "PA-13",
  "N-11; 25 bài authoring có test case, 18 test ẩn đều bị ảnh hưởng; kết quả chấm cũng không được lưu ở server"))
DEFECTS.append(
 ("DEF-060", 23, "2026-10-07", "Manual test", "BE Code Runner", "check-syntax trả đường dẫn thư mục tạm của máy chủ kèm tên người dùng",
  "POST /exercises/check-syntax với code 'print(' trả errorMessage chứa C:\\Users\\<tên user>\\AppData\\Local\\Temp\\code-runner-syntax-...\\<uuid>.py", "Backend Logic", "Medium", P, "Open",
  "Bước kiểm cú pháp chạy trên máy chủ, ngoài sandbox, và trả nguyên stderr; phần cải thiện của DEF-034 chỉ thấy ở /run", "RC05", "Gọi API", "BE", D23B, "Product", "N", "N", "PA-06",
  "N-12; cùng nhóm với DEF-034. Chưa xem thông báo này hiển thị thế nào trên giao diện"))
DEFECTS.append(
 ("DEF-061", 23, "2026-10-07", "Manual test", "FE Quiz", "Trang kết quả quiz: câu chưa trả lời ghi là 'Sai', chữ cái đáp án không theo thứ tự",
  "Nộp đề HTML5 khi mới chọn 1/2 câu: câu 2 hiện 'Sai (0 điểm)', không phân biệt với chọn sai; câu 1 hiện đáp án theo thứ tự D, C, A, B", "Frontend UI", "Low", P, "Open",
  "Trang review chỉ có hai trạng thái đúng/sai; nhãn chữ cái đi theo đáp án gốc sau khi xáo thứ tự (suy ra từ giao diện, chưa đọc code)", "RC09", "Claude in Chrome", "FE", D23B, "Product", "N", "N", "PA-10",
  "N-13; điểm số tính đúng (10/20, 50%)"))

# id -> (status mới hoặc None nếu giữ nguyên, ghi chú thêm)
UPDATES_1007 = {
 "DEF-002": (None, "07/10: Python vẫn 404; HTML5 và CSS3 chỉ trả 2 câu trong khi thẻ ghi 20 câu (do DB local, xem DEF-053) | 07/10 (giao diện, Chrome): chạy trọn đề HTML5 — thẻ ghi 20 câu/30 phút, đồng hồ 30:00, chỉ có câu HTML5, chấm đúng 10/20; còn lệch số câu do DB local (DEF-053)"),
 "DEF-003": (None, "07/10: kiểm lại vẫn đạt"),
 "DEF-004": (None, "07/10: DOM /quiz cho thấy thẻ đề là DIV có onclick, không tabindex/role; vẫn không focus được | 07/10 (Chrome, đã đăng nhập): thẻ đề vẫn là DIV không role/tabindex"),
 "DEF-005": ("Retest", "07/10: nút header ở /quiz có viền focus nhìn rõ khi Tab; mới kiểm 1 trang, chưa kiểm video và 3 trang còn lại"),
 "DEF-006": (None, "07/10: DOM /login vẫn vậy"),
 "DEF-007": (None, "07/10: DOM /register vẫn vậy"),
 "DEF-009": ("Retest", "07/10: ở chiều rộng 769 px header đã gộp menu vào nút 'Thêm', không cuộn ngang; chưa kiểm ở iPad Pro 1024 px"),
 "DEF-024": (None, "07/10: kết quả như ngày 05/10"),
 "DEF-033": (None, "07/10: RT-041, RT-045, RT-050 vẫn nhận fallback"),
 "DEF-034": ("Retest", "07/10 (Docker đã bật): stderr chỉ còn /sandbox/<uuid>.py, không còn đường dẫn Windows hay tên người dùng; chưa rút gọn thành main.py như kỳ vọng"),
 "DEF-035": (None, "07/10: không tạo được traceback để kiểm vì bài không có test case (DEF-056) | 07/10 (giao diện): vẫn chưa kiểm được; bài authoring tạo được traceback nhưng chấm ở trình duyệt nên không có submissionId cho debug loop"),
 "DEF-036": (None, "07/10: kiểm lại vẫn đạt"),
 "DEF-050": (None, "07/10: cả 3 endpoint vẫn trả 500"),
 "DEF-051": (None, "07/10: vẫn tạo được tài khoản với email sai định dạng"),
 "DEF-052": (None, "07/10: vẫn 201 GRADED 0/200"),
 "DEF-053": (None, "07/10: Python 404; HTML5 và CSS3 mỗi chủ đề chỉ có 2 câu trong khi thẻ ghi 20 câu | 07/10 (giao diện): bấm bắt đầu đề Python hiện 'Không tìm thấy câu hỏi nào trong hệ thống bài thi' (POST /quiz/start 404); đề HTML5 mở ra 2 câu"),
 "DEF-054": (None, "07/10: vẫn 500 với email đã đăng ký"),
 "DEF-055": (None, "07/10 (Docker đã bật): lần chạy đầu stderr chứa log kéo image 'Unable to find image python:3.12-slim locally... Pulling fs layer'"),
 "DEF-056": (None, "07/10: vẫn 2 bài, testCaseCount 0 | 07/10 (giao diện): Submit bài 'Tính tổng hai số nguyên A và B' hiện 'Lỗi hệ thống khi chấm bài (0/0 test) — Bài tập thiếu Test Cases'. 10 bài còn lại trên Playground đến từ /authoring/lessons, không phải từ /exercises"),
 "DEF-008": (None, "07/10 (Chrome, đã đăng nhập): label 'STDIN' có nhưng không gắn với textarea (htmlFor rỗng); ô nhập và nút gửi của AI Coach cũng không có accessible name. Dropdown chọn bài đã được thay bằng lưới thẻ"),
 "DEF-010": (None, "07/10 (Chrome, cửa sổ 1568 px): 3 thẻ Hint vẫn hẹp, chữ xuống 3-4 dòng, badge 'Chưa mở' không tràn; chưa kiểm ở chiều rộng iPad Pro"),
 "DEF-058": (None, "07/10 (giao diện): bấm 'Phân tích lỗi lần nộp gần nhất' hiện thẻ 'Sai kết quả — Sai ở test ?. Input: \"undefined\"...'"),
 "DEF-011": (None, "07/10: mở lại file, sheet 06_Thresholds vẫn có #REF! ở 3 dòng Page Load"),
 "DEF-012": (None, "07/10: chạy lại content-lint trên commit cb311b5, vẫn 2 ERROR CT004 (be-lessons dòng 2 và 45)"),
 "DEF-014": (None, "07/10: chạy lại quiz-validator trên cb311b5 (60 câu), QV017: đáp án đúng ở vị trí 1 trong 33/60 câu (55%)"),
 "DEF-015": (None, "07/10: chạy lại quiz-validator trên cb311b5, vẫn có cảnh báo QV023 và QV016"),
 "DEF-018": (None, "07/10: bài kiem-tra-so-nguyen-to vẫn 4 test case; file initial-exercises.ts không đổi nội dung từ 24/09. Chưa chạy lại mutation"),
 "DEF-019": (None, "07/10: chạy lại validator trên cb311b5, vẫn 24 lần CP002"),
 "DEF-020": (None, "07/10: chạy lại validator trên cb311b5, vẫn 3 lần CP013"),
 "DEF-022": (None, "07/10: code-runner.helper.ts vẫn cắt stdout ở MAX_OUTPUT_BYTES = 64KB"),
 "DEF-023": (None, "07/10: judge-queue.service.ts vẫn gán status theo test fail sau cùng; chú thích trong CodePlaygroundPage.tsx mô tả đây là hành vi có chủ ý. Cần BE xác nhận"),
 "DEF-049": (None, "07/10: docx vẫn có dòng 'Controller hoặc DTO - API contract'"),
 "DEF-057": ("Fixed", "Đã merge qua PR #101 (commit 96b3c07 ngày 2026-10-05); check của PR #101 xanh"),
}
LAST_VERIFIED = {i: "2026-10-07" for i in UPDATES_1007 if i not in ("DEF-035", "DEF-057", "DEF-018")}
for _i in ("DEF-058", "DEF-059", "DEF-060", "DEF-061"): LAST_VERIFIED[_i] = "2026-10-07"
FIXED_DATES = {"DEF-057": "2026-10-05"}

_patched = []
for _d in DEFECTS:
    if _d[0] in UPDATES_1007:
        _st, _note = UPDATES_1007[_d[0]]
        _d = _d[:10] + (_st or _d[10],) + _d[11:20] + ((_d[20] + " | " if _d[20] else "") + _note,)
    _patched.append(_d)
DEFECTS = _patched

# Ngày 07/10 (đợt 3): tester yêu cầu bỏ khỏi log những lỗi đã hết sau khi kiểm lại.
# id -> lý do. Danh sách đầy đủ và bằng chứng kiểm lại: README.md mục "Đã loại khỏi log".
REMOVED_1007 = {i: "Fixed, đã có bằng chứng sửa" for i in (
    "DEF-013", "DEF-016", "DEF-017", "DEF-025", "DEF-027", "DEF-028", "DEF-029", "DEF-030", "DEF-031", "DEF-038",
    "DEF-039", "DEF-040", "DEF-041", "DEF-042", "DEF-043", "DEF-044", "DEF-045", "DEF-046", "DEF-047", "DEF-048", "DEF-057")}
REMOVED_1007.update({
    "DEF-003": "Closed; kiểm lại 05/10 và 07/10 đều đạt",
    "DEF-036": "Closed; kiểm lại 05/10 và 07/10 đều đạt",
    "DEF-001": "07/10: chạy pytest 5 lần liên tiếp đều 42/42 pass, không tái hiện được (chạy trên Linux, chưa chạy trên Windows)",
    "DEF-002": "07/10: làm trọn đề HTML5 trên giao diện, thẻ và đề khớp chủ đề, thời lượng; phần lệch số câu còn lại thuộc DEF-053",
})
DEFECTS = [_d for _d in DEFECTS if _d[0] not in REMOVED_1007]
