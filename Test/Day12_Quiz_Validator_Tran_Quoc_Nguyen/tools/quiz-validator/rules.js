'use strict';
/**
 * rules.js
 * ------------------------------------------------------------------
 * NGÀY 12 - Validator đề trắc nghiệm (bản v2, sau khi tích hợp vào
 * cybersoft-learning-hub/Test/ theo hướng dẫn điều chỉnh)
 *
 * 23 rule QV001-QV023, chia theo 8 nhóm:
 *   Số đáp án (QV001-QV003), Trùng lặp (QV004-QV006), Rỗng (QV007-QV009),
 *   Answer key (QV010-QV013), Ambiguity flag (QV014-QV016),
 *   Pattern đáp án lệch (QV017-QV018, cấp độ FILE - xem FILE_LEVEL_RULES),
 *   Structure (QV019-QV020), Bổ sung theo hướng dẫn v2 (QV021-QV023).
 *
 * QV021/QV022/QV023 là 3 rule mới thêm ở bản v2, che phủ 3 ý trong bộ rule
 * đề xuất (QV009 "câu hỏi quá ngắn/mơ hồ", QV013 "câu hỏi gần trùng", QV014
 * "option quá lệch độ dài") mà bản v1 (20 rule) chưa có. Mã nội bộ KHÔNG
 * renumber lại theo đúng thứ tự liệt kê trong hướng dẫn (để không phải làm
 * lại toàn bộ 50 fixture/67 test đã kiểm chứng ở bản v1) - bảng đối chiếu
 * 1-1 giữa 15 rule đề xuất và 23 mã thực tế nằm ở README.md mục "Đối chiếu
 * với bộ rule đề xuất".
 *
 * Mỗi rule TRONG CÂU HỎI (RULES) là 1 object:
 *   {
 *     code, severity ('ERROR'|'WARNING'), group,
 *     description, fix,
 *     check(question, ctx) -> [{ message, line, path, extra? }, ...]
 *   }
 * `ctx.corpus` là TẤT CẢ câu hỏi của MỌI file được quét trong cùng 1 lần
 * chạy (dùng cho rule cần đối chiếu chéo, vd QV006 - trùng câu hỏi).
 *
 * Rule CẤP FILE (FILE_LEVEL_RULES, QV017-QV018) không gắn với 1 câu hỏi
 * riêng lẻ mà xét TOÀN BỘ câu hỏi của 1 file - vd "đáp án đúng lệch quá
 * nhiều về 1 vị trí trong cả file". Có shape khác:
 *   {
 *     code, severity, group, description, fix,
 *     check(questionsInFile, ctx) -> [{ message, line, path }, ...]
 *   }
 *
 * QUAN TRỌNG - "Không dùng AI làm nguồn phán quyết duy nhất" (điều kiện
 * nghiệm thu của kế hoạch): toàn bộ 20 rule dưới đây là logic tất định
 * (deterministic), không gọi AI/LLM nào để ra quyết định - AI chỉ được
 * dùng lúc VIẾT CODE này (xem AI_WORKLOG.md), không tham gia lúc CHẠY.
 */

const ERROR = 'ERROR';
const WARNING = 'WARNING';

// ==================== Hằng số dùng chung ==================== //

const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const BANNED_WORDS = ['todo', 'fixme', 'lorem ipsum', 'asdf', 'xxx', 'blah blah', 'placeholder text', 'tbd', 'chưa viết'];

// Các cụm từ kinh điển gây ambiguity khi hệ thống XÁO TRỘN thứ tự đáp án
// (xem `seededShuffle` trong `quiz.service.ts` của cybersoft-learning-hub -
// app này xáo trộn optionKeysOrder mỗi lượt làm bài) - 1 option kiểu "tất cả
// đáp án trên" chỉ còn đúng nghĩa nếu nó LUÔN ở vị trí cuối, điều mà hệ
// thống xáo trộn không đảm bảo => phải flag để người ra đề tự cân nhắc.
const AMBIGUOUS_PATTERNS = [
  /tất cả (các )?(đáp án|phương án|ý) (trên|ở trên)/i,
  /không có (đáp án|phương án|ý) nào (đúng|ở trên)/i,
  /all of the above/i,
  /none of the above/i,
  /both .* and .* (are|is) correct/i,
];

const MIN_OPTIONS = 2;
const MAX_OPTIONS_WARN = 6;
const MIN_CONTENT_LEN = 3;
const MIN_EXPLANATION_LEN = 15;

// Ngưỡng cho rule cấp file QV017/QV018 - xem giải thích chi tiết ở khai báo
// 2 rule đó bên dưới. Để hằng số riêng, dễ chỉnh khi áp dụng cho bộ đề khác.
const SKEW_MIN_QUESTIONS = 5; // cần ít nhất 5 câu single-choice hợp lệ mới xét lệch (tránh báo oan đề nhỏ)
const SKEW_RATIO_THRESHOLD = 0.4; // > 40% câu cùng 1 vị trí đáp án đúng -> lệch
const RUN_MIN_LENGTH = 4; // >= 4 câu LIÊN TIẾP cùng vị trí đáp án đúng -> lệch theo chuỗi

// Ngưỡng cho 3 rule bổ sung ở bản v2 (QV021-QV023) - xem giải thích chi tiết
// ở khai báo từng rule bên dưới.
const MIN_CONTENT_WORDS = 5; // content < 5 từ -> "quá ngắn/mơ hồ" (WARNING, khác QV001 - content RỖNG hẳn, severity ERROR)
const NEAR_DUP_JACCARD_THRESHOLD = 0.7; // 2 câu hỏi có >= 70% từ trùng nhau (Jaccard) nhưng KHÔNG giống hệt -> "gần trùng"
const OPTION_LENGTH_OUTLIER_RATIO = 1.8; // option đúng dài/ngắn hơn >= 1.8x độ dài trung bình các option sai -> lệch độ dài đáng ngờ

function normText(v) {
  return (v === undefined || v === null) ? '' : String(v).trim();
}

function normKey(v) {
  return normText(v).toUpperCase();
}

// Chuẩn hoá "gắt" để so khớp near-duplicate: hạ chữ thường, bỏ dấu câu/khoảng
// trắng thừa - CHỈ dùng cho QV014 (ambiguity), không dùng cho QV004 (duplicate
// chính xác) để 2 rule không chồng lấn ý nghĩa với nhau.
function normalizeForOverlap(v) {
  return normText(v)
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

const RULES = [];
const FILE_LEVEL_RULES = [];

function defineRule(def) {
  RULES.push(def);
}

function defineFileLevelRule(def) {
  FILE_LEVEL_RULES.push(def);
}

// ==================== NHÓM: SỐ ĐÁP ÁN (QV001-QV003) ==================== //

defineRule({
  code: 'QV001', severity: ERROR, group: 'Answer count',
  description: 'Thiếu hẳn field "options", hoặc "options" không phải kiểu mảng.',
  fix: 'Thêm field options (mảng {key, text, isCorrect}) cho câu hỏi.',
  check(q) {
    if (q.data.options === undefined) {
      return [{ message: 'options field is missing', line: q.loc.startLine, path: q.jsonPath }];
    }
    if (!Array.isArray(q.data.options)) {
      return [{ message: `options should be an array, got ${typeof q.data.options}`, line: q.loc.options || q.loc.startLine, path: `${q.jsonPath}.options` }];
    }
    return [];
  },
});

defineRule({
  code: 'QV002', severity: ERROR, group: 'Answer count',
  description: `Quá ít lựa chọn (dưới ${MIN_OPTIONS} option thì không còn là câu trắc nghiệm hợp lệ).`,
  fix: `Bổ sung cho đủ tối thiểu ${MIN_OPTIONS} lựa chọn.`,
  check(q) {
    if (!Array.isArray(q.data.options)) return []; // đã bắt bởi QV001
    if (q.options.length < MIN_OPTIONS) {
      return [{ message: `only ${q.options.length} option(s) found - a question needs at least ${MIN_OPTIONS}`, line: q.loc.options || q.loc.startLine, path: `${q.jsonPath}.options` }];
    }
    return [];
  },
});

defineRule({
  code: 'QV003', severity: WARNING, group: 'Answer count',
  description: `Quá nhiều lựa chọn (trên ${MAX_OPTIONS_WARN} option làm câu hỏi khó đọc/khó làm).`,
  fix: `Rút gọn còn tối đa ~${MAX_OPTIONS_WARN} lựa chọn, hoặc tách thành nhiều câu hỏi nhỏ hơn.`,
  check(q) {
    if (!Array.isArray(q.data.options)) return [];
    if (q.options.length > MAX_OPTIONS_WARN) {
      return [{ message: `${q.options.length} options is more than the recommended max (${MAX_OPTIONS_WARN})`, line: q.loc.options || q.loc.startLine, path: `${q.jsonPath}.options` }];
    }
    return [];
  },
});

// ==================== NHÓM: TRÙNG LẶP (QV004-QV006) ==================== //

defineRule({
  code: 'QV004', severity: ERROR, group: 'Duplicate',
  description: 'Có 2 option trùng nội dung text (so sánh không phân biệt hoa/thường, đã trim) trong cùng 1 câu hỏi.',
  fix: 'Xoá/sửa lại option trùng - mỗi lựa chọn phải là 1 phương án riêng biệt.',
  check(q) {
    const findings = [];
    const seen = new Map();
    q.options.forEach((opt, i) => {
      const key = normText(opt.text).toLowerCase();
      if (!key) return; // rỗng đã có QV007 lo
      if (seen.has(key)) {
        findings.push({
          message: `options[${i}] duplicates text already used in options[${seen.get(key)}]: "${normText(opt.text)}"`,
          line: opt.line,
          path: `${q.jsonPath}.options[${i}]`,
        });
      } else {
        seen.set(key, i);
      }
    });
    return findings;
  },
});

defineRule({
  code: 'QV005', severity: ERROR, group: 'Duplicate',
  description: 'Có 2 option trùng "key" (vd 2 lựa chọn cùng ghi là "A") trong cùng 1 câu hỏi.',
  fix: 'Đặt lại key duy nhất cho từng option (vd A, B, C, D, không lặp).',
  check(q) {
    const findings = [];
    const seen = new Map();
    q.options.forEach((opt, i) => {
      const key = normKey(opt.key);
      if (!key) return; // key rỗng đã có QV012 lo
      if (seen.has(key)) {
        findings.push({
          message: `options[${i}] key "${key}" duplicates key already used in options[${seen.get(key)}]`,
          line: opt.line,
          path: `${q.jsonPath}.options[${i}].key`,
        });
      } else {
        seen.set(key, i);
      }
    });
    return findings;
  },
});

defineRule({
  code: 'QV006', severity: WARNING, group: 'Duplicate',
  description: 'Nội dung câu hỏi (content) trùng với 1 câu hỏi khác đã quét trong cùng lần chạy (đối chiếu toàn bộ corpus, giống cách CT010 đối chiếu chéo ở Ngày 11).',
  fix: 'Xoá câu hỏi trùng, hoặc viết lại để hỏi khía cạnh khác.',
  check(q, ctx) {
    const text = normText(q.content).toLowerCase();
    if (!text) return []; // rỗng đã có QV008 lo
    const findings = [];
    for (const other of (ctx.corpus || [])) {
      if (other === q) continue;
      if (normText(other.content).toLowerCase() === text) {
        // Chỉ báo 1 chiều (câu xuất hiện SAU trong corpus trỏ về câu đầu tiên
        // trùng nó) để tránh báo đúp cả 2 chiều cho cùng 1 cặp trùng lặp.
        const otherPos = (ctx.corpus || []).indexOf(other);
        const myPos = (ctx.corpus || []).indexOf(q);
        if (otherPos < myPos) {
          findings.push({
            message: `question content duplicates another question (file "${other.__file || '?'}", ${other.jsonPath})`,
            line: q.loc.content,
            path: `${q.jsonPath}.content`,
          });
          break;
        }
      }
    }
    return findings;
  },
});

// ==================== NHÓM: RỖNG (QV007-QV009) ==================== //

defineRule({
  code: 'QV007', severity: ERROR, group: 'Empty',
  description: 'Option có text rỗng/trắng.',
  fix: 'Điền nội dung cho lựa chọn, hoặc xoá option đó nếu không dùng.',
  check(q) {
    const findings = [];
    q.options.forEach((opt, i) => {
      if (opt.raw && typeof opt.raw === 'object' && 'text' in opt.raw && normText(opt.text) === '') {
        findings.push({ message: `options[${i}] text is empty`, line: opt.line, path: `${q.jsonPath}.options[${i}].text` });
      }
    });
    return findings;
  },
});

defineRule({
  code: 'QV008', severity: ERROR, group: 'Empty',
  description: 'Nội dung câu hỏi (content) rỗng/trắng.',
  fix: 'Viết nội dung câu hỏi đầy đủ.',
  check(q) {
    if (q.data.content !== undefined && normText(q.content) === '') {
      return [{ message: 'content is blank/empty', line: q.loc.content, path: `${q.jsonPath}.content` }];
    }
    if (q.data.content === undefined) {
      return [{ message: 'content field is missing', line: q.loc.startLine, path: q.jsonPath }];
    }
    return [];
  },
});

defineRule({
  code: 'QV009', severity: WARNING, group: 'Empty',
  description: 'Giải thích (explanation) rỗng/trắng.',
  fix: 'Bổ sung giải thích vì sao đáp án đúng là đúng (và các đáp án khác sai).',
  check(q) {
    if (q.data.explanation !== undefined && normText(q.explanation) === '') {
      return [{ message: 'explanation is blank/empty', line: q.loc.explanation, path: `${q.jsonPath}.explanation` }];
    }
    return [];
  },
});

// ==================== NHÓM: ANSWER KEY (QV010-QV013) ==================== //

defineRule({
  code: 'QV010', severity: ERROR, group: 'Answer key',
  description: 'Không có option nào được đánh dấu đúng (isCorrect: true) - câu hỏi không có answer key.',
  fix: 'Đánh dấu đúng 1 (hoặc nhiều, nếu allowMultiple: true) option isCorrect: true.',
  check(q) {
    if (!Array.isArray(q.data.options) || q.options.length === 0) return []; // đã bắt bởi QV001/QV002
    const nCorrect = q.options.filter((o) => o.isCorrect === true).length;
    if (nCorrect === 0) {
      return [{ message: 'no option is marked isCorrect: true - missing answer key', line: q.loc.options || q.loc.startLine, path: `${q.jsonPath}.options` }];
    }
    return [];
  },
});

defineRule({
  code: 'QV011', severity: ERROR, group: 'Answer key',
  description: 'Có nhiều hơn 1 option isCorrect: true trong khi câu hỏi không khai báo allowMultiple: true (mặc định là câu 1 đáp án đúng).',
  fix: 'Chỉ giữ 1 option isCorrect: true, hoặc thêm allowMultiple: true nếu câu hỏi thật sự cho phép chọn nhiều.',
  check(q) {
    if (!Array.isArray(q.data.options)) return [];
    const correctIdx = q.options.map((o, i) => (o.isCorrect === true ? i : -1)).filter((i) => i !== -1);
    if (correctIdx.length > 1 && q.allowMultiple !== true) {
      return [{
        message: `${correctIdx.length} options are marked isCorrect: true (options[${correctIdx.join(', ')}]) but allowMultiple is not true`,
        line: q.loc.options || q.loc.startLine,
        path: `${q.jsonPath}.options`,
      }];
    }
    return [];
  },
});

defineRule({
  code: 'QV012', severity: ERROR, group: 'Answer key',
  description: 'Option thiếu "key" hoặc key rỗng.',
  fix: 'Đặt key ngắn gọn, duy nhất cho option (vd "A", "B", "C"...).',
  check(q) {
    const findings = [];
    q.options.forEach((opt, i) => {
      if (normKey(opt.key) === '') {
        findings.push({ message: `options[${i}] is missing a key`, line: opt.line, path: `${q.jsonPath}.options[${i}].key` });
      }
    });
    return findings;
  },
});

defineRule({
  code: 'QV013', severity: WARNING, group: 'Answer key',
  description: 'Explanation trích dẫn tường minh 1 key (vd `B`) khác với key của option đang isCorrect: true - có thể giải thích nhầm đáp án. CHỈ xét khi explanation có trích key trong dấu backtick/ngoặc kép rõ ràng, để tránh false positive với văn xuôi thường.',
  fix: 'Đối chiếu lại explanation với đúng option đang isCorrect: true.',
  check(q) {
    const text = normText(q.explanation);
    if (!text) return [];
    const correctKeys = new Set(q.options.filter((o) => o.isCorrect === true).map((o) => normKey(o.key)).filter(Boolean));
    if (correctKeys.size === 0) return []; // đã bắt bởi QV010, tránh báo trùng
    const validKeys = new Set(q.options.map((o) => normKey(o.key)).filter(Boolean));
    // Chỉ nhận diện key được trích dẫn RÕ RÀNG: trong backtick `X` hoặc ngoặc kép "X"
    const quoteRe = /[`"]([A-Za-z])[`"]/g;
    const mentioned = new Set();
    let m;
    while ((m = quoteRe.exec(text)) !== null) {
      const k = m[1].toUpperCase();
      if (validKeys.has(k)) mentioned.add(k);
    }
    if (mentioned.size === 0) return []; // không trích dẫn key nào rõ ràng -> không xét (tránh false positive)
    const wrongMentions = [...mentioned].filter((k) => !correctKeys.has(k));
    if (wrongMentions.length > 0 && ![...mentioned].some((k) => correctKeys.has(k))) {
      return [{
        message: `explanation explicitly quotes key(s) ${wrongMentions.join(', ')} but the marked-correct key is ${[...correctKeys].join(', ')} - possible wrong-answer explanation`,
        line: q.loc.explanation,
        path: `${q.jsonPath}.explanation`,
      }];
    }
    return [];
  },
});

// ==================== NHÓM: AMBIGUITY FLAG (QV014-QV016) ==================== //

defineRule({
  code: 'QV014', severity: WARNING, group: 'Ambiguity',
  description: 'Có 2 option gần như trùng nhau (chỉ khác dấu câu/khoảng trắng, KHÔNG trùng tuyệt đối - đã bắt riêng bởi QV004) - dễ gây khó hiểu cho người làm bài.',
  fix: 'Viết rõ ràng để 2 option không na ná nhau, hoặc gộp lại nếu thực chất là 1 phương án.',
  check(q) {
    const findings = [];
    const seen = new Map();
    q.options.forEach((opt, i) => {
      const norm = normalizeForOverlap(opt.text);
      if (!norm) return;
      const exact = normText(opt.text).toLowerCase();
      if (seen.has(norm)) {
        const { idx, exactText } = seen.get(norm);
        if (exactText !== exact) { // khác nhau ở mặt chữ (không phải QV004 trùng tuyệt đối)
          findings.push({
            message: `options[${i}] "${normText(opt.text)}" is near-identical to options[${idx}] "${q.options[idx].text !== undefined ? normText(q.options[idx].text) : exactText}" after ignoring punctuation/whitespace`,
            line: opt.line,
            path: `${q.jsonPath}.options[${i}]`,
          });
        }
      } else {
        seen.set(norm, { idx: i, exactText: exact });
      }
    });
    return findings;
  },
});

defineRule({
  code: 'QV015', severity: WARNING, group: 'Ambiguity',
  description: 'Option dùng mẫu câu kiểu "tất cả đáp án trên" / "all of the above" / "none of the above" - hệ thống XÁO TRỘN thứ tự option mỗi lượt làm bài (seededShuffle trong quiz.service.ts), nên loại option này dễ trở nên vô nghĩa hoặc sai sau khi xáo trộn.',
  fix: 'Tránh dùng "tất cả/không có đáp án trên" khi hệ thống xáo trộn thứ tự option; liệt kê tường minh các phương án đúng thay vào đó.',
  check(q) {
    const findings = [];
    q.options.forEach((opt, i) => {
      const text = normText(opt.text);
      if (!text) return;
      if (AMBIGUOUS_PATTERNS.some((re) => re.test(text))) {
        findings.push({ message: `options[${i}] "${text}" uses a shuffle-unsafe pattern ("all/none of the above")`, line: opt.line, path: `${q.jsonPath}.options[${i}]` });
      }
    });
    return findings;
  },
});

defineRule({
  code: 'QV016', severity: WARNING, group: 'Ambiguity',
  description: 'Text của 1 option là tập con (substring) của text 1 option KHÁC trong cùng câu hỏi - 2 phương án chồng lấn nghĩa, dễ gây tranh cãi đáp án nào đúng hơn.',
  fix: 'Viết lại để các option loại trừ lẫn nhau rõ ràng, không phương án nào là tập con của phương án khác.',
  check(q) {
    const findings = [];
    for (let i = 0; i < q.options.length; i++) {
      const a = normText(q.options[i].text).toLowerCase();
      if (!a) continue;
      for (let j = 0; j < q.options.length; j++) {
        if (i === j) continue;
        const b = normText(q.options[j].text).toLowerCase();
        if (!b || a === b) continue; // trùng tuyệt đối đã có QV004
        if (b.includes(a)) {
          findings.push({
            message: `options[${i}] "${normText(q.options[i].text)}" is a substring of options[${j}] "${normText(q.options[j].text)}"`,
            line: q.options[i].line,
            path: `${q.jsonPath}.options[${i}]`,
          });
          break; // 1 finding cho option i là đủ, tránh báo trùng nhiều lần với các j khác
        }
      }
    }
    return findings;
  },
});

// ==================== NHÓM: STRUCTURE (QV019-QV020) ==================== //

defineRule({
  code: 'QV019', severity: ERROR, group: 'Structure',
  description: 'Sai kiểu dữ liệu / giá trị không hợp lệ ở field cấu trúc (points không phải number, difficulty không thuộc EASY/MEDIUM/HARD, category thiếu).',
  fix: 'Sửa lại đúng kiểu dữ liệu / giá trị hợp lệ theo schema thật của BE (xem InitialQuestion trong initial-quiz-questions.ts).',
  check(q) {
    const findings = [];
    const d = q.data;
    if (d.points !== undefined && typeof d.points !== 'number') {
      findings.push({ message: `points should be of type number, got ${typeof d.points}`, line: q.loc.points || q.loc.startLine, path: `${q.jsonPath}.points` });
    }
    if (d.difficulty !== undefined && !VALID_DIFFICULTIES.includes(d.difficulty)) {
      findings.push({ message: `difficulty "${d.difficulty}" is not one of ${VALID_DIFFICULTIES.join('/')}`, line: q.loc.difficulty || q.loc.startLine, path: `${q.jsonPath}.difficulty` });
    }
    if (d.category === undefined || normText(d.category) === '') {
      findings.push({ message: 'category field is missing or empty', line: q.loc.category || q.loc.startLine, path: `${q.jsonPath}.category` });
    }
    return findings;
  },
});

defineRule({
  code: 'QV020', severity: WARNING, group: 'Structure',
  description: `Explanation quá ngắn (dưới ${MIN_EXPLANATION_LEN} ký tự) hoặc chứa từ placeholder chưa hoàn thiện (todo, fixme, lorem ipsum...).`,
  fix: 'Viết giải thích đầy đủ, đủ để người học hiểu vì sao đáp án đúng/sai - không để placeholder.',
  check(q) {
    const text = normText(q.explanation);
    if (!text) return []; // rỗng đã có QV009 lo
    const findings = [];
    const low = text.toLowerCase();
    BANNED_WORDS.forEach((w) => {
      if (low.includes(w)) {
        findings.push({ message: `explanation contains banned/placeholder text "${w}"`, line: q.loc.explanation, path: `${q.jsonPath}.explanation` });
      }
    });
    if (text.length < MIN_EXPLANATION_LEN) {
      findings.push({ message: `explanation is too short (${text.length} chars, minimum recommended ${MIN_EXPLANATION_LEN})`, line: q.loc.explanation, path: `${q.jsonPath}.explanation` });
    }
    return findings;
  },
});

// ==================== NHÓM: PATTERN ĐÁP ÁN LỆCH - CẤP FILE (QV017-QV018) ==================== //
// (Đặt sau nhóm Structure trong FILE này vì đây là 2 rule CẤP FILE - shape
// check(questionsInFile, ctx) khác với 18 rule CẤP CÂU HỎI ở trên - nhưng mã
// QV017/QV018 vẫn đứng đúng vị trí thứ tự trong bảng 20 rule ở README/rules-catalog.)

/**
 * Trả về "vị trí đáp án đúng" (0-based, theo thứ tự option trong mảng
 * options CỦA CHÍNH câu hỏi đó) cho các câu hỏi single-choice hợp lệ
 * (đúng 1 option isCorrect: true, allowMultiple !== true, options.length >= 2).
 * Câu hỏi lỗi (đã bị QV001/QV002/QV010/QV011 bắt) bị loại khỏi tập tính
 * toán để không làm nhiễu thống kê lệch pattern bằng dữ liệu vốn đã sai.
 */
function eligibleCorrectPositions(questionsInFile) {
  return questionsInFile
    .map((q) => {
      if (!Array.isArray(q.data.options) || q.options.length < MIN_OPTIONS) return null;
      if (q.allowMultiple === true) return null;
      const idx = q.options.map((o, i) => (o.isCorrect === true ? i : -1)).filter((i) => i !== -1);
      if (idx.length !== 1) return null;
      return { question: q, position: idx[0] };
    })
    .filter(Boolean);
}

defineFileLevelRule({
  code: 'QV017', severity: WARNING, group: 'Skew pattern',
  description: `Đáp án đúng LỆCH quá nhiều về 1 vị trí trong cả file (vd luôn là option đầu tiên) - chỉ xét khi file có >= ${SKEW_MIN_QUESTIONS} câu single-choice hợp lệ, và báo khi 1 vị trí chiếm > ${Math.round(SKEW_RATIO_THRESHOLD * 100)}% tổng số câu đó. Đây là dấu hiệu người ra đề vô tình tạo pattern đoán được (kể cả khi hệ thống có xáo trộn option, pattern lệch ở NGUỒN vẫn nên được sửa).`,
  fix: 'Phân bố lại vị trí đáp án đúng ngẫu nhiên hơn giữa các câu hỏi trong file.',
  check(questionsInFile) {
    const eligible = eligibleCorrectPositions(questionsInFile);
    if (eligible.length < SKEW_MIN_QUESTIONS) return [];
    const counts = new Map();
    eligible.forEach(({ position }) => counts.set(position, (counts.get(position) || 0) + 1));
    const findings = [];
    for (const [position, count] of counts.entries()) {
      const ratio = count / eligible.length;
      if (ratio > SKEW_RATIO_THRESHOLD) {
        findings.push({
          message: `correct answer sits at option position ${position} in ${count}/${eligible.length} questions (${Math.round(ratio * 100)}%) - skewed beyond the ${Math.round(SKEW_RATIO_THRESHOLD * 100)}% threshold`,
          line: null,
          path: '$',
        });
      }
    }
    return findings;
  },
});

defineFileLevelRule({
  code: 'QV018', severity: WARNING, group: 'Skew pattern',
  description: `Có >= ${RUN_MIN_LENGTH} câu hỏi LIÊN TIẾP (theo đúng thứ tự xuất hiện trong file) cùng có đáp án đúng ở CÙNG 1 vị trí - dễ bị "đoán mẫu" khi làm bài tuần tự (vd đoán luôn đáp án B trong 1 mạch câu hỏi).`,
  fix: 'Xen kẽ lại vị trí đáp án đúng giữa các câu hỏi liên tiếp trong file.',
  check(questionsInFile) {
    const eligible = eligibleCorrectPositions(questionsInFile); // giữ nguyên thứ tự xuất hiện trong file
    const findings = [];
    let runStart = 0;
    for (let i = 1; i <= eligible.length; i++) {
      const samePos = i < eligible.length && eligible[i].position === eligible[runStart].position;
      if (!samePos) {
        const runLen = i - runStart;
        if (runLen >= RUN_MIN_LENGTH) {
          const first = eligible[runStart].question;
          const last = eligible[i - 1].question;
          findings.push({
            message: `${runLen} consecutive questions (${first.jsonPath} .. ${last.jsonPath}) all have the correct answer at option position ${eligible[runStart].position}`,
            line: first.loc.startLine,
            path: first.jsonPath,
          });
        }
        runStart = i;
      }
    }
    return findings;
  },
});

// ==================== NHÓM: BỔ SUNG THEO HƯỚNG DẪN V2 (QV021-QV023) ==================== //
// 3 rule mới, che phủ 3 ý trong bộ rule đề xuất mà bản v1 (20 rule) chưa có
// - xem ghi chú đầu file.

function jaccardSimilarity(textA, textB) {
  const wordsA = new Set(normText(textA).toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(normText(textB).toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersection++;
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

defineRule({
  code: 'QV021', severity: WARNING, group: 'Content quality',
  description: `Nội dung câu hỏi quá ngắn/mơ hồ (dưới ${MIN_CONTENT_WORDS} từ) - có thể thiếu ngữ cảnh để người học hiểu đúng câu hỏi đang hỏi gì. Khác với QV008 (content RỖNG hẳn, severity ERROR): đây là content CÓ NỘI DUNG nhưng quá ngắn để đủ rõ nghĩa.`,
  fix: 'Viết lại câu hỏi đầy đủ ngữ cảnh hơn - nêu rõ chủ đề, tình huống hoặc đoạn code liên quan trước khi hỏi.',
  check(q) {
    const text = normText(q.content);
    if (!text) return []; // rỗng hẳn đã có QV008 lo
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount < MIN_CONTENT_WORDS) {
      return [{ message: `content is too short/vague (${wordCount} word(s), minimum recommended ${MIN_CONTENT_WORDS}): "${text}"`, line: q.loc.content, path: `${q.jsonPath}.content` }];
    }
    return [];
  },
});

defineRule({
  code: 'QV022', severity: WARNING, group: 'Duplicate',
  description: `Câu hỏi GẦN TRÙNG với 1 câu hỏi khác trong cùng lần chạy (Jaccard similarity theo tập từ >= ${NEAR_DUP_JACCARD_THRESHOLD}, nhưng KHÔNG giống hệt - đã bắt riêng bởi QV006). Khác QV006 ở chỗ bắt được cả paraphrase/diễn đạt lại gần giống, không chỉ trùng tuyệt đối.`,
  fix: 'Đối chiếu lại 2 câu hỏi - nếu thực chất hỏi cùng 1 ý, xoá bớt hoặc viết lại để khác biệt rõ ràng hơn (đổi góc nhìn, đổi ví dụ/đoạn code).',
  check(q, ctx) {
    const text = normText(q.content).toLowerCase();
    if (!text) return []; // rỗng đã có QV008 lo
    const findings = [];
    const corpus = ctx.corpus || [];
    const myPos = corpus.indexOf(q);
    for (const other of corpus) {
      if (other === q) continue;
      const otherPos = corpus.indexOf(other);
      if (otherPos >= myPos) continue; // chỉ báo 1 chiều, về phía câu xuất hiện TRƯỚC (tránh báo đúp cả 2 chiều)
      const otherText = normText(other.content).toLowerCase();
      if (!otherText || otherText === text) continue; // trùng tuyệt đối đã có QV006 lo
      const sim = jaccardSimilarity(text, otherText);
      if (sim >= NEAR_DUP_JACCARD_THRESHOLD) {
        findings.push({
          message: `question content is near-duplicate of another question (${Math.round(sim * 100)}% word overlap, file "${other.__file || '?'}", ${other.jsonPath})`,
          line: q.loc.content,
          path: `${q.jsonPath}.content`,
        });
        break; // 1 finding cho câu này là đủ, không báo trùng với nhiều câu khác cùng lúc
      }
    }
    return findings;
  },
});

defineRule({
  code: 'QV023', severity: WARNING, group: 'Ambiguity',
  description: `Độ dài option đúng lệch bất thường so với các option sai (>= ${OPTION_LENGTH_OUTLIER_RATIO}x dài hơn hoặc ngắn hơn trung bình các option sai) - thiên kiến ra đề kinh điển: đáp án đúng thường được viết chi tiết/cẩn thận hơn (dài hơn hẳn) các phương án nhiễu, vô tình trở thành "gợi ý" cho người làm bài đoán mò.`,
  fix: 'Viết lại các option sai (distractor) với độ dài tương đương option đúng, tránh để đáp án đúng nổi bật bất thường về độ dài.',
  check(q) {
    if (!Array.isArray(q.data.options) || q.options.length < MIN_OPTIONS) return []; // đã bắt bởi QV001/QV002
    const correctIdx = q.options.map((o, i) => (o.isCorrect === true ? i : -1)).filter((i) => i !== -1);
    if (correctIdx.length !== 1) return []; // chỉ xét câu single-choice hợp lệ (đã bắt bởi QV010/QV011 nếu không hợp lệ)
    const correct = q.options[correctIdx[0]];
    const distractors = q.options.filter((o, i) => i !== correctIdx[0] && normText(o.text) !== '');
    if (distractors.length < MIN_OPTIONS - 1) return []; // không đủ distractor có nội dung để so sánh
    const correctLen = normText(correct.text).length;
    if (correctLen === 0) return []; // rỗng đã có QV007 lo
    const avgDistractorLen = distractors.reduce((sum, o) => sum + normText(o.text).length, 0) / distractors.length;
    if (avgDistractorLen === 0) return [];
    const ratio = correctLen / avgDistractorLen;
    if (ratio >= OPTION_LENGTH_OUTLIER_RATIO) {
      return [{ message: `correct option is ${ratio.toFixed(1)}x longer than the average distractor (${correctLen} vs avg ${avgDistractorLen.toFixed(1)} chars) - possible length-based giveaway`, line: correct.line, path: `${q.jsonPath}.options[${correctIdx[0]}]` }];
    }
    if (ratio <= 1 / OPTION_LENGTH_OUTLIER_RATIO) {
      return [{ message: `correct option is ${(1 / ratio).toFixed(1)}x shorter than the average distractor (${correctLen} vs avg ${avgDistractorLen.toFixed(1)} chars) - possible length-based giveaway`, line: correct.line, path: `${q.jsonPath}.options[${correctIdx[0]}]` }];
    }
    return [];
  },
});

module.exports = {
  RULES,
  FILE_LEVEL_RULES,
  ERROR,
  WARNING,
  normText,
  normKey,
  normalizeForOverlap,
  jaccardSimilarity,
  VALID_DIFFICULTIES,
  SKEW_MIN_QUESTIONS,
  SKEW_RATIO_THRESHOLD,
  RUN_MIN_LENGTH,
  MIN_CONTENT_WORDS,
  NEAR_DUP_JACCARD_THRESHOLD,
  OPTION_LENGTH_OUTLIER_RATIO,
};
