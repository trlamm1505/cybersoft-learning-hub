/**
 * Mock HTTP server giả lập Dataset Registry API v1 của Data & AI Resource
 * (TTS 01) để Learning Hub phát triển và demo mà không phụ thuộc server thật.
 * Chỉ cài hai route Learning Hub dùng, cùng envelope và cùng header
 * `X-API-Key` như OpenAPI 3.1 của TTS 01.
 *
 * Chạy: npm run mock:data-service  (cổng MOCK_DATA_SERVICE_PORT, mặc định 8010)
 */
import express from 'express';
import { randomUUID } from 'crypto';
import { buildRegistryFixture } from './registry-fixture';

const PORT = Number(process.env.MOCK_DATA_SERVICE_PORT ?? 8010);
const API_KEYS = (process.env.MOCK_DATA_SERVICE_KEYS ?? 'dev-learning-hub-key')
  .split(',')
  .map((k) => k.trim());
const SANDBOX_DB_URL =
  process.env.MOCK_SANDBOX_DB_URL ??
  'postgresql://lab_reader:lab_reader_pw@localhost:55432/sales_v1';

const registry = buildRegistryFixture(SANDBOX_DB_URL);

const errorEnvelope = (code: string, message: string) => ({
  success: false,
  error: {
    code,
    message,
    details: [],
    request_id: randomUUID(),
    timestamp: new Date().toISOString(),
  },
});

const app = express();

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'healthy', mock: true } });
});

app.get('/api/v1/registry/datasets/:datasetId', (req, res) => {
  const key = req.header('X-API-Key');
  if (!key || !API_KEYS.includes(key)) {
    res
      .status(401)
      .json(errorEnvelope('AUTH_REQUIRED', 'Thiếu hoặc sai X-API-Key.'));
    return;
  }
  const dataset = (registry as Record<string, unknown>)[req.params.datasetId];
  if (!dataset) {
    res
      .status(404)
      .json(
        errorEnvelope(
          'ENTITY_NOT_FOUND',
          `Dataset ${req.params.datasetId} không tồn tại.`,
        ),
      );
    return;
  }
  res.json({ success: true, data: dataset, meta: { mock: true } });
});

app.listen(PORT, () => {
  console.log(`[mock-data-service] Dataset Registry mock: http://localhost:${PORT}`);
});
