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
import type {
  DatasetContract,
  EvaluationSetContract,
  PublicDatasetContract,
  RegistryDatasetDetail,
  RegistryEnvelope,
  RegistryEvaluationSet,
} from './dataset-contract.types';

// Cùng dạng mã dataset trong Registry của TTS 01 (vd `ds-retail-ecommerce-sales-v1`).
// Chặn ký tự đường dẫn để resource_id không bẻ được URL gọi sang service khác.
const RESOURCE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{2,80}$/i;
const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 5_000;
export const DATA_SERVICE_DOWN_MESSAGE =
  'Máy chủ dữ liệu giả lập chưa được bật';
export const DATA_SERVICE_TIMEOUT_MESSAGE =
  'Máy chủ dữ liệu phản hồi quá lâu';
export const DATA_SERVICE_UNREACHABLE_MESSAGE =
  'Không kết nối được máy chủ dữ liệu của Data & AI Resource';

const REFUSED_CODES = new Set(['ECONNREFUSED']);
const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT', 'ESOCKETTIMEDOUT']);

/**
 * Cổng duy nhất để Learning Hub lấy thông tin dataset từ Data & AI Resource
 * (TTS 01) qua REST. Không đọc file, không import code của thư mục TTS 01.
 *
 * Địa chỉ service cấu hình qua `DATA_SERVICE_BASE_URL` (mặc định trỏ tới mock
 * server `npm run mock:data-service` ở cổng 8010; đổi sang 8000 để gọi server
 * thật của TTS 01). Header `X-API-Key` đúng như security scheme trong OpenAPI.
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

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

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

    const envelope = await this.getEnvelope<RegistryEvaluationSet>(
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
    const baseUrl =
      this.config.get<string>('DATA_SERVICE_BASE_URL') ||
      'http://localhost:8010';
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
    // Hai trường mở rộng v1.1 là bắt buộc với lab SQL: thiếu thì báo rõ thay
    // vì tự dựng cấu trúc bảng ở phía Learning Hub.
    if (!data.data_dictionary?.tables?.length) {
      throw new BadGatewayException(
        `Dataset "${resourceId}" chưa có data_dictionary (mở rộng v1.1 của hợp đồng).`,
      );
    }
    if (!data.sandbox_db_url) {
      throw new BadGatewayException(
        `Dataset "${resourceId}" chưa được cấp sandbox_db_url.`,
      );
    }
    return {
      resource_id: data.id ?? resourceId,
      dataset_name: data.name,
      version: data.current_version ?? 'v1.0',
      data_dictionary: data.data_dictionary,
      sandbox_db_url: data.sandbox_db_url,
    };
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
    const items = (data.items ?? []).map((it) => {
      const ground_truths = [
        it.ground_truth_answer,
        ...(it.alternative_answers ?? []),
      ].filter((s) => typeof s === 'string' && s.trim());
      if (!it.question_id || !it.query || ground_truths.length === 0) {
        throw new BadGatewayException(
          `Evaluation set "${resourceId}" có câu hỏi thiếu query hoặc ground_truth_answer.`,
        );
      }
      return {
        question_id: it.question_id,
        query: it.query,
        category: it.category,
        expected_behavior: it.expected_behavior,
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
      corpus_id: data.corpus_id,
      checksum,
      items,
    };
  }
}
