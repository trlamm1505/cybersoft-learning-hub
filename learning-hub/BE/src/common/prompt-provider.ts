/** System prompt của các tính năng AI mà Admin được phép chỉnh. */
export type PromptKey = 'coach' | 'debug' | 'ailab';

export const PROMPT_PROVIDER = 'PROMPT_PROVIDER';

export interface PromptProvider {
  /** Prompt Admin đã lưu (cache trong bộ nhớ, tự làm mới khi Admin sửa); chưa có thì trả `fallback` mặc định của mã nguồn. */
  get(key: PromptKey, fallback: string): Promise<string>;
}
