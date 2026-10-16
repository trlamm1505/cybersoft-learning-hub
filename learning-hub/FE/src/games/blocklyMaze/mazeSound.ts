import { blip, isSoundOn, playFile, setSoundOn } from '../common/gameSound';

/**
 * Âm thanh của Maze: tiếng thắng/thua lấy từ Blockly Games (win.mp3, fail_pegman.mp3, Apache-2.0),
 * tiếng bước đi và quay là âm ngắn tự tạo (xem common/gameSound).
 */
export { isSoundOn, setSoundOn };

const BASE = '/games/blockly-maze';

export type SoundName = 'step' | 'turn' | 'look' | 'win' | 'fail' | 'click';

export function playSound(name: SoundName): void {
  switch (name) {
    case 'step':
      return blip(330, 90);
    case 'turn':
      return blip(520, 70, 'square', 0.04);
    case 'look':
      return blip(740, 50, 'sine', 0.04);
    case 'click':
      return blip(440, 40, 'sine', 0.05);
    case 'win':
      return playFile(`${BASE}/win.mp3`);
    case 'fail':
      return playFile(`${BASE}/fail_pegman.mp3`);
  }
}
