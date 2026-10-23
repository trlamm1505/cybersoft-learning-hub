/**
 * Sinh conversation traces cho ngày 17 bằng cách chạy 20 failure fixtures qua
 * chính hàm production `analyzeDebugLoop` — không tự tay viết output mẫu, để
 * đảm bảo trace phản ánh đúng những gì hệ thống thực sự trả về.
 *
 * Chạy: npx ts-node -T src/modules-api/coach/fixtures/generate-traces.ts
 * (hoặc build rồi chạy bằng node, xem README cạnh file này)
 */
import * as fs from 'fs';
import * as path from 'path';
import { analyzeDebugLoop, MAX_DEBUG_LOOPS } from '../coach-debug-loop';
import { DebugLoopTestInput, DebugLoopState } from '../coach-debug-loop.types';

interface Fixture {
  id: string;
  description: string;
  input: DebugLoopTestInput;
  state: DebugLoopState;
}

const fixturesPath = path.join(__dirname, 'failure-fixtures.json');
const fixtures: Fixture[] = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));

const traces = fixtures.map((fx) => {
  const result = analyzeDebugLoop(fx.input, fx.state, MAX_DEBUG_LOOPS);
  return {
    id: fx.id,
    description: fx.description,
    turn: {
      // "Người dùng" ở đây là hệ thống nộp bài thay học viên — Debug Loop v0.1
      // không nhận input tự do, chỉ nhận submission thật đã chấm.
      systemInput: { testResult: fx.input, loopState: fx.state },
      coachOutput: result,
    },
  };
});

const outPath = path.join(__dirname, 'conversation-traces.json');
fs.writeFileSync(outPath, JSON.stringify(traces, null, 2), 'utf-8');

console.log(`Đã sinh ${traces.length} traces -> ${outPath}`);
