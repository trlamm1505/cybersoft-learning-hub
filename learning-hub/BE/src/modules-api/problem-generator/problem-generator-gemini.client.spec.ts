import {
  isRetryableNetworkError,
  looksLikeTruncatedJson,
  GeminiProblemGeneratorClient,
} from './problem-generator-gemini.client';
import { ProblemSpec } from './problem-generator.types';

describe('isRetryableNetworkError', () => {
  it('retries on legacy Google error codes (503/429) embedded in message JSON', () => {
    expect(isRetryableNetworkError(new Error('{"error":{"code":503,"message":"overloaded"}}'))).toBe(true);
    expect(isRetryableNetworkError(new Error('{"error":{"code":429,"message":"rate limited"}}'))).toBe(true);
  });

  it('retries on other 5xx HTTP status codes, not just 503', () => {
    expect(isRetryableNetworkError(new Error('{"error":{"code":500,"message":"internal"}}'))).toBe(true);
    expect(isRetryableNetworkError(new Error('{"error":{"code":502,"message":"bad gateway"}}'))).toBe(true);
    expect(isRetryableNetworkError(new Error('{"error":{"code":504,"message":"gateway timeout"}}'))).toBe(true);
  });

  it('retries on "HTTP 5xx"/"status: 5xx" style messages from fetch-based clients', () => {
    expect(isRetryableNetworkError(new Error('Request failed with HTTP 503'))).toBe(true);
    expect(isRetryableNetworkError(new Error('status: 500'))).toBe(true);
    expect(isRetryableNetworkError(new Error('statusCode: 502'))).toBe(true);
  });

  it('retries on common Node.js network error codes via .code property', () => {
    const mkErr = (code: string) => Object.assign(new Error('network fail'), { code });
    expect(isRetryableNetworkError(mkErr('ETIMEDOUT'))).toBe(true);
    expect(isRetryableNetworkError(mkErr('ECONNRESET'))).toBe(true);
    expect(isRetryableNetworkError(mkErr('ECONNREFUSED'))).toBe(true);
    expect(isRetryableNetworkError(mkErr('ENOTFOUND'))).toBe(true);
    expect(isRetryableNetworkError(mkErr('EAI_AGAIN'))).toBe(true);
  });

  it('retries on common Node.js network error codes even when only present in the message text', () => {
    expect(isRetryableNetworkError(new Error('connect ETIMEDOUT 1.2.3.4:443'))).toBe(true);
    expect(isRetryableNetworkError(new Error('read ECONNRESET'))).toBe(true);
  });

  it('retries on FetchError/AbortError by name or by message', () => {
    const fetchErr = new Error('network timeout');
    fetchErr.name = 'FetchError';
    expect(isRetryableNetworkError(fetchErr)).toBe(true);

    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    expect(isRetryableNetworkError(abortErr)).toBe(true);

    expect(isRetryableNetworkError(new Error('caused by FetchError: network fail'))).toBe(true);
  });

  it('does NOT retry on genuine client errors (400 bad request, 401/403 auth, 404 not found)', () => {
    expect(isRetryableNetworkError(new Error('{"error":{"code":400,"message":"bad request"}}'))).toBe(false);
    expect(isRetryableNetworkError(new Error('{"error":{"code":401,"message":"unauthorized"}}'))).toBe(false);
    expect(isRetryableNetworkError(new Error('{"error":{"code":403,"message":"forbidden"}}'))).toBe(false);
    expect(isRetryableNetworkError(new Error('{"error":{"code":404,"message":"model not found"}}'))).toBe(false);
  });

  it('does not retry on an unrelated generic error', () => {
    expect(isRetryableNetworkError(new Error('Invalid API key format'))).toBe(false);
  });
});

describe('looksLikeTruncatedJson', () => {
  it('flags JSON cut off mid-string as truncated', () => {
    const raw = '{"title":"Bai tap","description":"Mo ta dai do';
    expect(looksLikeTruncatedJson(raw, 'Unexpected end of JSON input')).toBe(true);
  });

  it('flags JSON missing the closing brace as truncated', () => {
    const raw = '{"title":"Bai tap","solutionCode":"print(1)"';
    expect(looksLikeTruncatedJson(raw, 'Unexpected end of JSON input')).toBe(true);
  });

  it('does not flag a well-formed JSON string that happens to fail schema validation', () => {
    const raw = '{"title":"Bai tap","wrongField":123}';
    // Valid JSON syntax (ends with '}') — not a truncation issue, so this
    // helper must say "not truncated" even if the caller's shape check fails later.
    expect(looksLikeTruncatedJson(raw, 'some other parse error')).toBe(false);
  });

  it('does not flag a genuinely malformed JSON that is not related to truncation', () => {
    // Ends cleanly with '}' but has a syntax error inside (trailing comma) —
    // not the truncation pattern this helper targets.
    const raw = '{"title":"Bai tap",}';
    expect(looksLikeTruncatedJson(raw, 'Unexpected token } in JSON')).toBe(false);
  });
});

describe('GeminiProblemGeneratorClient.callWithRetry (via generate)', () => {
  const baseSpec: ProblemSpec = {
    id: 'spec-retry-test',
    learningOutcome: 'vong lap for',
    level: 'EASY',
    constraints: [],
    tags: ['loop'],
  };

  function mockGenerateContent(impl: jest.Mock) {
    const client = new GeminiProblemGeneratorClient('fake-api-key');
    // Thay thế SDK thật bằng mock để test retry/backoff mà không gọi mạng —
    // (client as any) vì generateContent là field private của GoogleGenAI SDK.
    (client as any).client = { models: { generateContent: impl } };
    // Rút ngắn backoff xuống gần 0 để test chạy nhanh, không đổi logic retry.
    (client as any).baseRetryDelayMs = 1;
    return client;
  }

  const validJsonResponse = {
    text: JSON.stringify({
      title: 'Bai kiem thu',
      description: 'Mo ta',
      starterCode: '',
      solutionCode: 'print(1)',
      testCases: [{ input: '', expectedOutput: '1', isHidden: false }],
    }),
  };

  it('retries on a retryable network error and succeeds on a later attempt', async () => {
    const networkErr = Object.assign(new Error('network fail'), { code: 'ETIMEDOUT' });
    const generateContent = jest
      .fn()
      .mockRejectedValueOnce(networkErr)
      .mockResolvedValueOnce(validJsonResponse);

    const client = mockGenerateContent(generateContent);
    const draft = await client.generate(baseSpec);

    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(draft.title).toBe('Bai kiem thu');
  });

  it('gives up after maxRetries consecutive retryable errors and throws a descriptive error', async () => {
    const serverErr = new Error('{"error":{"code":503,"message":"overloaded"}}');
    const generateContent = jest.fn().mockRejectedValue(serverErr);

    const client = mockGenerateContent(generateContent);

    await expect(client.generate(baseSpec)).rejects.toThrow(/spec-retry-test/);
    expect(generateContent).toHaveBeenCalledTimes(3); // maxRetries = 3
  });

  it('does not retry a non-retryable error (e.g. 400 bad request) — fails immediately', async () => {
    const badRequestErr = new Error('{"error":{"code":400,"message":"bad request"}}');
    const generateContent = jest.fn().mockRejectedValue(badRequestErr);

    const client = mockGenerateContent(generateContent);

    await expect(client.generate(baseSpec)).rejects.toThrow(/spec-retry-test/);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('retries with a "be more concise" prompt when the response JSON is truncated, then succeeds', async () => {
    const truncated = { text: '{"title":"Bai dai","description":"mo ta chua xong' };
    const generateContent = jest
      .fn()
      .mockResolvedValueOnce(truncated)
      .mockResolvedValueOnce(validJsonResponse);

    const client = mockGenerateContent(generateContent);
    const draft = await client.generate(baseSpec);

    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(draft.title).toBe('Bai kiem thu');
    // Lần gọi thứ 2 phải mang prompt đã được nhắc súc tích hơn.
    const secondCallArgs = generateContent.mock.calls[1][0];
    expect(secondCallArgs.contents).toContain('cắt cụt');
  });

  it('throws a clear parse error when JSON is malformed but NOT truncated (no infinite retry)', async () => {
    const malformed = { text: '{"title": "Bai loi",}' }; // trailing comma, ends cleanly
    const generateContent = jest.fn().mockResolvedValue(malformed);

    const client = mockGenerateContent(generateContent);

    await expect(client.generate(baseSpec)).rejects.toThrow(/Không parse được JSON/);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
});
