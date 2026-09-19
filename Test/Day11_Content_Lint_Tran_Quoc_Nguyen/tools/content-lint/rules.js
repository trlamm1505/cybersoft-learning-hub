'use strict';
/**
 * rules.js
 * ------------------------------------------------------------------
 * 20 rule CT001-CT020 cho content-lint, chia theo 6 nhóm đúng bảng đề xuất:
 *   Title (CT001-CT003), Learning outcome (CT004-CT007),
 *   Prerequisite (CT008-CT010), Terminology (CT011-CT013),
 *   Link (CT014-CT017), Structure (CT018-CT020).
 *
 * Mỗi rule là 1 object:
 *   {
 *     code, severity ('ERROR'|'WARNING'), group, appliesTo: ['json','md'],
 *     description, fix,
 *     check(lesson, ctx) -> [{ message, line, path, extra? }, ...]
 *   }
 *
 * `ctx.corpus` là danh sách TẤT CẢ lesson của MỌI file được lint trong
 * cùng 1 lần chạy (dùng cho rule cần đối chiếu chéo, vd CT010).
 */

const ERROR = 'ERROR';
const WARNING = 'WARNING';

const BANNED_WORDS = ['todo', 'fixme', 'lorem ipsum', 'asdf', 'xxx', 'blah blah', 'placeholder text'];

const CANONICAL_CASING = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  api: 'API',
  json: 'JSON',
  sql: 'SQL',
  http: 'HTTP',
};

const ACRONYM_WATCH = ['JS', 'API', 'SQL', 'UI', 'UX', 'CSS', 'HTML', 'JSON', 'HTTP'];

function normText(v) {
  return (v === undefined || v === null) ? '' : String(v).trim();
}

function isValidUrl(url) {
  try {
    // eslint-disable-next-line no-new
    const u = new URL(url);
    return !!u.protocol;
  } catch (e) {
    return false;
  }
}

const RULES = [];

function defineRule(def) {
  RULES.push(def);
}

// ==================== TITLE ==================== //

defineRule({
  code: 'CT001', severity: ERROR, group: 'Title', appliesTo: ['json', 'md'],
  description: 'Thiếu title (title bị thiếu hoặc rỗng).',
  fix: 'Thêm trường title mô tả rõ nội dung bài học.',
  check(lesson) {
    if (!lesson.title || !normText(lesson.title)) {
      return [{ message: 'title is missing', line: lesson.loc.title || lesson.loc.startLine, path: lesson.jsonPath }];
    }
    return [];
  },
});

defineRule({
  code: 'CT002', severity: WARNING, group: 'Title', appliesTo: ['json', 'md'],
  description: 'Title quá ngắn (< 10 ký tự).',
  fix: 'Viết title dài hơn, nêu rõ chủ đề + phạm vi bài học.',
  check(lesson) {
    const t = normText(lesson.title);
    if (t && t.length < 10) {
      return [{ message: `title is too short ("${t}", ${t.length} chars)`, line: lesson.loc.title, path: lesson.jsonPath }];
    }
    return [];
  },
});

defineRule({
  code: 'CT003', severity: WARNING, group: 'Title', appliesTo: ['json', 'md'],
  description: 'Title quá dài (> 100 ký tự).',
  fix: 'Rút gọn title, chuyển phần mô tả thêm xuống summary/description.',
  check(lesson) {
    const t = normText(lesson.title);
    if (t.length > 100) {
      return [{ message: `title is too long (${t.length} chars)`, line: lesson.loc.title, path: lesson.jsonPath }];
    }
    return [];
  },
});

// ==================== LEARNING OUTCOME ==================== //

defineRule({
  code: 'CT004', severity: ERROR, group: 'Learning outcome', appliesTo: ['json', 'md'],
  description: 'Thiếu learning outcome (không có field learningOutcome/objectives).',
  fix: "Thêm field learningOutcome (array các mục tiêu học tập) vào bài học.",
  check(lesson) {
    if (lesson.learningOutcome === undefined) {
      return [{ message: 'learningOutcome field is missing', line: lesson.loc.startLine, path: lesson.jsonPath }];
    }
    return [];
  },
});

defineRule({
  code: 'CT005', severity: ERROR, group: 'Learning outcome', appliesTo: ['json', 'md'],
  description: 'Learning outcome rỗng (mảng có nhưng không có phần tử nào).',
  fix: 'Bổ sung ít nhất 1 mục tiêu học tập cụ thể.',
  check(lesson) {
    if (Array.isArray(lesson.learningOutcome) && lesson.learningOutcome.length === 0) {
      return [{ message: 'learningOutcome is empty', line: lesson.loc.learningOutcome, path: `${lesson.jsonPath}.learningOutcome` }];
    }
    return [];
  },
});

defineRule({
  code: 'CT006', severity: WARNING, group: 'Learning outcome', appliesTo: ['json', 'md'],
  description: 'Learning outcome quá mơ hồ (câu quá ngắn/chung chung, không có động từ quan sát được).',
  fix: 'Dùng động từ quan sát được rõ ràng, ví dụ "giải thích", "triển khai", "so sánh" thay vì câu chung chung.',
  check(lesson) {
    if (!Array.isArray(lesson.learningOutcome)) return [];
    const findings = [];
    lesson.learningOutcome.forEach((item, i) => {
      const text = normText(item);
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (text && wordCount < 4) {
        const line = (lesson.loc.learningOutcomeItems && lesson.loc.learningOutcomeItems[i]) || lesson.loc.learningOutcome;
        findings.push({
          message: `learning outcome is too vague: "${text}"`,
          line,
          path: `${lesson.jsonPath}.learningOutcome[${i}]`,
        });
      }
    });
    return findings;
  },
});

defineRule({
  code: 'CT007', severity: WARNING, group: 'Learning outcome', appliesTo: ['json', 'md'],
  description: 'Learning outcome bị trùng lặp trong cùng 1 bài học.',
  fix: 'Gộp hoặc xoá bớt mục tiêu trùng lặp, mỗi outcome nên là 1 ý riêng biệt.',
  check(lesson) {
    if (!Array.isArray(lesson.learningOutcome)) return [];
    const findings = [];
    const seen = new Map();
    lesson.learningOutcome.forEach((item, i) => {
      const key = normText(item).toLowerCase();
      if (!key) return;
      if (seen.has(key)) {
        const line = (lesson.loc.learningOutcomeItems && lesson.loc.learningOutcomeItems[i]) || lesson.loc.learningOutcome;
        findings.push({
          message: `learning outcome[${i}] duplicates outcome[${seen.get(key)}]`,
          line,
          path: `${lesson.jsonPath}.learningOutcome[${i}]`,
        });
      } else {
        seen.set(key, i);
      }
    });
    return findings;
  },
});

// ==================== PREREQUISITE ==================== //

defineRule({
  code: 'CT008', severity: WARNING, group: 'Prerequisite', appliesTo: ['json', 'md'],
  description: 'Thiếu prerequisite (không có field prerequisite/prerequisites).',
  fix: 'Bổ sung danh sách prerequisite[]; nếu schema chưa hỗ trợ field này, cần đề xuất bổ sung trước.',
  check(lesson) {
    if (lesson.prerequisite === undefined) {
      return [{ message: 'prerequisite field is missing', line: lesson.loc.startLine, path: lesson.jsonPath }];
    }
    return [];
  },
});

defineRule({
  code: 'CT009', severity: WARNING, group: 'Prerequisite', appliesTo: ['json', 'md'],
  description: 'Prerequisite rỗng (mảng có nhưng không có phần tử nào).',
  fix: 'Bổ sung ít nhất 1 điều kiện tiên quyết, hoặc ghi rõ "Không yêu cầu tiên quyết".',
  check(lesson) {
    if (Array.isArray(lesson.prerequisite) && lesson.prerequisite.length === 0) {
      return [{ message: 'prerequisite is empty', line: lesson.loc.prerequisite, path: `${lesson.jsonPath}.prerequisite` }];
    }
    return [];
  },
});

defineRule({
  code: 'CT010', severity: ERROR, group: 'Prerequisite', appliesTo: ['json', 'md'],
  description: 'Prerequisite tham chiếu tới 1 bài học không tồn tại (vd "(Bài 04)" nhưng không có bài số 4 trong corpus).',
  fix: 'Sửa lại số/thứ tự bài học được tham chiếu, hoặc bỏ tham chiếu nếu bài đó không còn tồn tại.',
  check(lesson, ctx) {
    if (!Array.isArray(lesson.prerequisite)) return [];
    const findings = [];
    const refRe = /\(?\s*B[aà]i\s+(\d+)\s*\)?/i;
    lesson.prerequisite.forEach((pre, i) => {
      const text = `${normText(pre && pre.title)} ${normText(pre && pre.description)}`;
      const m = text.match(refRe);
      if (!m) return;
      const refNum = parseInt(m[1], 10);
      const exists = (ctx.corpus || []).some((other) => {
        const num = other.data && (other.data.lessonNumber || other.data.orderIndex);
        if (num === refNum) return true;
        const t = normText(other.title);
        return new RegExp(`B[aà]i\\s+0*${refNum}\\b`, 'i').test(t);
      });
      if (!exists) {
        const line = (lesson.loc.prerequisiteItems && lesson.loc.prerequisiteItems[i]) || lesson.loc.prerequisite;
        findings.push({
          message: `prerequisite[${i}] references "Bài ${refNum}" which does not exist in the scanned corpus`,
          line,
          path: `${lesson.jsonPath}.prerequisite[${i}]`,
        });
      }
    });
    return findings;
  },
});

// ==================== TERMINOLOGY ==================== //

defineRule({
  code: 'CT011', severity: WARNING, group: 'Terminology', appliesTo: ['json', 'md'],
  description: 'Thuật ngữ viết không nhất quán trong cùng nội dung (vd vừa "JS" vừa "Js").',
  fix: 'Chọn 1 cách viết chuẩn cho thuật ngữ và dùng thống nhất trong toàn bài.',
  check(lesson) {
    const text = normText(lesson.content);
    if (!text) return [];
    const findings = [];
    ACRONYM_WATCH.forEach((acronym) => {
      const re = new RegExp(`\\b${acronym}\\b`, 'i');
      if (!re.test(text)) return;
      const variantsRe = new RegExp(`\\b${acronym}\\b`, 'ig');
      const variants = new Set();
      let m;
      while ((m = variantsRe.exec(text)) !== null) variants.add(m[0]);
      if (variants.size > 1) {
        findings.push({
          message: `terminology "${acronym}" is inconsistent (found variants: ${[...variants].join(', ')})`,
          line: lesson.loc.content,
          path: `${lesson.jsonPath}.content`,
        });
      }
    });
    return findings;
  },
});

defineRule({
  code: 'CT012', severity: ERROR, group: 'Terminology', appliesTo: ['json', 'md'],
  description: 'Nội dung chứa từ cấm/placeholder chưa hoàn thiện (todo, fixme, lorem ipsum...).',
  fix: 'Thay từ placeholder bằng nội dung thật trước khi publish.',
  check(lesson) {
    const haystacks = [
      ['title', lesson.title, lesson.loc.title],
      ['content', lesson.content, lesson.loc.content],
    ];
    const findings = [];
    haystacks.forEach(([field, value, line]) => {
      const low = normText(value).toLowerCase();
      BANNED_WORDS.forEach((w) => {
        if (low.includes(w)) {
          findings.push({
            message: `${field} contains banned/placeholder text "${w}"`,
            line,
            path: `${lesson.jsonPath}.${field}`,
          });
        }
      });
    });
    return findings;
  },
});

defineRule({
  code: 'CT013', severity: WARNING, group: 'Terminology', appliesTo: ['json', 'md'],
  description: 'Viết hoa thuật ngữ sai convention (vd "Html" thay vì "HTML").',
  fix: 'Dùng đúng cách viết hoa chuẩn cho thuật ngữ/tên công nghệ (xem bảng canonical casing trong rules.js).',
  check(lesson) {
    const text = normText(lesson.content);
    if (!text) return [];
    const findings = [];
    Object.entries(CANONICAL_CASING).forEach(([lower, canonical]) => {
      const re = new RegExp(`\\b${lower}\\b`, 'ig');
      let m;
      while ((m = re.exec(text)) !== null) {
        if (m[0] !== canonical) {
          findings.push({
            message: `"${m[0]}" should be written as "${canonical}"`,
            line: lesson.loc.content,
            path: `${lesson.jsonPath}.content`,
          });
        }
      }
    });
    return findings;
  },
});

// ==================== LINK ==================== //

defineRule({
  code: 'CT014', severity: ERROR, group: 'Link', appliesTo: ['json', 'md'],
  description: 'Link sai định dạng URL.',
  fix: "Sửa lại URL đúng định dạng 'https://...'.",
  check(lesson) {
    const findings = [];
    (lesson.links || []).forEach(({ field, url, line }) => {
      const u = normText(url);
      if (u && !isValidUrl(u)) {
        findings.push({
          message: `${field} is malformed: "${u}"`,
          line: line || lesson.loc.startLine,
          path: `${lesson.jsonPath}.${field}`,
        });
      }
    });
    return findings;
  },
});

defineRule({
  code: 'CT015', severity: ERROR, group: 'Link', appliesTo: ['json', 'md'],
  description: 'Link rỗng (field link tồn tại nhưng giá trị rỗng).',
  fix: 'Điền URL hợp lệ hoặc bỏ hẳn field link nếu không dùng.',
  check(lesson) {
    const findings = [];
    (lesson.links || []).forEach(({ field, url, line }) => {
      if (url !== undefined && url !== null && normText(url) === '') {
        findings.push({
          message: `${field} is empty`,
          line: line || lesson.loc.startLine,
          path: `${lesson.jsonPath}.${field}`,
        });
      }
    });
    return findings;
  },
});

defineRule({
  code: 'CT016', severity: ERROR, group: 'Link', appliesTo: ['json', 'md'],
  description: 'Link dùng protocol không cho phép (chỉ cho phép http/https).',
  fix: 'Đổi sang link http(s), không dùng javascript:, data:, ftp:, file: ...',
  check(lesson) {
    const findings = [];
    (lesson.links || []).forEach(({ field, url, line }) => {
      const u = normText(url);
      if (!u || !isValidUrl(u)) return; // đã bắt bởi CT014
      const proto = new URL(u).protocol.replace(':', '');
      if (!['http', 'https'].includes(proto)) {
        findings.push({
          message: `${field} uses disallowed protocol "${proto}:"`,
          line: line || lesson.loc.startLine,
          path: `${lesson.jsonPath}.${field}`,
        });
      }
    });
    return findings;
  },
});

defineRule({
  code: 'CT017', severity: WARNING, group: 'Link', appliesTo: ['json', 'md'],
  description: 'Link bị trùng lặp trong cùng 1 bài học.',
  fix: 'Bỏ bớt link trùng, hoặc gộp lại nếu cùng trỏ tới 1 tài nguyên.',
  check(lesson) {
    const seen = new Map();
    const findings = [];
    (lesson.links || []).forEach(({ field, url, line }) => {
      const u = normText(url);
      if (!u) return;
      if (seen.has(u)) {
        findings.push({
          message: `${field} duplicates link already used in "${seen.get(u)}": ${u}`,
          line: line || lesson.loc.startLine,
          path: `${lesson.jsonPath}.${field}`,
        });
      } else {
        seen.set(u, field);
      }
    });
    return findings;
  },
});

// ==================== STRUCTURE ==================== //

defineRule({
  code: 'CT018', severity: ERROR, group: 'Structure', appliesTo: ['json', 'md'],
  description: 'Thiếu hẳn field/section bắt buộc (JSON: không có key content/contentMarkdown; Markdown: không có heading ## nào khớp Learning Outcome/Prerequisite/Terminology).',
  fix: 'JSON: thêm key content/contentMarkdown. Markdown: thêm heading "## Learning Outcome", "## Prerequisite", "## Terminology".',
  check(lesson) {
    if (lesson.format === 'json') {
      if (lesson.content === undefined) {
        return [{ message: 'required field "content"/"contentMarkdown" is missing', line: lesson.loc.startLine, path: lesson.jsonPath }];
      }
      return [];
    }
    // markdown
    const findings = [];
    const required = ['learningOutcome', 'prerequisite', 'terminology'];
    required.forEach((key) => {
      if (!lesson.rawSections || !lesson.rawSections[key]) {
        findings.push({
          message: `required section heading for "${key}" is missing`,
          line: lesson.loc.startLine,
          path: null,
        });
      }
    });
    return findings;
  },
});

defineRule({
  code: 'CT019', severity: ERROR, group: 'Structure', appliesTo: ['json'],
  description: 'Field sai kiểu dữ liệu (vd learningOutcome/prerequisite không phải array, points không phải number).',
  fix: 'Sửa lại đúng kiểu dữ liệu theo schema (array/number/boolean).',
  check(lesson) {
    const findings = [];
    const typeChecks = [
      ['learningOutcome', lesson.learningOutcome, 'array', Array.isArray(lesson.learningOutcome)],
      ['prerequisite', lesson.prerequisite, 'array', Array.isArray(lesson.prerequisite)],
    ];
    typeChecks.forEach(([field, value, expected, ok]) => {
      if (value !== undefined && !ok) {
        findings.push({
          message: `${field} should be of type ${expected}, got ${typeof value}`,
          line: lesson.loc[field] || lesson.loc.startLine,
          path: `${lesson.jsonPath}.${field}`,
        });
      }
    });
    const d = lesson.data || {};
    if (d.points !== undefined && typeof d.points !== 'number') {
      findings.push({
        message: `points should be of type number, got ${typeof d.points}`,
        line: lesson.loc.points || lesson.loc.startLine,
        path: `${lesson.jsonPath}.points`,
      });
    }
    if (d.isPublished !== undefined && typeof d.isPublished !== 'boolean') {
      findings.push({
        message: `isPublished should be of type boolean, got ${typeof d.isPublished}`,
        line: lesson.loc.isPublished || lesson.loc.startLine,
        path: `${lesson.jsonPath}.isPublished`,
      });
    }
    return findings;
  },
});

defineRule({
  code: 'CT020', severity: WARNING, group: 'Structure', appliesTo: ['json', 'md'],
  description: 'Nội dung trắng hoặc quá ngắn (content/contentMarkdown chỉ có khoảng trắng, hoặc quá ngắn để là 1 bài học hoàn chỉnh).',
  fix: 'Bổ sung nội dung bài học đầy đủ trước khi publish (tối thiểu ~40 ký tự có nghĩa).',
  check(lesson) {
    const text = normText(lesson.content);
    if (text === '') {
      return [{ message: 'content is blank/empty', line: lesson.loc.content, path: `${lesson.jsonPath}.content` }];
    }
    if (text.length < 40) {
      return [{ message: `content is too short (${text.length} chars)`, line: lesson.loc.content, path: `${lesson.jsonPath}.content` }];
    }
    return [];
  },
});

module.exports = { RULES, ERROR, WARNING, isValidUrl, normText };
