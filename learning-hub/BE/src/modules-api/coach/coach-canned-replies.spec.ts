import { buildGreetingReply, detectGreeting } from './coach-canned-replies';

describe('detectGreeting — nhận diện lời chào đơn giản để trả lời cứng, không tốn quota gọi model', () => {
  it.each([
    'Xin chào',
    'xin chào!',
    'Chào bạn',
    'chào AI Coach',
    'Chào coach',
    'Hi',
    'hello',
    'Hey!',
    '  Xin chào  ',
  ])('nhận diện lời chào: "%s"', (message) => {
    expect(detectGreeting(message)).toBe(true);
  });

  it.each([
    'Chào bạn, mình bị lỗi SyntaxError, giúp mình với',
    'Xin chào, cho mình hỏi bài này làm sao vậy?',
    'Mình bị sai ở đâu?',
    '',
    '   ',
    'Xin chào bạn, mình muốn hỏi một câu dài hơn về đề bài này rất nhiều chữ',
  ])(
    'KHÔNG nhận nhầm câu chứa lời chào nhưng có nội dung hỏi thêm: "%s"',
    (message) => {
      expect(detectGreeting(message)).toBe(false);
    },
  );
});

describe('buildGreetingReply', () => {
  it('trả về câu chào có nhắc tên bài tập, mời hỏi tiếp', () => {
    const result = buildGreetingReply('Tính tổng hai số nguyên');
    expect(result.matched).toBe(true);
    expect(result.reply).toContain('Tính tổng hai số nguyên');
    expect(result.reply).toMatch(/giúp gì|hỗ trợ/i);
  });
});
