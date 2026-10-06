import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import { CheckCircle2, ChevronLeft, Lock, Play, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';
import { buildToolbox, generateCode, registerMazeBlocks } from './mazeBlocks';
import { planAnimation, START_FRAME } from './mazeAnimation';
import { findSquare, runProgram, SquareType, type Outcome } from './mazeEngine';
import {
  MAZE_LEVEL_COUNT,
  MAZE_LEVELS,
  maxBlocksFor,
  mazeSlug,
  tileSprites,
  toolboxSpec,
} from './mazeLevels';
import { isSoundOn, playSound, setSoundOn } from './mazeSound';

/**
 * Blockly Maze trong Block Puzzle. Chuyển thể từ "Maze" của Blockly Games
 * (https://github.com/blockly-games/blockly-games), Copyright 2012 Google LLC, Apache-2.0.
 * Hình nhân vật, mảnh bản đồ và âm thắng/thua là tệp gốc (xem public/games/blockly-maze/NOTICE.txt).
 */
const BASE = '/games/blockly-maze';
const SQUARE = 50;
const PEG_W = 49;
const PEG_H = 52;

const LEVEL_HINTS: string[] = [
  'Kéo khối «tiến lên» thêm vào chuỗi để đưa nhân vật tới cờ rồi bấm Chạy.',
  'Con đường có khúc quanh: dùng thêm khối rẽ trái hoặc rẽ phải.',
  'Chỉ được dùng tối đa 2 khối. Dùng khối «lặp lại cho đến khi tới đích» thay cho nhiều khối giống nhau.',
  'Tối đa 5 khối. Đặt nhiều khối bên trong một vòng lặp.',
  'Tối đa 5 khối. Đường đi dài và thẳng: để vòng lặp lo phần lặp lại.',
  'Khối «nếu» cho nhân vật nhìn đường trước khi quyết định. Hãy thử rẽ trái khi có đường bên trái.',
  'Đổi hướng kiểm tra của khối «nếu» (phía trước, trái, phải) cho phù hợp với đường đi.',
  'Tối đa 10 khối. Kết hợp vòng lặp với nhiều khối «nếu».',
  'Dùng khối «nếu... nếu không» để chọn giữa hai hướng.',
  'Mê cung lớn: thử quy tắc «luôn bám theo tường bên trái» để không bị lạc.',
];

type Notice = { kind: 'success' | 'error' | 'info'; text: string };

const OUTCOME_TEXT: Record<Exclude<Outcome, 'SUCCESS'>, Notice> = {
  FAILURE: { kind: 'error', text: 'Chương trình đã dừng nhưng nhân vật chưa tới đích. Hãy sửa các khối rồi chạy lại.' },
  ERROR: { kind: 'error', text: 'Nhân vật đâm vào tường. Hãy kiểm tra lại các khối.' },
  TIMEOUT: { kind: 'error', text: 'Chương trình chạy quá lâu (có thể lặp mãi). Hãy kiểm tra vòng lặp.' },
};

interface Props {
  completedSlugs: Set<string>;
  onComplete: (slug: string) => void;
  onBack: () => void;
}

const levelUnlocked = (n: number, done: Set<string>) => n === 1 || done.has(mazeSlug(n - 1));

export const BlocklyMazeGame: React.FC<Props> = ({ completedSlugs, onComplete, onBack }) => {
  const firstOpen = useMemo(() => {
    for (let n = 1; n <= MAZE_LEVEL_COUNT; n++) {
      if (levelUnlocked(n, completedSlugs) && !completedSlugs.has(mazeSlug(n))) return n;
    }
    return MAZE_LEVEL_COUNT;
    // chỉ tính một lần khi mở game
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [level, setLevel] = useState(firstOpen);
  const map = MAZE_LEVELS[level - 1];
  const start = useMemo(() => findSquare(map, SquareType.START), [map]);
  const finish = useMemo(() => findSquare(map, SquareType.FINISH), [map]);
  const sprites = useMemo(() => tileSprites(map), [map]);
  const rows = map.length;
  const cols = map[0].length;
  const view = Math.max(rows, cols) * SQUARE;

  const hostRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const timers = useRef<number[]>([]);

  const [peg, setPeg] = useState({ x: start.x, y: start.y, d: START_FRAME() });
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [capacity, setCapacity] = useState<number>(Infinity);
  const [soundOn, setSoundOnState] = useState(isSoundOn);
  const [won, setWon] = useState(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const resetView = useCallback(() => {
    clearTimers();
    setRunning(false);
    setWon(false);
    setNotice(null);
    setPeg({ x: start.x, y: start.y, d: START_FRAME() });
    wsRef.current?.highlightBlock(null);
  }, [clearTimers, start]);

  // Dựng workspace Blockly cho mỗi màn.
  useEffect(() => {
    registerMazeBlocks();
    const host = hostRef.current;
    if (!host) return;
    const max = maxBlocksFor(level);
    const ws = Blockly.inject(host, {
      toolbox: buildToolbox(toolboxSpec(level)),
      maxBlocks: max,
      trashcan: true,
      // Màn đầu khối to hơn cho dễ kéo (1,3), màn cuối bằng 1,0 như bản gốc.
      zoom: { startScale: 1 + (1 - level / MAZE_LEVEL_COUNT) / 3 },
      grid: { spacing: 24, length: 2, colour: '#d0d0d8', snap: false },
    });
    wsRef.current = ws;
    Blockly.serialization.workspaces.load(
      {
        blocks: {
          languageVersion: 0,
          blocks: [{ type: 'maze_moveForward', x: 70, y: 70, movable: level !== 1 }],
        },
      },
      ws,
    );
    setCapacity(ws.remainingCapacity());
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      if (!e.isUiEvent) setCapacity(ws.remainingCapacity());
    });
    const ro = new ResizeObserver(() => Blockly.svgResize(ws));
    ro.observe(host);
    return () => {
      ro.disconnect();
      ws.dispose();
      wsRef.current = null;
    };
  }, [level]);

  // Đổi màn: đưa nhân vật về điểm xuất phát; rời trang: dừng mọi hoạt ảnh.
  useEffect(() => {
    resetView();
    return clearTimers;
  }, [level, resetView, clearTimers]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundOnState(next);
    if (next) playSound('click');
  };

  const run = () => {
    const ws = wsRef.current;
    if (!ws || running) return;
    playSound('click'); // mở khóa âm thanh của trình duyệt bằng thao tác của người dùng
    clearTimers();
    setWon(false);
    ws.highlightBlock(null);
    if (level === 1 && ws.getTopBlocks(false).length > 1) {
      setNotice({ kind: 'info', text: 'Màn này chỉ dùng một chuỗi khối nối liền nhau. Hãy nối các khối lại.' });
      return;
    }
    const result = runProgram(map, generateCode(ws));
    const plan = planAnimation(result.log, result.outcome, start);
    setNotice(null);
    setRunning(true);
    setPeg({ x: start.x, y: start.y, d: START_FRAME() });

    for (const f of plan.frames) {
      timers.current.push(
        window.setTimeout(() => {
          setPeg({ x: f.x, y: f.y, d: f.d });
          if (f.blockId !== undefined) ws.highlightBlock(f.blockId);
          if (f.sound) playSound(f.sound);
        }, f.at + 80),
      );
    }
    timers.current.push(
      window.setTimeout(() => {
        ws.highlightBlock(null);
        setRunning(false);
        if (result.outcome === 'SUCCESS') {
          setNotice({ kind: 'success', text: 'Tuyệt vời! Nhân vật đã tới đích.' });
          setWon(true);
          onComplete(mazeSlug(level));
        } else {
          setNotice(OUTCOME_TEXT[result.outcome]);
        }
      }, plan.duration + 160),
    );
  };

  const goto = (n: number) => {
    if (!levelUnlocked(n, completedSlugs) || n === level) return;
    setLevel(n);
  };

  const pegX = peg.x * SQUARE + 1;
  const pegY = SQUARE * (peg.y + 0.5) - PEG_H / 2 - 8;
  const limit = maxBlocksFor(level);

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-cyan-900 p-6 text-white shadow-xl md:p-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-indigo-200 hover:text-white"
        >
          <ChevronLeft size={14} strokeWidth={2.5} /> Chọn trò chơi khác
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Mê Cung Blockly</h1>
            <p className="mt-1 text-sm text-indigo-200">Ghép khối lệnh để đưa nhân vật tới cờ. Chuyển thể từ Blockly Games (Google, Apache-2.0).</p>
          </div>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 hover:bg-white/20"
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Chọn màn */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Chọn màn chơi">
        {Array.from({ length: MAZE_LEVEL_COUNT }, (_, i) => i + 1).map((n) => {
          const open = levelUnlocked(n, completedSlugs);
          const done = completedSlugs.has(mazeSlug(n));
          const active = n === level;
          return (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={!open}
              onClick={() => goto(n)}
              title={open ? `Màn ${n}` : 'Hoàn thành màn trước để mở'}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition-colors ${
                !open
                  ? 'cursor-not-allowed border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] opacity-60'
                  : active
                    ? 'cursor-pointer border-indigo-500 bg-indigo-600 text-white'
                    : done
                      ? 'cursor-pointer border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'cursor-pointer border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-indigo-300'
              }`}
            >
              {!open ? <Lock size={13} /> : done && !active ? <CheckCircle2 size={15} /> : n}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* Bản đồ */}
        <section aria-label="Bản đồ" className="space-y-3 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <p className="text-sm leading-relaxed text-[var(--text-main)]">{LEVEL_HINTS[level - 1]}</p>
          <svg viewBox={`0 0 ${view} ${view}`} className="mx-auto w-full max-w-[26rem] rounded-xl border border-[#CCB] bg-[#F1EEE7]" role="img" aria-label={`Bản đồ màn ${level}`}>
            {sprites.map((t) => (
              <svg key={`${t.x}-${t.y}`} x={t.x * SQUARE} y={t.y * SQUARE} width={SQUARE} height={SQUARE} viewBox={`${t.col * SQUARE} ${t.row * SQUARE} ${SQUARE} ${SQUARE}`}>
                <image href={`${BASE}/tiles_pegman.png`} width={SQUARE * 5} height={SQUARE * 4} />
              </svg>
            ))}
            <image
              href={`${BASE}/marker.png`}
              width={20}
              height={34}
              x={SQUARE * (finish.x + 0.5) - 10}
              y={SQUARE * (finish.y + 0.6) - 34}
            />
            <svg x={pegX} y={pegY} width={PEG_W} height={PEG_H} viewBox={`${peg.d * PEG_W} 0 ${PEG_W} ${PEG_H}`}>
              <image href={`${BASE}/pegman.png`} width={PEG_W * 21} height={PEG_H} />
            </svg>
          </svg>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-default disabled:opacity-60"
            >
              <Play size={14} strokeWidth={2.5} /> Chạy
            </button>
            <button
              type="button"
              onClick={() => {
                resetView();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-bold text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]"
            >
              <RotateCcw size={14} strokeWidth={2.5} /> Đặt lại
            </button>
            {Number.isFinite(limit) && (
              <span className="ml-auto text-xs text-[var(--text-muted)]" aria-live="polite">
                {capacity === 0 ? 'Đã hết khối được dùng' : `Còn ${capacity} khối`} (tối đa {limit})
              </span>
            )}
          </div>

          {notice && (
            <p
              role="status"
              className={`rounded-xl border px-3 py-2 text-sm ${
                notice.kind === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                  : notice.kind === 'error'
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300'
              }`}
            >
              {notice.text}
            </p>
          )}

          {won && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-main)]">
                <Trophy size={16} className="text-amber-500" />
                {level < MAZE_LEVEL_COUNT ? `Hoàn thành màn ${level}` : 'Bạn đã hoàn thành mọi màn!'}
              </span>
              {level < MAZE_LEVEL_COUNT && (
                <button
                  type="button"
                  onClick={() => setLevel(level + 1)}
                  className="cursor-pointer rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-emerald-500"
                >
                  Màn tiếp theo
                </button>
              )}
            </div>
          )}
        </section>

        {/* Workspace Blockly */}
        <section aria-label="Khu ghép khối" className="min-w-0 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2">
          <div ref={hostRef} className="h-[28rem] w-full overflow-hidden rounded-2xl" />
        </section>
      </div>
    </div>
  );
};

export default BlocklyMazeGame;
