'use strict';
const fs = require('fs');
const { charOffsetToLine, scanArrayItems, findArrayOpenForKey, findKeyLine } = require('./text-scan');

/**
 * quiz-parser.js
 * ------------------------------------------------------------------
 * Đọc 1 file JSON chứa câu hỏi trắc nghiệm và trả về danh sách Question đã
 * chuẩn hoá, kèm số dòng thật (line) cho từng field quan trọng + từng
 * option - dùng để quiz-validator in ra report có vị trí lỗi chính xác.
 *
 * Format câu hỏi khớp với schema thật đang dùng ở BE (Mongoose
 * `Question` schema, xem
 * `cybersoft-learning-hub/learning-hub/BE/src/data/initial-quiz-questions.ts`):
 *   {
 *     content: string,
 *     codeSnippet?: string,
 *     category: string,
 *     difficulty: 'EASY' | 'MEDIUM' | 'HARD',
 *     points: number,
 *     allowMultiple?: boolean,   // mở rộng riêng của quiz-validator, KHÔNG có
 *                                // trong schema BE thật - mặc định false/undefined
 *                                // nghĩa là "chỉ 1 đáp án đúng" (xem rules.js QV011)
 *     options: { key: string, text: string, isCorrect: boolean }[],
 *     explanation: string,
 *     tags?: string[],
 *   }
 *
 * Hỗ trợ 3 hình dạng input (giống quy ước ở content-lint Ngày 11):
 *   1. Mảng câu hỏi ở top-level:              [ {...}, {...} ]
 *   2. Object bọc ngoài có field "questions":  { "questions": [ {...} ] }
 *   3. 1 câu hỏi đơn (object, không phải mảng): { "content": ... }
 */
function parseJsonQuizFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: err, raw, filePath };
  }

  let arrayData;
  let arrayKeyPrefix; // tiền tố JSONPath, ví dụ "$" hoặc "$.questions"

  if (Array.isArray(data)) {
    arrayData = data;
    arrayKeyPrefix = '$';
  } else if (data && Array.isArray(data.questions)) {
    arrayData = data.questions;
    arrayKeyPrefix = '$.questions';
  } else if (data && typeof data === 'object') {
    arrayData = [data];
    arrayKeyPrefix = '$';
  } else {
    return { ok: false, error: new Error('JSON không phải object hay array câu hỏi hợp lệ'), raw, filePath };
  }

  let arrayOpenIndex;
  if (arrayKeyPrefix === '$.questions') {
    arrayOpenIndex = findArrayOpenForKey(raw, 'questions', 0, raw.length);
  } else if (Array.isArray(data)) {
    arrayOpenIndex = raw.indexOf('[');
  } else {
    arrayOpenIndex = -1; // trường hợp 1 câu hỏi đơn, không có mảng thật trong raw
  }

  let elementRanges = [];
  if (arrayOpenIndex !== -1) {
    elementRanges = scanArrayItems(raw, arrayOpenIndex).items;
  }

  const questions = arrayData.map((qObj, idx) => {
    const range = elementRanges[idx] || { start: 0, end: raw.length - 1 };
    const startLine = charOffsetToLine(raw, range.start);
    const endLine = charOffsetToLine(raw, range.end);
    const fieldLine = (key) => findKeyLine(raw, key, range.start, range.end + 1) || startLine;

    // options: mảng OBJECT (không phải mảng string như links ở Ngày 11) -
    // quét ranh giới từng option object rồi lấy dòng bắt đầu của chính nó
    // (mỗi option trong sample/fixture được viết trên 1 dòng nên key/text/
    // isCorrect của cùng 1 option luôn cùng 1 dòng - đủ chính xác để báo lỗi).
    let optionRanges = [];
    const optionsOpenIdx = findArrayOpenForKey(raw, 'options', range.start, range.end + 1);
    if (optionsOpenIdx !== -1) {
      optionRanges = scanArrayItems(raw, optionsOpenIdx).items;
    }

    const rawOptions = Array.isArray(qObj.options) ? qObj.options : [];
    const options = rawOptions.map((opt, i) => {
      const oRange = optionRanges[i];
      const line = oRange ? charOffsetToLine(raw, oRange.start) : (qObj.options !== undefined ? fieldLine('options') : startLine);
      return {
        key: opt && typeof opt === 'object' ? opt.key : undefined,
        text: opt && typeof opt === 'object' ? opt.text : undefined,
        isCorrect: opt && typeof opt === 'object' ? opt.isCorrect : undefined,
        line,
        raw: opt,
      };
    });

    const jsonPath = `${arrayKeyPrefix}[${idx}]`;

    return {
      index: idx,
      jsonPath,
      content: qObj.content,
      codeSnippet: qObj.codeSnippet,
      category: qObj.category,
      difficulty: qObj.difficulty,
      points: qObj.points,
      allowMultiple: qObj.allowMultiple,
      options,
      explanation: qObj.explanation,
      tags: qObj.tags,
      data: qObj,
      loc: {
        startLine,
        endLine,
        content: qObj.content !== undefined ? fieldLine('content') : startLine,
        category: qObj.category !== undefined ? fieldLine('category') : null,
        difficulty: qObj.difficulty !== undefined ? fieldLine('difficulty') : null,
        points: qObj.points !== undefined ? fieldLine('points') : null,
        explanation: qObj.explanation !== undefined ? fieldLine('explanation') : startLine,
        options: qObj.options !== undefined ? fieldLine('options') : null,
        tags: qObj.tags !== undefined ? fieldLine('tags') : null,
      },
    };
  });

  return { ok: true, raw, filePath, questions };
}

module.exports = { parseJsonQuizFile };
