'use strict';
/**
 * mutation.js
 * ------------------------------------------------------------------
 * Mutation testing cho bộ test của 1 bài coding.
 *
 * Ý tưởng: lấy reference solution (đúng), cố ý sửa thành lời giải SAI (mutant),
 * rồi chấm mutant bằng CHÍNH bộ test của bài (sample + hidden) qua runner.judge
 * (mô phỏng judge thật). Mutant bị bắt (status != AC) = KILLED - bộ test đủ
 * mạnh với lỗi đó. Mutant vẫn AC = SURVIVED - bộ test có lỗ hổng độ phủ.
 *
 * Mutation Score = KILLED / VALID x 100, với VALID = tất cả mutant TRỪ:
 *   - EQUIVALENT: mutant mà con người đã xác nhận là "sai về mặt code nhưng
 *     judge KHÔNG phân biệt được với đúng" (vd thừa xuống dòng cuối vì judge trim).
 *     Bắt buộc có `equivalentReason`, và chỉ được tính EQUIVALENT khi nó thật sự
 *     SURVIVED - nếu test lại bắt được thì nó không equivalent (bị ghi cờ).
 *   - INVALID: patch không áp dụng được / mutant giống hệt reference / lỗi cú pháp
 *     (stillborn) - không có nghĩa lý gì để chấm.
 *
 * Mutant manifest (mutants/<slug>.json):
 *   { problemSlug, mutants: [ { id, type, description, expected: 'KILLED'|'TIMEOUT'|'EQUIVALENT',
 *       gapHint?, equivalent?, equivalentReason?,
 *       patch?: [{find, replace}]   // find phải xuất hiện ĐÚNG 1 lần trong reference
 *       source?: '...python...'     // hoặc thay nguyên cả file
 *   } ] }
 */
const { judge, checkSyntax } = require('./runner');

function applyMutant(reference, m) {
  if (typeof m.source === 'string') return { ok: true, source: m.source };
  if (!Array.isArray(m.patch) || m.patch.length === 0) return { ok: false, reason: 'mutant không có patch/source' };
  let src = reference;
  for (const [k, p] of m.patch.entries()) {
    const count = src.split(p.find).length - 1;
    if (count !== 1) return { ok: false, reason: `patch[${k}].find xuất hiện ${count} lần trong reference (cần đúng 1)` };
    src = src.replace(p.find, () => p.replace);
  }
  return { ok: true, source: src };
}

function classify(m, sourceRes, jr) {
  // trả về record KHÔNG chứa dữ liệu hidden (chỉ số thứ tự + kết quả)
  const sample = jr.results.filter((r) => !r.isHidden);
  const hidden = jr.results.filter((r) => r.isHidden);
  const sampleFailed = sample.filter((r) => !r.passed).map((r) => r.index + 1);
  const hiddenFailed = hidden.filter((r) => !r.passed).map((r) => r.hiddenIndex);
  const anyTle = jr.results.some((r) => r.kind === 'TLE');
  const killed = jr.status !== 'AC';
  let killedBy = null;
  if (killed) {
    if (sampleFailed.length > 0) killedBy = 'SAMPLE';
    else if (hidden.some((r) => !r.passed && r.kind !== 'TLE')) killedBy = 'HIDDEN';
    else killedBy = 'TIMEOUT';
  }
  return {
    sampleResult: sample.length ? (sampleFailed.length ? 'FAIL' : 'PASS') : '-',
    sampleFailed,
    hiddenResult: hidden.length ? (hiddenFailed.length ? 'FAIL' : 'PASS') : '-',
    hiddenPassed: `${jr.hiddenPassed}/${jr.hiddenTotal}`,
    hiddenFailed,
    hasTimeout: anyTle,
    judgeStatus: jr.status,
    killed,
    killedBy,
    maxTimeMs: jr.maxTimeMs,
  };
}

function runMutation(problem, manifest, opts = {}) {
  const records = [];
  const materialized = []; // {id, source} để ghi ra file cho con người đọc
  for (const m of manifest.mutants) {
    const base = { id: m.id, type: m.type, description: m.description, expected: m.expected, gapHint: m.gapHint || '' };
    const applied = applyMutant(problem.solutionCode, m);
    if (!applied.ok) {
      records.push({ ...base, status: 'INVALID', reason: applied.reason });
      continue;
    }
    materialized.push({ id: m.id, source: applied.source });
    if (applied.source.trim() === problem.solutionCode.trim()) {
      records.push({ ...base, status: 'INVALID', reason: 'mutant giống hệt reference' });
      continue;
    }
    const syn = checkSyntax(applied.source, opts);
    if (!syn.ok) {
      records.push({ ...base, status: 'INVALID', reason: 'mutant lỗi cú pháp (stillborn)' });
      continue;
    }
    const jr = judge(applied.source, problem.testCases, problem.timeLimitMs, opts);
    const c = classify(m, applied, jr);

    let status;
    let flag = '';
    if (c.killed) {
      status = 'KILLED';
      if (m.equivalent) flag = 'equivalentClaimWrong: mutant được đánh dấu equivalent nhưng test lại bắt được - xem lại';
    } else if (m.equivalent) {
      status = 'EQUIVALENT';
    } else {
      status = 'SURVIVED';
    }
    let expectedMatch;
    if (m.expected === 'TIMEOUT') expectedMatch = status === 'KILLED' && c.hasTimeout;
    else if (m.expected === 'EQUIVALENT') expectedMatch = status === 'EQUIVALENT';
    else expectedMatch = status === 'KILLED';

    records.push({
      ...base,
      status,
      ...c,
      expectedMatch,
      equivalentReason: m.equivalent ? m.equivalentReason || '(thiếu lý do!)' : undefined,
      flag: flag || undefined,
      patch: m.patch ? m.patch.map((p) => ({ find: p.find, replace: p.replace })) : undefined,
    });
  }
  return { records, materialized };
}

function summarize(records, threshold) {
  const count = (s) => records.filter((r) => r.status === s).length;
  const killed = count('KILLED');
  const survived = count('SURVIVED');
  const equivalent = count('EQUIVALENT');
  const invalid = count('INVALID');
  const valid = killed + survived;
  const score = valid === 0 ? 0 : Math.round((killed / valid) * 1000) / 10;
  const byType = {};
  for (const r of records) {
    const t = (byType[r.type] = byType[r.type] || { total: 0, killed: 0, survived: 0, equivalent: 0, invalid: 0 });
    t.total++;
    t[r.status.toLowerCase()]++;
  }
  const killedBy = { SAMPLE: 0, HIDDEN: 0, TIMEOUT: 0 };
  records.filter((r) => r.status === 'KILLED').forEach((r) => { killedBy[r.killedBy] = (killedBy[r.killedBy] || 0) + 1; });
  return {
    total: records.length, valid, killed, survived, equivalent, invalid,
    mutationScore: score, threshold, pass: valid > 0 && score >= threshold,
    byType, killedBy,
    survivors: records.filter((r) => r.status === 'SURVIVED').map((r) => ({ id: r.id, type: r.type, gapHint: r.gapHint })),
    unexpected: records.filter((r) => r.expectedMatch === false && r.status !== 'INVALID').map((r) => r.id),
    flags: records.filter((r) => r.flag).map((r) => ({ id: r.id, flag: r.flag })),
  };
}

function toCsv(problem, suite, records) {
  const header = ['problem', 'suite', 'mutantId', 'type', 'description', 'expected', 'sampleResult', 'hiddenResult', 'hiddenPassed', 'failedHiddenTests', 'status', 'killedBy', 'judgeStatus', 'expectedMatch', 'gapHint', 'humanVerification'];
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [header.join(',')];
  for (const r of records) {
    rows.push([
      problem.slug, suite, r.id, r.type, r.description, r.expected,
      r.sampleResult || '', r.hiddenResult || '', r.hiddenPassed || '',
      (r.hiddenFailed || []).map((n) => `#${String(n).padStart(2, '0')}`).join(' '),
      r.status, r.killedBy || '', r.judgeStatus || '',
      r.expectedMatch === undefined ? '' : r.expectedMatch ? 'yes' : 'NO',
      r.status === 'SURVIVED' ? r.gapHint : '', '',
    ].map(esc).join(','));
  }
  return rows.join('\n');
}

function coverageMarkdown(problem, suite, summary, records, reference) {
  const L = [];
  L.push(`# Coverage report - ${problem.slug} (suite: ${suite})`);
  L.push('');
  L.push(`Reference: **${reference.status}** (${reference.passedCount}/${reference.totalCount} test, hidden ${reference.hiddenPassed}/${reference.hiddenTotal}, max ${reference.maxTimeMs}ms / limit ${problem.timeLimitMs}ms)`);
  L.push('');
  L.push(`**Mutation score = ${summary.killed}/${summary.valid} = ${summary.mutationScore}%** (ngưỡng ${summary.threshold}%) -> **${summary.pass ? 'PASS' : 'FAIL'}**`);
  L.push('');
  L.push(`Killed ${summary.killed} (sample ${summary.killedBy.SAMPLE}, hidden ${summary.killedBy.HIDDEN}, timeout ${summary.killedBy.TIMEOUT}) - Survived ${summary.survived} - Equivalent ${summary.equivalent} (loại khỏi mẫu số) - Invalid ${summary.invalid}`);
  L.push('');
  L.push('| Mutant | Loại | Sample | Hidden | Hidden test fail | Kết quả | Bị bắt bởi |');
  L.push('|---|---|---|---|---|---|---|');
  for (const r of records) {
    L.push(`| ${r.id} | ${r.type} | ${r.sampleResult || '-'} | ${r.hiddenPassed || '-'} | ${(r.hiddenFailed || []).map((n) => `#${String(n).padStart(2, '0')}`).join(' ') || '-'} | ${r.status} | ${r.killedBy || '-'} |`);
  }
  if (summary.survivors.length) {
    L.push('');
    L.push('## Mutant SỐNG SÓT = lỗ hổng độ phủ của bộ test');
    L.push('');
    for (const s of summary.survivors) L.push(`- **${s.id}** (${s.type}): ${s.gapHint || '(chưa có gợi ý)'}`);
  }
  if (summary.flags.length) {
    L.push('');
    L.push('## Cờ cần người xem lại');
    summary.flags.forEach((f) => L.push(`- ${f.id}: ${f.flag}`));
  }
  L.push('');
  L.push('> Report này chỉ ghi số thứ tự hidden test (vd "Hidden test #03") - không ghi input/expected của hidden test.');
  return L.join('\n');
}

module.exports = { runMutation, summarize, toCsv, coverageMarkdown, applyMutant };
