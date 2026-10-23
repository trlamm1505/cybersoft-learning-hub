'use strict';
/**
 * text-scan.js
 * ------------------------------------------------------------------
 * Các hàm quét text thuần (không dùng thư viện ngoài) để lấy được SỐ DÒNG
 * thật của từng field/phần tử trong file JSON gốc. `JSON.parse()` chuẩn
 * của Node không giữ lại vị trí (line/col) của từng node, nên quiz-validator
 * cần tự quét lại raw text để trả về report có "Line" chính xác thay vì
 * chỉ có JSONPath suông.
 *
 * Đây KHÔNG phải một JSON parser đầy đủ - nó chỉ đủ để:
 *   1. Tìm ranh giới (start/end offset) của từng phần tử trong 1 mảng JSON.
 *   2. Tìm dòng chứa 1 key cụ thể bên trong 1 object.
 * Áp dụng đúng cho JSON hợp lệ, được format dạng "pretty" như các file
 * sample/fixture trong project này.
 *
 * (Cùng kỹ thuật đã dùng ở Ngày 11 - tools/content-lint/parsers/text-scan.js
 * - tái sử dụng nguyên vẹn cho Ngày 12 vì đây là hàm quét text thuần tuý,
 * không phụ thuộc gì vào cấu trúc "lesson".)
 */

function charOffsetToLine(raw, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < raw.length; i++) {
    if (raw[i] === '\n') line++;
  }
  return line;
}

/**
 * Quét các phần tử ở CẤP CAO NHẤT của một mảng JSON, bắt đầu từ vị trí
 * ký tự '[' (arrayOpenIndex). Trả về danh sách {start, end} (offset ký tự,
 * end là offset của ký tự đóng cuối cùng của phần tử đó).
 * Dùng 1 bộ đếm depth chung cho '{' và '[' - hợp lệ vì JSON đúng cú pháp
 * luôn cân bằng ngoặc theo kiểu lồng nhau (Dyck language).
 */
function scanArrayItems(raw, arrayOpenIndex) {
  let i = arrayOpenIndex + 1;
  const items = [];
  let depth = 0;
  let itemStart = -1;
  let inString = false;
  let escape = false;

  const markStart = (idx) => {
    if (itemStart === -1) itemStart = idx;
  };

  for (; i < raw.length; i++) {
    const ch = raw[i];

    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      markStart(i);
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') {
      markStart(i);
      depth++;
      continue;
    }
    if (ch === '}') {
      depth--;
      continue;
    }
    if (ch === ']') {
      if (depth === 0) {
        if (itemStart !== -1) {
          items.push({ start: itemStart, end: i - 1 });
          itemStart = -1;
        }
        return { items, arrayCloseIndex: i };
      }
      depth--;
      continue;
    }
    if (depth === 0 && ch === ',') {
      if (itemStart !== -1) {
        items.push({ start: itemStart, end: i - 1 });
        itemStart = -1;
      }
      continue;
    }
    if (depth === 0 && /\s/.test(ch)) continue;
    markStart(i); // ký tự của giá trị nguyên thuỷ (số, true/false/null)
  }
  return { items, arrayCloseIndex: -1 };
}

/**
 * Tìm offset của dấu '[' mở đầu mảng gán cho `key` bên trong đoạn
 * raw.slice(searchFrom, searchTo). Trả về -1 nếu không thấy.
 */
function findArrayOpenForKey(raw, key, searchFrom, searchTo) {
  const re = new RegExp(`"${key}"\\s*:\\s*\\[`, 'g');
  re.lastIndex = searchFrom;
  const m = re.exec(raw.slice(0, searchTo));
  if (!m) return -1;
  // vị trí dấu '[' là ký tự cuối cùng của match
  return m.index + m[0].length - 1;
}

/**
 * Tìm dòng chứa key trực tiếp (không đệ quy vào key trùng tên ở tầng sâu
 * hơn - chấp nhận giới hạn này vì file trong project được viết/sinh có
 * kiểm soát, key không lặp lại lồng nhau bất thường).
 */
function findKeyLine(raw, key, searchFrom, searchTo) {
  const re = new RegExp(`"${key}"\\s*:`, 'g');
  re.lastIndex = searchFrom;
  const m = re.exec(raw.slice(0, searchTo));
  if (!m) return null;
  return charOffsetToLine(raw, m.index);
}

module.exports = {
  charOffsetToLine,
  scanArrayItems,
  findArrayOpenForKey,
  findKeyLine,
};
