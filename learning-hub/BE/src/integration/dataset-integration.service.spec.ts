import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosHeaders } from 'axios';
import { of, throwError } from 'rxjs';
import { EVALUATION_SETS } from './local-registry/evaluation-set-fixture';
import {
  DATA_SERVICE_DOWN_MESSAGE,
  DatasetIntegrationService,
} from './dataset-integration.service';

const DETAIL = {
  id: 'ds-retail-ecommerce-sales-v1',
  name: 'Sales Performance',
  current_version: 'v1.0',
  data_dictionary: {
    tables: [
      {
        name: 'orders',
        columns: [
          {
            name: 'order_id',
            type: 'VARCHAR(10)',
            nullable: false,
            description: '',
          },
        ],
      },
    ],
  },
  sandbox_db_url: 'postgresql://lab_reader:pw@sandbox:5432/sales_v1',
};

describe('DatasetIntegrationService', () => {
  let http: { get: jest.Mock };
  let service: DatasetIntegrationService;
  const config = {
    get: (key: string) =>
      ({
        DATA_SERVICE_BASE_URL: 'http://data-service.test',
        DATA_SERVICE_API_KEY: 'test-key',
      })[key],
  };

  beforeEach(() => {
    http = {
      get: jest
        .fn()
        .mockReturnValue(of({ data: { success: true, data: DETAIL } })),
    };
    service = new DatasetIntegrationService(
      http as unknown as HttpService,
      config as unknown as ConfigService,
    );
  });

  it('gọi đúng endpoint Registry v1 kèm X-API-Key và map sang hợp đồng nội bộ', async () => {
    const contract = await service.fetchDatasetInfo(
      'ds-retail-ecommerce-sales-v1',
    );

    expect(http.get).toHaveBeenCalledWith(
      'http://data-service.test/api/v1/registry/datasets/ds-retail-ecommerce-sales-v1',
      expect.objectContaining({ headers: { 'X-API-Key': 'test-key' } }),
    );
    expect(contract).toEqual({
      resource_id: 'ds-retail-ecommerce-sales-v1',
      dataset_name: 'Sales Performance',
      version: 'v1.0',
      data_dictionary: DETAIL.data_dictionary,
      sandbox_db_url: DETAIL.sandbox_db_url,
    });
  });

  it('bản public không bao giờ chứa sandbox_db_url', async () => {
    const pub = await service.fetchPublicDatasetInfo(
      'ds-retail-ecommerce-sales-v1',
    );

    expect(pub).not.toHaveProperty('sandbox_db_url');
    expect(JSON.stringify(pub)).not.toContain('postgresql://');
  });

  it('cache kết quả, không gọi lại TTS 01 cho mỗi lần chạy SQL', async () => {
    await service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1');
    await service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1');

    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('từ chối resource_id có ký tự đường dẫn, không gọi ra ngoài', async () => {
    await expect(service.fetchDatasetInfo('../admin')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(http.get).not.toHaveBeenCalled();
  });

  it('404 từ Registry thành NotFoundException', async () => {
    const err = new AxiosError('Not Found', '404', undefined, undefined, {
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    http.get.mockReturnValue(throwError(() => err));

    await expect(service.fetchDatasetInfo('ds-unknown')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('mất kết nối tới TTS 01 thành BadGatewayException', async () => {
    http.get.mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

    await expect(
      service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1'),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('máy chủ dữ liệu chưa bật (không có phản hồi) thành 503 với thông báo rõ ràng', async () => {
    const err = new AxiosError(
      'connect ECONNREFUSED 127.0.0.1:8010',
      'ECONNREFUSED',
    );
    http.get.mockReturnValue(throwError(() => err));

    const promise = service.fetchEvaluationSet('eval-cs-faq-basic-v1');
    await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(promise).rejects.toThrow(DATA_SERVICE_DOWN_MESSAGE);
  });

  it.each([
    ['ECONNABORTED', 'phản hồi quá lâu'],
    ['ETIMEDOUT', 'phản hồi quá lâu'],
    ['ENOTFOUND', 'Không kết nối được máy chủ dữ liệu'],
  ])('[L1] lỗi %s không có phản hồi -> 503 "%s"', async (code, message) => {
    http.get.mockReturnValue(throwError(() => new AxiosError('fail', code)));

    const promise = service.fetchEvaluationSet('eval-cs-faq-basic-v1');
    await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(promise).rejects.toThrow(message);
  });

  it('Registry trả lỗi 5xx (có phản hồi) vẫn là 502, không nhầm với chưa bật', async () => {
    const err = new AxiosError('Server Error', '500', undefined, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    http.get.mockReturnValue(throwError(() => err));

    await expect(
      service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1'),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('Registry v1.0 thiếu data_dictionary/sandbox_db_url thì báo rõ, không tự dựng schema', async () => {
    const { data_dictionary: _dd, sandbox_db_url: _url, ...v10 } = DETAIL;
    http.get.mockReturnValue(of({ data: { success: true, data: v10 } }));

    await expect(
      service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1'),
    ).rejects.toThrow('data_dictionary');
  });

  describe('fetchEvaluationSet (AI Lab, mở rộng v1.1)', () => {
    const EVAL = {
      id: 'eval-custom-v1',
      name: 'FAQ cơ bản',
      version: 'v1.0',
      corpus_id: 'corpus-cybersoft-academic-v1',
      items: [
        {
          question_id: 'Q010',
          query: 'Cần tham gia bao nhiêu % buổi học?',
          category: 'standard_qa',
          expected_behavior: 'ANSWER',
          ground_truth_answer: 'Tối thiểu 80% tổng số buổi học.',
          alternative_answers: ['Ít nhất 80% số buổi.'],
          expected_doc_ids: ['CS-POL-003'],
        },
      ],
    };

    beforeEach(() => {
      http.get.mockReturnValue(of({ data: { success: true, data: EVAL } }));
    });

    it('gọi route evaluation-sets kèm X-API-Key, gộp đáp án chuẩn thành ground_truths và có checksum', async () => {
      const set = await service.fetchEvaluationSet('eval-custom-v1');

      expect(http.get).toHaveBeenCalledWith(
        'http://data-service.test/api/v1/registry/evaluation-sets/eval-custom-v1',
        expect.objectContaining({ headers: { 'X-API-Key': 'test-key' } }),
      );
      expect(set.items[0].ground_truths).toEqual([
        'Tối thiểu 80% tổng số buổi học.',
        'Ít nhất 80% số buổi.',
      ]);
      expect(set.checksum).toMatch(/^[0-9a-f]{64}$/);
      expect(set.corpus_id).toBe('corpus-cybersoft-academic-v1');
    });

    it('cache evaluation set riêng với dataset', async () => {
      await service.fetchEvaluationSet('eval-custom-v1');
      await service.fetchEvaluationSet('eval-custom-v1');

      expect(http.get).toHaveBeenCalledTimes(1);
    });

    it('câu hỏi thiếu đáp án chuẩn thì báo lỗi, không chấm thiếu', async () => {
      http.get.mockReturnValue(
        of({
          data: {
            success: true,
            data: {
              ...EVAL,
              items: [
                {
                  ...EVAL.items[0],
                  ground_truth_answer: '',
                  alternative_answers: [],
                },
              ],
            },
          },
        }),
      );

      await expect(
        service.fetchEvaluationSet('eval-custom-v1'),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });
});

describe('DatasetIntegrationService — registry tích hợp sẵn (không cần bật máy chủ nào)', () => {
  const makeService = (env: Record<string, string | undefined>) => {
    const http = { get: jest.fn() };
    const service = new DatasetIntegrationService(
      http as unknown as HttpService,
      { get: (key: string) => env[key] } as unknown as ConfigService,
    );
    return { http, service };
  };
  const refused = () =>
    throwError(() => new AxiosError('refused', 'ECONNREFUSED'));

  it.each([
    ['để trống', ''],
    ['không đặt', undefined],
    ['ghi rõ "embedded"', 'embedded'],
  ])(
    'DATA_SERVICE_BASE_URL %s: lấy dataset từ dữ liệu tích hợp sẵn, không gọi HTTP',
    async (_label, value) => {
      const { http, service } = makeService({ DATA_SERVICE_BASE_URL: value });

      const contract = await service.fetchDatasetInfo(
        'ds-retail-ecommerce-sales-v1',
      );

      expect(http.get).not.toHaveBeenCalled();
      expect(contract.data_dictionary.tables.map((t) => t.name)).toEqual(
        expect.arrayContaining(['customers', 'orders', 'order_details']),
      );
      expect(contract.sandbox_db_url).toMatch(/^postgresql:\/\/lab_reader:/);
      expect(service.describeSource()).toEqual({
        mode: 'embedded',
        baseUrl: null,
      });
    },
  );

  it('bản trả cho trình duyệt vẫn không kèm chuỗi kết nối sandbox', async () => {
    const { service } = makeService({});
    const pub = await service.fetchPublicDatasetInfo(
      'ds-retail-ecommerce-sales-v1',
    );
    expect(JSON.stringify(pub)).not.toContain('sandbox_db_url');
    expect(JSON.stringify(pub)).not.toContain('lab_reader');
  });

  it('evaluation set cho AI Lab cũng lấy được từ dữ liệu tích hợp sẵn', async () => {
    const { http, service } = makeService({});
    const id = Object.keys(EVALUATION_SETS)[0];
    const set = await service.fetchEvaluationSet(id);
    expect(http.get).not.toHaveBeenCalled();
    expect(set.items.length).toBeGreaterThan(0);
  });

  it('dataset/evaluation set không tồn tại → 404, không phải lỗi máy chủ', async () => {
    const { service } = makeService({});
    await expect(
      service.fetchDatasetInfo('ds-khong-co'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.fetchEvaluationSet('es-khong-co'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resource_id có ký tự đường dẫn vẫn bị chặn trước khi tới registry', async () => {
    const { service } = makeService({});
    await expect(
      service.fetchDatasetInfo('../etc/passwd'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('có địa chỉ máy chủ thật: gọi REST và mô tả chế độ remote (bỏ dấu / cuối)', async () => {
    const { http, service } = makeService({
      DATA_SERVICE_BASE_URL: 'http://tts01:8000/',
    });
    http.get.mockReturnValue(of({ data: { success: true, data: DETAIL } }));
    await service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1');
    expect(http.get.mock.calls[0][0]).toBe(
      'http://tts01:8000/api/v1/registry/datasets/ds-retail-ecommerce-sales-v1',
    );
    expect(service.describeSource()).toEqual({
      mode: 'remote',
      baseUrl: 'http://tts01:8000',
    });
  });

  it('máy chủ thật tắt và KHÔNG bật fallback: báo lỗi rõ ràng, không âm thầm đổi nguồn dữ liệu', async () => {
    const { http, service } = makeService({
      DATA_SERVICE_BASE_URL: 'http://tts01:8000',
    });
    http.get.mockReturnValue(refused());
    await expect(
      service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1'),
    ).rejects.toThrow(DATA_SERVICE_DOWN_MESSAGE);
  });

  it('máy chủ thật tắt và bật DATA_SERVICE_FALLBACK=embedded: rơi về dữ liệu tích hợp sẵn', async () => {
    const { http, service } = makeService({
      DATA_SERVICE_BASE_URL: 'http://tts01:8000',
      DATA_SERVICE_FALLBACK: 'embedded',
    });
    http.get.mockReturnValue(refused());
    const contract = await service.fetchDatasetInfo(
      'ds-retail-ecommerce-sales-v1',
    );
    expect(contract.data_dictionary.tables.length).toBeGreaterThan(0);
  });

  it('fallback chỉ áp dụng khi không có phản hồi; máy chủ trả 404 vẫn là 404', async () => {
    const { http, service } = makeService({
      DATA_SERVICE_BASE_URL: 'http://tts01:8000',
      DATA_SERVICE_FALLBACK: 'embedded',
    });
    const notFound = new AxiosError('nf', '404', undefined, undefined, {
      status: 404,
      data: {},
      statusText: 'Not Found',
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    http.get.mockReturnValue(throwError(() => notFound));
    await expect(
      service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
