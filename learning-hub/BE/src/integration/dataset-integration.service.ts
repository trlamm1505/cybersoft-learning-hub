import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';
import { createHash } from 'crypto';
import { buildSandboxDbUrl } from '../common/config/sandbox-env';
import { getEvalSlice, normalizeEvalKind, sourceSetOf } from './eval-slices';
import { LocalRegistry } from './local-registry/local-registry';
import type {
  DatasetContract,
  DatasetTable,
  RegistryDictionaryTable,
  EvaluationSetContract,
  PublicDatasetContract,
  RegistryDatasetDetail,
  RegistryEnvelope,
  RegistryEvalItem,
  RegistryEvaluationSet,
  CatalogResourceItem,
} from './dataset-contract.types';

// Cùng dạng mã dataset trong Registry của TTS 01 (vd `ds-retail-ecommerce-sales-v1`).
// Chặn ký tự đường dẫn để resource_id không bẻ được URL gọi sang service khác.
const RESOURCE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{2,80}$/i;
const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 5_000;
export const DATA_SERVICE_DOWN_MESSAGE =
  'Không kết nối được máy chủ dữ liệu (DATA_SERVICE_BASE_URL). Hãy bật máy chủ đó, hoặc để trống DATA_SERVICE_BASE_URL để dùng dữ liệu tích hợp sẵn trong backend';
export const DATA_SERVICE_TIMEOUT_MESSAGE = 'Máy chủ dữ liệu phản hồi quá lâu';
export const DATA_SERVICE_UNREACHABLE_MESSAGE =
  'Không kết nối được máy chủ dữ liệu của Data & AI Resource';

const REFUSED_CODES = new Set(['ECONNREFUSED']);
const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT', 'ESOCKETTIMEDOUT']);

/**
 * Cổng duy nhất để Learning Hub lấy thông tin dataset từ Data & AI Resource
 * (TTS 01) qua REST. Không đọc file, không import code của thư mục TTS 01.
 *
 * Nguồn dữ liệu cấu hình qua `DATA_SERVICE_BASE_URL`:
 * - để trống (mặc định): dùng LocalRegistry tích hợp sẵn, không cần bật thêm gì;
 * - có địa chỉ (vd `http://localhost:8000` của TTS 01): gọi REST, header
 *   `X-API-Key` đúng như security scheme trong OpenAPI. Máy chủ đó không trả lời
 *   thì báo lỗi rõ, trừ khi bật `DATA_SERVICE_FALLBACK=embedded` (chỉ nên dùng
 *   khi dev: tự rơi về dữ liệu tích hợp sẵn và ghi cảnh báo).
 */
@Injectable()
export class DatasetIntegrationService {
  private readonly logger = new Logger(DatasetIntegrationService.name);
  private readonly cache = new Map<
    string,
    { value: DatasetContract; expiresAt: number }
  >();
  private readonly evalCache = new Map<
    string,
    { value: EvaluationSetContract; expiresAt: number }
  >();

  private localRegistry?: LocalRegistry;
  private warnedFallback = false;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /** Chế độ nguồn dữ liệu hiện tại, dùng cho /api/health và chẩn đoán. */
  describeSource(): { mode: 'embedded' | 'remote'; baseUrl: string | null } {
    const baseUrl = this.baseUrl();
    return baseUrl
      ? { mode: 'remote', baseUrl }
      : { mode: 'embedded', baseUrl: null };
  }

  /** Lấy danh sách Catalog các tài nguyên (Dataset / Evaluation Set) phục vụ tạo bài giao (Day 26). */
  async fetchResourceCatalog(): Promise<CatalogResourceItem[]> {
    return [
      {
        resource_id: 'ds-retail-ecommerce-sales-v1',
        name: 'Sales Performance (Retail Sales v1.0)',
        type: 'DATASET',
        current_version: 'v1.0',
        available_versions: ['v1.0', 'v1.1'],
        domain: 'Retail',
        description: 'Bộ dữ liệu bán hàng đa bảng chuẩn hóa: khách hàng, nhân viên, sản phẩm, đơn hàng và chi tiết đơn hàng.',
      },
      {
        resource_id: 'eval-cs-rag-golden-v1',
        name: 'CyberSoft Academic RAG Evaluation Set (Golden Set)',
        type: 'EVALUATION_SET',
        current_version: 'v1.0',
        available_versions: ['v1.0'],
        domain: 'AI & Data Engineering',
        description: 'Bộ đánh giá chuẩn RAG với câu hỏi chuẩn hoá và golden answers.',
      },
      {
        resource_id: 'eval-cs-faq-basic-v1',
        name: 'CyberSoft FAQ Basic Evaluation Set',
        type: 'EVALUATION_SET',
        current_version: 'v1.0',
        available_versions: ['v1.0'],
        domain: 'AI & Chatbot',
        description: 'Bộ câu hỏi thường gặp hệ thống CyberSoft.',
      },
    ];
  }

  /**
   * Kiểm tra và khóa version bài giao tại thời điểm assignment (Day 26).
   * Xử lý lỗi khi chọn version không tồn tại/bị gỡ (unavailable version).
   */
  async fetchResourceVersionContract(
    resourceId: string,
    requestedVersion?: string,
  ): Promise<{ resource_id: string; version: string; assignedResourceVersion: string }> {
    this.assertResourceId(resourceId);
    const catalog = await this.fetchResourceCatalog();
    const item = catalog.find((c) => c.resource_id === resourceId);

    if (!item && resourceId !== 'ds-retail-ecommerce-sales-v1') {
      throw new NotFoundException(`Resource "${resourceId}" không tồn tại trong Catalog.`);
    }

    const availableVersions = item?.available_versions ?? ['v1.0', 'v1.1'];
    const currentVersion = item?.current_version ?? 'v1.0';

    const targetVersion = requestedVersion && requestedVersion.trim() !== ''
      ? requestedVersion.trim()
      : currentVersion;

    if (!availableVersions.includes(targetVersion)) {
      throw new BadRequestException(
        `Version "${targetVersion}" không tồn tại hoặc không khả dụng cho resource "${resourceId}". Các version khả dụng: ${availableVersions.join(', ')}`,
      );
    }

    return {
      resource_id: resourceId,
      version: targetVersion,
      assignedResourceVersion: targetVersion,
    };
  }


  private baseUrl(): string | null {
    const value = (this.config.get<string>('DATA_SERVICE_BASE_URL') ?? '')
      .trim()
      .replace(/\/+$/, '');
    return !value || value.toLowerCase() === 'embedded' ? null : value;
  }

  private local(): LocalRegistry {
    // Sandbox URL dựng từ cùng biến môi trường với Docker Compose nên luôn khớp role lab_reader.
    return (this.localRegistry ??= new LocalRegistry(buildSandboxDbUrl()));
  }

  /** Cùng dạng envelope như REST, lấy từ dữ liệu tích hợp sẵn. */
  private fromLocal<T>(
    path: string,
    notFoundMessage: string,
  ): RegistryEnvelope<T> {
    const match =
      /^\/api\/v1\/registry\/(datasets|evaluation-sets)\/(.+)$/.exec(path);
    const id = match ? decodeURIComponent(match[2]) : '';
    const data = !match
      ? undefined
      : match[1] === 'datasets'
        ? this.local().getDataset(id)
        : this.local().getEvaluationSet(id);
    if (!data) throw new NotFoundException(notFoundMessage);
    return { success: true, data: data as T } as RegistryEnvelope<T>;
  }

  async fetchDatasetInfo(resourceId: string): Promise<DatasetContract> {
    this.assertResourceId(resourceId);

    const cached = this.cache.get(resourceId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const envelope = await this.getEnvelope<RegistryDatasetDetail>(
      `/api/v1/registry/datasets/${encodeURIComponent(resourceId)}`,
      `Dataset "${resourceId}" không tồn tại trong Registry của Data & AI Resource.`,
    );

    const contract = this.toContract(resourceId, envelope);
    this.cache.set(resourceId, {
      value: contract,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return contract;
  }

  /** Bản trả cho trình duyệt: không bao giờ kèm chuỗi kết nối sandbox. */
  async fetchPublicDatasetInfo(
    resourceId: string,
  ): Promise<PublicDatasetContract> {
    const { sandbox_db_url: _omit, ...rest } =
      await this.fetchDatasetInfo(resourceId);
    return rest;
  }

  /**
   * Evaluation set (câu hỏi + đáp án chuẩn) của TTS 01 làm căn cứ chấm AI Lab.
   * Kết quả có đáp án chuẩn: chỉ dùng ở backend, không trả nguyên cho FE.
   */
  async fetchEvaluationSet(resourceId: string): Promise<EvaluationSetContract> {
    this.assertResourceId(resourceId);

    const cached = this.evalCache.get(resourceId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const envelope = this.baseUrl()
      ? await this.getRemoteEvaluationSet(resourceId)
      : await this.getEnvelope<RegistryEvaluationSet>(
          `/api/v1/registry/evaluation-sets/${encodeURIComponent(resourceId)}`,
          `Evaluation set "${resourceId}" không tồn tại trong Registry của Data & AI Resource.`,
        );

    const contract = this.toEvaluationSet(resourceId, envelope);
    this.evalCache.set(resourceId, {
      value: contract,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return contract;
  }

  /**
   * Trên Registry thật: mã bài lab có thể là một "lát" (vd `eval-cs-rag-abstain-v1`)
   * của các bộ lớn do TTS 01 phát hành; ghép lát từ nội dung thật, giữ thứ tự bài lab.
   * Mã không phải lát thì gọi thẳng như một evaluation set.
   */
  private async getRemoteEvaluationSet(
    resourceId: string,
  ): Promise<RegistryEnvelope<RegistryEvaluationSet>> {
    const fetchSet = (id: string) =>
      this.getEnvelope<RegistryEvaluationSet>(
        `/api/v1/registry/evaluation-sets/${encodeURIComponent(id)}`,
        `Evaluation set "${id}" không tồn tại trong Registry của Data & AI Resource.`,
      );
    const slice = getEvalSlice(resourceId);
    if (!slice) return fetchSet(resourceId);

    const sourceIds = [...new Set(slice.questionIds.map(sourceSetOf))];
    const sources = new Map<string, RegistryEvaluationSet>();
    for (const id of sourceIds) {
      const env = await fetchSet(id);
      if (!env.success || !env.data) return env as never;
      sources.set(id, env.data);
    }
    const byId = new Map<string, RegistryEvalItem>();
    for (const set of sources.values()) {
      for (const q of set.items ?? set.questions ?? []) {
        byId.set(q.question_id, q);
      }
    }
    const missing = slice.questionIds.filter((q) => !byId.has(q));
    if (missing.length) {
      throw new BadGatewayException(
        `Registry thật thiếu câu ${missing.join(', ')} mà bài lab "${resourceId}" cần.`,
      );
    }
    const first = sources.values().next().value as RegistryEvaluationSet;
    return {
      success: true,
      data: {
        id: slice.id,
        name: slice.name,
        version: sourceIds
          .map((id) => `${id}@${sources.get(id)!.version}`)
          .join('+'),
        corpus_id: first.corpus_id,
        items: slice.questionIds.map((q) => byId.get(q)!),
      },
    };
  }

  private assertResourceId(resourceId: string) {
    if (!RESOURCE_ID_PATTERN.test(resourceId ?? '')) {
      throw new BadRequestException(
        `resource_id không hợp lệ: "${resourceId}"`,
      );
    }
  }

  private async getEnvelope<T>(
    path: string,
    notFoundMessage: string,
  ): Promise<RegistryEnvelope<T>> {
    const baseUrl = this.baseUrl();
    if (!baseUrl) return this.fromLocal<T>(path, notFoundMessage);
    const url = `${baseUrl}${path}`;

    try {
      const res = await firstValueFrom(
        this.http.get<RegistryEnvelope<T>>(url, {
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            'X-API-Key': this.config.get<string>('DATA_SERVICE_API_KEY') ?? '',
          },
        }),
      );
      return res.data;
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        throw new NotFoundException(notFoundMessage);
      }
      this.logger.error(
        `Gọi Dataset Registry thất bại (${url}): ${(err as Error).message}`,
      );
      // Không có phản hồi (ECONNREFUSED, timeout...): máy chủ dữ liệu chưa chạy.
      // Không có phản hồi: phân biệt máy chủ chưa chạy với máy chủ chạy nhưng quá chậm.
      if (isAxiosError(err) && !err.response) {
        if (this.config.get<string>('DATA_SERVICE_FALLBACK') === 'embedded') {
          if (!this.warnedFallback) {
            this.warnedFallback = true;
            this.logger.warn(
              `Máy chủ dữ liệu ${baseUrl} không trả lời; tạm dùng dữ liệu tích hợp sẵn (DATA_SERVICE_FALLBACK=embedded).`,
            );
          }
          return this.fromLocal<T>(path, notFoundMessage);
        }
        const code = err.code ?? '';
        throw new ServiceUnavailableException(
          REFUSED_CODES.has(code)
            ? DATA_SERVICE_DOWN_MESSAGE
            : TIMEOUT_CODES.has(code)
              ? DATA_SERVICE_TIMEOUT_MESSAGE
              : DATA_SERVICE_UNREACHABLE_MESSAGE,
        );
      }
      throw new BadGatewayException(
        'Không kết nối được Dataset Registry của Data & AI Resource.',
      );
    }
  }

  private toContract(
    resourceId: string,
    envelope: RegistryEnvelope<RegistryDatasetDetail>,
  ): DatasetContract {
    const data = envelope?.data;
    if (!envelope?.success || !data) {
      throw new BadGatewayException(
        envelope?.error?.message ?? 'Dataset Registry trả về envelope lỗi.',
      );
    }
    // data_dictionary là bắt buộc với lab SQL: thiếu thì báo rõ thay vì tự dựng
    // cấu trúc bảng ở phía Learning Hub.
    const tables = this.normalizeDictionary(data.data_dictionary);
    if (!tables.length) {
      throw new BadGatewayException(
        `Dataset "${resourceId}" chưa có data_dictionary.`,
      );
    }
    return {
      resource_id: data.id ?? resourceId,
      dataset_name: data.name,
      version: data.current_version ?? 'v1.0',
      data_dictionary: { tables },
      // Server thật không cấp sandbox_db_url: Postgres Sandbox do Learning Hub
      // quản lý và nạp dữ liệu qua scripts/ingest-sandbox.js.
      sandbox_db_url: data.sandbox_db_url || buildSandboxDbUrl(),
    };
  }

  /**
   * Hai dạng data_dictionary: mảng bảng của server thật (`table_name`, `data_type`,
   * `is_primary_key`, `foreign_key_target`) và `{ tables }` của bản mô phỏng
   * (`name`, `type`, `pk`, `fk`). Chuẩn hóa về dạng sau, là dạng FE và lab đang dùng.
   */
  private normalizeDictionary(
    raw: RegistryDatasetDetail['data_dictionary'],
  ): DatasetTable[] {
    if (!raw) return [];
    if (!Array.isArray(raw)) return raw.tables ?? [];
    return (raw as RegistryDictionaryTable[]).map((t) => ({
      name: t.table_name,
      description: t.description ?? undefined,
      row_count: t.row_count ?? undefined,
      primary_key: t.primary_key ?? undefined,
      columns: (t.columns ?? []).map((c) => ({
        name: c.name,
        type: c.data_type,
        nullable: c.nullable ?? false,
        pk: c.is_primary_key ?? false,
        fk: c.foreign_key_target ?? null,
        description: c.description ?? '',
      })),
    }));
  }

  private toEvaluationSet(
    resourceId: string,
    envelope: RegistryEnvelope<RegistryEvaluationSet>,
  ): EvaluationSetContract {
    const data = envelope?.data;
    if (!envelope?.success || !data) {
      throw new BadGatewayException(
        envelope?.error?.message ?? 'Dataset Registry trả về envelope lỗi.',
      );
    }
    // Câu thiếu đáp án chuẩn thì không chấm được: báo lỗi thay vì bỏ qua lặng lẽ.
    const items = (data.items ?? data.questions ?? []).map((it) => {
      const ground_truths = [
        it.ground_truth_answer,
        ...(it.alternative_answers ?? []),
      ].filter((s) => typeof s === 'string' && s.trim());
      if (!it.question_id || !it.query || ground_truths.length === 0) {
        throw new BadGatewayException(
          `Evaluation set "${resourceId}" có câu hỏi thiếu query hoặc ground_truth_answer.`,
        );
      }
      const kind = normalizeEvalKind(it);
      if (!kind) {
        throw new BadGatewayException(
          `Evaluation set "${resourceId}", câu ${it.question_id}: expected_behavior "${it.expected_behavior}" không nhận diện được.`,
        );
      }
      return {
        question_id: it.question_id,
        query: it.query,
        category: kind.category,
        expected_behavior: kind.expected_behavior,
        ground_truths,
        expected_doc_ids: it.expected_doc_ids ?? [],
      };
    });
    if (items.length === 0) {
      throw new BadGatewayException(
        `Evaluation set "${resourceId}" không có câu hỏi nào.`,
      );
    }
    const checksum = createHash('sha256')
      .update(
        JSON.stringify(
          items.map((i) => [i.question_id, i.query, i.ground_truths]),
        ),
      )
      .digest('hex');
    return {
      resource_id: data.id ?? resourceId,
      name: data.name,
      version: data.version ?? 'v1.0',
      corpus_id: data.corpus_id ?? 'corpus-cybersoft-academic-v1',
      checksum,
      items,
    };
  }
}
