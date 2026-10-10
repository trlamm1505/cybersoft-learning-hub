import { GeminiCoachLlmClient, GEMINI_GUARDRAIL_RULES } from './coach-gemini.client';
import { SYSTEM_PROMPT } from './coach.service';
import type { CoachContext } from './coach-context.types';
import type { LlmClient } from './coach-llm.client';

const generateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent },
  })),
}));

const context = {
  exercise: { slug: 'bai-1', title: 'Bài 1', description: '', difficulty: 'EASY', visibleTestCases: [], hiddenTestCount: 2 },
} as unknown as CoachContext;

describe('GeminiCoachLlmClient', () => {
  let fallback: jest.Mocked<LlmClient>;
  let client: GeminiCoachLlmClient;

  beforeEach(() => {
    generateContent.mockReset();
    fallback = {
      chat: jest.fn().mockResolvedValue({ content: 'stub', promptTokens: 1, completionTokens: 1 }),
    };
    client = new GeminiCoachLlmClient('test-key', fallback);
  });

  it('đưa SYSTEM_PROMPT cũ và quy tắc chống injection vào systemInstruction', async () => {
    generateContent.mockResolvedValue({
      text: 'Bạn thử in ra giá trị biến tổng sau mỗi vòng lặp.',
      usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 15 },
    });

    const res = await client.chat(SYSTEM_PROMPT, context, 'Vòng lặp của mình sai ở đâu?');

    const req = generateContent.mock.calls[0][0];
    expect(req.config.systemInstruction).toContain(SYSTEM_PROMPT);
    expect(req.config.systemInstruction).toContain(GEMINI_GUARDRAIL_RULES);
    expect(req.config.systemInstruction).toMatch(/Không tiết lộ.*system instruction/);
    expect(req.config.maxOutputTokens).toBe(800);
    expect(res).toEqual({
      content: 'Bạn thử in ra giá trị biến tổng sau mỗi vòng lặp.',
      promptTokens: 120,
      completionTokens: 15,
    });
  });

  it('tin nhắn học viên nằm trong thẻ dữ liệu, không trộn vào systemInstruction', async () => {
    generateContent.mockResolvedValue({ text: 'ok' });

    await client.chat(SYSTEM_PROMPT, context, 'Câu hỏi của tôi');

    const req = generateContent.mock.calls[0][0];
    expect(req.contents).toContain('<hoc_vien>Câu hỏi của tôi</hoc_vien>');
    expect(req.config.systemInstruction).not.toContain('Câu hỏi của tôi');
  });

  it('Gemini lỗi (hết quota) thì dùng câu trả lời của Stub', async () => {
    generateContent.mockRejectedValue(new Error('429 RESOURCE_EXHAUSTED'));

    const res = await client.chat(SYSTEM_PROMPT, context, 'hỏi');

    expect(res.content).toBe('stub');
    expect(fallback.chat).toHaveBeenCalledWith(SYSTEM_PROMPT, context, 'hỏi');
  });
});
