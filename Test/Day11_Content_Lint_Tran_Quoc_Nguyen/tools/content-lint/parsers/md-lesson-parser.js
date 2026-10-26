'use strict';
const fs = require('fs');

const SECTION_ALIASES = {
  learningOutcome: /^(learning outcome|objectives?|m[uụ]c ti[eê]u)/i,
  prerequisite: /^(prerequisites?|[dđ]i[eề]u ki[eệ]n ti[eê]n quy[eế]t)/i,
  terminology: /^(terminology|glossary|thu[aậ]t ng[uữ])/i,
  content: /^(content|n[oộ]i dung)/i,
};

const LINK_RE = /\[([^\]]*)\]\((\S*?)\)/g;

/**
 * Parser Markdown tối thiểu, KHÔNG dùng thư viện ngoài - chỉ đủ để
 * content-lint đọc được heading (title = H1 đầu tiên), các section theo
 * H2 (## ...), và link dạng [text](url). Số dòng lấy trực tiếp từ index
 * dòng khi quét file (không cần suy luận qua offset như JSON).
 */
function parseMarkdownLessonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');

  let title = null;
  let titleLine = null;
  const sections = {}; // key chuẩn hoá (learningOutcome/prerequisite/...) -> {heading, line, bodyLines: [{text, line}]}
  let currentSectionKey = null;
  let currentSectionRaw = null;

  const links = [];

  lines.forEach((lineText, idx) => {
    const lineNo = idx + 1;

    const h1 = lineText.match(/^#\s+(.+?)\s*$/);
    if (h1 && title === null) {
      title = h1[1].trim();
      titleLine = lineNo;
    }

    const h2 = lineText.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      const headingText = h2[1].trim();
      let matchedKey = null;
      for (const [key, re] of Object.entries(SECTION_ALIASES)) {
        if (re.test(headingText)) {
          matchedKey = key;
          break;
        }
      }
      currentSectionKey = matchedKey || `raw:${headingText}`;
      currentSectionRaw = { heading: headingText, line: lineNo, bodyLines: [] };
      sections[currentSectionKey] = currentSectionRaw;
      return; // dòng heading không tính là nội dung section
    }

    if (currentSectionRaw && lineText.trim() !== '') {
      currentSectionRaw.bodyLines.push({ text: lineText, line: lineNo });
    }

    let m;
    LINK_RE.lastIndex = 0;
    while ((m = LINK_RE.exec(lineText)) !== null) {
      links.push({ text: m[1], url: m[2], line: lineNo });
    }
  });

  const bulletItems = (section) => {
    if (!section) return undefined;
    return section.bodyLines
      .filter((l) => /^\s*[-*]\s+/.test(l.text))
      .map((l) => ({ text: l.text.replace(/^\s*[-*]\s+/, '').trim(), line: l.line }));
  };

  const learningOutcomeItems = bulletItems(sections.learningOutcome);
  const prerequisiteItems = bulletItems(sections.prerequisite);
  const terminologyItems = bulletItems(sections.terminology);

  const contentSection = sections.content;
  const contentText = contentSection
    ? contentSection.bodyLines.map((l) => l.text).join('\n')
    : lines.slice(titleLine || 0).join('\n');

  return {
    ok: true,
    filePath,
    raw,
    lessons: [{
      format: 'md',
      lessonUid: filePath,
      // Markdown không có JSONPath thật (không phải JSON) - dùng gốc "$md" thay vì
      // null để rules.js nối chuỗi `${lesson.jsonPath}.field` không ra "null.field".
      jsonPath: '$md',
      title,
      slug: null,
      learningOutcome: learningOutcomeItems ? learningOutcomeItems.map((i) => i.text) : undefined,
      prerequisite: prerequisiteItems ? prerequisiteItems.map((i) => ({ title: i.text, description: i.text })) : undefined,
      terminology: terminologyItems ? terminologyItems.map((i) => i.text) : undefined,
      content: contentText,
      links: links.map((l, i) => ({ field: `link[${i}] "${l.text}"`, url: l.url, line: l.line })),
      data: { title, sections },
      loc: {
        startLine: 1,
        endLine: lines.length,
        title: titleLine,
        learningOutcome: sections.learningOutcome ? sections.learningOutcome.line : null,
        learningOutcomeItems: learningOutcomeItems ? learningOutcomeItems.map((i) => i.line) : [],
        prerequisite: sections.prerequisite ? sections.prerequisite.line : null,
        prerequisiteItems: prerequisiteItems ? prerequisiteItems.map((i) => i.line) : [],
        terminology: sections.terminology ? sections.terminology.line : null,
        content: contentSection ? contentSection.line : (titleLine || 1),
        links: links.map((l) => l.line),
      },
      rawLinks: links,
      rawSections: sections,
    }],
  };
}

module.exports = { parseMarkdownLessonFile, SECTION_ALIASES };
