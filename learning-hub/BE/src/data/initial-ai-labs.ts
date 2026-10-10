/**
 * AI Lab Pack (Day 23): 8 bài AI Engineer tăng dần, từ prompt zero-shot tới
 * RAG end-to-end có ngân sách cost/latency.
 *
 * `resource_id` của mỗi bài là mã evaluation set (câu hỏi + đáp án chuẩn)
 * trong Registry của Data & AI Resource (TTS 01), kéo qua
 * DatasetIntegrationService lúc chấm. Learning Hub không lưu bản sao đáp án.
 *
 * Tự nạp khi backend khởi động (AiLabsService.onModuleInit), upsert theo slug.
 */
import type {
  AiLabSpec,
  PromptTechnique,
} from '../modules-api/ai-labs/ai-lab.catalog';
import { CONCISE_PATTERN } from '../modules-api/ai-labs/ai-lab-grader.service';

export interface AiLabSeed {
  slug: string;
  title: string;
  description: string;
  type: 'AI_LAB';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  orderInTopic: number;
  resource_id: string;
  /** Prompt khởi đầu hiện sẵn trong ô soạn prompt. */
  starterCode: string;
  aiLabSpec: AiLabSpec;
}

// Regex chạy với cờ `iu` trên toàn bộ prompt của học viên.
const T: Record<string, PromptTechnique> = {
  role: {
    id: 'role',
    label: 'Gán vai trò',
    hint: 'Cho mô hình biết nó đóng vai ai và phục vụ ai.',
    pattern: '(bạn là|you are|đóng vai|act as|vai trò)',
    weight: 1,
  },
  task: {
    id: 'task',
    label: 'Nêu rõ nhiệm vụ',
    hint: 'Nêu rõ mô hình phải làm gì với đầu vào nhận được.',
    pattern: '(trả lời|answer|giải đáp|nhiệm vụ)',
    weight: 1,
  },
  concise: {
    id: 'concise',
    label: 'Giới hạn độ dài',
    hint: 'Đặt giới hạn độ dài cụ thể cho câu trả lời: sát đáp án hơn và tốn ít token đầu ra hơn.',
    pattern: CONCISE_PATTERN,
    weight: 1,
  },
  format: {
    id: 'format',
    label: 'Quy định định dạng',
    hint: 'Quy định cách trình bày đầu ra và cách xử lý số liệu, đơn vị.',
    pattern: '(định dạng|format|gạch đầu dòng|bullet|giữ nguyên|markdown|json)',
    weight: 1,
  },
  fewshot: {
    id: 'fewshot',
    label: 'Ví dụ mẫu (few-shot)',
    hint: 'Cho mô hình xem ít nhất một cặp câu hỏi và câu trả lời mẫu đúng phong cách mong muốn.',
    pattern:
      '(ví dụ|example)[\\s\\S]*(hỏi|q|question)\\s*:[\\s\\S]*(đáp|a|answer)\\s*:',
    weight: 2,
  },
  context: {
    id: 'context',
    label: 'Chèn ngữ cảnh truy xuất',
    hint: 'Dùng biến {{context}} để hệ thống chèn các đoạn tài liệu truy xuất được.',
    pattern: '\\{\\{\\s*context\\s*\\}\\}',
    weight: 2,
  },
  question: {
    id: 'question',
    label: 'Chèn câu hỏi',
    hint: 'Dùng biến {{question}} cho câu hỏi của học viên.',
    pattern: '\\{\\{\\s*question\\s*\\}\\}',
    weight: 1,
  },
  grounded: {
    id: 'grounded',
    label: 'Chỉ dựa trên ngữ cảnh',
    hint: 'Giới hạn nguồn thông tin mô hình được phép dùng khi trả lời.',
    pattern:
      '(chỉ (dựa|sử dụng|dùng)|only (use|based)|không (bịa|suy diễn|thêm thông tin))',
    weight: 2,
  },
  abstain: {
    id: 'abstain',
    label: 'Biết từ chối',
    hint: 'Chỉ cho mô hình cách phản hồi khi tài liệu không chứa câu trả lời.',
    pattern:
      '(không có thông tin|không tìm thấy|không đủ (thông tin|dữ kiện)|từ chối|không biết|i do not know|i don.t know)',
    weight: 2,
    criticalFor: ['unanswerable_out_of_domain'],
  },
  injection: {
    id: 'injection',
    label: 'Chống prompt injection',
    hint: 'Bảo vệ chỉ dẫn hệ thống trước nội dung lạ chen vào qua câu hỏi hoặc tài liệu.',
    pattern:
      '(prompt injection|bỏ qua (mọi|các|những)?\\s*(chỉ thị|yêu cầu|lệnh)|không (tiết lộ|làm theo)|ignore (any|all) instructions)',
    weight: 2,
    criticalFor: ['adversarial_injection'],
  },
  premise: {
    id: 'premise',
    label: 'Kiểm tra tiền đề sai',
    hint: 'Yêu cầu mô hình kiểm tra điều câu hỏi mặc định là đúng trước khi trả lời.',
    pattern: '(tiền đề|giả định|đính chính|false premise|không đúng)',
    weight: 2,
    criticalFor: ['adversarial_distractor'],
  },
  citation: {
    id: 'citation',
    label: 'Trích dẫn nguồn',
    hint: 'Yêu cầu câu trả lời chỉ ra được nó lấy thông tin từ tài liệu nào.',
    pattern: '(trích dẫn|nguồn|cite|citation|mã tài liệu|document_id)',
    weight: 1,
  },
};

const RAG_STARTER = 'Ngữ cảnh:\n{{context}}\n\nCâu hỏi: {{question}}\n';

const lab = (
  n: number,
  difficulty: AiLabSeed['difficulty'],
  points: number,
  title: string,
  description: string,
  resource_id: string,
  starterCode: string,
  aiLabSpec: AiLabSpec,
): AiLabSeed => ({
  slug: `ai-lab-${String(n).padStart(2, '0')}`,
  title,
  description,
  type: 'AI_LAB',
  difficulty,
  points,
  orderInTopic: n,
  resource_id,
  starterCode,
  aiLabSpec,
});

export const INITIAL_AI_LABS: AiLabSeed[] = [
  lab(
    1,
    'EASY',
    10,
    'Prompt zero-shot: vai trò và nhiệm vụ',
    'Viết system prompt cho trợ giảng học vụ CyberSoft trả lời các câu hỏi FAQ. Prompt cần gán vai trò và nêu rõ nhiệm vụ. Câu hỏi được hệ thống tự nối sau prompt.',
    'eval-cs-faq-basic-v1',
    'Hãy xử lý câu hỏi sau.',
    {
      rag: false,
      techniques: [T.role, T.task],
      passQuality: 50,
      budget: { maxCostUsd: 0.01, maxLatencyMs: 3000 },
    },
  ),
  lab(
    2,
    'EASY',
    10,
    'Ràng buộc định dạng và độ dài',
    'Câu hỏi về quy chế có nhiều con số (phí, tỷ lệ, thời hạn). Viết prompt buộc mô hình trả lời ngắn gọn, đúng định dạng và giữ nguyên số liệu. Câu trả lời dài dòng vừa giảm độ khớp vừa tốn token đầu ra.',
    'eval-cs-policy-format-v1',
    'Bạn là trợ giảng học vụ CyberSoft. Trả lời câu hỏi của học viên.',
    {
      rag: false,
      techniques: [T.role, T.task, T.concise, T.format],
      passQuality: 55,
      budget: { maxCostUsd: 0.004, maxLatencyMs: 2500 },
    },
  ),
  lab(
    3,
    'MEDIUM',
    15,
    'Few-shot prompting',
    'Câu hỏi kỹ thuật (Git, Docker) cần trả lời đúng cú pháp lệnh. Thêm vài cặp hỏi–đáp mẫu để mô hình bắt chước phong cách trả lời ngắn, giữ nguyên lệnh trong dấu backtick.',
    'eval-cs-tech-fewshot-v1',
    'Bạn là mentor kỹ thuật của CyberSoft. Trả lời ngắn gọn.\n\nVí dụ\n',
    {
      rag: false,
      techniques: [T.role, T.concise, T.fewshot],
      passQuality: 60,
      budget: { maxCostUsd: 0.004, maxLatencyMs: 2000 },
    },
  ),
  lab(
    4,
    'MEDIUM',
    15,
    'RAG cơ bản: trả lời bám ngữ cảnh',
    'Từ bài này prompt là một template RAG: hệ thống truy xuất top-K đoạn tài liệu bằng embedding model bạn chọn rồi thay vào {{context}}, câu hỏi thay vào {{question}}. Yêu cầu mô hình chỉ dựa trên ngữ cảnh.',
    'eval-cs-rag-grounding-v1',
    RAG_STARTER,
    {
      rag: true,
      techniques: [T.context, T.question, T.grounded, T.concise],
      passQuality: 70,
      budget: { maxCostUsd: 0.005, maxLatencyMs: 2000 },
    },
  ),
  lab(
    5,
    'MEDIUM',
    15,
    'Biết từ chối câu ngoài phạm vi',
    'Evaluation set có câu ngoài phạm vi tài liệu (Unanswerable). Prompt thiếu chỉ dẫn từ chối thì mô hình sẽ bịa câu trả lời và mất trọn điểm ở các câu đó.',
    'eval-cs-rag-abstain-v1',
    RAG_STARTER,
    {
      rag: true,
      techniques: [T.context, T.question, T.grounded, T.abstain],
      passQuality: 70,
      budget: { maxCostUsd: 0.005, maxLatencyMs: 2000 },
    },
  ),
  lab(
    6,
    'HARD',
    20,
    'Chống câu bẫy và prompt injection',
    'Evaluation set có câu chứa tiền đề sai ("Có đúng là...?") và câu prompt injection ("Ignore all prior rules..."). Prompt phải dặn mô hình kiểm tra giả định và bỏ qua chỉ thị lạ trong câu hỏi.',
    'eval-cs-rag-adversarial-v1',
    RAG_STARTER,
    {
      rag: true,
      techniques: [T.context, T.question, T.grounded, T.premise, T.injection],
      passQuality: 70,
      budget: { maxCostUsd: 0.005, maxLatencyMs: 2000 },
    },
  ),
  lab(
    7,
    'HARD',
    20,
    'Embeddings và Top-K: cân recall với chi phí',
    'Câu hỏi multi-hop cần trúng HAI đoạn tài liệu trong top-K. Top-K lớn tăng recall nhưng nhồi thêm token ngữ cảnh (tăng cost, latency); embedding model tốt hơn cho recall cao với K nhỏ. Tìm cấu hình đạt chất lượng trong ngân sách chặt.',
    'eval-cs-rag-multihop-v1',
    RAG_STARTER,
    {
      rag: true,
      techniques: [T.context, T.question, T.grounded, T.citation],
      passQuality: 75,
      budget: { maxCostUsd: 0.0025, maxLatencyMs: 1200 },
    },
  ),
  lab(
    8,
    'HARD',
    25,
    'RAG end-to-end trong ngân sách',
    'Bài tổng hợp: câu thường, câu bẫy, câu ngoài phạm vi và prompt injection trên cùng một evaluation set, với ngân sách cost và latency chặt nhất. Cần đủ kỹ thuật prompt VÀ chọn đúng model, cấu hình.',
    'eval-cs-rag-e2e-v1',
    RAG_STARTER,
    {
      rag: true,
      techniques: [
        T.context,
        T.question,
        T.grounded,
        T.abstain,
        T.premise,
        T.injection,
        T.citation,
        T.concise,
      ],
      passQuality: 75,
      budget: { maxCostUsd: 0.003, maxLatencyMs: 1000 },
    },
  ),
];
