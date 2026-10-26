import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

/**
 * Đọc danh sách email học viên từ file Excel/CSV do Admin tải lên. Đầu vào là dữ liệu không tin cậy
 * nên kiểm tra theo thứ tự rẻ trước: phần mở rộng, kích thước, chữ ký nhị phân phải khớp phần mở rộng,
 * số dòng, rồi mới tới nội dung. Chỉ lấy MỘT cột email của sheet đầu tiên; mọi ô khác bị bỏ qua,
 * công thức không được tính, và kết quả chỉ là mảng chuỗi đã chuẩn hóa nên không có gì từ file đi thẳng vào truy vấn.
 */
export const MAX_ROSTER_BYTES = 2 * 1024 * 1024;
export const MAX_ROSTER_ROWS = 500;
const MAX_EMAIL_LENGTH = 254;
const ALLOWED_EXT = ['.xlsx', '.xls', '.csv'] as const;
type Ext = (typeof ALLOWED_EXT)[number];

export interface RosterFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

export interface RosterParseResult {
  /** Email hợp lệ, đã chuẩn hóa chữ thường và bỏ trùng trong file. */
  emails: string[];
  /** Giá trị ở cột email nhưng sai cú pháp (đã làm sạch, tối đa 80 ký tự để hiển thị). */
  invalid: string[];
  /** Số email lặp lại trong chính file (đã bỏ). */
  duplicatesInFile: number;
  /** Số dòng dữ liệu không rỗng đã đọc. */
  rowCount: number;
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];
const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const EMAIL_HEADER =
  /^(e-?mail|email address|mail|thư điện tử|địa chỉ email)$/i;
// Cú pháp thực dụng: một "@", miền có dấu chấm, không khoảng trắng hay ký tự điều khiển/ngoặc.
const EMAIL =
  /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/;

const startsWith = (buf: Buffer, magic: number[]) =>
  buf.length >= magic.length && magic.every((b, i) => buf[i] === b);

function extensionOf(name: string): Ext {
  const m = /\.[a-z0-9]+$/i.exec(name ?? '');
  const ext = (m ? m[0].toLowerCase() : '') as Ext;
  if (!ALLOWED_EXT.includes(ext)) {
    throw new BadRequestException('Chỉ nhận file .xlsx, .xls hoặc .csv.');
  }
  return ext;
}

/** Ký tự điều khiển (kể cả NUL, xuống dòng trong ô) và khoảng trắng đầu/cuối bị loại. */
export function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  // eslint-disable-next-line no-control-regex
  return String(value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim();
}

/** CSV RFC 4180; tự nhận dấu phân cách `,` `;` hoặc tab theo dòng đầu. */
export function parseCsvRows(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const delim = [',', ';', '\t'].reduce((best, d) =>
    firstLine.split(d).length > firstLine.split(best).length ? d : best,
  );
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function readRows(file: RosterFile, ext: Ext): string[][] {
  const buf = file.buffer;
  if (ext === '.xlsx' && !startsWith(buf, ZIP_MAGIC)) {
    throw new BadRequestException(
      'File không phải .xlsx hợp lệ (nội dung không khớp phần mở rộng).',
    );
  }
  if (ext === '.xls' && !startsWith(buf, OLE_MAGIC)) {
    throw new BadRequestException(
      'File không phải .xls hợp lệ (nội dung không khớp phần mở rộng).',
    );
  }
  if (ext === '.csv') {
    if (
      startsWith(buf, ZIP_MAGIC) ||
      startsWith(buf, OLE_MAGIC) ||
      buf.includes(0)
    ) {
      throw new BadRequestException(
        'File .csv chứa dữ liệu nhị phân, không đọc được.',
      );
    }
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch {
      throw new BadRequestException('File .csv phải mã hóa UTF-8.');
    }
    return parseCsvRows(text);
  }
  try {
    const wb = XLSX.read(buf, {
      type: 'buffer',
      sheetRows: MAX_ROSTER_ROWS + 3, // đủ để phát hiện vượt giới hạn mà không đọc cả file lớn
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      cellDates: false,
      bookVBA: false,
    });
    const sheetName = wb.SheetNames[0];
    const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
    if (!sheet) return [];
    return (
      XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: false,
        blankrows: false,
      }) as unknown[][]
    ).map((r) => r.map(sanitizeCell));
  } catch {
    throw new BadRequestException(
      'Không đọc được file Excel (file hỏng hoặc không đúng định dạng).',
    );
  }
}

/** Xác định cột email: theo tiêu đề; nếu không có tiêu đề thì chọn cột có nhiều ô giống email nhất. */
function pickColumn(rows: string[][]): { col: number; start: number } | null {
  const header = rows[0] ?? [];
  const byHeader = header.findIndex((c) => EMAIL_HEADER.test(c.trim()));
  if (byHeader >= 0) return { col: byHeader, start: 1 };
  const width = Math.max(0, ...rows.map((r) => r.length));
  let best = -1;
  let bestCount = 0;
  for (let c = 0; c < width; c++) {
    const count = rows.filter((r) => EMAIL.test((r[c] ?? '').trim())).length;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best >= 0 ? { col: best, start: 0 } : null;
}

export function parseRosterFile(
  file: RosterFile | undefined,
): RosterParseResult {
  if (!file || !file.buffer) throw new BadRequestException('Chưa chọn file.');
  const ext = extensionOf(file.originalname);
  if (file.size > MAX_ROSTER_BYTES || file.buffer.length > MAX_ROSTER_BYTES) {
    throw new BadRequestException('File vượt quá 2MB.');
  }
  if (file.buffer.length === 0) throw new BadRequestException('File rỗng.');

  const rows = readRows(file, ext).filter((r) =>
    r.some((c) => c.trim() !== ''),
  );
  const pick = pickColumn(rows);
  if (!pick)
    throw new BadRequestException('Không tìm thấy cột email trong file.');

  const dataRows = rows.slice(pick.start);
  if (dataRows.length > MAX_ROSTER_ROWS) {
    throw new BadRequestException(
      `File có hơn ${MAX_ROSTER_ROWS} dòng, hãy chia nhỏ.`,
    );
  }

  const seen = new Set<string>();
  const emails: string[] = [];
  const invalid: string[] = [];
  let duplicatesInFile = 0;
  let rowCount = 0;
  for (const row of dataRows) {
    const raw = sanitizeCell(row[pick.col]);
    if (!raw) continue;
    rowCount += 1;
    const email = raw.toLowerCase();
    if (email.length > MAX_EMAIL_LENGTH || !EMAIL.test(email)) {
      invalid.push(raw.slice(0, 80));
      continue;
    }
    if (seen.has(email)) {
      duplicatesInFile += 1;
      continue;
    }
    seen.add(email);
    emails.push(email);
  }
  if (rowCount === 0)
    throw new BadRequestException('File không có dòng email nào.');
  return { emails, invalid: [...new Set(invalid)], duplicatesInFile, rowCount };
}
