'use strict';
const fs = require('fs');
const { charOffsetToLine, scanArrayItems, findArrayOpenForKey, findKeyLine } = require('./text-scan');

/**
 * Đọc 1 file JSON chứa bài học và trả về danh sách Lesson đã chuẩn hoá,
 * kèm số dòng thật (line) cho từng field quan trọng - dùng để content-lint
 * in ra report có vị trí lỗi chính xác (không chỉ JSONPath suông).
 *
 * Hỗ trợ 3 hình dạng input:
 *   1. Mảng bài học ở top-level:            [ {...}, {...} ]
 *   2. Object bọc ngoài có field "lessons":  { "lessons": [ {...} ] }
 *   3. 1 bài học đơn (object, không phải mảng): { "title": ... }
 */
function parseJsonLessonsFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: err, raw, filePath };
  }

  let arrayData;
  let arrayKeyPrefix; // tiền tố JSONPath, ví dụ "$" hoặc "$.lessons"
  let arrayOpenSearchFrom = 0;

  if (Array.isArray(data)) {
    arrayData = data;
    arrayKeyPrefix = '$';
  } else if (data && Array.isArray(data.lessons)) {
    arrayData = data.lessons;
    arrayKeyPrefix = '$.lessons';
  } else if (data && typeof data === 'object') {
    // 1 bài học đơn - bọc lại thành mảng 1 phần tử để xử lý thống nhất
    arrayData = [data];
    arrayKeyPrefix = '$';
  } else {
    return { ok: false, error: new Error('JSON không phải object hay array bài học hợp lệ'), raw, filePath };
  }

  // Tìm offset ký tự của dấu '[' mở mảng bài học trong raw text, để quét
  // ranh giới từng lesson object.
  let arrayOpenIndex;
  if (arrayKeyPrefix === '$.lessons') {
    arrayOpenIndex = findArrayOpenForKey(raw, 'lessons', 0, raw.length);
  } else if (Array.isArray(data)) {
    arrayOpenIndex = raw.indexOf('[');
  } else {
    arrayOpenIndex = -1; // trường hợp 1 bài học đơn, không có mảng thật trong raw
  }

  let elementRanges = [];
  if (arrayOpenIndex !== -1) {
    elementRanges = scanArrayItems(raw, arrayOpenIndex).items;
  }

  const lessons = arrayData.map((lessonObj, idx) => {
    const range = elementRanges[idx] || { start: 0, end: raw.length - 1 };
    const startLine = charOffsetToLine(raw, range.start);
    const endLine = charOffsetToLine(raw, range.end);

    const fieldLine = (key) => findKeyLine(raw, key, range.start, range.end + 1) || startLine;

    // Line cho từng phần tử của 1 field dạng mảng (vd learningOutcome[i]).
    const arrayItemLines = (key) => {
      const openIdx = findArrayOpenForKey(raw, key, range.start, range.end + 1);
      if (openIdx === -1) return [];
      const { items } = scanArrayItems(raw, openIdx);
      return items.map((it) => charOffsetToLine(raw, it.start));
    };

    const jsonPath = arrayKeyPrefix === '$' && !Array.isArray(data)
      ? '$'
      : `${arrayKeyPrefix}[${idx}]`;

    const links = [];
    if (lessonObj.videoUrl !== undefined) {
      links.push({ field: 'videoUrl', url: lessonObj.videoUrl, line: fieldLine('videoUrl') });
    }
    if (lessonObj.link !== undefined) {
      links.push({ field: 'link', url: lessonObj.link, line: fieldLine('link') });
    }
    if (Array.isArray(lessonObj.links)) {
      const itemLines = arrayItemLines('links');
      lessonObj.links.forEach((u, i) => {
        links.push({ field: `links[${i}]`, url: u, line: itemLines[i] || fieldLine('links') });
      });
    }

    return {
      format: 'json',
      lessonUid: `${arrayKeyPrefix}[${idx}]`,
      jsonPath,
      title: lessonObj.title,
      slug: lessonObj.slug,
      learningOutcome: lessonObj.learningOutcome !== undefined
        ? lessonObj.learningOutcome
        : (lessonObj.objectives !== undefined ? lessonObj.objectives : undefined),
      prerequisite: lessonObj.prerequisite !== undefined
        ? lessonObj.prerequisite
        : (lessonObj.prerequisites !== undefined ? lessonObj.prerequisites : undefined),
      terminology: lessonObj.terminology,
      content: lessonObj.content !== undefined ? lessonObj.content : lessonObj.contentMarkdown,
      links,
      data: lessonObj,
      loc: {
        startLine,
        endLine,
        title: fieldLine('title'),
        slug: fieldLine('slug'),
        learningOutcome: fieldLine(lessonObj.learningOutcome !== undefined ? 'learningOutcome' : 'objectives'),
        learningOutcomeItems: arrayItemLines(lessonObj.learningOutcome !== undefined ? 'learningOutcome' : 'objectives'),
        prerequisite: fieldLine(lessonObj.prerequisite !== undefined ? 'prerequisite' : 'prerequisites'),
        prerequisiteItems: arrayItemLines(lessonObj.prerequisite !== undefined ? 'prerequisite' : 'prerequisites'),
        terminology: fieldLine('terminology'),
        content: fieldLine(lessonObj.content !== undefined ? 'content' : 'contentMarkdown'),
        videoUrl: fieldLine('videoUrl'),
        links: fieldLine('links'),
        points: lessonObj.points !== undefined ? fieldLine('points') : null,
        isPublished: lessonObj.isPublished !== undefined ? fieldLine('isPublished') : null,
      },
    };
  });

  return { ok: true, raw, filePath, lessons, rootIsArray: Array.isArray(data) || Array.isArray(data && data.lessons) };
}

module.exports = { parseJsonLessonsFile };
