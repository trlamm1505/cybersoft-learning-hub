import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';
import type {
  DatasetContract,
  PublicDatasetContract,
  RegistryDatasetDetail,
  RegistryEnvelope,
} from './dataset-contract.types';

// Cùng dạng mã dataset trong Registry của TTS 01 (vd `ds-retail-ecommerce-sales-v1`).
// Chặn ký tự đường dẫn để resource_id không bẻ được URL gọi sang service khác.
const RESOURCE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{2,80}$/i;
const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 5_000;

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

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async fetchDatasetInfo(resourceId: string): Promise<DatasetContract> {
    if (!RESOURCE_ID_PATTERN.test(resourceId ?? '')) {
      throw new BadRequestException(`resource_id không hợp lệ: "${resourceId}"`);
    }

    const cached = this.cache.get(resourceId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const baseUrl =
      this.config.get<string>('DATA_SERVICE_BASE_URL') ||
      'http://localhost:8010';
    const url = `${baseUrl}/api/v1/registry/datasets/${encodeURIComponent(resourceId)}`;

    let envelope: RegistryEnvelope<RegistryDatasetDetail>;
    try {
      const res = await firstValueFrom(
        this.http.get<RegistryEnvelope<RegistryDatasetDetail>>(url, {
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            'X-API-Key': this.config.get<string>('DATA_SERVICE_API_KEY') ?? '',
          },
        }),
      );
      envelope = res.data;
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        throw new NotFoundException(
          `Dataset "${resourceId}" không tồn tại trong Registry của Data & AI Resource.`,
        );
      }
      this.logger.error(
        `Gọi Dataset Registry thất bại (${url}): ${(err as Error).message}`,
      );
      throw new BadGatewayException(
        'Không kết nối được Dataset Registry của Data & AI Resource.',
      );
    }

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
}
