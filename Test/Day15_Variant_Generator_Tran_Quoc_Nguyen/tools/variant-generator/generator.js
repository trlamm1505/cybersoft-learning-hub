#!/usr/bin/env node
'use strict';
/**
 * generator.js - NGÀY 15 - Variant Generator v0.1
 * ========================================================================
 * Sinh biến thể CÓ KIỂM SOÁT từ `source-manifest.json` (5 source thật, xem
 * PHASE1_SURVEY.md). Nguyên tắc bắt buộc (theo acceptance của kế hoạch):
 *
 *   1. AI (Claude) chỉ ĐỀ XUẤT giá trị tham số (số nào, literal nào) theo
 *      `paramRules`/coverage đã thiết kế trong source-manifest.json - KHÔNG
 *      tự khẳng định đáp án.
 *   2. Đáp án (expectedOutput cho coding / tính bất biến cho quiz) LUÔN được
 *      CHƯƠNG TRÌNH tính lại bằng cách CHẠY THẬT `solutionCode` (Python qua
 *      python3) hoặc chạy thật biểu thức JS (node), không đọc/suy luận tay.
 *   3. Không đổi `description/starterCode/solutionCode/options/explanation`
 *      của source (đúng `mustNotChange` trong manifest) - chỉ đổi phần được
 *      phép đổi trong `allowedToChange`.
 *   4. Mỗi variant giữ `sourceId/sourceVersion/variantVersion` để truy vết.
 *
 * Dùng:
 *   node generator.js <source-manifest.json> <out-dir> [--variants-per-source N]
 *
 * Output:
 *   <out-dir>/variants/<sourceId-an-toàn>/V01.json .. V0N.json  (1 file/variant,
 *     đầy đủ envelope + content khớp schema thật)
 *   <out-dir>/for-validation/coding-variants.json  (mảng content coding, đúng
 *     format base-exercises.json để đưa thẳng vào Day13 coding-problem-validator)
 *   <out-dir>/for-validation/quiz-variants.json    (mảng content quiz, đúng
 *     format quiz seed để đưa thẳng vào Day12 quiz-validator)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';

function runPython(code, stdinInput) {
  const r = spawnSync(PYTHON_BIN, ['-c', code], {
    input: stdinInput,
    encoding: 'utf8',
    timeout: 5000,
    // Windows may default redirected Python output to cp1252. Force UTF-8 so
    // Vietnamese answers such as "Chẵn"/"Lẻ" can be captured reliably.
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
  });
  if (r.error) throw new Error(`Không chạy được python3: ${r.error.message}`);
  if (r.status !== 0) {
    throw new Error(`solutionCode lỗi khi chạy input=${JSON.stringify(stdinInput)}: exit=${r.status} stderr=${r.stderr}`);
  }
  return r.stdout.replace(/\r\n/g, '\n').replace(/\n+$/, '').trim();
}

function runNodeExpr(expr) {
  const r = spawnSync(process.execPath, ['-e', `console.log(${expr})`], { encoding: 'utf8', timeout: 5000 });
  if (r.status !== 0) throw new Error(`node -e lỗi cho biểu thức ${expr}: ${r.stderr}`);
  return r.stdout.trim();
}

/** Chạy solutionCode trên 1 danh sách input, trả về testCases đã RECOMPUTE expectedOutput thật. */
function buildTestCases(solutionCode, cases) {
  return cases.map(({ input, isHidden, note }) => {
    const expectedOutput = runPython(solutionCode, input);
    return { input, expectedOutput, isHidden: !!isHidden, __note: note };
  });
}

// ------------------------------------------------------------------------
// Generator riêng cho từng source (AI đề xuất GIÁ TRỊ, chương trình TÍNH LẠI)
// ------------------------------------------------------------------------

function genSumVariants(src, n) {
  // AI đề xuất 6 cặp (a,b) đa dạng: dương nhỏ, âm, hỗn hợp, số 0, số lớn, âm lớn.
  const pairSets = [
    [[2, 9], [15, 27], [-6, 20], [500000, 400000]],
    [[41, 17], [-30, -12], [0, 0], [999999, -999999]],
    [[7, 8], [-100, 250], [123456, 654321], [-1, 1]],
    [[300, 700], [-55, 55], [999999, 1], [-999999, -1]],
    [[12, 34], [-8, -9], [0, 987654], [500000, -500001]],
    [[1000, 2000], [-3000, 1500], [-999999, 999999], [222, -222]],
  ];
  const out = [];
  for (let v = 0; v < n; v++) {
    const pairs = pairSets[v % pairSets.length];
    const cases = pairs.map(([a, b], i) => ({ input: `${a}\n${b}`, isHidden: i >= 2, note: `a=${a}, b=${b}` }));
    const testCases = buildTestCases(src.content.solutionCode, cases);
    out.push({ parameters: { pairs: pairs.map(([a, b]) => ({ a, b })) }, testCases });
  }
  return out;
}

function genParityVariants(src, n) {
  const valueSets = [
    [8, 13, 0, -4],
    [21, -7, 100000, -1],
    [2, 999999, -999998, 17],
    [0, -2, 55555, -55555],
    [4, 9, -3, 1000000],
    [-6, 6, 777, -777],
  ];
  const out = [];
  for (let v = 0; v < n; v++) {
    const vals = valueSets[v % valueSets.length];
    const cases = vals.map((n2, i) => ({ input: `${n2}`, isHidden: i >= 2, note: `n=${n2}` }));
    const testCases = buildTestCases(src.content.solutionCode, cases);
    out.push({ parameters: { n: vals }, testCases });
  }
  return out;
}

function isPrimeJs(x) {
  if (x < 2) return false;
  for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;
  return true;
}

function genPrimeVariants(src, n) {
  // Mỗi variant giữ đúng "hình dạng" coverage của source gốc: [prime nhỏ, hợp số nhỏ] hiển thị,
  // [biên <2, prime/hợp số lớn] ẩn - chỉ đổi giá trị cụ thể, không đổi cấu trúc test.
  // LƯU Ý (phát hiện khi chạy Day13 validator thật - CP010): đề gốc ghi rõ "N nguyên
  // dương" (N >= 1), nên "edge" PHẢI nằm trong domain đó - dùng edge=1 (số nguyên dương
  // nhỏ nhất, vẫn <2 nên vẫn kiểm đúng nhánh "không phải số nguyên tố") thay vì 0/-5
  // (ngoài domain đề bài, CP010 coi là lỗi test-data không khớp đề, đúng vậy).
  const shapeSets = [
    { prime: 11, composite: 21, edge: 1, big: 89 },
    { prime: 13, composite: 33, edge: 1, big: 101 },
    { prime: 17, composite: 51, edge: 1, big: 199 },
    { prime: 19, composite: 77, edge: 1, big: 211 },
    { prime: 23, composite: 91, edge: 2, big: 307 }, // n=2 - biên "số nguyên tố chẵn duy nhất"
    { prime: 29, composite: 121, edge: 1, big: 401 },
  ];
  const out = [];
  for (let v = 0; v < n; v++) {
    const s = shapeSets[v % shapeSets.length];
    // AI kiểm tra nhanh bằng JS trước khi đưa vào (chỉ để CHỌN giá trị hợp lý, không dùng làm đáp án cuối)
    if (!isPrimeJs(s.prime)) throw new Error(`Giá trị đề xuất "prime"=${s.prime} thật ra không phải số nguyên tố - sửa lại shapeSets.`);
    if (isPrimeJs(s.composite)) throw new Error(`Giá trị đề xuất "composite"=${s.composite} thật ra là số nguyên tố - sửa lại shapeSets.`);
    const cases = [
      { input: `${s.prime}`, isHidden: false, note: `n=${s.prime} (prime)` },
      { input: `${s.composite}`, isHidden: false, note: `n=${s.composite} (composite)` },
      { input: `${s.edge}`, isHidden: true, note: `n=${s.edge} (edge <2)` },
      { input: `${s.big}`, isHidden: true, note: `n=${s.big} (prime lớn)` },
    ];
    const testCases = buildTestCases(src.content.solutionCode, cases);
    out.push({ parameters: s, testCases });
  }
  return out;
}

function genMaxVariants(src, n) {
  const listSets = [
    [[3, 9, -2, 7], [5]],
    [[-10, -3, -7, -1], [100, -50, 0, 99, 100]],
    [[1000, -1000, 500], [7, 7, 7, 7]],
    [[-1, -2, -3], [42]],
    [[8, 8, 9, -9], [-5, -5, -5, -6]],
    [[0, 0, 0], [123, 456, -789, 456]],
  ];
  const out = [];
  for (let v = 0; v < n; v++) {
    const [visList, hiddenList] = listSets[v % listSets.length];
    const cases = [
      { input: `${visList.length}\n${visList.join(' ')}`, isHidden: false, note: `list=${JSON.stringify(visList)}` },
      { input: `${hiddenList.length}\n${hiddenList.join(' ')}`, isHidden: true, note: `list=${JSON.stringify(hiddenList)}` },
    ];
    const testCases = buildTestCases(src.content.solutionCode, cases);
    out.push({ parameters: { lists: [visList, hiddenList] }, testCases });
  }
  return out;
}

const TYPEOF_LITERALS = [
  { code: '"hello"', label: 'chuỗi "hello"' },
  { code: 'true', label: 'boolean true' },
  { code: 'null', label: 'null' },
  { code: 'undefined', label: 'undefined' },
  { code: '[1, 2, 3]', label: 'mảng [1,2,3]' },
  { code: '3.14', label: 'số thực 3.14' },
];

function genTypeofVariants(src, n) {
  const out = [];
  for (let v = 0; v < n; v++) {
    const lit = TYPEOF_LITERALS[v % TYPEOF_LITERALS.length];
    // Tính CẢ 2 bước thật bằng node (không đoán): typeof(literal) rồi typeof(typeof(literal)).
    const innerType = runNodeExpr(`JSON.stringify(typeof (${lit.code}))`).replace(/^"|"$/g, '');
    const outerType = runNodeExpr(`JSON.stringify(typeof (typeof (${lit.code})))`).replace(/^"|"$/g, '');
    if (outerType !== 'string') {
      throw new Error(`BẤT NGỜ: typeof(typeof(${lit.code})) không phải "string" (ra "${outerType}") - dừng lại, giả định bất biến bị sai với literal này.`);
    }
    const codeSnippet = `console.log(typeof typeof ${lit.code});`;
    const content = JSON.parse(JSON.stringify(src.content)); // clone, không sửa object gốc
    content.codeSnippet = codeSnippet;
    // PHÁT HIỆN khi chạy Day12 validator thật (QV017/QV018): nếu giữ nguyên thứ tự 4 option
    // ở MỌI variant, đáp án đúng luôn nằm ở cùng 1 vị trí (option B) trong cả 6 variant -
    // đúng kiểu "học viên nhớ vị trí thay vì hiểu kiến thức" mà chính rule QV017/018 sinh ra
    // để bắt. Sửa: XOAY vòng thứ tự 4 option theo chỉ số variant (rotate), rồi gắn lại key
    // A/B/C/D theo thứ tự mới - text/isCorrect đi theo option, không đổi nội dung nào cả.
    // An toàn với BE thật: `quiz.service.ts` tự shuffle lại theo seed ở mỗi lượt thi
    // (`seededShuffle`), nên thứ tự lưu trong bank không ảnh hưởng cách học viên thấy đề.
    const texts = src.content.options.map((o) => o.text);
    const rotated = [...texts.slice(v % texts.length), ...texts.slice(0, v % texts.length)];
    const keys = ['A', 'B', 'C', 'D'];
    content.options = rotated.map((text, idx) => ({ key: keys[idx], text, isCorrect: text.replace(/["'`]/g, '') === 'string' }));
    const nCorrect = content.options.filter((o) => o.isCorrect).length;
    if (nCorrect !== 1) throw new Error(`Variant quiz phải có ĐÚNG 1 option isCorrect=true, hiện có ${nCorrect} - kiểm lại option text của source.`);
    // QUAN TRỌNG: explanation gốc nói cứng "typeof 1 trả về number" - sai với literal khác
    // (vd typeof null === "object", không phải "number"). Viết lại explanation THEO ĐÚNG
    // innerType vừa tính thật, giữ nguyên cấu trúc lập luận của source (2 bước typeof).
    content.explanation = `\`typeof ${lit.code}\` trả về chuỗi \`"${innerType}"\`. Tiếp tục thực hiện \`typeof "${innerType}"\` sẽ trả về chuỗi \`"${outerType}"\` (vì tham số của \`typeof\` lúc này đã là 1 chuỗi).`;
    out.push({
      parameters: { literal: lit.code, literalLabel: lit.label, innerType },
      content,
      recomputedTypeofTypeof: outerType,
    });
  }
  return out;
}

const GENERATORS = {
  'tinh-tong-hai-so-nguyen': genSumVariants,
  'kiem-tra-so-chan-le': genParityVariants,
  'kiem-tra-so-nguyen-to': genPrimeVariants,
  'tim-so-lon-nhat': genMaxVariants,
  'initial-quiz-questions.ts#Q5': genTypeofVariants,
};

function safeIdFor(sourceId) {
  return sourceId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function main() {
  const args = process.argv.slice(2);
  const manifestPath = args[0];
  const outDir = args[1];
  const npsIdx = args.indexOf('--variants-per-source');
  const variantsPerSource = npsIdx >= 0 ? parseInt(args[npsIdx + 1], 10) : 6;

  if (!manifestPath || !outDir) {
    console.error('Usage: node generator.js <source-manifest.json> <out-dir> [--variants-per-source N]');
    process.exit(2);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const variantsDir = path.join(outDir, 'variants');
  const forValidationDir = path.join(outDir, 'for-validation');
  fs.mkdirSync(variantsDir, { recursive: true });
  fs.mkdirSync(forValidationDir, { recursive: true });

  const codingVariantContents = [];
  const quizVariantContents = [];
  const allEnvelopes = [];

  for (const src of manifest) {
    const gen = GENERATORS[src.sourceId];
    if (!gen) throw new Error(`Chưa có generator cho sourceId="${src.sourceId}"`);
    console.log(`\n=== Sinh ${variantsPerSource} variant cho ${src.sourceId} (${src.sourceType}) ===`);
    const raw = gen(src, variantsPerSource);
    const srcDir = path.join(variantsDir, safeIdFor(src.sourceId));
    fs.mkdirSync(srcDir, { recursive: true });

    raw.forEach((r, i) => {
      const vNum = String(i + 1).padStart(2, '0');
      const variantId = `${src.sourceId}-V${vNum}`;
      // Exercise.slug là `unique: true` trong schema thật (xem PHASE1_SURVEY.md mục 2) -
      // nếu 6 variant của cùng 1 source giữ NGUYÊN slug gốc, seed vào BE sẽ vi phạm unique
      // constraint (chỉ 1/6 insert được). Phát hiện việc này bằng cách chạy Day13 validator
      // thật (CP017) trên lô đầu tiên, không phải đoán trước - nên mỗi variant coding được
      // gắn slug/title RIÊNG (hậu tố -v0N), description/starterCode/solutionCode giữ NGUYÊN
      // (đúng mustNotChange) để vẫn là "cùng 1 bài, dữ liệu test khác" về mặt nội dung.
      const codingContent = src.sourceType === 'CODING'
        ? {
            ...src.content,
            slug: `${src.content.slug}-v${vNum}`,
            title: `${src.content.title} (Biến thể ${parseInt(vNum, 10)})`,
            testCases: r.testCases.map(({ __note, ...t }) => t),
          }
        : null;
      const envelope = {
        variantId,
        sourceId: src.sourceId,
        sourceVersion: src.sourceVersion,
        variantVersion: '1.0',
        sourceType: src.sourceType,
        parameters: r.parameters,
        generationMethod: 'ai-selected-parameters + program-recomputed-answer (python3/node, khong tin truc tiep AI)',
        content: src.sourceType === 'CODING' ? codingContent : r.content,
        __testCaseNotes: src.sourceType === 'CODING' ? r.testCases.map((t) => t.__note) : undefined,
        recomputedTypeofTypeof: r.recomputedTypeofTypeof,
        validationStatus: 'PENDING', // Day12/13 validator sẽ điền ở bước sau
        humanReview: { equivalenceAccepted: null, reviewer: '', notes: '', reviewedAt: '' },
      };
      fs.writeFileSync(path.join(srcDir, `V${String(i + 1).padStart(2, '0')}.json`), JSON.stringify(envelope, null, 2) + '\n', 'utf8');
      allEnvelopes.push(envelope);

      if (src.sourceType === 'CODING') codingVariantContents.push(envelope.content);
      else quizVariantContents.push(envelope.content);

      console.log(`  ${variantId} OK (${src.sourceType === 'CODING' ? envelope.content.testCases.length + ' testCases' : 'quiz literal=' + r.parameters.literal})`);
    });
  }

  // Tách 2 thư mục con RIÊNG BIỆT (không chỉ tên file khác nhau) - Day12/13 validator quét
  // đệ quy cả thư mục được truyền vào, nếu 2 file nằm CHUNG 1 thư mục và ai đó lỡ trỏ
  // validator vào thẳng thư mục cha thì 1 loại dữ liệu sẽ bị validator SAI kiểm nhầm loại
  // kia (đã gặp lỗi này khi tự kiểm - xem AI_WORKLOG.md mục "Kiểm chứng").
  const codingDir = path.join(forValidationDir, 'coding');
  const quizDir = path.join(forValidationDir, 'quiz');
  fs.mkdirSync(codingDir, { recursive: true });
  fs.mkdirSync(quizDir, { recursive: true });
  fs.writeFileSync(path.join(codingDir, 'coding-variants.json'), JSON.stringify(codingVariantContents, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(quizDir, 'quiz-variants.json'), JSON.stringify(quizVariantContents, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(outDir, 'all-variants.json'), JSON.stringify(allEnvelopes, null, 2) + '\n', 'utf8');

  console.log(`\nTONG: ${allEnvelopes.length} variant (${codingVariantContents.length} coding + ${quizVariantContents.length} quiz)`);
  console.log(`  -> ${codingDir}/coding-variants.json (đưa vào Day13 coding-problem-validator - CHỈ trỏ vào thư mục "coding", không trỏ vào "for-validation")`);
  console.log(`  -> ${quizDir}/quiz-variants.json (đưa vào Day12 quiz-validator - CHỈ trỏ vào thư mục "quiz")`);
  console.log(`  -> ${outDir}/all-variants.json (envelope đầy đủ, traceability)`);
}

main();
