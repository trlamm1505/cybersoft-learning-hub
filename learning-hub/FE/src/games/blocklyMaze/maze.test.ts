import { describe, expect, it } from 'vitest';
import { planAnimation, START_FRAME, STEP_OTHER_MS, STEP_SUCCESS_MS } from './mazeAnimation';
import {
  constrain16,
  constrain4,
  createSimulation,
  Direction,
  findSquare,
  runProgram,
  SquareType,
  type MazeMap,
} from './mazeEngine';
import {
  MAX_BLOCKS,
  MAZE_LEVEL_COUNT,
  MAZE_LEVELS,
  maxBlocksFor,
  mazeSlug,
  tileSprites,
  toolboxSpec,
} from './mazeLevels';

const lvl = (n: number): MazeMap => MAZE_LEVELS[n - 1];

describe('bản đồ 10 màn', () => {
  it('có đúng 10 màn, mỗi màn có một điểm xuất phát và một đích, bản đồ chữ nhật', () => {
    expect(MAZE_LEVEL_COUNT).toBe(10);
    for (const map of MAZE_LEVELS) {
      const flat = map.flat();
      expect(flat.filter((c) => c === SquareType.START)).toHaveLength(1);
      expect(flat.filter((c) => c === SquareType.FINISH)).toHaveLength(1);
      expect(new Set(map.map((r) => r.length)).size).toBe(1);
      expect(flat.every((c) => c >= 0 && c <= 3)).toBe(true);
    }
  });

  it('mọi màn giải được: đích nằm trong vùng đi tới được từ điểm xuất phát', () => {
    for (const map of MAZE_LEVELS) {
      const s = findSquare(map, SquareType.START);
      const f = findSquare(map, SquareType.FINISH);
      const seen = new Set<string>([`${s.x},${s.y}`]);
      const queue = [s];
      while (queue.length) {
        const { x, y } = queue.shift()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (map[ny]?.[nx] !== undefined && map[ny][nx] !== SquareType.WALL && !seen.has(`${nx},${ny}`)) {
            seen.add(`${nx},${ny}`);
            queue.push({ x: nx, y: ny });
          }
        }
      }
      expect(seen.has(`${f.x},${f.y}`)).toBe(true);
    }
  });

  it('giới hạn số khối theo màn như bản gốc', () => {
    expect(MAX_BLOCKS).toEqual([Infinity, Infinity, 2, 5, 5, 5, 5, 10, 7, 10]);
    expect(maxBlocksFor(3)).toBe(2);
    expect(maxBlocksFor(1)).toBe(Infinity);
    expect(maxBlocksFor(99)).toBe(Infinity);
  });

  it('bộ khối mở dần: vòng lặp từ màn 3, "nếu" từ màn 6, "nếu... nếu không" từ màn 9', () => {
    expect(toolboxSpec(1)).toEqual({ forever: false, ifBlock: 'none', ifElse: false });
    expect(toolboxSpec(2).forever).toBe(false);
    expect(toolboxSpec(3)).toMatchObject({ forever: true, ifBlock: 'none' });
    expect(toolboxSpec(6)).toMatchObject({ ifBlock: 'left', ifElse: false });
    expect(toolboxSpec(7)).toMatchObject({ ifBlock: 'ahead', ifElse: false });
    expect(toolboxSpec(9)).toMatchObject({ ifBlock: 'ahead', ifElse: true });
    expect(toolboxSpec(10).ifElse).toBe(true);
  });

  it('slug tiến độ theo màn', () => {
    expect(mazeSlug(1)).toBe('blockly-maze-level-1');
    expect(mazeSlug(10)).toBe('blockly-maze-level-10');
  });

  it('mảnh ghép: mỗi ô có đúng một mảnh hợp lệ và kết quả cố định giữa các lần vẽ', () => {
    const a = tileSprites(lvl(10));
    const b = tileSprites(lvl(10));
    expect(a).toEqual(b);
    expect(a).toHaveLength(8 * 8);
    for (const t of a) {
      expect(t.col).toBeGreaterThanOrEqual(0);
      expect(t.col).toBeLessThan(5);
      expect(t.row).toBeGreaterThanOrEqual(0);
      expect(t.row).toBeLessThan(4);
    }
    // Đoạn đường ngang giữa màn 3 dùng mảnh "ngang" (3,2); hai đầu dùng mảnh ngõ cụt theo bảng của bản gốc.
    const m3 = tileSprites(lvl(3));
    const at = (x: number, y: number) => m3.find((t) => t.x === x && t.y === y)!;
    expect([at(3, 4).col, at(3, 4).row]).toEqual([3, 2]);
    expect([at(1, 4).col, at(1, 4).row]).toEqual([0, 2]); // đầu trái ('10100')
    expect([at(6, 4).col, at(6, 4).row]).toEqual([3, 3]); // đầu phải ('10001')
  });
});

describe('hướng', () => {
  it('constrain4 và constrain16 quấn vòng cả hai chiều', () => {
    expect([constrain4(-1), constrain4(4), constrain4(5), constrain4(-5)]).toEqual([3, 0, 1, 3]);
    expect([constrain16(-1), constrain16(16), constrain16(17), constrain16(15.6)]).toEqual([15, 0, 1, 0]);
  });
});

describe('runProgram: luật chơi', () => {
  it('màn 1: tiến lên 2 lần tới đích', () => {
    const r = runProgram(lvl(1), "moveForward('a'); moveForward('b');");
    expect(r.outcome).toBe('SUCCESS');
    expect(r.log.map((l) => [l.action, l.blockId])).toEqual([['east', 'a'], ['east', 'b']]);
    expect(r.final).toMatchObject({ x: 4, y: 4 });
  });

  it('chương trình dừng giữa đường là FAILURE, chương trình rỗng cũng vậy', () => {
    expect(runProgram(lvl(1), "moveForward('a');").outcome).toBe('FAILURE');
    expect(runProgram(lvl(1), '').outcome).toBe('FAILURE');
  });

  it('đâm vào tường là ERROR, ghi nhận va chạm vào nhật ký và dừng ngay', () => {
    const r = runProgram(lvl(1), "turnLeft('t'); moveForward('m'); moveForward('never');");
    expect(r.outcome).toBe('ERROR');
    expect(r.log.map((l) => l.action)).toEqual(['left', 'fail_forward']);
    expect(r.final).toMatchObject({ x: 2, y: 4 });
  });

  it('đi lùi ra khỏi bản đồ cũng là va chạm', () => {
    const r = runProgram(lvl(1), "moveBackward('x');");
    expect(r.outcome).toBe('ERROR');
    expect(r.log[0].action).toBe('fail_backward');
  });

  it('vòng lặp vô hạn bị cắt: TIMEOUT, không treo trình duyệt', () => {
    const r = runProgram(lvl(1), 'while (true) { tick(); }');
    expect(r.outcome).toBe('TIMEOUT');
    const r2 = runProgram(lvl(1), "while (true) { turnLeft('x'); }");
    expect(r2.outcome).toBe('TIMEOUT');
    const r3 = runProgram(lvl(1), 'while (notDone()) { tick(); }'); // không làm gì, không tới đích
    expect(r3.outcome).toBe('TIMEOUT');
    expect(runProgram(lvl(1), 'while (true) { tick(); }', 50).log).toHaveLength(0);
  });

  it('lỗi cú pháp hoặc mã gọi hàm lạ là ERROR, không văng ra ngoài', () => {
    expect(runProgram(lvl(1), 'moveForward(').outcome).toBe('ERROR');
    expect(runProgram(lvl(1), 'fetch("/x")').outcome).toBe('ERROR'); // API trình duyệt bị che, không gọi ra mạng
    expect(runProgram(lvl(1), 'window.location = "/x"').outcome).toBe('ERROR');
    expect(runProgram(lvl(1), 'localStorage.clear()').outcome).toBe('ERROR');
    expect(runProgram(lvl(1), 'document.body').outcome).toBe('ERROR');
    expect(runProgram(lvl(1), 'throw new Error("x")').outcome).toBe('ERROR');
  });

  it('màn 2: rẽ trái rồi rẽ phải để đi qua khúc quanh', () => {
    const code = "moveForward('1'); turnLeft('2'); moveForward('3'); turnRight('4'); moveForward('5');";
    expect(runProgram(lvl(2), code).outcome).toBe('SUCCESS');
  });

  it('màn 3: một vòng lặp tới đích', () => {
    expect(runProgram(lvl(3), "while (notDone()) { tick(); moveForward('a'); }").outcome).toBe('SUCCESS');
  });

  it('màn 4: bậc thang lặp (tiến, trái, tiến, phải)', () => {
    const code = "while (notDone()) { tick(); moveForward('a'); turnLeft('b'); moveForward('c'); turnRight('d'); }";
    expect(runProgram(lvl(4), code).outcome).toBe('SUCCESS');
  });

  it('màn 5: tiến, tiến, trái, rồi lặp tiến', () => {
    const code = "moveForward('a'); moveForward('b'); turnLeft('c'); while (notDone()) { tick(); moveForward('d'); }";
    expect(runProgram(lvl(5), code).outcome).toBe('SUCCESS');
  });

  it('các màn 6-10: quy tắc bám tường trái đưa nhân vật tới đích (dùng khối "nếu")', () => {
    const wallFollower = `
      while (notDone()) {
        tick();
        if (isPathLeft('l')) { turnLeft('t'); }
        if (isPathForward('f')) { moveForward('m'); } else { turnRight('r'); }
      }`;
    for (const n of [6, 7, 8, 9, 10]) {
      expect(runProgram(lvl(n), wallFollower).outcome, `màn ${n}`).toBe('SUCCESS');
    }
  });

  it('nhìn đường ghi nhật ký "look" kèm id khối, và nhìn hướng nào cũng đúng', () => {
    const sim = createSimulation(lvl(2));
    expect(sim.api.isPathForward('a')).toBe(true); // (3,4) mở
    expect(sim.api.isPathLeft('b')).toBe(false); // phía bắc (2,3) là tường
    expect(sim.api.isPathRight('c')).toBe(false);
    expect(sim.api.isPathBackward('d')).toBe(false);
    expect(sim.log.map((l) => l.action)).toEqual(['look_east', 'look_north', 'look_south', 'look_west']);
  });

  it('kiểm tra đường biên: ô ngoài bản đồ không phải đường, không ném lỗi', () => {
    const sim = createSimulation([[2, 3]] as MazeMap);
    expect(sim.api.isPathLeft()).toBe(false);
    expect(sim.api.isPathRight()).toBe(false);
    expect(sim.api.isPathBackward()).toBe(false);
    expect(sim.api.isPathForward()).toBe(true);
  });

  it('bản đồ thiếu điểm xuất phát bị báo lỗi rõ', () => {
    expect(() => findSquare([[0, 1]] as MazeMap, SquareType.START)).toThrow(/thiếu ô/);
  });
});

describe('planAnimation', () => {
  const run = (n: number, code: string) => {
    const r = runProgram(lvl(n), code);
    return { r, plan: planAnimation(r.log, r.outcome, findSquare(lvl(n), SquareType.START)) };
  };

  it('một bước đi là 4 khung nội suy cách nhau đúng nhịp, kèm tiếng bước và id khối', () => {
    const { plan } = run(1, "moveForward('a');");
    const f = plan.frames.slice(0, 4);
    expect(f.map((x) => x.x)).toEqual([2.25, 2.5, 2.75, 3]);
    expect(f.map((x) => x.at)).toEqual([0, STEP_OTHER_MS, STEP_OTHER_MS * 2, STEP_OTHER_MS * 3]);
    expect(f[0]).toMatchObject({ blockId: 'a', sound: 'step', d: START_FRAME(Direction.EAST) });
  });

  it('thắng thì nhanh hơn và kết thúc bằng điệu nhảy có tiếng thắng', () => {
    const { r, plan } = run(1, "moveForward('a'); moveForward('b');");
    expect(r.outcome).toBe('SUCCESS');
    expect(plan.frames[1].at).toBe(STEP_SUCCESS_MS);
    expect(plan.finishAt).toBe(STEP_SUCCESS_MS * 5 * 2);
    const dance = plan.frames.filter((f) => f.sound === 'win');
    expect(dance).toHaveLength(1);
    expect(plan.frames.at(-1)!.d).toBe(4); // đứng nghiêm quay sang Đông
    expect(plan.frames.some((f) => f.d === 16) && plan.frames.some((f) => f.d === 18)).toBe(true);
    expect(plan.duration).toBeGreaterThan(plan.finishAt!);
  });

  it('rẽ trái đổi khung hình hướng dần dần và cập nhật hướng cho bước sau', () => {
    const { plan } = run(2, "turnLeft('t'); moveForward('m');");
    const turn = plan.frames.slice(0, 4).map((x) => x.d);
    expect(turn).toEqual([3, 2, 1, 0]); // Đông (4) quay sang Bắc (0)
    expect(plan.frames[0].sound).toBe('turn');
    expect(plan.frames[4].d).toBe(0); // bước kế tiếp đi theo hướng Bắc
  });

  it('va tường: nảy hai lần, có tiếng thua hai lần và không có điệu nhảy', () => {
    const { r, plan } = run(1, "turnLeft('t'); moveForward('m');");
    expect(r.outcome).toBe('ERROR');
    const fails = plan.frames.filter((f) => f.sound === 'fail');
    expect(fails).toHaveLength(2);
    expect(plan.finishAt).toBeNull();
    expect(plan.frames.some((f) => f.sound === 'win')).toBe(false);
  });

  it('thời điểm các khung không giảm, và khung nằm trong bản đồ khi chương trình hợp lệ', () => {
    const { plan } = run(4, "while (notDone()) { tick(); moveForward('a'); turnLeft('b'); moveForward('c'); turnRight('d'); }");
    for (let i = 1; i < plan.frames.length; i++) {
      expect(plan.frames[i].at).toBeGreaterThanOrEqual(plan.frames[i - 1].at - 1e-9);
    }
    expect(plan.frames.every((f) => f.d >= 0 && f.d <= 20)).toBe(true);
  });

  it('chương trình rỗng chỉ có khung đứng yên', () => {
    const { plan } = run(1, '');
    expect(plan.frames).toHaveLength(1);
    expect(plan.duration).toBe(0);
  });

  it('nhìn đường không di chuyển nhưng vẫn tô sáng khối', () => {
    const { plan } = run(2, "isPathForward('q');");
    expect(plan.frames[0]).toMatchObject({ blockId: 'q', sound: 'look', x: 2, y: 4 });
  });
});
