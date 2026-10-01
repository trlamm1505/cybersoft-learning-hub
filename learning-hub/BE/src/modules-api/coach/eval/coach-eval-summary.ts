import {
  CaseResult,
  EvalCategory,
  EvalRunVersion,
  EvalSummary,
  RubricScore,
} from './eval-types';

export function summarize(
  results: CaseResult[],
  runVersion: EvalRunVersion,
): EvalSummary {
  const byCategory: EvalSummary['byCategory'] = {
    correct: { total: 0, passed: 0, failed: 0 },
    incorrect: { total: 0, passed: 0, failed: 0 },
    missing_context: { total: 0, passed: 0, failed: 0 },
    prompt_injection: { total: 0, passed: 0, failed: 0 },
  };

  const scoreSums: RubricScore = {
    correctness: 0,
    pedagogy: 0,
    leakage: 0,
    safety: 0,
  };

  let minLeakageScore = 1;
  let minSafetyScore = 1;

  for (const r of results) {
    const bucket = byCategory[r.category];
    bucket.total += 1;
    if (r.passed) bucket.passed += 1;
    else bucket.failed += 1;

    scoreSums.correctness += r.score.correctness;
    scoreSums.pedagogy += r.score.pedagogy;
    scoreSums.leakage += r.score.leakage;
    scoreSums.safety += r.score.safety;

    minLeakageScore = Math.min(minLeakageScore, r.score.leakage);
    minSafetyScore = Math.min(minSafetyScore, r.score.safety);
  }

  const n = results.length || 1;

  return {
    totalCases: results.length,
    passedCases: results.filter((r) => r.passed).length,
    failedCases: results.filter((r) => !r.passed).length,
    byCategory,
    averageScore: {
      correctness: scoreSums.correctness / n,
      pedagogy: scoreSums.pedagogy / n,
      leakage: scoreSums.leakage / n,
      safety: scoreSums.safety / n,
    },
    minLeakageScore,
    minSafetyScore,
    generatedAt: new Date().toISOString(),
    runVersion,
  };
}

export function toMarkdown(
  summary: EvalSummary,
  results: CaseResult[],
): string {
  const lines: string[] = [];
  lines.push('# Coach Eval Harness — Baseline Report');
  lines.push('');
  lines.push(`Sinh lúc: ${summary.generatedAt}`);
  lines.push(
    `Phiên bản: promptHash=${summary.runVersion.promptHash} llmClient=${summary.runVersion.llmClientName}`,
  );
  lines.push('');
  lines.push(`- Tổng số case: ${summary.totalCases}`);
  lines.push(`- Đạt: ${summary.passedCases}`);
  lines.push(`- Không đạt: ${summary.failedCases}`);
  lines.push('');
  lines.push('## Theo category');
  lines.push('');
  lines.push('| Category | Tổng | Đạt | Không đạt |');
  lines.push('|---|---|---|---|');
  for (const cat of Object.keys(summary.byCategory) as EvalCategory[]) {
    const b = summary.byCategory[cat];
    lines.push(`| ${cat} | ${b.total} | ${b.passed} | ${b.failed} |`);
  }
  lines.push('');
  lines.push('## Điểm rubric trung bình (0..1)');
  lines.push('');
  lines.push('| Correctness | Pedagogy | Leakage | Safety |');
  lines.push('|---|---|---|---|');
  lines.push(
    `| ${summary.averageScore.correctness.toFixed(3)} | ${summary.averageScore.pedagogy.toFixed(3)} | ${summary.averageScore.leakage.toFixed(3)} | ${summary.averageScore.safety.toFixed(3)} |`,
  );
  lines.push('');
  lines.push(
    `Leakage thấp nhất: ${summary.minLeakageScore} — Safety thấp nhất: ${summary.minSafetyScore}`,
  );
  lines.push('');

  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    lines.push('## Case không đạt');
    lines.push('');
    for (const r of failed) {
      lines.push(`### ${r.id} (${r.category}) — ${r.description}`);
      lines.push('');
      for (const reason of r.failureReasons) {
        lines.push(`- ${reason}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
