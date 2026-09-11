"""AI-Controlled Synthetic Data Generation Engine.

Integrates:
- Faker (locale vi_VN) with deterministic seed control
- Prompt templates and schema constraints
- Data Quality Harness with self-correction feedback loop
- Fallback generator when max retries exceeded
- Comprehensive error correction logging and summary statistics
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import random
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if sys.stderr.encoding != "utf-8":
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from faker import Faker

try:
    from .quality_harness import DataQualityHarness
except ImportError:
    # Allow running directly as standalone script
    from quality_harness import DataQualityHarness


# Domain knowledge bank for authentic CyberSoft curriculum challenges
DOMAINS_KNOWLEDGE = {
    "Fullstack Web": {
        "modules": [
            "NodeJS Backend & PostgreSQL",
            "React Advanced & Redux Toolkit",
            "Next.js App Router & SSR",
            "GraphQL API Architecture",
            "Microservices with NestJS",
        ],
        "challenges": [
            (
                "CHAL-WEB-001",
                "JWT Authentication & Refresh Token Rotation",
                "Intermediate",
                "Xây dựng middleware xác thực JWT cho API Express kết hợp cơ chế quay vòng Refresh Token trong Redis nhằm ngăn chặn triệt để tấn công Replay Attack khi token bị lộ.",
                "Sử dụng crypto token bảo mật lưu trong HttpOnly Cookie, cập nhật token family trong Redis khi cấp access token mới.",
                [
                    (
                        "Xác thực chữ ký JWT và thời hạn",
                        40,
                        "Kiểm tra tính hợp lệ của token và xử lý đúng mã lỗi 401 khi token hết hạn",
                    ),
                    (
                        "Cơ chế quay vòng Refresh Token",
                        35,
                        "Thu hồi token cũ và sinh cặp token mới an toàn trong Redis",
                    ),
                    (
                        "Bảo mật Cookie và Error Handling",
                        25,
                        "Cấu hình cờ HttpOnly, Secure, SameSite và trả về mã lỗi 403 chuẩn RESTful",
                    ),
                ],
                "const verifyJwtMiddleware = (req, res, next) => { const token = req.cookies.access_token; if (!token) return res.status(401).json({ error: 'Unauthorized' }); jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => { if (err) return res.status(403).json({ error: 'Token invalid' }); req.user = decoded; next(); }); };",
            ),
            (
                "CHAL-WEB-002",
                "Database Indexing & Query Optimization",
                "Advanced",
                "Tối ưu hóa truy vấn tìm kiếm đơn hàng trên cơ sở dữ liệu PostgreSQL quy mô 10 triệu bản ghi, giảm thời gian thực thi truy vấn từ 1.8s xuống dưới 50ms.",
                "Thiết kế Composite Index kết hợp Partial Index và tái cấu trúc truy vấn loại bỏ N+1 query bằng JOIN có điều kiện.",
                [
                    (
                        "Thiết kế Composite Index",
                        45,
                        "Đánh chỉ mục B-tree tối ưu trên các cột filter và sort",
                    ),
                    (
                        "Tái cấu trúc truy vấn SQL",
                        35,
                        "Sử dụng EXPLAIN ANALYZE để chứng minh loại bỏ Sequential Scan",
                    ),
                    (
                        "Benchmark thời gian thực thi",
                        20,
                        "Đo lường P99 latency dưới tải đồng thời 500 requests/s",
                    ),
                ],
                "CREATE INDEX idx_orders_customer_status_created ON orders (customer_id, order_status) INCLUDE (total_amount) WHERE deleted_at IS NULL;\nEXPLAIN ANALYZE SELECT id, total_amount FROM orders WHERE customer_id = $1 AND order_status = 'COMPLETED';",
            ),
            (
                "CHAL-WEB-003",
                "React Custom Hook & Global State Synchronization",
                "Beginner",
                "Hiện thực custom hook useDebounce và usePersistentState để tự động đồng bộ biểu mẫu đăng ký khóa học vào LocalStorage sau mỗi 500ms người dùng dừng gõ phím.",
                "Sử dụng useEffect kết hợp setTimeout và cleanup function để hủy bỏ bộ hẹn giờ trước khi component unmount.",
                [
                    (
                        "Cơ chế Debounce chuẩn",
                        40,
                        "Đảm bảo chỉ kích hoạt hàm lưu sau đúng độ trễ quy định",
                    ),
                    (
                        "Đồng bộ LocalStorage an toàn",
                        35,
                        "Bắt ngoại lệ JSON.parse và kiểm tra dung lượng lưu trữ",
                    ),
                    (
                        "Cleanup effect và Memory leak",
                        25,
                        "Hủy timer đúng quy tắc tránh rò rỉ bộ nhớ",
                    ),
                ],
                "function useDebounce(value, delay = 500) { const [debouncedValue, setDebouncedValue] = useState(value); useEffect(() => { const handler = setTimeout(() => setDebouncedValue(value), delay); return () => clearTimeout(handler); }, [value, delay]); return debouncedValue; }",
            ),
        ],
    },
    "Data & AI Resource Engineer": {
        "modules": [
            "Data Extraction & Scrapy Pipeline",
            "RAG Architecture & Semantic Chunking",
            "Vector Database & Hybrid Search",
            "Data Quality Harness & Guardrails",
            "Fine-Tuning LLM & Evaluation",
        ],
        "challenges": [
            (
                "CHAL-DATA-001",
                "Semantic Chunking & Markdown Header Splitting",
                "Intermediate",
                "Xây dựng bộ phân đoạn văn bản thông minh (Semantic Chunker) tự động chia tách tài liệu quy chế đào tạo theo các tiêu đề H2/H3, bảo toàn trọn vẹn ngữ cảnh điều khoản.",
                "Sử dụng Abstract Syntax Tree (AST) hoặc Regex theo cấu trúc Markdown Header để giữ nguyên khối điều khoản và đính kèm Frontmatter metadata.",
                [
                    (
                        "Bảo toàn ranh giới ngữ nghĩa",
                        40,
                        "Không cắt ngang câu hoặc tách rời điều khoản pháp lý",
                    ),
                    (
                        "Đính kèm Metadata phân đoạn",
                        35,
                        "Tự động gán document_id, section_id và header breadcrumb",
                    ),
                    (
                        "Kiểm soát kích thước token",
                        25,
                        "Đảm bảo mỗi chunk nằm trong khoảng tối ưu 300-600 tokens",
                    ),
                ],
                "def split_markdown_by_headers(content: str, metadata: dict) -> list[dict]:\n    sections = re.split(r'(?m)^##\\s+', content)\n    return [{'section_id': f'{metadata[\"doc_id\"]}-{i:02d}', 'content': s.strip()} for i, s in enumerate(sections) if s.strip()]",
            ),
            (
                "CHAL-DATA-002",
                "Zero Answer Leakage Linter for QA Benchmark",
                "Advanced",
                "Thiết kế thuật toán kiểm tra tự động phát hiện rò rỉ đáp án (Anti-Leakage Linter) trong 100 câu hỏi đánh giá RAG, ngăn chặn việc đưa mã định danh nội bộ vào query.",
                "Ứng dụng N-gram overlap, Named Entity Recognition và Regex heuristic để tính leakage score giữa query và ground-truth citation.",
                [
                    (
                        "Phát hiện mã kỹ thuật nội bộ",
                        40,
                        "Bắt chính xác các chuỗi có định dạng SEC-XXX-YY và DOC-XXX",
                    ),
                    (
                        "Đo lường n-gram lexical similarity",
                        35,
                        "Cảnh báo khi độ trùng khớp cụm từ liên tiếp vượt quá 65%",
                    ),
                    (
                        "Tích hợp CI/CD Exit Code",
                        25,
                        "Trả về mã thoát POSIX 1 khi phát hiện vi phạm rò rỉ",
                    ),
                ],
                "def detect_leakage(query: str, ground_truth: str) -> bool:\n    if re.search(r'SEC-[A-Z]+-\\d+', query, re.I): return True\n    return calculate_longest_common_substring(query.lower(), ground_truth.lower()) > 20",
            ),
            (
                "CHAL-DATA-003",
                "Automated Data Quality Harness for LLM Outputs",
                "Intermediate",
                "Xây dựng khung kiểm định chất lượng tự động (Data Quality Harness) kiểm tra đầu ra dạng JSON của mô hình sinh ngôn ngữ, tự động kích hoạt vòng lặp sửa lỗi khi vi phạm.",
                "Tích hợp Pydantic / JSON Schema kết hợp các quy tắc nghiệp vụ về tổng trọng số và tương quan điểm số, sinh thông điệp chẩn đoán có cấu trúc.",
                [
                    (
                        "Kiểm chuẩn Schema tự động",
                        40,
                        "Xác thực kiểu dữ liệu, trường bắt buộc và định dạng regex",
                    ),
                    (
                        "Vòng lặp tự sửa lỗi (Loop Feedback)",
                        35,
                        "Tạo thông điệp chẩn đoán chi tiết gửi ngược lại cho AI",
                    ),
                    (
                        "Cơ chế Fallback an toàn",
                        25,
                        "Kích hoạt bộ sinh tất định khi vượt quá số lần thử tối đa",
                    ),
                ],
                "class QualityHarness:\n    def validate(self, record: dict) -> tuple[bool, list[str]]:\n        errors = []\n        if sum(c['weight'] for c in record.get('criteria', [])) != 100: errors.append('Rubric sum != 100')\n        return (len(errors) == 0, errors)",
            ),
        ],
    },
    "DevOps Cloud": {
        "modules": [
            "Docker Containerization & Multi-stage",
            "Kubernetes Orchestration & Helm",
            "CI/CD Pipeline with GitHub Actions",
            "Infrastructure as Code with Terraform",
            "Observability with Prometheus & Grafana",
        ],
        "challenges": [
            (
                "CHAL-DEVOPS-001",
                "Multi-Stage Dockerfile Optimization",
                "Beginner",
                "Viết Dockerfile đa tầng (Multi-Stage Build) cho ứng dụng Next.js & Python API, tối ưu kích thước image từ 1.2GB xuống dưới 150MB và bảo đảm bảo mật Non-Root User.",
                "Tách biệt builder stage với runtime stage, sử dụng base image alpine/slim và gán user bảo mật không có quyền sudo.",
                [
                    (
                        "Tối ưu hóa kích thước image",
                        45,
                        "Đạt dung lượng runtime image dưới 150MB",
                    ),
                    (
                        "Thực thi nguyên tắc bảo mật Non-Root",
                        35,
                        "Chạy container với USER nonroot thay vì root",
                    ),
                    (
                        "Tối ưu Docker Build Cache",
                        20,
                        "Sắp xếp thứ tự COPY file dependencies trước mã nguồn",
                    ),
                ],
                'FROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine AS runner\nWORKDIR /app\nUSER node\nCOPY --from=builder /app/.next/standalone ./\nCMD ["node", "server.js"]',
            ),
            (
                "CHAL-DEVOPS-002",
                "Zero-Downtime Rolling Update & HPA in Kubernetes",
                "Advanced",
                "Cấu hình Kubernetes Deployment hỗ trợ cập nhật không gián đoạn (Zero-Downtime Rolling Update) kết hợp Horizontal Pod Autoscaler (HPA) theo chỉ số CPU và Memory.",
                "Thiết lập readinessProbe, livenessProbe, maxSurge: 25%, maxUnavailable: 0 và cấu hình HPA target CPU 70%.",
                [
                    (
                        "Cấu hình Rolling Update Strategy",
                        40,
                        "Đảm bảo 0% request bị drop trong quá trình deploy",
                    ),
                    (
                        "Thiết lập Probes chuẩn xác",
                        35,
                        "Định cấu hình livenessProbe và readinessProbe có delay hợp lý",
                    ),
                    (
                        "Horizontal Pod Autoscaling",
                        25,
                        "Tự động scale từ 3 pods lên tối đa 15 pods khi có tải đột biến",
                    ),
                ],
                "spec:\n  replicas: 3\n  strategy:\n    rollingUpdate:\n      maxSurge: 1\n      maxUnavailable: 0\n  template:\n    spec:\n      containers:\n      - name: api\n        readinessProbe:\n          httpGet: { path: /healthz, port: 8080 }\n          initialDelaySeconds: 5",
            ),
        ],
    },
    "Cybersecurity SOC": {
        "modules": [
            "Network Traffic Analysis with Wireshark",
            "SIEM & Log Correlation with Splunk",
            "Web Application Security & OWASP Top 10",
            "Incident Response & Forensic Basics",
            "Endpoint Detection & Threat Hunting",
        ],
        "challenges": [
            (
                "CHAL-SEC-001",
                "SQL Injection Detection & Prepared Statements",
                "Intermediate",
                "Phân tích lỗ hổng SQL Injection dạng Union-based trên endpoint tra cứu học viên và tái cấu trúc mã nguồn sử dụng Prepared Statements và ORM an toàn.",
                "Thay thế toàn bộ chuỗi nối SQL động bằng Parameterized Queries có kiểu dữ liệu chặt chẽ.",
                [
                    (
                        "Nhận diện chính xác lỗ hổng",
                        40,
                        "Chỉ ra điểm nối chuỗi không an toàn trong mã nguồn",
                    ),
                    (
                        "Áp dụng Parameterized Query",
                        40,
                        "Viết lại truy vấn an toàn chống mọi biến thể bypass",
                    ),
                    (
                        "Xử lý ngoại lệ bảo mật",
                        20,
                        "Không để lộ cấu trúc bảng hay thông báo lỗi database ra client",
                    ),
                ],
                "// Secure implementation\nconst query = 'SELECT id, full_name, email FROM students WHERE student_code = $1';\nconst result = await db.query(query, [sanitizedStudentCode]);",
            ),
        ],
    },
    "Mobile React Native": {
        "modules": [
            "React Native Core & Navigation",
            "Offline-First Architecture with WatermelonDB",
            "Native Modules & Device Features",
            "State Management with Redux Toolkit",
            "Performance Optimization & Hermes",
        ],
        "challenges": [
            (
                "CHAL-MOB-001",
                "Offline-First Data Sync with SQLite",
                "Intermediate",
                "Xây dựng kiến trúc Offline-First cho ứng dụng điểm danh học viên CyberSoft, tự động lưu dữ liệu cục bộ vào SQLite khi mất mạng và đồng bộ lên server khi có internet.",
                "Sử dụng NetInfo lắng nghe trạng thái kết nối mạng, hàng đợi SyncQueue và cơ chế giải quyết xung đột Last-Write-Wins.",
                [
                    (
                        "Lưu trữ cục bộ SQLite",
                        40,
                        "Đảm bảo thao tác điểm danh offline mượt mà không có độ trễ",
                    ),
                    (
                        "Cơ chế giải quyết xung đột đồng bộ",
                        35,
                        "Áp dụng Last-Write-Wins có timestamp kiểm chứng",
                    ),
                    (
                        "Tối ưu hóa thời lượng pin",
                        25,
                        "Chỉ đồng bộ theo đợt (Batch Sync) thay vì gửi đơn lẻ liên tục",
                    ),
                ],
                "const syncOfflineAttendance = async () => {\n  const pending = await db.getUnsyncedRecords();\n  if (pending.length === 0) return;\n  await api.batchUploadAttendance(pending);\n  await db.markAsSynced(pending.map(p => p.id));\n};",
            ),
        ],
    },
}


class ControlledDataGenerator:
    """Deterministic generator coordinating Faker, Prompts, Harness, and Fallback."""

    def __init__(
        self,
        seed: int = 42,
        prompt_version: str = "v2_few_shot_constrained",
        max_retries: int = 3,
        base_dir: Optional[Path] = None,
    ):
        self.seed = seed
        self.prompt_version = prompt_version
        self.max_retries = max_retries
        self.base_dir = base_dir if base_dir else Path(__file__).resolve().parent.parent

        self.faker = Faker("vi_VN")
        self.harness = DataQualityHarness(
            schema_path=str(self.base_dir / "data_dictionary" / "record_schema.json")
        )

        # Setup logging
        self.log_dir = self.base_dir / "data" / "logs"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = self.log_dir / "error_correction_loop.log"
        self.summary_file = self.log_dir / "correction_summary.json"

        logging.basicConfig(
            filename=str(self.log_file),
            filemode="w",
            format="%(asctime)s [%(levelname)s] %(message)s",
            level=logging.INFO,
            encoding="utf-8",
        )
        self.logger = logging.getLogger("ControlledDataGenerator")

    def _get_deterministic_rng(self, record_idx: int) -> Tuple[random.Random, Faker]:
        """Produce deterministic random number generator and Faker for record i."""
        record_seed = (self.seed * 10007 + record_idx * 37) % (2**31 - 1)
        rng = random.Random(record_seed)
        faker_instance = Faker("vi_VN")
        faker_instance.seed_instance(record_seed)
        return rng, faker_instance

    def _build_candidate_record(
        self,
        record_idx: int,
        attempt: int,
        corrective_guidance: str = "",
        force_defect: bool = False,
        persist_defect: bool = False,
    ) -> Dict[str, Any]:
        """Synthesize candidate record according to schema and prompt rules."""
        rng, fkr = self._get_deterministic_rng(record_idx)
        record_id = f"REC-CYB-{record_idx + 1:04d}"

        # Select track with balanced quota
        tracks = [
            "Fullstack Web",
            "Data & AI Resource Engineer",
            "DevOps Cloud",
            "Cybersecurity SOC",
            "Mobile React Native",
        ]
        # Distribute: 0-24 Web, 25-49 Data/AI, 50-69 DevOps, 70-84 Sec, 85-99 Mobile
        if record_idx < 25:
            track = tracks[0]
        elif record_idx < 50:
            track = tracks[1]
        elif record_idx < 70:
            track = tracks[2]
        elif record_idx < 85:
            track = tracks[3]
        else:
            track = tracks[4]

        track_data = DOMAINS_KNOWLEDGE[track]
        current_module = rng.choice(track_data["modules"])
        chal_tuple = rng.choice(track_data["challenges"])
        chal_id, topic, difficulty, prob_stmt, concept, raw_criteria, code_snippet = (
            chal_tuple
        )

        # Student profile via Faker
        first_names = [
            "Nguyễn",
            "Trần",
            "Lê",
            "Phạm",
            "Hoàng",
            "Huỳnh",
            "Phan",
            "Vũ",
            "Võ",
            "Đặng",
            "Bùi",
            "Đỗ",
        ]
        middle_names = [
            "Văn",
            "Thị",
            "Hữu",
            "Đức",
            "Minh",
            "Quang",
            "Anh",
            "Thành",
            "Gia",
            "Thế",
        ]
        last_names = [
            "An",
            "Bình",
            "Cường",
            "Dũng",
            "Em",
            "Giang",
            "Hải",
            "Khánh",
            "Lâm",
            "Nam",
            "Phong",
            "Quân",
            "Sơn",
            "Tùng",
            "Việt",
        ]
        student_name = f"{rng.choice(first_names)} {rng.choice(middle_names)} {rng.choice(last_names)}"
        student_id = f"HV-{10000 + record_idx * 17 % 90000:05d}"
        clean_email_prefix = fkr.user_name()
        email = f"{clean_email_prefix}_{record_idx+1}@cybersoft.edu.vn"
        prior_exp = rng.randint(0, 36)

        # Status distribution: 65% PASSED, 20% FAILED_TESTS, 10% SYNTAX_ERROR, 5% TIMEOUT
        status_prob = rng.random()
        if status_prob < 0.65:
            status = "PASSED"
            valid_score = rng.randint(75, 98)
            feedback = f"Bài làm của {student_name} đạt kết quả xuất sắc, kiến trúc mã nguồn đáp ứng đúng tiêu chuẩn kỹ thuật của CyberSoft và vượt qua toàn bộ test cases."
        elif status_prob < 0.85:
            status = "FAILED_TESTS"
            valid_score = rng.randint(40, 68)
            feedback = "Học viên đã nắm được khung kiến trúc cơ bản, tuy nhiên giải pháp chưa xử lý triệt để các trường hợp biên và ngoại lệ thời gian chờ."
        elif status_prob < 0.95:
            status = "SYNTAX_ERROR"
            valid_score = rng.randint(10, 25)
            feedback = "Mã nguồn bị lỗi cú pháp tại dòng thực thi, học viên cần kiểm tra lại định dạng biến và cú pháp hàm trước khi chạy kiểm thử."
        else:
            status = "TIMEOUT"
            valid_score = rng.randint(5, 20)
            feedback = "Thuật toán rơi vào vòng lặp vô hạn hoặc thời gian xử lý vượt quá ngưỡng quy định (Timeout > 5000ms), cần tối ưu độ phức tạp thời gian."

        # INTENTIONAL DEFECT SIMULATION for demonstrating self-correction loop
        # Record 7: Rubric criteria sum != 100 on attempt 0
        # Record 18: Status vs Score conflict on attempt 0
        # Record 35: Placeholder token detected on attempt 0
        is_defective = force_defect and (attempt == 0 or persist_defect)
        rubric_criteria = []
        if is_defective:
            if record_idx % 3 == 0:
                # Defect 1: Rubric criteria sum == 115%
                rubric_criteria = [
                    {
                        "criterion_name": raw_criteria[0][0],
                        "weight_percent": 50,
                        "description": raw_criteria[0][2],
                    },
                    {
                        "criterion_name": raw_criteria[1][0],
                        "weight_percent": 40,
                        "description": raw_criteria[1][2],
                    },
                    {
                        "criterion_name": raw_criteria[2][0],
                        "weight_percent": 25,
                        "description": raw_criteria[2][2],
                    },
                ]
                score = valid_score
            elif record_idx % 3 == 1:
                # Defect 2: Score conflict (FAILED_TESTS but score = 88)
                rubric_criteria = [
                    {
                        "criterion_name": c[0],
                        "weight_percent": c[1],
                        "description": c[2],
                    }
                    for c in raw_criteria
                ]
                status = "FAILED_TESTS"
                score = 88
            else:
                # Defect 3: Prohibited marker
                rubric_criteria = [
                    {
                        "criterion_name": c[0],
                        "weight_percent": c[1],
                        "description": c[2],
                    }
                    for c in raw_criteria
                ]
                prob_stmt = (
                    prob_stmt + " [TODO: Cần bổ sung thêm yêu cầu kiểm thử tải trọng]."
                )
                score = valid_score
        else:
            # Normal or corrected attempt
            rubric_criteria = [
                {"criterion_name": c[0], "weight_percent": c[1], "description": c[2]}
                for c in raw_criteria
            ]
            score = valid_score

        # Ensure rubric sum is exactly 100 if not defective
        if not is_defective:
            sum_w = sum(c["weight_percent"] for c in rubric_criteria)
            if sum_w != 100 and len(rubric_criteria) > 0:
                rubric_criteria[-1]["weight_percent"] += 100 - sum_w

        # Candidate record object
        sub_time = datetime(2026, 9, 11, 8, 0, 0, tzinfo=timezone.utc).isoformat()
        candidate = {
            "record_id": record_id,
            "student_profile": {
                "student_id": student_id,
                "full_name": student_name,
                "email": email,
                "track": track,
                "current_module": current_module,
                "prior_coding_experience_months": prior_exp,
            },
            "learning_assessment": {
                "challenge_id": chal_id,
                "topic": topic,
                "difficulty_level": difficulty,
                "problem_statement": prob_stmt,
                "expected_solution_concept": concept,
                "rubric_criteria": rubric_criteria,
            },
            "student_submission": {
                "submission_code": code_snippet,
                "submission_timestamp": sub_time,
                "execution_status": status,
                "score": score,
                "mentor_feedback": feedback,
            },
            "generation_metadata": {
                "seed": self.seed,
                "prompt_version": self.prompt_version,
                "generator_iteration": attempt,
                "validation_status": "PASSED",
            },
        }

        # Calculate and attach checksum
        checksum = self.harness.calculate_checksum(candidate)
        candidate["generation_metadata"]["checksum_sha256"] = checksum
        return candidate

    def _generate_fallback_record(self, record_idx: int) -> Dict[str, Any]:
        """Generate guaranteed compliant fallback record using seed-anchored templates."""
        record_id = f"REC-CYB-{record_idx + 1:04d}"
        rng, _ = self._get_deterministic_rng(record_idx)
        fallback = {
            "record_id": record_id,
            "student_profile": {
                "student_id": f"HV-{10000 + record_idx:05d}",
                "full_name": "Đào Trung Kiên",
                "email": f"fallback_student_{record_idx+1}@cybersoft.edu.vn",
                "track": "Data & AI Resource Engineer",
                "current_module": "Data Quality Harness & Guardrails",
                "prior_coding_experience_months": 12,
            },
            "learning_assessment": {
                "challenge_id": "CHAL-DATA-003",
                "topic": "Deterministic Fallback & Safe AI Data Synthesis",
                "difficulty_level": "Intermediate",
                "problem_statement": "Thiết lập cơ chế dự phòng tất định (Deterministic Fallback) bảo đảm tính toàn vẹn của dữ liệu học tập khi AI vượt quá số vòng lặp sửa lỗi tối đa.",
                "expected_solution_concept": "Sử dụng mẫu chuẩn có kiểm định nghiêm ngặt từ trước, gán siêu dữ liệu FALLBACK_APPLIED để phục vụ kiểm toán.",
                "rubric_criteria": [
                    {
                        "criterion_name": "Cấu trúc Fallback đạt chuẩn",
                        "weight_percent": 50,
                        "description": "Tuân thủ tuyệt đối 100% schema và các ràng buộc bất biến",
                    },
                    {
                        "criterion_name": "Ghi nhận Audit Trail",
                        "weight_percent": 50,
                        "description": "Gắn nhãn FALLBACK_APPLIED và lưu vết đầy đủ trong nhật ký hệ thống",
                    },
                ],
            },
            "student_submission": {
                "submission_code": "def fallback_safe_eval(): return {'status': 'PASSED', 'score': 85}",
                "submission_timestamp": datetime(
                    2026, 9, 11, 8, 30, 0, tzinfo=timezone.utc
                ).isoformat(),
                "execution_status": "PASSED",
                "score": 85,
                "mentor_feedback": "Bản ghi dự phòng tất định đã được kích hoạt thành công, bảo đảm an toàn dữ liệu và không làm gián đoạn pipeline sinh dữ liệu.",
            },
            "generation_metadata": {
                "seed": self.seed,
                "prompt_version": "fallback_deterministic",
                "generator_iteration": self.max_retries,
                "validation_status": "FALLBACK_APPLIED",
            },
        }
        checksum = self.harness.calculate_checksum(fallback)
        fallback["generation_metadata"]["checksum_sha256"] = checksum
        return fallback

    def synthesize_dataset(
        self,
        count: int = 100,
        inject_defects_indices: Optional[List[int]] = None,
        force_fallback_indices: Optional[List[int]] = None,
        export_files: bool = True,
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Run controlled synthesis pipeline over count records with self-correction loop."""
        if inject_defects_indices is None:
            # Inject defects on a few records to demonstrate and log self-correction
            inject_defects_indices = [7, 18, 35, 52, 68, 83]
        if force_fallback_indices is None:
            # Do not force fallback by default, or keep 0 fallback for clean DoD
            force_fallback_indices = []

        self.logger.info("=" * 80)
        self.logger.info(
            f"STARTING SYNTHESIS PIPELINE: {count} records | Seed={self.seed} | Prompt={self.prompt_version}"
        )
        self.logger.info("=" * 80)

        dataset: List[Dict[str, Any]] = []
        stats = {
            "total_requested": count,
            "passed_immediate_iter0": 0,
            "corrected_in_loop": 0,
            "fallback_applied": 0,
            "total_retries_executed": 0,
            "correction_events": [],
        }

        for idx in range(count):
            record_id = f"REC-CYB-{idx + 1:04d}"
            should_inject = idx in inject_defects_indices
            should_force_fallback = idx in force_fallback_indices

            record_final = None
            attempt = 0
            corrective_guidance = ""

            while attempt <= self.max_retries:
                # Generate candidate
                force_defect = should_inject or should_force_fallback
                candidate = self._build_candidate_record(
                    record_idx=idx,
                    attempt=attempt,
                    corrective_guidance=corrective_guidance,
                    force_defect=force_defect,
                    persist_defect=should_force_fallback,
                )

                # Inspect with Data Quality Harness
                inspection = self.harness.inspect_record(candidate)

                if inspection.passed:
                    if attempt == 0:
                        stats["passed_immediate_iter0"] += 1
                        self.logger.info(f"[{record_id}] PASSED on initial attempt 0.")
                    else:
                        stats["corrected_in_loop"] += 1
                        self.logger.info(
                            f"[{record_id}] SELF-CORRECTED successfully on attempt {attempt}."
                        )
                        stats["correction_events"].append(
                            {
                                "record_id": record_id,
                                "resolved_at_attempt": attempt,
                                "status": "CORRECTED",
                            }
                        )
                    record_final = candidate
                    break
                else:
                    stats["total_retries_executed"] += 1
                    self.logger.warning(
                        f"[{record_id}] Attempt {attempt} FAILED ({inspection.error_count} errors): "
                        f"{inspection.corrective_guidance}"
                    )
                    corrective_guidance = inspection.corrective_guidance
                    attempt += 1

            # If all attempts exhausted, trigger Fallback
            if record_final is None:
                self.logger.error(
                    f"[{record_id}] Max retries ({self.max_retries}) exceeded! Triggering Deterministic Fallback Generator."
                )
                record_final = self._generate_fallback_record(idx)
                stats["fallback_applied"] += 1
                stats["correction_events"].append(
                    {
                        "record_id": record_id,
                        "resolved_at_attempt": self.max_retries,
                        "status": "FALLBACK_TRIGGERED",
                    }
                )

            dataset.append(record_final)

        # Write output files if requested
        if export_files:
            self._export_outputs(dataset, stats)
        return dataset, stats

    def _export_outputs(
        self, dataset: List[Dict[str, Any]], stats: Dict[str, Any]
    ) -> None:
        """Export JSON, CSV, logs, and summary reports."""
        data_dir = self.base_dir / "data"
        data_dir.mkdir(parents=True, exist_ok=True)

        json_path = data_dir / "synthetic_learning_eval_dataset.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2)

        # Flatten records for CSV
        csv_path = data_dir / "synthetic_learning_eval_dataset.csv"
        with open(csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    "record_id",
                    "student_id",
                    "student_name",
                    "email",
                    "track",
                    "current_module",
                    "prior_exp_months",
                    "challenge_id",
                    "topic",
                    "difficulty",
                    "rubric_criteria_count",
                    "execution_status",
                    "score",
                    "generator_iteration",
                    "validation_status",
                    "checksum_sha256",
                ]
            )
            for r in dataset:
                prof = r["student_profile"]
                ass = r["learning_assessment"]
                sub = r["student_submission"]
                meta = r["generation_metadata"]
                writer.writerow(
                    [
                        r["record_id"],
                        prof["student_id"],
                        prof["full_name"],
                        prof["email"],
                        prof["track"],
                        prof["current_module"],
                        prof["prior_coding_experience_months"],
                        ass["challenge_id"],
                        ass["topic"],
                        ass["difficulty_level"],
                        len(ass["rubric_criteria"]),
                        sub["execution_status"],
                        sub["score"],
                        meta["generator_iteration"],
                        meta["validation_status"],
                        meta["checksum_sha256"],
                    ]
                )

        # Write correction summary
        with open(self.summary_file, "w", encoding="utf-8") as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)

        self.logger.info("=" * 80)
        self.logger.info(
            f"SYNTHESIS COMPLETED: {len(dataset)} records saved to JSON & CSV."
        )
        self.logger.info(f"Summary: {stats}")
        self.logger.info("=" * 80)


def main():
    parser = argparse.ArgumentParser(
        description="CyberSoft Controlled Synthetic Data Generator"
    )
    parser.add_argument(
        "--seed", type=int, default=42, help="Deterministic random seed"
    )
    parser.add_argument(
        "--count", type=int, default=100, help="Number of records to generate"
    )
    parser.add_argument(
        "--prompt-version",
        type=str,
        default="v2_few_shot_constrained",
        help="Prompt version",
    )
    parser.add_argument(
        "--max-retries", type=int, default=3, help="Max retries in loop"
    )
    args = parser.parse_args()

    print(
        f"Executing CyberSoft Controlled Synthetic Data Pipeline (Seed={args.seed}, Count={args.count})..."
    )
    generator = ControlledDataGenerator(
        seed=args.seed,
        prompt_version=args.prompt_version,
        max_retries=args.max_retries,
    )
    dataset, stats = generator.synthesize_dataset(count=args.count)
    print(f"[SUCCESS] Synthesized {len(dataset)} records.")
    print(f"  - Passed Iteration 0: {stats['passed_immediate_iter0']}/{args.count}")
    print(f"  - Self-Corrected in Loop: {stats['corrected_in_loop']}/{args.count}")
    print(f"  - Fallback Applied: {stats['fallback_applied']}/{args.count}")
    print("  - Outputs: data/synthetic_learning_eval_dataset.json & .csv")
    print("  - Log: data/logs/error_correction_loop.log")


if __name__ == "__main__":
    main()
