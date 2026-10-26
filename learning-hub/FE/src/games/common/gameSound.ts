/**
 * Âm thanh dùng chung cho các trò chơi Blockly trong Block Puzzle. Âm ngắn tự tạo bằng Web Audio (không cần tệp);
 * tệp thắng/thua lấy từ Blockly Games (Apache-2.0). Một công tắc bật/tắt chung, nhớ lựa chọn.
 * Trình duyệt chỉ phát tiếng sau thao tác của người dùng nên mọi âm đều gọi từ nút Chạy hoặc Kiểm tra.
 */
const KEY = 'app_block_puzzle_sound';

export const isSoundOn = (): boolean => {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
};

export const setSoundOn = (on: boolean): void => {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // storage bị chặn: bỏ qua
  }
};

let ctx: AudioContext | null = null;
const audio = new Map<string, HTMLAudioElement>();

function context(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Âm ngắn tần số `freq` (Hz) kéo dài `ms` mili giây, giảm dần để không bị lách tách. */
export function blip(freq: number, ms: number, type: OscillatorType = 'triangle', volume = 0.08): void {
  if (!isSoundOn()) return;
  const c = context();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const now = c.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + ms / 1000 + 0.02);
}

/** Phát một tệp âm thanh (đường dẫn tuyệt đối trên web), bỏ qua lặng lẽ nếu trình duyệt không cho phát. */
export function playFile(path: string, volume = 0.5): void {
  if (!isSoundOn()) return;
  try {
    let a = audio.get(path);
    if (!a) {
      a = new Audio(path);
      a.preload = 'auto';
      audio.set(path, a);
    }
    a.currentTime = 0;
    a.volume = volume;
    void a.play().catch(() => undefined);
  } catch {
    // không phát được: trò chơi vẫn chạy
  }
}

/** Giai điệu ngắn đi lên, dùng khi một màn không có tệp thắng riêng. */
export function chime(): void {
  [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 140, 'triangle', 0.08), i * 120));
}
