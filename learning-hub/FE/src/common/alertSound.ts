/** Tiếng "bíp" ngắn báo học viên vừa rời màn hình. Lỗi âm thanh (bị chặn, không hỗ trợ) bị bỏ qua. */
export function playAlertBeep(): void {
  try {
    const Ctx: typeof AudioContext | undefined =
      typeof window !== 'undefined'
        ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!Ctx) return;
    const ctx = new Ctx();
    const tone = (freq: number, start: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.18);
    };
    tone(880, 0);
    tone(660, 0.22);
    setTimeout(() => void ctx.close().catch(() => undefined), 800);
  } catch {
    /* không phát được âm thanh: vẫn còn cảnh báo bằng hình */
  }
}
