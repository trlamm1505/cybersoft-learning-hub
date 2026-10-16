import {
  containsSecret,
  decodeBase64Text,
  normalizeForSecretScan,
  textContainsSecret,
} from './secret-patterns';

const K = '1234567890abcdefghijXYZ';

describe('secret-patterns (dùng chung BE/FE)', () => {
  describe('[M7] biến thể né bộ lọc bị chặn', () => {
    it.each([
      ['sk- liền', `sk-${K}`],
      ['sk- ngắt bằng khoảng trắng', `sk-12 ${K}`],
      ['sk- ngắt dòng', `sk-1234\n567890abcdefghij`],
      ['zero-width chen giữa', `sk-\u200B${K}`],
      ['soft hyphen chen giữa', `sk-12\u00AD${K}`],
      ['chữ full-width', `ｓｋ-${K}`],
      ['Stripe sk_live_', `sk_live_${K}`],
      ['Stripe rk_test_', `rk_test_${K}`],
      ['Groq gsk_', `gsk_${K}`],
      ['xAI xai-', `xai-${K}`],
      ['Slack xoxb-', `xoxb-${K}`],
      ['GitHub fine-grained', `github_pat_${K}_abc`],
      ['Azure 32 hex', '0123456789abcdef0123456789abcdef'],
      ['Google AIza', 'AIzaSyA1b2C3d4E5f6G7h8I9j0KlMnOpQrStUvW'],
    ])('%s', (_name, text) => {
      expect(textContainsSecret(text)).toBe(true);
    });

    it('quét JSON lồng sâu tùy ý (1000 tầng) mà không tràn stack', () => {
      let deep: unknown = `sk-${K}`;
      for (let i = 0; i < 1000; i++) deep = { a: deep };
      expect(containsSecret(deep)).toBe(true);
    });

    it('quét cả tên khóa, phần tử mảng; không lặp vô hạn với object vòng', () => {
      const cyclic: Record<string, unknown> = { ok: 'x' };
      cyclic.self = cyclic;
      expect(containsSecret(cyclic)).toBe(false);
      expect(containsSecret({ [`sk-${K}`]: 1 })).toBe(true);
      expect(containsSecret(['a', ['b', [`gsk_${K}`]]])).toBe(true);
    });
  });

  describe('không chặn nhầm', () => {
    it.each([
      'Bạn là trợ giảng. Trả lời ngắn gọn tối đa 2 câu, dùng sklearn và task-oriented.',
      'Phân tích risk-based, desk-review, key: giá trị, secret là bí mật.',
      'Commit 3f2a9c1 sửa lỗi; mã đơn ORD_013 và PROD_06.',
      'Câu hỏi: {{question}}\nNgữ cảnh: {{context}}',
    ])('%s', (text) => {
      expect(textContainsSecret(text)).toBe(false);
    });
  });

  describe('[Base64] key bị mã hóa để né regex', () => {
    const b64 = (t: string) => Buffer.from(t).toString('base64');
    const b64url = (t: string) => Buffer.from(t).toString('base64url');

    it.each([
      ['base64 của sk-', b64(`sk-${K}`)],
      ['base64 URL-safe của gsk_', b64url(`gsk_${K}`)],
      ['base64 của xai-', b64(`xai-${K}`)],
      ['base64 của AIza', b64('AIzaSyA1b2C3d4E5f6G7h8I9j0KlMnOpQrStUvW')],
      ['base64 lồng 2 lớp', b64(b64(`sk-${K}`))],
      [
        'base64 kèm câu chữ xung quanh',
        `Dùng key này: ${b64(`OPENAI=sk-${K}`)} nhé`,
      ],
    ])('%s', (_n, text) => {
      expect(textContainsSecret(text)).toBe(true);
    });

    it('base64 nằm trong config lồng sâu cũng bị chặn', () => {
      expect(
        containsSecret({ config: { extra: [{ v: b64(`sk-${K}`) }] } }),
      ).toBe(true);
    });

    it('base64 của văn bản bình thường và từ dài không bị chặn nhầm', () => {
      expect(textContainsSecret(b64('Xin chào, đây là ví dụ hướng dẫn.'))).toBe(
        false,
      );
      expect(
        textContainsSecret('internationalization_configuration_value'),
      ).toBe(false);
      expect(textContainsSecret(b64(b64(b64(`sk-${K}`))))).toBe(false); // quá 2 lớp: ngoài phạm vi
    });

    it('decodeBase64Text bỏ qua dữ liệu nhị phân', () => {
      expect(
        decodeBase64Text(
          Buffer.from([
            0, 1, 2, 3, 250, 251, 252, 253, 254, 255, 9, 8,
          ]).toString('base64'),
        ),
      ).toBeNull();
      expect(decodeBase64Text(b64('hello world text'))).toBe(
        'hello world text',
      );
    });
  });

  it('chuẩn hóa: bỏ ký tự vô hình và gộp khoảng trắng', () => {
    expect(normalizeForSecretScan('a\u200B b\n\n  c')).toBe('a b c');
  });
});
