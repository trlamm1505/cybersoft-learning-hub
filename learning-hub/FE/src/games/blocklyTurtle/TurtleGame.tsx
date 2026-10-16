import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import { Play, RotateCcw } from 'lucide-react';
import { ensureBlocklyEnv } from '../common/blocklyEnv';
import { GameHeader, LevelTabs, NoticeBox, type GameProps, type Notice } from '../common/GameChrome';
import { blip, playFile } from '../common/gameSound';
import { useBlocklyWorkspace } from '../common/useBlocklyWorkspace';
import { buildTurtleToolbox, generateTurtleCode, registerTurtleBlocks } from './turtleBlocks';
import {
  alphaDelta,
  applyCommand,
  CANVAS_SIZE,
  INITIAL_STATE,
  runTurtleProgram,
  simulate,
  type Cmd,
  type Op,
  type TurtleState,
} from './turtleEngine';
import {
  answerCommands,
  blockLimit,
  FREE_LEVEL,
  judge,
  toolboxSpec,
  TURTLE_HINTS,
  TURTLE_LEVEL_COUNT,
  turtleSlug,
} from './turtleLevels';

/**
 * Turtle trong Block Puzzle. Chuyển thể từ "Turtle" của Blockly Games
 * (https://github.com/blockly-games/blockly-games), Copyright 2012 Google LLC, Apache-2.0.
 * Tiếng thắng là tệp gốc (public/games/blockly-turtle/win.mp3).
 */
const WIN_SOUND = '/games/blockly-turtle/win.mp3';

function drawOp(ctx: CanvasRenderingContext2D, op: Op) {
  if (op.k === 'line') {
    ctx.lineWidth = op.width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = op.colour;
    ctx.beginPath();
    ctx.moveTo(op.x0, op.y0);
    ctx.lineTo(op.x1, op.y1);
    ctx.stroke();
  } else {
    ctx.save();
    ctx.translate(op.x, op.y);
    ctx.rotate((op.angle * Math.PI) / 180);
    ctx.fillStyle = op.colour;
    ctx.font = op.font;
    ctx.fillText(op.text, 0, 0);
    ctx.restore();
  }
}

function newLayer(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = CANVAS_SIZE;
  c.height = CANVAS_SIZE;
  // Hai lớp này được đọc điểm ảnh để so hình; khai báo trước để trình duyệt giữ chúng ở bộ nhớ CPU.
  c.getContext('2d', { willReadFrequently: true });
  return c;
}

/** Vẽ con rùa (vòng tròn và mũi tên chỉ hướng) giống bản gốc. */
function drawTurtle(ctx: CanvasRenderingContext2D, s: TurtleState, colour: string) {
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  const radius = s.width / 2 + 10;
  ctx.beginPath();
  ctx.arc(s.x, s.y, radius, 0, 2 * Math.PI, false);
  ctx.lineWidth = 3;
  ctx.stroke();
  const W = 0.3;
  let r = (s.heading * Math.PI) / 180;
  const at = (rad: number, len: number) => [s.x + len * Math.sin(rad), s.y - len * Math.cos(rad)] as const;
  const tip = at(r, radius + 10);
  r -= W;
  const left = at(r, radius + 4);
  r += W / 2;
  const leftCtl = at(r, radius + 6);
  r += W;
  const rightCtl = at(r, radius + 6);
  r += W / 2;
  const right = at(r, radius + 4);
  ctx.beginPath();
  ctx.moveTo(tip[0], tip[1]);
  ctx.lineTo(left[0], left[1]);
  ctx.bezierCurveTo(leftCtl[0], leftCtl[1], rightCtl[0], rightCtl[1], right[0], right[1]);
  ctx.closePath();
  ctx.fill();
}

const speedToPause = (v: number) => Math.max(1, 1000 * Math.pow(1 - v, 2));

export const TurtleGame: React.FC<GameProps> = ({ completedSlugs, onComplete, onBack }) => {
  const unlocked = (n: number) => n === 1 || completedSlugs.has(turtleSlug(n - 1));
  const firstOpen = useMemo(() => {
    for (let n = 1; n <= TURTLE_LEVEL_COUNT; n++) {
      if (unlocked(n) && !completedSlugs.has(turtleSlug(n))) return n;
    }
    return TURTLE_LEVEL_COUNT;
    // chỉ tính một lần khi mở game
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [level, setLevel] = useState(firstOpen);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [speed, setSpeed] = useState(0.8);
  const [blockCount, setBlockCount] = useState(1);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const displayRef = useRef<HTMLCanvasElement>(null);
  const answerLayer = useMemo(newLayer, []);
  const scratchLayer = useMemo(newLayer, []);
  const stateRef = useRef<TurtleState>(INITIAL_STATE());
  const colourRef = useRef('#ffffff');
  const timers = useRef<number[]>([]);
  const free = level === FREE_LEVEL;

  const redraw = useCallback(() => {
    const canvas = displayRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.globalAlpha = 0.2;
    ctx.drawImage(answerLayer, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(scratchLayer, 0, 0);
    if (stateRef.current.visible) drawTurtle(ctx, stateRef.current, colourRef.current);
  }, [answerLayer, scratchLayer]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const resetDrawing = useCallback(() => {
    clearTimers();
    setRunning(false);
    stateRef.current = INITIAL_STATE();
    colourRef.current = '#ffffff';
    const ctx = scratchLayer.getContext('2d');
    ctx?.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    redraw();
  }, [clearTimers, redraw, scratchLayer]);

  // Đổi màn: vẽ lại hình mẫu (mờ) và đưa rùa về vị trí đầu.
  useEffect(() => {
    const actx = answerLayer.getContext('2d');
    actx?.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (actx && !free) simulate(answerCommands(level)).ops.forEach((op) => drawOp(actx, op));
    setNotice(null);
    resetDrawing();
    return clearTimers;
  }, [level, free, answerLayer, resetDrawing, clearTimers]);

  const { hostRef, wsRef } = useBlocklyWorkspace(
    (host) => {
      registerTurtleBlocks();
      ensureBlocklyEnv();
      const ws = Blockly.inject(host, {
        toolbox: buildTurtleToolbox(toolboxSpec(level)),
        trashcan: true,
        zoom: level === FREE_LEVEL ? { controls: true, wheel: true } : undefined,
        grid: { spacing: 24, length: 2, colour: '#d0d0d8', snap: false },
      });
      Blockly.serialization.workspaces.load(
        {
          blocks: {
            languageVersion: 0,
            blocks: [
              level === FREE_LEVEL
                ? { type: 'turtle_move', x: 70, y: 70, inputs: { VALUE: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } }
                : { type: 'turtle_move_internal', x: 70, y: 70, fields: { DIR: 'moveForward', VALUE: '100' } },
            ],
          },
        },
        ws,
      );
      const count = () => ws.getAllBlocks(false).filter((b) => !b.isShadow()).length;
      setBlockCount(count());
      ws.addChangeListener((e: Blockly.Events.Abstract) => {
        if (!e.isUiEvent) setBlockCount(count());
      });
      return ws;
    },
    [level],
  );

  const finish = (_cmds: Cmd[], status: 'OK' | 'TIMEOUT' | 'ERROR') => {
    const ws = wsRef.current;
    ws?.highlightBlock(null);
    setRunning(false);
    if (status === 'ERROR') {
      setNotice({ kind: 'error', text: 'Chương trình gặp lỗi. Hãy kiểm tra các khối rồi chạy lại.' });
      return;
    }
    const count = ws ? ws.getAllBlocks(false).filter((b) => !b.isShadow()).length : 0;
    const a = answerLayer.getContext('2d')!.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    const u = scratchLayer.getContext('2d')!.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    const verdict = judge(level, alphaDelta(u, a), count);
    if (status === 'TIMEOUT') {
      setNotice({ kind: 'error', text: 'Chương trình vẽ quá lâu hoặc quá nhiều nét nên đã bị dừng.' });
    } else if (verdict === 'PASS') {
      colourRef.current = '#ffffff';
      redraw();
      if (free) {
        setNotice({ kind: 'success', text: 'Tác phẩm đẹp lắm! Bạn đã hoàn thành màn vẽ tự do.' });
        blip(660, 160, 'triangle', 0.08);
      } else {
        setNotice({ kind: 'success', text: 'Chính xác! Hình bạn vẽ trùng với hình mẫu.' });
        playFile(WIN_SOUND);
      }
      onComplete(turtleSlug(level));
    } else if (verdict === 'USE_LOOP') {
      setNotice({
        kind: 'info',
        text: `Hình đã đúng nhưng bạn dùng ${count} khối. Hãy dùng vòng lặp để chỉ cần tối đa ${blockLimit(level)} khối.`,
      });
    } else {
      colourRef.current = '#ff0000';
      redraw();
      setNotice({
        kind: 'error',
        text: free ? 'Hãy thêm ít nhất một khối nữa để vẽ.' : 'Hình chưa khớp với hình mẫu mờ. Hãy xem lại các khối và chạy lại.',
      });
    }
  };

  const run = () => {
    const ws = wsRef.current;
    if (!ws || running) return;
    blip(440, 40, 'sine', 0.05);
    resetDrawing();
    setNotice(null);
    const { cmds, status } = runTurtleProgram(generateTurtleCode(ws));
    if (cmds.length === 0) {
      finish(cmds, status);
      return;
    }
    setRunning(true);
    const sctx = scratchLayer.getContext('2d')!;
    let i = 0;
    const step = () => {
      const pause = speedToPause(speedRef.current);
      // Tốc độ rất nhanh: xử lý nhiều lệnh mỗi nhịp để không phải chờ hàng nghìn timer.
      const batch = Math.max(1, Math.round(8 / pause));
      for (let n = 0; n < batch && i < cmds.length; n++, i++) {
        const cmd = cmds[i];
        const r = applyCommand(stateRef.current, cmd);
        stateRef.current = r.state;
        if (cmd.t === 'colour') colourRef.current = r.state.colour;
        if (r.op) drawOp(sctx, r.op);
        if (cmd.id) wsRef.current?.highlightBlock(cmd.id);
      }
      redraw();
      if (i < cmds.length) timers.current.push(window.setTimeout(step, pause));
      else finish(cmds, status);
    };
    step();
  };

  const limit = blockLimit(level);

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      <GameHeader title="Rùa Vẽ Hình" subtitle="Ghép khối lệnh để rùa vẽ lại hình mẫu. Chuyển thể từ Blockly Games (Google, Apache-2.0)." onBack={onBack} />
      <LevelTabs
        count={TURTLE_LEVEL_COUNT}
        level={level}
        isUnlocked={unlocked}
        isDone={(n) => completedSlugs.has(turtleSlug(n))}
        onSelect={setLevel}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <section aria-label="Khung vẽ" className="space-y-3 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <p className="text-sm leading-relaxed text-[var(--text-main)]">{TURTLE_HINTS[level - 1]}</p>
          <canvas
            ref={displayRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            role="img"
            aria-label={`Khung vẽ màn ${level}`}
            className="mx-auto block w-full max-w-[26rem] rounded-xl border border-neutral-700 bg-black"
          />
          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            Tốc độ
            <input
              type="range"
              min={0}
              max={0.99}
              step={0.01}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              aria-label="Tốc độ vẽ"
              className="flex-1"
            />
          </label>
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
                resetDrawing();
                wsRef.current?.highlightBlock(null);
                setNotice(null);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-bold text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]"
            >
              <RotateCcw size={14} strokeWidth={2.5} /> Đặt lại
            </button>
            {limit !== null && (
              <span className="ml-auto text-xs text-[var(--text-muted)]" aria-live="polite">
                {blockCount} khối (tối đa {limit} để hoàn thành)
              </span>
            )}
          </div>
          <NoticeBox notice={notice} />
        </section>

        <section aria-label="Khu ghép khối" className="min-w-0 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2">
          <div ref={hostRef} className="h-[30rem] w-full overflow-hidden rounded-2xl" />
        </section>
      </div>
    </div>
  );
};

export default TurtleGame;
