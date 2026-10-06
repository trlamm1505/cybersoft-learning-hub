/**
 * Hợp đồng dữ liệu giữa Learning Hub (TTS 02) và Data & AI Resource (TTS 01).
 *
 * Nguồn: `GET /api/v1/registry/datasets/{dataset_id}` trong OpenAPI 3.1 do
 * TTS 01 phát hành ở Day 21 (envelope `{ success, data, meta }`). Bản v1.0
 * chỉ có `schema_definition` phẳng (một danh sách cột), chưa có cấu trúc
 * nhiều bảng và chưa có địa chỉ sandbox DB, nên hai trường `data_dictionary`
 * và `sandbox_db_url` dưới đây là PHẦN MỞ RỘNG đề xuất cho v1.1, chờ TTS 01
 * xác nhận. Learning Hub không lưu bản sao cấu trúc bảng hay dữ liệu gốc,
 * mọi thông tin dataset đều đi qua DatasetIntegrationService.
 */

/** Một cột trong data dictionary (giữ nguyên tên trường snake_case của TTS 01). */
export interface DatasetColumn {
  name: string;
  type: string;
  nullable: boolean;
  pk?: boolean;
  /** Tham chiếu khóa ngoại dạng `table.column`, null nếu không có. */
  fk?: string | null;
  description: string;
}

export interface DatasetTable {
  name: string;
  description?: string;
  row_count?: number;
  primary_key?: string;
  columns: DatasetColumn[];
}

/** Payload `data` trong envelope thành công của TTS 01 (các trường Learning Hub dùng). */
export interface RegistryDatasetDetail {
  id: string;
  name: string;
  current_version?: string;
  description?: string;
  schema_definition?: Array<Omit<DatasetColumn, 'pk' | 'fk'>>;
  /**
   * Server thật của TTS 01 trả MẢNG bảng (`RegistryDictionaryTable`); bản mô phỏng
   * v1.1 trả `{ tables: [...] }`. Adapter trong DatasetIntegrationService chuẩn hóa
   * về `{ tables: DatasetTable[] }`.
   */
  data_dictionary?: RegistryDictionaryTable[] | { tables: DatasetTable[] };
  /** Chỉ có ở bản mô phỏng; server thật không cấp (sandbox do Learning Hub quản lý). */
  sandbox_db_url?: string;
}

/** Cột trong data_dictionary của server thật TTS 01 (Day 21). */
export interface RegistryDictionaryColumn {
  name: string;
  data_type: string;
  nullable?: boolean;
  is_primary_key?: boolean;
  is_foreign_key?: boolean;
  /** Dạng `bảng.cột`. */
  foreign_key_target?: string | null;
  description?: string;
}

export interface RegistryDictionaryTable {
  table_name: string;
  file_name?: string | null;
  row_count?: number | null;
  primary_key?: string | null;
  description?: string | null;
  columns: RegistryDictionaryColumn[];
}

export interface RegistryEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; request_id?: string };
}

/** Hợp đồng nội bộ mà mọi module lab của Learning Hub tiêu thụ. */
export interface DatasetContract {
  resource_id: string;
  dataset_name: string;
  version: string;
  data_dictionary: { tables: DatasetTable[] };
  /**
   * Chuỗi kết nối tới DB cô lập do TTS 01 cấp, có chứa thông tin đăng nhập.
   * Chỉ dùng ở backend, KHÔNG BAO GIỜ trả về cho trình duyệt.
   */
  sandbox_db_url: string;
}

/** Bản an toàn để trả cho FE: bỏ `sandbox_db_url`. */
export type PublicDatasetContract = Omit<DatasetContract, 'sandbox_db_url'>;

/**
 * Evaluation set RAG của TTS 01 (bộ câu hỏi Day 08, golden set Day 14/20).
 * OpenAPI v1.0 chưa có route này: `GET /api/v1/registry/evaluation-sets/{id}`
 * là PHẦN MỞ RỘNG đề xuất cho v1.1, cùng envelope với Registry. Tên trường
 * câu hỏi giữ đúng như `rag_eval_questions.json` / `golden_rag_eval_v1.json`.
 */
export type EvalExpectedBehavior = 'ANSWER' | 'ABSTAIN';

export interface RegistryEvalItem {
  question_id: string;
  query: string;
  /** vd `standard_qa`, `ambiguous_multihop`, `unanswerable_out_of_domain`, `adversarial_injection`. */
  category: string;
  expected_behavior: EvalExpectedBehavior;
  ground_truth_answer: string;
  /** Các câu trả lời chuẩn khác cũng được chấp nhận (nếu có). */
  alternative_answers?: string[];
  expected_doc_ids?: string[];
}

export interface RegistryEvaluationSet {
  id: string;
  name: string;
  version?: string;
  corpus_id?: string;
  /** Bản mô phỏng v1.1 dùng `items`; server thật của TTS 01 dùng `questions`. */
  items?: RegistryEvalItem[];
  questions?: RegistryEvalItem[];
}

export interface EvaluationItem {
  question_id: string;
  query: string;
  category: string;
  expected_behavior: EvalExpectedBehavior;
  /** Mọi đáp án chuẩn được chấp nhận; chấm lấy độ khớp cao nhất. */
  ground_truths: string[];
  expected_doc_ids: string[];
}

/** Hợp đồng nội bộ cho AI Lab. Chứa đáp án chuẩn: chỉ dùng ở backend. */
export interface EvaluationSetContract {
  resource_id: string;
  name: string;
  version: string;
  corpus_id: string;
  /** sha256 của câu hỏi + đáp án chuẩn, ghi vào run manifest để tái lập. */
  checksum: string;
  items: EvaluationItem[];
}
