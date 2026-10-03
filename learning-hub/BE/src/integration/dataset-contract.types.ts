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
  /** Mở rộng v1.1 (đề xuất). */
  data_dictionary?: { tables: DatasetTable[] };
  /** Mở rộng v1.1 (đề xuất). */
  sandbox_db_url?: string;
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
