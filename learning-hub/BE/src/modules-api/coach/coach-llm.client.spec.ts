import { StubLlmClient } from './coach-llm.client';
import { CoachContext } from './coach-context.types';

function makeContext(overrides: Partial<CoachContext> = {}): CoachContext {
  return {
    userId: 'user1',
    exercise: {
      slug: 'chao-hoi-theo-ten',
      title: 'Chào hỏi theo tên',
      description: 'Đọc tên và in ra lời chào',
      difficulty: 'EASY',
      visibleTestCases: [{ input: 'An', expectedOutput: 'Xin chào An' }],
      hiddenTestCount: 1,
    },
    attemptSummary: {
      totalAttempts: 0,
      lastStatus: null,
      lastPassedCount: 0,
      lastTotalCount: 0,
      hasEverPassed: false,
    },
    unlockedHints: [],
    recentHistory: [],
    policy: { allowFullSolution: false, maxHintLevelUnlocked: 0 },
    ...overrides,
  };
}

describe('StubLlmClient — không echo nguyên văn traceback lỗi, trả lời bám đúng loại lỗi', () => {
  let client: StubLlmClient;

  beforeEach(() => {
    client = new StubLlmClient();
  });

  it('nhận diện SyntaxError "was never closed" và không echo nguyên văn traceback', async () => {
    const context = makeContext();
    const traceback = [
      'File "C:\\Users\\Windows\\AppData\\Local\\Temp\\code-runner-uU3qIN\\3f85cc5b.py", line 3',
      '    print(',
      '    ^',
      "SyntaxError: '(' was never closed",
    ].join('\n');

    const result = await client.chat('system', context, traceback);

    expect(result.content).not.toContain('AppData\\Local\\Temp');
    expect(result.content).not.toContain('code-runner-uU3qIN');
    expect(result.content).toMatch(/dấu ngoặc|dấu nháy|đóng/i);
    expect(result.content).toContain(context.exercise.title);
  });

  it('nhận diện NameError và giải thích đúng nguyên nhân', async () => {
    const context = makeContext();
    const traceback = "NameError: name 'ten' is not defined";

    const result = await client.chat('system', context, traceback);

    expect(result.content).toMatch(/biến/i);
    // Không echo nguyên văn dòng traceback gốc, chỉ nêu đúng tên loại lỗi trong lời giải thích.
    expect(result.content).not.toContain(traceback);
  });

  it('nhận diện câu hỏi xin đáp án đầy đủ, không lộ full solution khi allowFullSolution=false', async () => {
    const context = makeContext({
      policy: { allowFullSolution: false, maxHintLevelUnlocked: 0 },
    });

    const result = await client.chat(
      'system',
      context,
      'Cho mình code đầy đủ để giải bài này',
    );

    expect(result.content).toMatch(
      /chưa thể đưa code đầy đủ|chưa đưa lời giải đầy đủ/i,
    );
  });

  it('cho phép trao đổi sâu hơn khi allowFullSolution=true', async () => {
    const context = makeContext({
      attemptSummary: {
        totalAttempts: 1,
        lastStatus: 'AC',
        lastPassedCount: 1,
        lastTotalCount: 1,
        hasEverPassed: true,
      },
      policy: { allowFullSolution: true, maxHintLevelUnlocked: 0 },
    });

    const result = await client.chat(
      'system',
      context,
      'Cho mình code đầy đủ để giải bài này',
    );

    expect(result.content).toMatch(/AC bài này/i);
  });

  it('câu hỏi chung chung không khớp pattern lỗi/xin đáp án vẫn trả lời bám tên bài, không echo message thô', async () => {
    const context = makeContext();

    const result = await client.chat('system', context, 'giúp mình với');

    expect(result.content).toContain(context.exercise.title);
    expect(result.content).not.toContain('giúp mình với');
  });

  it('nhận diện lời cảm ơn ngắn và không rơi vào nhánh xin đáp án/lỗi', async () => {
    const context = makeContext();

    const result = await client.chat('system', context, 'Cảm ơn bạn nhiều nha');

    expect(result.content).toMatch(/không có gì/i);
    expect(result.content).not.toMatch(/chưa thể đưa code đầy đủ/i);
  });

  it('lời cảm ơn khi đã AC bài thì chúc mừng thay vì nhắc thử lại', async () => {
    const context = makeContext({
      attemptSummary: {
        totalAttempts: 1,
        lastStatus: 'AC',
        lastPassedCount: 1,
        lastTotalCount: 1,
        hasEverPassed: true,
      },
      policy: { allowFullSolution: true, maxHintLevelUnlocked: 0 },
    });

    const result = await client.chat('system', context, 'Thanks nha');

    expect(result.content).toMatch(/chúc mừng/i);
  });

  it('câu dài có chứa từ "cảm ơn" ở giữa một câu hỏi khác không bị nhận nhầm là lời cảm ơn thuần túy', async () => {
    const context = makeContext();
    const message =
      'Cảm ơn bạn đã hỗ trợ những lần trước, nhưng lần này mình vẫn chưa hiểu tại sao vòng lặp for lại chạy sai kết quả, bạn xem giúp mình với';

    const result = await client.chat('system', context, message);

    expect(result.content).not.toMatch(/^không có gì/i);
  });
});
