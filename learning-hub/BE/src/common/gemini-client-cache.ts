import { GoogleGenAI } from '@google/genai';

/** Nguồn API key: chuỗi cố định, hoặc hàm đọc key hiện hành (để Admin đổi key mà không phải khởi động lại). */
export type GeminiKeySource = string | (() => string | undefined);

/**
 * Giữ một GoogleGenAI theo key hiện hành: key không đổi thì dùng lại client cũ, key đổi thì dựng client mới ở lần gọi kế tiếp.
 * Không có key thì ném lỗi rõ ràng để nơi gọi (đã có try/catch và đường dự phòng) xử lý như lỗi gọi API.
 */
export class GeminiClientCache {
  private key?: string;
  private client?: GoogleGenAI;

  constructor(private readonly source: GeminiKeySource) {}

  get(): GoogleGenAI {
    const key = typeof this.source === 'string' ? this.source : this.source();
    if (!key) throw new Error('Chưa cấu hình Gemini API key.');
    if (!this.client || key !== this.key) {
      this.client = new GoogleGenAI({ apiKey: key });
      this.key = key;
    }
    return this.client;
  }
}
