/**
 * Bộ lọc nội dung không phù hợp với trẻ em cho AI Coach (Day 30, DEF-033 / TC_K69_06).
 *
 * Khác coach-injection-guard.ts (chống đổi vai trò / lộ system prompt), module này chặn CHỦ ĐỀ nguy hiểm: bạo lực, vũ
 * khí, tự hại, chất cấm, nội dung người lớn, mã độc / chiếm đoạt tài khoản, cờ bạc. Áp cho cả câu hỏi của học viên
 * (trước khi gọi model) và câu trả lời của model (trước khi trả về).
 *
 * So khớp trên văn bản đã CHUẨN HÓA: chữ thường, bỏ dấu tiếng Việt (đ → d), ký tự lạ thành khoảng trắng — nên
 * "giết", "GIET", "g.i.ế.t" đều về cùng dạng. Chỉ khớp theo nguyên CỤM TỪ (biên từ hai đầu) để không bắt nhầm thuật
 * ngữ lập trình (vd "kill process", "hackathon", "shoot" trong tên biến không nằm trong danh sách).
 */
export type UnsafeCategory = 'violence' | 'self_harm' | 'drugs' | 'adult' | 'cybercrime' | 'gambling';

export interface ContentSafetyResult {
  blocked: boolean;
  category?: UnsafeCategory;
}

const PHRASES: Record<UnsafeCategory, string[]> = {
  self_harm: ['tu tu', 'tu sat', 'tu hai', 'muon chet', 'cat tay', 'ket lieu ban than', 'kill myself', 'suicide', 'self harm', 'hurt myself', 'end my life'],
  violence: [
    'giet nguoi', 'giet chet', 'giet ban', 'cach giet', 'dam chet', 'chem nguoi', 'danh chet', 'lam bom', 'che tao bom', 'che bom', 'thuoc no', 'vu khi', 'mua sung', 'ban sung', 'lam sung',
    'how to kill', 'kill someone', 'kill people', 'make a bomb', 'build a bomb', 'bomb making', 'weapon', 'weapons', 'shoot someone', 'buy a gun', 'make a gun',
  ],
  drugs: ['ma tuy', 'thuoc lac', 'can sa', 'hut can', 'heroin', 'cocaine', 'methamphetamine', 'ma tuy da', 'buy drugs', 'make drugs', 'weed'],
  adult: ['khieu dam', 'tinh duc', 'phim nguoi lon', 'phim sex', 'anh nong', 'khoa than', 'sex', 'porn', 'porno', 'nude', 'nudes', 'xxx'],
  cybercrime: [
    'hack facebook', 'hack tai khoan', 'hack mat khau', 'danh cap mat khau', 'trom mat khau', 'lay trom tai khoan', 'chiem tai khoan', 'lua dao', 'viet virus', 'tao virus',
    'malware', 'ransomware', 'keylogger', 'ddos', 'phishing', 'trojan', 'steal password', 'steal passwords', 'hack account', 'hack someone',
  ],
  gambling: ['co bac', 'danh bac', 'ca do', 'ca cuoc', 'casino', 'gambling', 'betting'],
};

/** Chữ thường, bỏ dấu, chỉ giữ chữ/số, gộp khoảng trắng; bọc hai đầu bằng khoảng trắng để khớp theo biên từ. */
export function normalizeForSafety(text: string): string {
  const plain = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
  return ` ${plain.replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

const COMPILED: Array<[UnsafeCategory, string[]]> = (Object.entries(PHRASES) as Array<[UnsafeCategory, string[]]>).map(([c, list]) => [
  c,
  list.map((p) => normalizeForSafety(p)),
]);

/** Chữ bị tách bằng dấu chấm/khoảng trắng (g.i.e.t, s e x) cũng được ghép lại để so thêm một lần. */
const collapseSpacedLetters = (norm: string): string => norm.replace(/\b(?:[a-z] ){2,}[a-z]\b/g, (m) => m.replace(/ /g, ''));

export function checkContentSafety(text: string | undefined | null): ContentSafetyResult {
  if (!text) return { blocked: false };
  const norm = normalizeForSafety(text);
  const variants = [norm, collapseSpacedLetters(norm)];
  // Tự hại xét trước để câu trả lời kèm hướng dẫn tìm người giúp đỡ.
  for (const [category, phrases] of COMPILED) {
    if (variants.some((v) => phrases.some((p) => v.includes(p)))) return { blocked: true, category };
  }
  return { blocked: false };
}

/** Câu từ chối thân thiện, phù hợp với học sinh nhỏ tuổi. */
export function buildSafetyRefusalReply(category?: UnsafeCategory): string {
  const base =
    'Mình là AI Coach, chỉ giúp bạn học lập trình thôi nhé! Câu hỏi này không phù hợp nên mình không trả lời được. ' +
    'Mình cùng quay lại bài tập hiện tại nha, bạn đang vướng ở bước nào?';
  if (category === 'self_harm') {
    return (
      'Mình rất tiếc khi bạn đang cảm thấy như vậy. Bạn hãy nói ngay với bố mẹ, thầy cô hoặc một người lớn mà bạn tin tưởng nhé. ' +
      'Bạn cũng có thể gọi Tổng đài quốc gia bảo vệ trẻ em 111 (miễn phí, 24/7). ' +
      base
    );
  }
  return base;
}
