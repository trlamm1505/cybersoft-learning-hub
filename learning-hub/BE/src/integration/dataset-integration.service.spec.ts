import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosHeaders } from 'axios';
import { of, throwError } from 'rxjs';
import { DatasetIntegrationService } from './dataset-integration.service';

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

  it('Registry v1.0 thiếu data_dictionary/sandbox_db_url thì báo rõ, không tự dựng schema', async () => {
    const { data_dictionary: _dd, sandbox_db_url: _url, ...v10 } = DETAIL;
    http.get.mockReturnValue(of({ data: { success: true, data: v10 } }));

    await expect(
      service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1'),
    ).rejects.toThrow('data_dictionary');
  });
});
