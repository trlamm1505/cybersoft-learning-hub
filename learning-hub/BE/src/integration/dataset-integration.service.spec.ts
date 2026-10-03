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
          { name: 'order_id', type: 'VARCHAR(10)', nullable: false, description: '' },
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
      get: jest.fn().mockReturnValue(of({ data: { success: true, data: DETAIL } })),
    };
    service = new DatasetIntegrationService(
      http as unknown as HttpService,
      config as unknown as ConfigService,
    );
  });

  it('gọi đúng endpoint Registry v1 kèm X-API-Key và map sang hợp đồng nội bộ', async () => {
    const contract = await service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1');

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
    const pub = await service.fetchPublicDatasetInfo('ds-retail-ecommerce-sales-v1');

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
    const err = new AxiosError('connect ECONNREFUSED 127.0.0.1:8010', 'ECONNREFUSED');
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
      id: 'eval-cs-faq-basic-v1',
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
      const set = await service.fetchEvaluationSet('eval-cs-faq-basic-v1');

      expect(http.get).toHaveBeenCalledWith(
        'http://data-service.test/api/v1/registry/evaluation-sets/eval-cs-faq-basic-v1',
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
      await service.fetchEvaluationSet('eval-cs-faq-basic-v1');
      await service.fetchEvaluationSet('eval-cs-faq-basic-v1');

      expect(http.get).toHaveBeenCalledTimes(1);
    });

    it('câu hỏi thiếu đáp án chuẩn thì báo lỗi, không chấm thiếu', async () => {
      http.get.mockReturnValue(
        of({
          data: {
            success: true,
            data: { ...EVAL, items: [{ ...EVAL.items[0], ground_truth_answer: '', alternative_answers: [] }] },
          },
        }),
      );

      await expect(service.fetchEvaluationSet('eval-cs-faq-basic-v1')).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });
});
