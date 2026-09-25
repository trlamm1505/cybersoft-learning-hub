/**
 * Sinh baseline report cho Coach Eval Harness ngày 18 bằng cách chạy toàn bộ
 * 100 test case qua đúng hàm production (không tự viết tay kết quả mẫu) —
 * cùng triết lý với coach/fixtures/generate-traces.ts của ngày 17.
 *
 * Chạy: npx ts-node -T src/modules-api/coach/eval/generate-baseline-report.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { runAllCases } from './run-all-cases';
import { summarize, toMarkdown } from './coach-eval-summary';
import { getEvalRunVersion } from './coach-eval-runner';

async function main() {
  const results = await runAllCases();
  const runVersion = getEvalRunVersion();
  const summary = summarize(results, runVersion);

  const reportsDir = path.join(__dirname, 'reports');
  const historyDir = path.join(reportsDir, 'history');
  fs.mkdirSync(historyDir, { recursive: true });

  const reportJson = JSON.stringify({ summary, results }, null, 2);
  const reportMarkdown = toMarkdown(summary, results);

  // File "mới nhất" luôn bị ghi đè — dùng để xem nhanh kết quả lần chạy gần
  // nhất. File trong history/ đặt tên theo promptHash, KHÔNG bị ghi đè giữa
  // các lần chạy có promptHash khác nhau — đây là cơ chế thực hiện điều kiện
  // nghiệm thu "chạy regression theo prompt/model version": so sánh 2 file
  // trong history/ ứng với 2 promptHash khác nhau để biết đổi prompt làm
  // điểm rubric tăng/giảm thế nào.
  fs.writeFileSync(
    path.join(reportsDir, 'baseline-report.json'),
    reportJson,
    'utf-8',
  );
  fs.writeFileSync(
    path.join(reportsDir, 'baseline-report.md'),
    reportMarkdown,
    'utf-8',
  );
  const historyBaseName = `${runVersion.promptHash}_${runVersion.llmClientName}`;
  fs.writeFileSync(
    path.join(historyDir, `${historyBaseName}.json`),
    reportJson,
    'utf-8',
  );

  console.log(
    `Đã sinh baseline report: ${summary.passedCases}/${summary.totalCases} case đạt.`,
  );
  console.log(
    `Phiên bản: promptHash=${runVersion.promptHash} llmClient=${runVersion.llmClientName}`,
  );
  console.log(`-> ${path.join(reportsDir, 'baseline-report.json')}`);
  console.log(`-> ${path.join(reportsDir, 'baseline-report.md')}`);
  console.log(`-> ${path.join(historyDir, `${historyBaseName}.json`)}`);

  if (summary.minLeakageScore < 1) {
    console.error('CẢNH BÁO: có case rò rỉ dữ liệu (leakage score < 1).');
    process.exitCode = 1;
  }
}

void main();
