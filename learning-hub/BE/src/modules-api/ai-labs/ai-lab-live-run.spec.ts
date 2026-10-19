import { evaluateLiveOutput, extractKeywords, isValidJson, pickLiveItems, requiresJson, runLiveCheck } from './ai-lab-live-run';
import type { EvaluationItem } from '../../integration/dataset-contract.types';

const item = (over: Partial<EvaluationItem> = {}): EvaluationItem => ({
  question_id: 'q1',
  query: 'Phí học lại là bao nhiêu?',
  category: 'standard_qa',
  expected_behavior: 'ANSWER',
  ground_truths: ['Phí học lại là 500.000 đồng cho mỗi môn, đóng trong vòng 7 ngày.'],
  expected_doc_ids: [],
  ...over,
});

describe('chấm câu trả lời thật của AI Lab', () => {
  it('trích từ khóa: số liệu trước, rồi từ đặc trưng, tối đa 6', () => {
    const k = extractKeywords('Phí học lại là 500.000 đồng cho mỗi môn, đóng trong vòng 7 ngày.');
    expect(k[0]).toBe('500.000');
    expect(k).toContain('7');
    expect(k.length).toBeLessThanOrEqual(6);
  });

  it('ANSWER: độ phủ từ khóa chỉ để tham khảo, câu trả lời có nội dung vẫn đạt', () => {
    const full = evaluateLiveOutput(item(), 'Phí học lại là 500.000 đồng mỗi môn, đóng trong 7 ngày.', false);
    expect(full).toMatchObject({ passed: true, checks: { keywordCoverage: 1, keywordsInformational: false } });
    const low = evaluateLiveOutput(item(), 'Bạn hãy liên hệ phòng học vụ.', false);
    expect(low.passed).toBe(true);
    expect(low.checks.keywordsInformational).toBe(true);
    expect(low.checks.missingKeywords!.length).toBeGreaterThan(0);
    expect(evaluateLiveOutput(item(), '   ', false).passed).toBe(false);
  });

  it('ABSTAIN: phải từ chối đúng cách', () => {
    const abstain = item({ expected_behavior: 'ABSTAIN', ground_truths: [] });
    expect(evaluateLiveOutput(abstain, 'Xin lỗi, thông tin này nằm ngoài phạm vi tài liệu.', false).passed).toBe(true);
    expect(evaluateLiveOutput(abstain, 'Có, CyberSoft hỗ trợ trường hợp này.', false).passed).toBe(false);
  });

  it('bài yêu cầu JSON: câu trả lời không phải JSON hợp lệ thì trượt dù có đủ nội dung', () => {
    const out = 'Phí học lại là 500.000 đồng mỗi môn, đóng trong 7 ngày.';
    expect(evaluateLiveOutput(item(), out, true)).toMatchObject({ passed: false, checks: { jsonValid: false } });
    const json = '```json\n{"phi":"500.000 đồng","han":"7 ngày","ghi_chu":"mỗi môn học lại"}\n```';
    expect(evaluateLiveOutput(item(), json, true).checks.jsonValid).toBe(true);
    expect(isValidJson('{"a":')).toBe(false);
    expect(isValidJson('chữ thường')).toBe(false);
  });

  it('nhận biết bài yêu cầu JSON từ prompt hoặc đề bài', () => {
    expect(requiresJson('Trả lời dưới dạng JSON')).toBe(true);
    expect(requiresJson('Trả lời ngắn', 'Đầu ra phải là JSON hợp lệ')).toBe(true);
    expect(requiresJson('Trả lời ngắn', 'Viết prompt')).toBe(false);
  });

  it('chọn mỗi loại câu một câu, tối đa 3', () => {
    const items = ['a', 'a', 'b', 'c', 'd'].map((c, i) => item({ question_id: `q${i}`, category: c }));
    expect(pickLiveItems(items).map((i) => i.category)).toEqual(['a', 'b', 'c']);
  });
});

describe('runLiveCheck', () => {
  it('chạy thật qua llm, truyền prompt làm system và câu hỏi làm nội dung', async () => {
    const llm = { generate: jest.fn().mockResolvedValue('Phí học lại là 500.000 đồng mỗi môn, đóng trong 7 ngày.') };
    const r = await runLiveCheck(llm, { prompt: 'Bạn là trợ giảng.', rag: false, items: [item()], model: 'gemini-x' });
    expect(llm.generate).toHaveBeenCalledWith('Bạn là trợ giảng.', 'Phí học lại là bao nhiêu?');
    expect(r).toMatchObject({ source: 'gemini', model: 'gemini-x', passRate: 1 });
  });

  it('không có llm / bài RAG / Gemini lỗi: không ném lỗi, báo rõ lý do', async () => {
    expect((await runLiveCheck(null, { prompt: 'p', rag: false, items: [item()] })).source).toBe('unavailable');
    expect((await runLiveCheck({ generate: jest.fn() }, { prompt: 'p', rag: true, items: [item()] })).source).toBe('skipped');
    const failing = { generate: jest.fn().mockRejectedValue(new Error('429')) };
    const r = await runLiveCheck(failing, { prompt: 'p', rag: false, items: [item()] });
    expect(r).toMatchObject({ source: 'unavailable', passRate: 0 });
  });
});
