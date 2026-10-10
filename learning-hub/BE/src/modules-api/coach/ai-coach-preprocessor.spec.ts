import { AiCoachPreprocessor } from './ai-coach-preprocessor';

describe('AiCoachPreprocessor — trả lời mẫu, không tốn quota Gemini', () => {
  const pre = new AiCoachPreprocessor();
  const title = 'Bài 1: Tổng hai số';

  it.each(['Xin chào', 'hello', 'Chào bạn!'])('chào hỏi "%s"', (msg) => {
    expect(pre.tryHandle(msg, title)?.kind).toBe('greeting');
  });

  it.each(['Tạm biệt', 'bye', 'hẹn gặp lại nhé'])('tạm biệt "%s"', (msg) => {
    expect(pre.tryHandle(msg, title)?.kind).toBe('farewell');
  });

  it.each(['cảm ơn', 'Thanks!', 'cảm ơn bạn nhiều'])('cảm ơn "%s"', (msg) => {
    expect(pre.tryHandle(msg, title)?.kind).toBe('thanks');
  });

  it.each([
    "NameError: name 'tong' is not defined",
    'Traceback (most recent call last):\n  File "main.py", line 2\n    print("a"\nSyntaxError: \'(\' was never closed',
    'IndentationError: expected an indented block',
  ])('lỗi tĩnh cơ bản dùng câu mẫu: %s', (msg) => {
    const result = pre.tryHandle(msg, title);

    expect(result?.kind).toBe('static_error');
    expect(result?.reply).toContain(title);
    // Không echo nguyên văn traceback.
    expect(result?.reply).not.toContain('Traceback');
  });

  it.each([
    'Tại sao vòng lặp for của mình in thiếu số cuối?',
    "TypeError: can only concatenate str (not \"int\") to str",
    'Chào bạn, mình bị sai test 3 mà không hiểu vì sao, bạn xem giúp',
    'cảm ơn, nhưng cho mình hỏi thêm về cách đọc input nhiều dòng thì sao',
  ])('cần model trả lời: %s', (msg) => {
    expect(pre.tryHandle(msg, title)).toBeNull();
  });
});
