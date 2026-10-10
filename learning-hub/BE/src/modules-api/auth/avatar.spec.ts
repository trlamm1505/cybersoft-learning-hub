import {
  checkAvatar,
  MAX_AVATAR_DATA_URL_LENGTH,
  MAX_AVATAR_URL_LENGTH,
} from './avatar';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('checkAvatar', () => {
  it('null, undefined hoặc chuỗi rỗng nghĩa là xóa ảnh', () => {
    for (const v of [null, undefined, '', '   ']) expect(checkAvatar(v)).toEqual({ ok: true, value: null });
  });

  it('nhận URL http(s) hợp lệ và cắt khoảng trắng', () => {
    expect(checkAvatar('  https://example.com/a.png ')).toEqual({ ok: true, value: 'https://example.com/a.png' });
    expect(checkAvatar('http://localhost:3000/x.jpg').ok).toBe(true);
  });

  it('từ chối giao thức nguy hiểm, URL hỏng và kiểu không phải chuỗi', () => {
    for (const v of ['javascript:alert(1)', 'ftp://x.com/a.png', 'file:///etc/passwd', 'khong-phai-url', 'https://']) {
      expect(checkAvatar(v).ok).toBe(false);
    }
    expect(checkAvatar(123).ok).toBe(false);
    expect(checkAvatar({ a: 1 }).ok).toBe(false);
  });

  it('URL quá dài bị từ chối', () => {
    expect(checkAvatar('https://x.com/' + 'a'.repeat(MAX_AVATAR_URL_LENGTH)).ok).toBe(false);
  });

  it('nhận data URL png/jpeg/webp base64 hợp lệ', () => {
    expect(checkAvatar(PNG)).toEqual({ ok: true, value: PNG });
    expect(checkAvatar('data:image/jpeg;base64,/9j/4AAQSkZJRg==').ok).toBe(true);
    expect(checkAvatar('data:image/webp;base64,UklGRg==').ok).toBe(true);
  });

  it('từ chối SVG (có thể chứa script), kiểu khác và base64 sai', () => {
    expect(checkAvatar('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=').ok).toBe(false);
    expect(checkAvatar('data:text/html;base64,PHNjcmlwdD4=').ok).toBe(false);
    expect(checkAvatar('data:image/png;base64,<script>').ok).toBe(false);
    expect(checkAvatar('data:image/png,abc').ok).toBe(false);
  });

  it('data URL vượt giới hạn dung lượng bị từ chối (nằm dưới mức body JSON mặc định)', () => {
    const big = 'data:image/png;base64,' + 'A'.repeat(MAX_AVATAR_DATA_URL_LENGTH);
    expect(checkAvatar(big)).toEqual({ ok: false, message: 'Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn.' });
    expect(MAX_AVATAR_DATA_URL_LENGTH).toBeLessThan(100 * 1024);
  });
});
