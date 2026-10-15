/** Mã lớp dễ đọc, không có ký tự dễ nhầm (0/O, 1/I): CL- + 6 ký tự. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateClassCode(random: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return 'CL-' + s;
}
