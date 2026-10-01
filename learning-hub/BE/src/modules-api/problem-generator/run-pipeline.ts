/**
 * Chạy Problem Generator v0.1 qua 10 spec mẫu (learning outcome, level,
 * constraints) và xuất validation report. KHÔNG ghi gì vào MongoDB — đúng
 * điều kiện nghiệm thu "không publish tự động" của đề bài ngày 19, bài sinh
 * ra chỉ nằm trong file report chờ người review đọc và tự quyết định.
 *
 * Dùng GeminiProblemGeneratorClient (gọi Gemini thật) khi biến môi trường
 * GEMINI_API_KEY tồn tại trong learning-hub/BE/.env; nếu không, rơi về
 * StubProblemGeneratorClient (template cố định, không gọi mạng ngoài) để
 * CI/máy không có key vẫn chạy được pipeline end-to-end.
 *
 * Chạy: npx ts-node -T src/modules-api/problem-generator/run-pipeline.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PROBLEM_SPECS } from './problem-generator-specs';
import {
  ProblemGeneratorLlmClient,
  StubProblemGeneratorClient,
} from './problem-generator-llm.client';
import { GeminiProblemGeneratorClient } from './problem-generator-gemini.client';
import { buildProblemPrompt } from './problem-prompt-builder';
import { validateProblemDraft, ValidationResult } from './problem-validator';
import { ProblemDraft } from './problem-generator.types';

dotenv.config();

function toMarkdown(
  drafts: ProblemDraft[],
  results: ValidationResult[],
  generatorUsed: string,
): string {
  const passedCount = results.filter((r) => r.allTestsPassed).length;
  const readyCount = results.filter((r) => r.readyForReview).length;

  const lines: string[] = [
    '# Problem Generator v0.1 — Validation Report',
    '',
    `Generator client: ${generatorUsed}`,
    `Tổng số bài chạy qua pipeline: ${results.length}`,
    `Số bài reference solution pass mọi test: ${passedCount}/${results.length}`,
    `Số bài sẵn sàng chờ review (pass test + không nghi trùng lặp): ${readyCount}/${results.length}`,
    '',
    '| specId | Title | Slug | Syntax | Tests pass | Trùng lặp nghi vấn | Sẵn sàng review |',
    '|---|---|---|---|---|---|---|',
  ];

  for (const r of results) {
    const testSummary = `${r.testResults.filter((t) => t.passed).length}/${r.testResults.length}`;
    const dupSummary =
      r.duplicateCandidates.length === 0
        ? '-'
        : r.duplicateCandidates
            .map((d) => `${d.existingSlug} (${(d.similarity * 100).toFixed(0)}%)`)
            .join(', ');

    lines.push(
      `| ${r.specId} | ${r.title} | ${r.slug} | ${r.syntaxOk ? 'OK' : 'LỖI'} | ${testSummary} | ${dupSummary} | ${r.readyForReview ? 'Có' : 'Không'} |`,
    );
  }

  lines.push('', '## Chi tiết từng bài', '');

  for (const r of results) {
    const draft = drafts.find((d) => d.specId === r.specId)!;
    lines.push(`### ${r.specId}: ${r.title}`, '');
    lines.push(`- Slug: \`${r.slug}\``);
    lines.push(`- Độ khó: ${draft.difficulty}`);
    lines.push(`- Tags: ${draft.tags.join(', ')}`);
    lines.push(`- Mô tả: ${draft.description}`);
    lines.push(`- Prompt đã dùng để sinh bài này:`);
    lines.push('  ```');
    for (const promptLine of buildProblemPrompt(
      PROBLEM_SPECS.find((s) => s.id === r.specId)!,
    ).split('\n')) {
      lines.push(`  ${promptLine}`);
    }
    lines.push('  ```');
    lines.push(`- Cú pháp solution: ${r.syntaxOk ? 'hợp lệ' : `LỖI — ${r.syntaxError}`}`);

    if (r.testResults.length > 0) {
      lines.push('- Test case:');
      for (const t of r.testResults) {
        const label = t.isHidden ? 'hidden' : 'visible';
        lines.push(
          `  - [${t.passed ? 'PASS' : 'FAIL'}] (${label}) input=\`${t.input.replace(/\n/g, '\\n')}\` expected=\`${t.expectedOutput}\` actual=\`${t.actualOutput}\``,
        );
      }
    }

    if (r.duplicateCandidates.length > 0) {
      lines.push('- Cảnh báo trùng lặp (cần review thủ công):');
      for (const d of r.duplicateCandidates) {
        lines.push(
          `  - "${d.existingTitle}" (slug: ${d.existingSlug}) — độ tương đồng ${(d.similarity * 100).toFixed(0)}%`,
        );
      }
    } else {
      lines.push('- Không phát hiện nghi vấn trùng lặp với catalog hiện có.');
    }

    lines.push('');
  }

  return lines.join('\n');
}

function buildClient(): { client: ProblemGeneratorLlmClient; label: string } {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return {
      client: new GeminiProblemGeneratorClient(apiKey),
      label: 'GeminiProblemGeneratorClient (gemini-flash-lite-latest, gọi API thật)',
    };
  }
  return {
    client: new StubProblemGeneratorClient(),
    label: 'StubProblemGeneratorClient (template cố định — GEMINI_API_KEY chưa được cấu hình)',
  };
}

async function main() {
  const { client, label } = buildClient();
  console.log(`Dùng generator: ${label}`);

  const drafts: ProblemDraft[] = [];
  const results: ValidationResult[] = [];

  // Chạy tuần tự, không Promise.all, để không vượt rate limit của Gemini
  // free tier khi gọi 10 request gần như đồng thời.
  for (const spec of PROBLEM_SPECS) {
    const draft = await client.generate(spec);
    drafts.push(draft);
    results.push(await validateProblemDraft(draft));
  }

  const reportsDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(reportsDir, 'validation-report.json'),
    JSON.stringify({ generatorUsed: label, drafts, results }, null, 2),
    'utf-8',
  );
  fs.writeFileSync(
    path.join(reportsDir, 'validation-report.md'),
    toMarkdown(drafts, results, label),
    'utf-8',
  );

  const passedCount = results.filter((r) => r.allTestsPassed).length;
  const readyCount = results.filter((r) => r.readyForReview).length;

  console.log(
    `Đã sinh ${drafts.length} bài. ${passedCount}/${drafts.length} bài pass mọi test. ${readyCount}/${drafts.length} bài sẵn sàng chờ review.`,
  );
  console.log(`-> ${path.join(reportsDir, 'validation-report.json')}`);
  console.log(`-> ${path.join(reportsDir, 'validation-report.md')}`);

  if (passedCount < drafts.length) {
    console.error(
      'CẢNH BÁO: có bài mà reference solution không pass hết test — không được publish.',
    );
    process.exitCode = 1;
  }
}

void main();
