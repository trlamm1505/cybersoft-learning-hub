import * as fs from 'fs';
import * as path from 'path';
import { BadGatewayException } from '@nestjs/common';
import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import { AxiosHeaders } from 'axios';
import { of } from 'rxjs';
import { DatasetIntegrationService } from './dataset-integration.service';
import { EVALUATION_SETS } from './local-registry/evaluation-set-fixture';
import { getEvalSlice, sourceSetOf } from './eval-slices';

/**
 * Hợp đồng với server THẬT của TTS 01 (Day 21 + bổ sung 3 endpoint). Các tệp trong
 * __fixtures__ là phản hồi chụp nguyên văn từ server thật, nên test này bắt lỗi
 * lệch tên trường mà không cần bật server. Bộ test "live" cuối tệp chạy trực tiếp
 * khi đặt DATA_SERVICE_CONTRACT_URL (và DATA_SERVICE_CONTRACT_KEY).
 */
const load = (name: string) =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '__fixtures__', name), 'utf8'),
  ) as { success: boolean; data: any };

const DATASET = load('real-dataset.json');
const GOLDEN = load('real-eval-golden.json');
const POLICY = load('real-eval-policy.json');
const BY_ID: Record<string, unknown> = {
  'ds-retail-ecommerce-sales-v1': DATASET,
  'eval-rag-golden-v1': GOLDEN,
  'eval-policy-curriculum-v1': POLICY,
};

function makeService(base = 'http://registry.test') {
  const http = {
    get: jest.fn((url: string) => {
      const id = decodeURIComponent(url.split('/').pop()!);
      return of({
        data: BY_ID[id],
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
      });
    }),
  };
  const config = {
    get: (k: string) =>
      ({ DATA_SERVICE_BASE_URL: base, DATA_SERVICE_API_KEY: 'k' })[k],
  };
  return {
    http,
    service: new DatasetIntegrationService(
      http as unknown as HttpService,
      config as unknown as ConfigService,
    ),
  };
}

describe('hợp đồng với Registry thật của TTS 01', () => {
  it('data_dictionary dạng mảng (table_name/data_type/is_primary_key/foreign_key_target) được chuẩn hóa', async () => {
    const { service } = makeService();
    const c = await service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1');

    expect(c.data_dictionary.tables.map((t) => t.name)).toEqual([
      'customers',
      'employees',
      'products',
      'orders',
      'order_details',
    ]);
    const orders = c.data_dictionary.tables.find((t) => t.name === 'orders')!;
    expect(orders.row_count).toBe(1000);
    expect(orders.columns.find((x) => x.name === 'order_id')).toMatchObject({
      type: 'VARCHAR(10)',
      pk: true,
      fk: null,
    });
    expect(orders.columns.find((x) => x.name === 'customer_id')).toMatchObject({
      fk: 'customers.customer_id',
    });
    expect(
      orders.columns.find((x) => x.name === 'shipping_date'),
    ).toMatchObject({ nullable: true });
  });

  it('server thật không cấp sandbox_db_url: dựng từ cấu hình sandbox của Learning Hub, không lộ ra bản public', async () => {
    const { service } = makeService();
    const c = await service.fetchDatasetInfo('ds-retail-ecommerce-sales-v1');
    expect(c.sandbox_db_url).toMatch(
      /^postgresql:\/\/lab_reader:.*\/sales_v1$/,
    );

    const pub = await service.fetchPublicDatasetInfo(
      'ds-retail-ecommerce-sales-v1',
    );
    expect(pub).not.toHaveProperty('sandbox_db_url');
  });

  it('evaluation set thật dùng `questions` (không phải `items`) và vẫn thành hợp đồng chấm được', async () => {
    const { service } = makeService();
    const set = await service.fetchEvaluationSet('eval-rag-golden-v1');

    expect(set.items).toHaveLength(30);
    expect(set.items[0]).toMatchObject({
      question_id: 'EVAL-STD-01',
      expected_behavior: 'ANSWER',
    });
    expect(set.items[0].ground_truths[0]).toContain('80%');
    expect(set.checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(
      set.items.filter((i) => i.expected_behavior === 'ABSTAIN'),
    ).toHaveLength(
      GOLDEN.data.questions.filter(
        (q: any) => q.expected_behavior === 'ABSTAIN',
      ).length,
    );
  });

  describe('các bài AI Lab (lát câu hỏi) trên bộ thật', () => {
    const sliceIds = Object.keys(EVALUATION_SETS);

    it.each(sliceIds)(
      '%s: mọi câu có trên Registry thật, cùng câu hỏi và hành vi kỳ vọng với bản tích hợp sẵn',
      async (id) => {
        const { service } = makeService();
        const real = await service.fetchEvaluationSet(id);
        const local = (EVALUATION_SETS as Record<string, any>)[id];

        expect(real.items.map((i) => i.question_id)).toEqual(
          local.items.map((i: any) => i.question_id),
        );
        for (const [n, item] of real.items.entries()) {
          expect(item.query).toBe(local.items[n].query);
          expect(item.expected_behavior).toBe(local.items[n].expected_behavior);
          expect(item.category).toBe(local.items[n].category);
          expect(item.ground_truths.length).toBeGreaterThan(0);
        }
      },
    );

    it('lát ghép từ nhiều bộ thật (e2e) gọi từng bộ nguồn đúng một lần', async () => {
      const { service, http } = makeService();
      await service.fetchEvaluationSet('eval-cs-rag-e2e-v1');
      const urls = http.get.mock.calls.map((c) => c[0] as string).sort();
      expect(urls).toEqual([
        'http://registry.test/api/v1/registry/evaluation-sets/eval-policy-curriculum-v1',
        'http://registry.test/api/v1/registry/evaluation-sets/eval-rag-golden-v1',
      ]);
    });

    it('Registry thiếu một câu mà bài lab cần thì báo lỗi rõ, không chấm thiếu', async () => {
      const { service } = makeService();
      const missing = getEvalSlice('eval-cs-faq-basic-v1')!.questionIds[0];
      BY_ID['eval-policy-curriculum-v1'] = {
        ...POLICY,
        data: {
          ...POLICY.data,
          questions: POLICY.data.questions.filter(
            (q: any) => q.question_id !== missing,
          ),
        },
      };
      try {
        await expect(
          service.fetchEvaluationSet('eval-cs-faq-basic-v1'),
        ).rejects.toBeInstanceOf(BadGatewayException);
      } finally {
        BY_ID['eval-policy-curriculum-v1'] = POLICY;
      }
    });

    it('sourceSetOf phân câu theo tiền tố mã', () => {
      expect(sourceSetOf('EVAL-OOD-01')).toBe('eval-rag-golden-v1');
      expect(sourceSetOf('Q061')).toBe('eval-policy-curriculum-v1');
    });
  });
});

const LIVE = process.env.DATA_SERVICE_CONTRACT_URL;
(LIVE ? describe : describe.skip)('hợp đồng LIVE với server TTS 01', () => {
  const headers = {
    'X-API-Key':
      process.env.DATA_SERVICE_CONTRACT_KEY ??
      'cybersoft-student-public-key-101',
  };
  const get = async (p: string) => {
    const res = await fetch(`${LIVE}/api/v1/registry/${p}`, { headers });
    return {
      res,
      json: (await res
        .clone()
        .json()
        .catch(() => null)) as any,
    };
  };

  it('3 endpoint trả đúng cấu trúc mà adapter mong đợi', async () => {
    const ds = await get('datasets/ds-retail-ecommerce-sales-v1');
    expect(ds.json.data.data_dictionary[0]).toHaveProperty('table_name');
    expect(ds.json.data.data_dictionary[0].columns[0]).toHaveProperty(
      'data_type',
    );

    const ev = await get('evaluation-sets/eval-rag-golden-v1');
    expect(ev.json.data.questions[0]).toEqual(
      expect.objectContaining({
        question_id: expect.any(String),
        query: expect.any(String),
        ground_truth_answer: expect.any(String),
        expected_behavior: expect.stringMatching(/^(ANSWER|ABSTAIN)$/),
      }),
    );

    const tb = await get(
      'datasets/ds-retail-ecommerce-sales-v1/tables/orders?variant=clean&page_size=1',
    );
    expect(tb.json.data).toEqual(
      expect.objectContaining({
        current_version: expect.any(String),
        checksum_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        total_rows: 1000,
      }),
    );
  });

  it('checksum CSV khớp header và số dòng khớp data_dictionary (clean)', async () => {
    const { createHash } = require('crypto') as typeof import('crypto');
    const ds = await get('datasets/ds-retail-ecommerce-sales-v1');
    for (const t of ds.json.data.data_dictionary) {
      const { res } = await get(
        `datasets/ds-retail-ecommerce-sales-v1/tables/${t.table_name}?variant=clean&format=csv`,
      );
      const body = Buffer.from(await res.arrayBuffer());
      expect(createHash('sha256').update(body).digest('hex')).toBe(
        res.headers.get('x-checksum-sha256'),
      );
      expect(Number(res.headers.get('x-total-rows'))).toBe(t.row_count);
    }
  });
});
