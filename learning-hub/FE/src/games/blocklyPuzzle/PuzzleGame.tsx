import React, { useCallback, useState } from 'react';
import * as Blockly from 'blockly/core';
import { CheckCheck, RotateCcw } from 'lucide-react';
import { GameHeader, NoticeBox, type GameProps, type Notice } from '../common/GameChrome';
import { blip, playFile } from '../common/gameSound';
import { useBlocklyWorkspace } from '../common/useBlocklyWorkspace';
import { ANIMALS, PUZZLE_SLUG, checkPuzzle, shuffle } from './puzzleData';
import { isCorrectBlock, modelOf, populate, registerPuzzleBlocks } from './puzzleBlocks';

/**
 * Puzzle trong Block Puzzle. Chuyển thể từ "Puzzle" của Blockly Games
 * (https://github.com/blockly-games/blockly-games), Copyright 2012 Google LLC, Apache-2.0.
 * Hình con vật là biểu tượng vẽ thành SVG, không dùng ảnh gốc.
 */
const COLS = 4;
const CELL_W = 230;
const CELL_H = 190;

function buildBlocks(ws: Blockly.WorkspaceSvg): void {
  const specs: Array<{ type: 'animal' | 'picture' | 'trait'; n: number; m?: number }> = [];
  ANIMALS.forEach((_, i) => {
    const n = i + 1;
    specs.push({ type: 'animal', n }, { type: 'picture', n }, { type: 'trait', n, m: 1 }, { type: 'trait', n, m: 2 });
  });
  shuffle(specs).forEach((s, i) => {
    const block = ws.newBlock(s.type);
    populate(block, s.n, s.m);
    block.initSvg();
    block.render();
    // Dịch nhẹ ngẫu nhiên để khối không xếp thẳng hàng cứng nhắc.
    const jitter = () => Math.round((Math.random() - 0.5) * 24);
    block.moveBy((i % COLS) * CELL_W + 20 + jitter(), Math.floor(i / COLS) * CELL_H + 20 + jitter());
  });
}

export const PuzzleGame: React.FC<GameProps> = ({ completedSlugs, onComplete, onBack }) => {
  const done = completedSlugs.has(PUZZLE_SLUG);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [round, setRound] = useState(0);

  const { hostRef, wsRef } = useBlocklyWorkspace(
    (host) => {
      registerPuzzleBlocks();
      const ws = Blockly.inject(host, {
        trashcan: false,
        zoom: { startScale: 0.9 },
        grid: { spacing: 24, length: 2, colour: '#d0d0d8', snap: false },
      });
      buildBlocks(ws);
      return ws;
    },
    [round],
  );

  const check = useCallback(() => {
    const ws = wsRef.current;
    if (!ws) return;
    const blocks = ws.getAllBlocks(false);
    const result = checkPuzzle(blocks.map(modelOf));
    if (result.errors === 0) {
      playFile('/games/blockly-puzzle/win.mp3');
      setNotice({ kind: 'success', text: result.message[0] });
      onComplete(PUZZLE_SLUG);
      return;
    }
    blip(220, 120, 'triangle', 0.06);
    const wrong = blocks.find((b) => !isCorrectBlock(b));
    if (wrong) Blockly.common.setSelected(wrong as Blockly.BlockSvg);
    setNotice({ kind: 'error', text: result.message.join(' ') });
  }, [wsRef, onComplete]);

  const restart = () => {
    setNotice(null);
    setRound((r) => r + 1);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      <GameHeader
        title="Ghép Con Vật"
        subtitle="Đặt hình, số chân và đặc điểm vào đúng con vật. Chuyển thể từ Blockly Games (Google, Apache-2.0)."
        onBack={onBack}
      />
      <section aria-label="Khu ghép khối" className="space-y-3 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <p className="text-sm leading-relaxed text-[var(--text-main)]">
          Kéo hình và các đặc điểm vào đúng khối con vật, rồi chọn số chân phù hợp. Bấm &quot;Kiểm tra&quot; khi xong.
          {done && ' (Bạn đã hoàn thành, có thể chơi lại.)'}
        </p>
        <div ref={hostRef} className="h-[34rem] w-full overflow-hidden rounded-2xl" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={check}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
          >
            <CheckCheck size={14} strokeWidth={2.5} /> Kiểm tra
          </button>
          <button
            type="button"
            onClick={restart}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-bold text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]"
          >
            <RotateCcw size={14} strokeWidth={2.5} /> Xáo lại
          </button>
        </div>
        <NoticeBox notice={notice} />
      </section>
    </div>
  );
};

export default PuzzleGame;
