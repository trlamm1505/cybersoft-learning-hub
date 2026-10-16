import {
  buildDebugPrompt,
  DEBUG_FALLBACK_REPLY,
  DEBUG_SYSTEM_INSTRUCTION,
  GeminiDebugExplainer,
} from './coach-debug-explainer';

const generateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({ models: { generateContent } })),
}));

const CODE = 'a = int(input())\nb = int(input())\n';

describe('buildDebugPrompt', () => {
  it('gồm đề bài, code hiện tại và lỗi thực tế của test công khai', () => {
    const prompt = buildDebugPrompt('Tính tổng hai số', CODE, {
      status: 'WA',
      passedCount: 0,
      totalCount: 3,
      firstFailingTest: { index: 0, input: '3 5', expectedOutput: '8', actualOutput: '', isHidden: false },
    });

    expect(prompt).toContain('Đề bài: Tính tổng hai số');
    expect(prompt).toContain(CODE);
    expect(prompt).toContain('Sai ở test 0. Input: "3 5" — Kỳ vọng: "8" — Thực tế: ""');
  });

  it('test ẩn: không gửi input, kỳ vọng, thực tế hay stderr cho model', () => {
    const prompt = buildDebugPrompt('Đề', CODE, {
      status: 'WA',
      passedCount: 2,
      totalCount: 3,
      firstFailingTest: {
        index: 2,
        input: 'HIDDEN_INPUT_999',
        expectedOutput: 'HIDDEN_EXPECTED_42',
        actualOutput: 'HIDDEN_ACTUAL_7',
        stderr: 'HIDDEN_STDERR',
        isHidden: true,
      },
    });

    expect(prompt).toContain('Sai ở test ẩn số 2');
    expect(prompt).not.toMatch(/HIDDEN_(INPUT|EXPECTED|ACTUAL|STDERR)/);
  });

  it('cắt code quá dài để tiết kiệm token đầu vào', () => {
    const prompt = buildDebugPrompt('Đề', 'x'.repeat(10_000), {
      status: 'RE',
      passedCount: 0,
      totalCount: 1,
    });

    expect(prompt.length).toBeLessThan(3_000);
  });
});

describe('GeminiDebugExplainer', () => {
  beforeEach(() => generateContent.mockReset());

  it('system instruction ép trả lời 2-3 câu, không viết lời giải, maxOutputTokens 150', async () => {
    generateContent.mockResolvedValue({ text: 'Lỗi đọc input: hai số nằm trên cùng một dòng.' });

    const reply = await new GeminiDebugExplainer('k').explain('prompt');

    const { config } = generateContent.mock.calls[0][0];
    expect(config.systemInstruction).toBe(DEBUG_SYSTEM_INSTRUCTION);
    expect(config.systemInstruction).toContain('TỐI ĐA 2-3 CÂU');
    expect(config.systemInstruction).toContain('KHÔNG viết code giải sẵn');
    expect(config.maxOutputTokens).toBe(150);
    expect(reply).toBe('Lỗi đọc input: hai số nằm trên cùng một dòng.');
  });

  it.each([
    ['429 hết quota', new Error('[429 Too Many Requests] RESOURCE_EXHAUSTED')],
    ['mất mạng', new Error('ECONNRESET')],
  ])('%s: trả câu phản hồi mẫu, không ném lỗi', async (_name, err) => {
    generateContent.mockRejectedValue(err);

    await expect(new GeminiDebugExplainer('k').explain('prompt')).resolves.toBe(
      DEBUG_FALLBACK_REPLY,
    );
  });
});
