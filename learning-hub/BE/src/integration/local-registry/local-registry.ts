import { buildRegistryFixture } from './registry-fixture';
import { EVALUATION_SETS } from './evaluation-set-fixture';

/**
 * Registry dữ liệu tích hợp sẵn trong backend: cùng hợp đồng (dataset v1.1 có
 * `data_dictionary` + `sandbox_db_url`, evaluation set) với Dataset Registry của
 * Data & AI Resource (TTS 01), nhưng đọc thẳng từ bộ dữ liệu mẫu đi kèm mã nguồn.
 *
 * Dùng khi `DATA_SERVICE_BASE_URL` để trống: không cần bật thêm tiến trình mock
 * hay server riêng, nên chạy dev, demo và deploy chỉ cần backend. Khi TTS 01 phát
 * hành hợp đồng v1.1 trên server thật, đặt `DATA_SERVICE_BASE_URL` trỏ tới đó là
 * chuyển sang dữ liệu thật mà không đổi mã.
 */
export class LocalRegistry {
  private readonly datasets: Record<string, unknown>;

  constructor(sandboxDbUrl: string) {
    this.datasets = buildRegistryFixture(sandboxDbUrl);
  }

  getDataset(id: string): unknown | undefined {
    return Object.prototype.hasOwnProperty.call(this.datasets, id)
      ? this.datasets[id]
      : undefined;
  }

  getEvaluationSet(id: string): unknown | undefined {
    return Object.prototype.hasOwnProperty.call(EVALUATION_SETS, id)
      ? (EVALUATION_SETS as Record<string, unknown>)[id]
      : undefined;
  }
}
