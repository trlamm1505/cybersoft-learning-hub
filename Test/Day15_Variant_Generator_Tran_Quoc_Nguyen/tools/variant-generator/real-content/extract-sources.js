#!/usr/bin/env node
'use strict';
/**
 * extract-sources.js
 * ------------------------------------------------------------------
 * NGÀY 15 - trích 5 source THẬT đã chọn ở Phase 1 (xem PHASE1_SURVEY.md muc 7)
 * trực tiếp từ seed data BE, dùng đúng kỹ thuật của Day12 (extract-quiz-from-ts.js)
 * và Day13 (extract-exercises-from-ts.js) - KHÔNG bịa nội dung, KHÔNG sửa file .ts gốc.
 *
 * Dùng: node extract-sources.js <be-data-dir> <out-dir>
 * Output: <out-dir>/sources-raw.json - mảng 5 object { sourceId, sourceType, ... }
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

function extractTsConstArray(tsSource, exportName) {
  const startRe = new RegExp(`export\\s+const\\s+${exportName}\\s*[:=]`);
  const m = startRe.exec(tsSource);
  if (!m) throw new Error(`Không tìm thấy "export const ${exportName}" trong file nguồn.`);
  const afterEq = tsSource.indexOf('=', m.index);
  const bracketStart = tsSource.indexOf('[', afterEq);
  if (bracketStart === -1) throw new Error(`Không tìm thấy "[" sau "export const ${exportName} ="`);
  const literal = tsSource.slice(bracketStart);
  const end = literal.lastIndexOf(']');
  if (end === -1) throw new Error('Không thấy dấu đóng mảng cuối file.');
  const arrayText = literal.slice(0, end + 1);
  return vm.runInNewContext(`(${arrayText})`, Object.create(null), { timeout: 2000 });
}

function contentHash(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

function main() {
  const [beDataDir, outDir] = process.argv.slice(2);
  if (!beDataDir || !outDir) {
    console.error('Usage: node extract-sources.js <be-data-dir> <out-dir>');
    process.exit(2);
  }
  fs.mkdirSync(outDir, { recursive: true });

  // ---- 1. Coding exercises (initial-exercises.ts) ----
  const exTsPath = path.join(beDataDir, 'initial-exercises.ts');
  const exTsSrc = fs.readFileSync(exTsPath, 'utf8');
  const allExercises = extractTsConstArray(exTsSrc, 'INITIAL_EXERCISES');

  const CODING_SLUGS = ['tinh-tong-hai-so-nguyen', 'kiem-tra-so-chan-le', 'kiem-tra-so-nguyen-to', 'tim-so-lon-nhat'];
  const codingSources = CODING_SLUGS.map((slug) => {
    const ex = allExercises.find((e) => e.slug === slug);
    if (!ex) throw new Error(`Không tìm thấy exercise slug="${slug}" trong initial-exercises.ts - kiểm tra lại BE đã đổi dữ liệu chưa.`);
    const slim = {
      slug: ex.slug,
      title: ex.title,
      type: ex.type,
      difficulty: ex.difficulty,
      description: ex.description,
      starterCode: ex.starterCode,
      solutionCode: ex.solutionCode,
      timeLimitMs: ex.timeLimitMs,
      testCases: (ex.testCases || []).map((t) => ({ input: t.input, expectedOutput: t.expectedOutput, isHidden: !!t.isHidden })),
    };
    return {
      sourceId: ex.slug,
      sourceType: 'CODING',
      sourceFile: 'BE/src/data/initial-exercises.ts',
      content: slim,
      contentHash: contentHash(slim),
    };
  });

  // ---- 2. Quiz question (initial-quiz-questions.ts), lấy Q5 (index 4, 0-based) ----
  const qzTsPath = path.join(beDataDir, 'initial-quiz-questions.ts');
  const qzTsSrc = fs.readFileSync(qzTsPath, 'utf8');
  const allQuestions = extractTsConstArray(qzTsSrc, 'INITIAL_QUIZ_QUESTIONS');

  const QUIZ_INDEX_0BASED = 4; // Q5 = index 4 -> "console.log(typeof typeof 1);"
  const q = allQuestions[QUIZ_INDEX_0BASED];
  if (!q || !q.codeSnippet || !q.codeSnippet.includes('typeof typeof')) {
    throw new Error(`initial-quiz-questions.ts#Q${QUIZ_INDEX_0BASED + 1} không khớp câu "typeof typeof" như khảo sát Phase 1 mô tả - BE có thể đã đổi thứ tự câu hỏi. DỪNG LẠI, cần khảo sát lại.`);
  }
  const qSlim = {
    content: q.content,
    codeSnippet: q.codeSnippet,
    category: q.category,
    difficulty: q.difficulty,
    points: q.points,
    options: q.options.map((o) => ({ key: o.key, text: o.text, isCorrect: !!o.isCorrect })),
    explanation: q.explanation,
    tags: q.tags || [],
  };
  const quizSource = {
    sourceId: `initial-quiz-questions.ts#Q${QUIZ_INDEX_0BASED + 1}`,
    sourceType: 'QUIZ',
    sourceFile: 'BE/src/data/initial-quiz-questions.ts',
    content: qSlim,
    contentHash: contentHash(qSlim),
  };

  const sources = [...codingSources, quizSource];
  fs.writeFileSync(path.join(outDir, 'sources-raw.json'), JSON.stringify(sources, null, 2) + '\n', 'utf8');
  console.log(`OK: trích ${sources.length} source thật -> ${path.join(outDir, 'sources-raw.json')}`);
  sources.forEach((s) => console.log(`  - ${s.sourceId} (${s.sourceType}) hash=${s.contentHash}`));
}

main();
