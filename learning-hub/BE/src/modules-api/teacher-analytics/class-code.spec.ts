import { generateClassCode } from './class-code';

describe('generateClassCode', () => {
  it('dạng CL- + 6 ký tự, không có ký tự dễ nhầm', () => {
    for (let i = 0; i < 200; i++) expect(generateClassCode()).toMatch(/^CL-[A-HJ-NP-Z2-9]{6}$/);
  });
  it('dùng bộ sinh ngẫu nhiên truyền vào (kiểm thử được)', () => {
    expect(generateClassCode(() => 0)).toBe('CL-AAAAAA');
  });
});
