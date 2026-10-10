import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import { Play, RotateCcw } from 'lucide-react';
import { GameHeader, LevelTabs, NoticeBox, type GameProps, type Notice } from '../common/GameChrome';
import { blip, playFile } from '../common/gameSound';
import { useBlocklyWorkspace } from '../common/useBlocklyWorkspace';
import { buildBirdToolbox, generateBirdCode, registerBirdBlocks } from './birdBlocks';
import { birdSprite, borderWalls, BIRD_ICON, MAP_SIZE, planBirdAnimation, runBirdLevel, type Pose } from './birdEngine';
import {
  BIRD_HINTS,
  BIRD_LEVEL_COUNT,
  BIRD_MAPS,
  birdSlug,
  birdToolbox,
  startBlockType,
} from './birdLevels';

/**
 * Bird trong Block Puzzle. Chuyển thể từ "Bird" của Blockly Games
 * (https://github.com/blockly-games/blockly-games), Copyright 2012 Google LLC, Apache-2.0.
 * Hình chim, tổ, sâu và âm thanh là tệp gốc (public/games/blockly-bird).
 */
const BASE = '/games/blockly-bird';
const NEST = 100;
const WORM = 100;
const FRAME_MS = 35;

const MESSAGE: Record<string, Notice> = {
  FAILURE: { kind: 'error', text: 'Chương trình đã dừng nhưng chim chưa về tổ.' },
  ERROR: { kind: 'error', text: 'Chim đâm vào tường. Hãy đổi hướng bay hoặc điều kiện.' },
  TIMEOUT: { kind: 'error', text: 'Chim bay quá lâu mà chưa tới tổ. Hãy kiểm tra các điều kiện.' },
};

interface View {
  x: number;
  y: number;
  angle: number;
  pose: Pose;
  at: number;
}

const toPx = (v: number) => (v / 100) * MAP_SIZE;

export const BirdGame: React.FC<GameProps> = ({ completedSlugs, onComplete, onBack }) => {
  const unlocked = (n: number) => n === 1 || completedSlugs.has(birdSlug(n - 1));
  const firstOpen = useMemo(() => {
    for (let n = 1; n <= BIRD_LEVEL_COUNT; n++) {
      if (unlocked(n) && !completedSlugs.has(birdSlug(n))) return n;
    }
    return BIRD_LEVEL_COUNT;
    // chỉ tính một lần khi mở game
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [level, setLevel] = useState(firstOpen);
  const map = BIRD_MAPS[level - 1];
  const walls = useMemo(() => [...map.walls, ...borderWalls()], [map]);
  const startView = useMemo<View>(() => ({ x: map.start.x, y: map.start.y, angle: map.startAngle, pose: 'SOAR', at: 0 }), [map]);
  const [view, setView] = useState<View>(startView);
  const [wormEaten, setWormEaten] = useState(false);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const resetView = useCallback(() => {
    clearTimers();
    setRunning(false);
    setNotice(null);
    setWormEaten(false);
    setView(startView);
    wsRef.current?.highlightBlock(null);
    // wsRef khai báo bên dưới; hàm chỉ chạy sau khi đã gắn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimers, startView]);

  const { hostRef, wsRef } = useBlocklyWorkspace(
    (host) => {
      registerBirdBlocks();
      const ws = Blockly.inject(host, {
        toolbox: buildBirdToolbox(birdToolbox(level)),
        trashcan: true,
        zoom: { startScale: 1 },
        grid: { spacing: 24, length: 2, colour: '#d0d0d8', snap: false },
      });
      Blockly.serialization.workspaces.load(
        { blocks: { languageVersion: 0, blocks: [{ type: startBlockType(level), x: 70, y: 70, deletable: false }] } },
        ws,
      );
      // Khối rời nằm ngoài khối "nếu" thì bị vô hiệu (bản gốc làm vậy từ màn 2).
      if (level > 1) ws.addChangeListener(Blockly.Events.disableOrphans);
      return ws;
    },
    [level],
  );

  useEffect(() => {
    resetView();
    return clearTimers;
  }, [level, resetView, clearTimers]);

  const run = () => {
    const ws = wsRef.current;
    if (!ws || running) return;
    blip(440, 40, 'sine', 0.05);
    resetView();
    const result = runBirdLevel(level, generateBirdCode(ws));
    const plan = planBirdAnimation(map, result, FRAME_MS);
    setRunning(true);
    for (const f of plan.frames) {
      timers.current.push(
        window.setTimeout(() => {
          setView({ x: f.x, y: f.y, angle: f.angle, pose: f.pose, at: f.at });
          if (f.blockId !== undefined) ws.highlightBlock(f.blockId);
          if (f.wormEaten) setWormEaten(true);
          if (f.sound) playFile(`${BASE}/${f.sound}.mp3`);
        }, f.at + 60),
      );
    }
    timers.current.push(
      window.setTimeout(() => {
        ws.highlightBlock(null);
        setRunning(false);
        if (result.outcome === 'SUCCESS') {
          setNotice({ kind: 'success', text: 'Tuyệt vời! Chim đã mang sâu về tổ.' });
          onComplete(birdSlug(level));
        } else {
          setNotice(MESSAGE[result.outcome]);
        }
      }, plan.duration + 160),
    );
  };

  const sprite = birdSprite(view.angle, view.pose, view.at);
  const bx = toPx(view.x) - BIRD_ICON / 2;
  const by = toPx(100 - view.y) - BIRD_ICON / 2;
  const showX = level > 3;
  const showY = level > 4;

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      <GameHeader title="Chim Tìm Tổ" subtitle="Dùng góc, toạ độ và điều kiện để chim bắt sâu rồi về tổ. Chuyển thể từ Blockly Games (Google, Apache-2.0)." onBack={onBack} />
      <LevelTabs
        count={BIRD_LEVEL_COUNT}
        level={level}
        isUnlocked={unlocked}
        isDone={(n) => completedSlugs.has(birdSlug(n))}
        onSelect={setLevel}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <section aria-label="Bản đồ" className="space-y-3 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <p className="text-sm leading-relaxed text-[var(--text-main)]">{BIRD_HINTS[level - 1]}</p>
          <svg
            viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
            className="mx-auto block w-full max-w-[26rem] rounded-xl border border-[#CCB] bg-[#F1EEE7]"
            role="img"
            aria-label={`Bản đồ màn ${level}`}
          >
            {walls.map((w, i) => (
              <line
                key={i}
                x1={toPx(w.x0)}
                y1={toPx(100 - w.y0)}
                x2={toPx(w.x1)}
                y2={toPx(100 - w.y1)}
                stroke="#CCB"
                strokeWidth={10}
                strokeLinecap="round"
              />
            ))}
            <image href={`${BASE}/nest.png`} width={NEST} height={NEST} x={toPx(map.nest.x) - NEST / 2} y={toPx(100 - map.nest.y) - NEST / 2} />
            {map.worm && (
              <image
                href={`${BASE}/worm.png`}
                width={WORM}
                height={WORM}
                x={toPx(map.worm.x) - WORM / 2}
                y={toPx(100 - map.worm.y) - WORM / 2}
                opacity={wormEaten ? 0 : 1}
                style={{ transition: 'opacity 300ms' }}
              />
            )}
            <svg x={bx} y={by} width={BIRD_ICON} height={BIRD_ICON} viewBox={`${sprite.col * BIRD_ICON} ${sprite.row * BIRD_ICON} ${BIRD_ICON} ${BIRD_ICON}`}>
              <g transform={`rotate(${sprite.rotate} ${sprite.col * BIRD_ICON + BIRD_ICON / 2} ${sprite.row * BIRD_ICON + BIRD_ICON / 2})`}>
                <image href={`${BASE}/birds-120.png`} width={BIRD_ICON * 12} height={BIRD_ICON * 4} />
              </g>
            </svg>
            <rect width={MAP_SIZE} height={MAP_SIZE} fill="none" stroke="#999" strokeWidth={2} />
            {Array.from({ length: 8 }, (_, k) => k + 1).map((k) => {
              const major = k % 2 === 0;
              const v = (k / 10) * MAP_SIZE;
              return (
                <g key={k} stroke="#999">
                  {showX && <line x1={v} y1={MAP_SIZE} x2={v} y2={MAP_SIZE - (major ? 18 : 9)} />}
                  {showY && <line x1={0} y1={v} x2={major ? 18 : 9} y2={v} />}
                  {showX && major && (
                    <text x={v + 2} y={MAP_SIZE - 4} fontSize={11} fill="#666" stroke="none">
                      {k * 10}
                    </text>
                  )}
                  {showY && major && (
                    <text x={3} y={v - 2} fontSize={11} fill="#666" stroke="none">
                      {100 - k * 10}
                    </text>
                  )}
                </g>
              );
            })}
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
              onClick={resetView}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-bold text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]"
            >
              <RotateCcw size={14} strokeWidth={2.5} /> Đặt lại
            </button>
          </div>
          <NoticeBox notice={notice} />
        </section>

        <section aria-label="Khu ghép khối" className="min-w-0 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2">
          <div ref={hostRef} className="h-[28rem] w-full overflow-hidden rounded-2xl" />
        </section>
      </div>
    </div>
  );
};

export default BirdGame;
