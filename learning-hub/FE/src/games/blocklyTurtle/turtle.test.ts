import { describe, expect, it } from 'vitest';
import { alphaDelta, runTurtleProgram, safeColour, safeFont, safeStyle, signature, simulate, MAX_COMMANDS } from './turtleEngine';
import { TURTLE_LEVEL_COUNT, answerCommands, blockLimit, judge, maxPixelErrors, toolboxSpec, turtleSlug, TURTLE_HINTS } from './turtleLevels';

const sigOf = (code: string) => signature(simulate(runTurtleProgram(code).cmds).ops);
const answerSig = (level: number) => signature(simulate(answerCommands(level)).ops);

describe('Turtle: hình mẫu', () => {
  it('màn 1-9 đều có lệnh vẽ, màn 10 thì không', () => {
    for (let n = 1; n <= 9; n++) expect(answerCommands(n).length).toBeGreaterThan(0);
    expect(answerCommands(10)).toEqual([]);
    expect(TURTLE_HINTS).toHaveLength(TURTLE_LEVEL_COUNT);
    expect(turtleSlug(3)).toBe('blockly-turtle-level-3');
  });

  it('chương trình chuẩn của màn 1, 2, 3 vẽ đúng hình mẫu', () => {
    expect(sigOf('for (let i = 0; i < 4; i++) { moveForward(100); turnRight(90); }')).toEqual(answerSig(1));
    expect(sigOf('for (let i = 0; i < 5; i++) { moveForward(100); turnRight(72); }')).toEqual(answerSig(2));
    expect(sigOf("penColour('#ffff00'); for (let i = 0; i < 5; i++) { moveForward(100); turnRight(144); }")).toEqual(answerSig(3));
  });

  it('hình sai cho chữ ký khác', () => {
    expect(sigOf('for (let i = 0; i < 3; i++) { moveForward(100); turnRight(90); }')).not.toEqual(answerSig(1));
  });
});

describe('Turtle: chấm điểm', () => {
  it('judge theo ngưỡng điểm ảnh và giới hạn khối', () => {
    expect(judge(1, 0, 3)).toBe('PASS');
    expect(judge(1, 0, 8)).toBe('USE_LOOP');
    expect(judge(1, maxPixelErrors(1) + 1, 3)).toBe('WRONG');
    expect(maxPixelErrors(8)).toBe(350);
    expect(maxPixelErrors(9)).toBe(600);
    expect(blockLimit(4)).toBeNull();
    expect(blockLimit(5)).toBe(10);
    expect(judge(10, 0, 1)).toBe('WRONG');
    expect(judge(10, 0, 4)).toBe('PASS');
  });

  it('alphaDelta chỉ xét kênh alpha với ngưỡng 64', () => {
    expect(alphaDelta([0, 0, 0, 0, 0, 0, 0, 255], [9, 9, 9, 0, 0, 0, 0, 0])).toBe(1);
    expect(alphaDelta([0, 0, 0, 10], [0, 0, 0, 70])).toBe(0);
  });

  it('hộp công cụ mở dần', () => {
    expect(toolboxSpec(1)).toEqual({ full: false, colour: false, pen: false });
    expect(toolboxSpec(4)).toEqual({ full: false, colour: true, pen: true });
    expect(toolboxSpec(10).full).toBe(true);
  });
});

describe('Turtle: chạy mã an toàn', () => {
  it('vòng lặp vô hạn thì TIMEOUT, lệnh đã vẽ được giữ lại', () => {
    const r = runTurtleProgram('while (true) { tick(); moveForward(1); }');
    expect(r.status).toBe('TIMEOUT');
    expect(r.cmds.length).toBeGreaterThan(0);
    expect(r.cmds.length).toBeLessThanOrEqual(MAX_COMMANDS);
  });

  it('biến toàn cục bị che, lỗi chạy trả ERROR', () => {
    expect(runTurtleProgram('fetch("/x")').status).toBe('ERROR');
    expect(runTurtleProgram('localStorage.getItem("a")').status).toBe('ERROR');
    expect(runTurtleProgram('nope()').status).toBe('ERROR');
  });

  it('giá trị không hợp lệ được làm sạch', () => {
    expect(runTurtleProgram('moveForward("abc")').cmds[0]).toMatchObject({ t: 'move', d: 0 });
    expect(safeColour('url(javascript:1)')).toBe('#000000');
    expect(safeColour('#ff0000')).toBe('#ff0000');
    expect(safeFont('Evil')).toBe('Arial');
    expect(safeStyle('bold')).toBe('bold');
    expect(safeStyle('x')).toBe('normal');
  });
});
