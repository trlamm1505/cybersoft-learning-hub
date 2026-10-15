/**
 * Bộ avatar hoạt hình cho bé. Mỗi avatar là emoji vẽ lên hình tròn màu rồi xuất ra ảnh PNG nhỏ
 * (BE chỉ nhận png/jpeg/webp, không nhận svg).
 */
export interface KidAvatarOption {
  id: string;
  label: string;
  emoji: string;
  bg: string;
}

export const KID_AVATARS: readonly KidAvatarOption[] = [
  { id: 'dragon', label: 'Bé rồng', emoji: '🐲', bg: '#bbf7d0' },
  { id: 'astronaut', label: 'Phi hành gia', emoji: '🧑‍🚀', bg: '#bfdbfe' },
  { id: 'bear', label: 'Chú gấu', emoji: '🐻', bg: '#fde68a' },
  { id: 'cat', label: 'Mèo con', emoji: '🐱', bg: '#fbcfe8' },
  { id: 'panda', label: 'Gấu trúc', emoji: '🐼', bg: '#e2e8f0' },
  { id: 'fox', label: 'Cáo nhỏ', emoji: '🦊', bg: '#fed7aa' },
  { id: 'bunny', label: 'Thỏ trắng', emoji: '🐰', bg: '#fce7f3' },
  { id: 'unicorn', label: 'Kỳ lân', emoji: '🦄', bg: '#e9d5ff' },
  { id: 'frog', label: 'Ếch xanh', emoji: '🐸', bg: '#d9f99d' },
  { id: 'robot', label: 'Robot', emoji: '🤖', bg: '#cbd5e1' },
  { id: 'penguin', label: 'Cánh cụt', emoji: '🐧', bg: '#bae6fd' },
  { id: 'lion', label: 'Sư tử', emoji: '🦁', bg: '#fef08a' },
];

const SIZE = 128;

/** Vẽ avatar thành data URL PNG (cần trình duyệt có canvas). Trả null nếu không vẽ được. */
export function renderKidAvatar(option: KidAvatarOption): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = option.bg;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${Math.round(SIZE * 0.62)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(option.emoji, SIZE / 2, SIZE / 2 + SIZE * 0.04);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
