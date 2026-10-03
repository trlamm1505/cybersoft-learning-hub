import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  useDraggable,
  useDroppable,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useToast } from '../components/Toast';
import {
  Hash,
  Repeat,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Puzzle,
  X,
  Wrench,
  ClipboardList,
  Lightbulb,
  Bot,
  Play,
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle2,
  Trophy,
  BookOpen,
  Home,
  TreeDeciduous,
  Rocket,
  PartyPopper,
  Bomb,
  ChevronLeft,
  Gamepad2,
  type LucideIcon,
} from 'lucide-react';
import type { LessonAuthoring, BlockCommand } from '../types/authoring';
import type { AuthUser } from '../types/auth';
import blockPuzzleApi from '../axios/blockPuzzleApi';

interface BlockPuzzlePageProps {
  teacherLessons?: LessonAuthoring[];
  authUser?: AuthUser | null;
}

const CONCEPT_META: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  sequence: { label: 'Tuần tự', Icon: Hash, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300' },
  loop: { label: 'Vòng lặp', Icon: Repeat, color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300' },
  condition: { label: 'Điều kiện', Icon: HelpCircle, color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300' },
};

const DIRECTION_ARROW: Record<string, LucideIcon> = { UP: ArrowUp, DOWN: ArrowDown, LEFT: ArrowLeft, RIGHT: ArrowRight };
const DIRECTION_ORDER: Array<'UP' | 'RIGHT' | 'DOWN' | 'LEFT'> = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

interface PlacedBlock {
  instanceId: string;
  command: BlockCommand;
  repeatTimes?: number; // only for REPEAT
  children?: PlacedBlock[]; // only for REPEAT | IF_OBSTACLE — nested 1 level deep, no REPEAT/IF inside children
}

// Draggable palette item (source)
const PaletteBlock: React.FC<{ command: BlockCommand }> = ({ command }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${command.key}`,
    data: { command },
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-grab active:cursor-grabbing bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] shadow-xs hover:border-indigo-400 transition-all ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <span className="text-base">{command.icon}</span>
      <span>{command.label}</span>
    </button>
  );
};

const HOW_TO_PLAY_SEEN_KEY = 'app_block_puzzle_seen_guide';

// Simple step-by-step visual guide for 7-10 year olds — big icon + short sentences,
// shown automatically the first time a child opens this page, reopenable via a help button.
const HowToPlayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const modalRef = useFocusTrap(true, onClose);
  const steps: Array<{ Icon: LucideIcon; text: string }> = [
    { Icon: Wrench, text: 'Kéo 1 khối lệnh từ ô "Khối lệnh" bên trái.' },
    { Icon: ClipboardList, text: 'Thả khối vào khung "Xếp khối lệnh" — thả đúng thứ tự con muốn Robot làm.' },
    { Icon: Bot, text: 'Bấm nút "Chạy Thử" — xem Robot đi từng bước trên bản đồ.' },
    { Icon: Home, text: 'Robot tới đúng ngôi nhà là con thắng! Đâm cây hay đâm tường thì thử lại nhé.' },
    { Icon: Lightbulb, text: 'Bí quá thì bấm "Gợi ý" — xem gợi ý 1 trước, chưa được thì mới xem gợi ý tiếp theo.' },
    { Icon: Unlock, text: 'Thắng xong 1 bài thì bài tiếp theo mới mở khoá — con chơi lần lượt từ Bài 1 nhé!' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cách chơi"
        tabIndex={-1}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
            <Puzzle size={20} strokeWidth={2.5} />
            Cách chơi
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-full bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-muted)] border-none cursor-pointer flex items-center justify-center"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="space-y-3">
          {steps.map((s, i) => {
            const StepIcon = s.Icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                <StepIcon size={26} strokeWidth={2} className="shrink-0 text-orange-500" />
                <p className="text-sm font-bold text-[var(--text-main)] leading-snug">{s.text}</p>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black cursor-pointer border-none flex items-center justify-center gap-2"
        >
          Con hiểu rồi, bắt đầu chơi!
          <Rocket size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// Droppable sequence area (target) — fallback catch-all so dropping isn't lost when it
// misses every gap (mainly relevant while the list is empty and there are no gaps yet).
const SequenceDropZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'sequence-drop-zone' });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] rounded-2xl border-2 border-dashed p-3 flex flex-wrap items-center transition-colors ${
        isOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-[var(--border-color)]'
      }`}
    >
      {children}
    </div>
  );
};

// A thin droppable "slot" between two blocks (or before the first / after the last) — dropping
// a palette block here inserts it at that exact position instead of always appending at the end.
// `zoneId` is either a top-level gap ("gap-N") or a gap inside a container's children
// ("child-gap-{parentInstanceId}-N").
const InsertGap: React.FC<{ zoneId: string }> = ({ zoneId }) => {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });
  return (
    <div
      ref={setNodeRef}
      className={`self-stretch flex items-center justify-center transition-all ${
        isOver ? 'w-8 mx-0.5' : 'w-2'
      }`}
    >
      <div
        className={`rounded-full transition-all ${
          isOver ? 'w-1.5 h-10 bg-indigo-500' : 'w-0.5 h-6 bg-transparent'
        }`}
      />
    </div>
  );
};

const CONTAINER_KEYS = new Set(['REPEAT', 'IF_OBSTACLE']);

// Nested drop zones (a container's own zone sits fully inside its parent's) need
// pointerWithin so the innermost zone under the cursor wins instead of the outer one.
// But the thin InsertGap slots (a few px wide) are easy to miss with a pointer-exact
// check, so fall back to rectIntersection (geometry-overlap based, more forgiving)
// whenever pointerWithin finds nothing — standard dnd-kit pattern for mixing nested
// containers with slim insertion gaps in the same tree.
const collisionDetectionStrategy: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

// Renders one placed block. REPEAT/IF_OBSTACLE render as a container with their own nested
// drop zone (1 level deep only). A container's child zone accepts a DIFFERENT container type
// (REPEAT can hold IF_OBSTACLE and vice versa, to combine loop + condition) but not the same
// type again and not a second level of nesting — enforced in handleDragEnd.
const PlacedBlockItem: React.FC<{
  block: PlacedBlock;
  index: number;
  onRemove: (instanceId: string) => void;
  onUpdateRepeatTimes: (instanceId: string, times: number) => void;
}> = ({ block: b, index: i, onRemove, onUpdateRepeatTimes }) => {
  const isContainer = CONTAINER_KEYS.has(b.command.key);
  const childZoneId = `child-zone-${b.instanceId}`;
  return (
    <div
      className={`px-2.5 py-2 rounded-xl border text-xs font-bold space-y-2 ${
        b.command.key === 'REPEAT'
          ? 'border-cyan-300 bg-cyan-50 dark:bg-cyan-950/40'
          : b.command.key === 'IF_OBSTACLE'
          ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/40'
          : 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950/40'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[var(--text-muted)]">{i + 1}.</span>
        <span>{b.command.icon}</span>
        <span>{b.command.label}</span>
        {b.command.key === 'REPEAT' && (
          <input
            type="number"
            min={1}
            max={10}
            value={b.repeatTimes ?? 1}
            onChange={(e) => onUpdateRepeatTimes(b.instanceId, parseInt(e.target.value) || 1)}
            className="w-10 text-center rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)]"
          />
        )}
        <button
          type="button"
          onClick={() => onRemove(b.instanceId)}
          className="text-red-500 hover:text-red-700 cursor-pointer border-none bg-transparent font-black ml-auto flex items-center"
          aria-label="Xóa khối"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
      {isContainer && (
        <div className="ml-4 pl-2 border-l-2 border-dashed border-[var(--border-color)]">
          <div
            className="min-h-[44px] rounded-xl border-2 border-dashed p-2 flex flex-wrap items-center gap-0.5 transition-colors border-[var(--border-color)]"
            data-child-zone={childZoneId}
          >
            <ChildDropZone zoneId={childZoneId}>
              {(!b.children || b.children.length === 0) && (
                <span className="text-[10px] text-[var(--text-muted)] p-1">Kéo khối vào đây...</span>
              )}
              <InsertGap zoneId={`child-gap-${b.instanceId}-0`} />
              {(b.children ?? []).map((child, ci) => (
                <React.Fragment key={child.instanceId}>
                  <PlacedBlockItem
                    block={child}
                    index={ci}
                    onRemove={onRemove}
                    onUpdateRepeatTimes={onUpdateRepeatTimes}
                  />
                  <InsertGap zoneId={`child-gap-${b.instanceId}-${ci + 1}`} />
                </React.Fragment>
              ))}
            </ChildDropZone>
          </div>
        </div>
      )}
    </div>
  );
};

// Droppable wrapper for a container's children list — same fallback-catch-all role as
// SequenceDropZone but keyed to the specific parent container.
const ChildDropZone: React.FC<{ zoneId: string; children: React.ReactNode }> = ({ zoneId, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });
  return (
    <div ref={setNodeRef} className={`flex flex-wrap items-center gap-0.5 w-full ${isOver ? 'bg-indigo-50 dark:bg-indigo-950/30 rounded-lg' : ''}`}>
      {children}
    </div>
  );
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface SimStep {
  x: number;
  y: number;
  direction: Direction;
  hitWall: boolean; // true only on the final step if the robot crashed
}

interface SimResult {
  steps: SimStep[]; // step[0] is the starting position; playback walks through the rest
  success: boolean;
  message: string;
}

// Returns every intermediate position/direction so the UI can animate the robot moving
// block-by-block, instead of only reporting the final win/lose outcome.
function simulateRun(
  placed: PlacedBlock[],
  puzzle: NonNullable<LessonAuthoring['blockPuzzle']>,
): SimResult {
  let { x, y } = puzzle.startPosition;
  let direction: Direction = puzzle.startPosition.direction;
  const obstacleSet = new Set(puzzle.obstacles.map((o) => `${o.x},${o.y}`));
  const steps: SimStep[] = [{ x, y, direction, hitWall: false }];

  const isBlocked = (nx: number, ny: number) =>
    nx < 0 || ny < 0 || nx >= puzzle.gridWidth || ny >= puzzle.gridHeight || obstacleSet.has(`${nx},${ny}`);

  const nextCell = () => {
    if (direction === 'UP') return { x, y: y - 1 };
    if (direction === 'DOWN') return { x, y: y + 1 };
    if (direction === 'LEFT') return { x: x - 1, y };
    return { x: x + 1, y };
  };

  // Returns false and pushes a hitWall step when the robot crashes — caller stops immediately.
  const runOne = (cmd: BlockCommand): boolean => {
    if (cmd.key === 'MOVE_FORWARD') {
      const n = nextCell();
      if (isBlocked(n.x, n.y)) {
        // Crashing into an obstacle: show the robot right on that tile. Crashing into the grid
        // edge: `n` would be off-grid and unrenderable, so keep the robot at its current tile
        // (the edge) instead — the shake/crash effect still plays there.
        const isOffGrid = n.x < 0 || n.y < 0 || n.x >= puzzle.gridWidth || n.y >= puzzle.gridHeight;
        steps.push({ x: isOffGrid ? x : n.x, y: isOffGrid ? y : n.y, direction, hitWall: true });
        return false;
      }
      x = n.x;
      y = n.y;
      steps.push({ x, y, direction, hitWall: false });
      return true;
    }
    if (cmd.key === 'TURN_LEFT') {
      const idx = DIRECTION_ORDER.indexOf(direction);
      direction = DIRECTION_ORDER[(idx + 3) % 4];
      steps.push({ x, y, direction, hitWall: false });
      return true;
    }
    if (cmd.key === 'TURN_RIGHT') {
      const idx = DIRECTION_ORDER.indexOf(direction);
      direction = DIRECTION_ORDER[(idx + 1) % 4];
      steps.push({ x, y, direction, hitWall: false });
      return true;
    }
    return true;
  };

  // Runs a list of blocks in order, recursing one level into REPEAT/IF_OBSTACLE children.
  // Returns false the moment the robot crashes so the caller stops immediately.
  const runBlocks = (blocks: PlacedBlock[]): boolean => {
    for (const block of blocks) {
      if (block.command.key === 'REPEAT') {
        const times = block.repeatTimes ?? 1;
        const body = block.children && block.children.length > 0 ? block.children : null;
        if (!body) continue; // empty REPEAT does nothing — nothing to repeat
        for (let i = 0; i < times; i++) {
          if (!runBlocks(body)) return false;
        }
        continue;
      }
      if (block.command.key === 'IF_OBSTACLE') {
        const n = nextCell();
        const conditionTrue = isBlocked(n.x, n.y);
        if (conditionTrue && block.children && block.children.length > 0) {
          if (!runBlocks(block.children)) return false;
        }
        continue;
      }
      if (!runOne(block.command)) return false;
    }
    return true;
  };

  const crashMessage = 'Ối! Robot đâm vào chướng ngại vật rồi. Thử lại nhé!';

  if (!runBlocks(placed)) {
    return { steps, success: false, message: crashMessage };
  }

  if (x === puzzle.goalPosition.x && y === puzzle.goalPosition.y) {
    return { steps, success: true, message: puzzle.successMessage || 'Chúc mừng! Robot đã tới đích!' };
  }
  return { steps, success: false, message: 'Chưa tới đích rồi, thử xếp lại các khối lệnh nhé!' };
}

export const BlockPuzzlePage: React.FC<BlockPuzzlePageProps> = ({ teacherLessons = [], authUser }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const allBlockLessons = useMemo(
    () =>
      teacherLessons
        .filter((l) => (l.status === 'published' || !l.status) && l.type === 'block' && l.blockPuzzle)
        // BE trả về theo thứ tự mới tạo trước (createdAt desc) — sort lại theo đúng thứ tự
        // độ khó dễ→khó bằng field order, không dựa vào thứ tự API trả về.
        .sort((a, b) => (a.blockPuzzle?.order ?? 0) - (b.blockPuzzle?.order ?? 0)),
    [teacherLessons],
  );

  // Màn hình chọn game hiện trước danh sách bài — mỗi game là một gameId
  // riêng biệt (ví dụ 'robot-ve-nha'), cho phép thêm game mới sau này mà
  // không dồn tất cả bài vào chung một danh sách dài duy nhất.
  const games = useMemo(() => {
    const map = new Map<string, { gameId: string; gameTitle: string; lessons: LessonAuthoring[] }>();
    allBlockLessons.forEach((l) => {
      const gameId = l.blockPuzzle?.gameId || 'robot-ve-nha';
      const gameTitle = l.blockPuzzle?.gameTitle || 'Robot Về Nhà';
      const existing = map.get(gameId);
      if (existing) {
        existing.lessons.push(l);
      } else {
        map.set(gameId, { gameId, gameTitle, lessons: [l] });
      }
    });
    return Array.from(map.values());
  }, [allBlockLessons]);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const blockLessons = useMemo(
    () => (selectedGameId ? allBlockLessons.filter((l) => (l.blockPuzzle?.gameId || 'robot-ve-nha') === selectedGameId) : []),
    [allBlockLessons, selectedGameId],
  );

  // Sequential unlock ("ải"): bài 1 luôn mở, bài N+1 chỉ mở khi bài N đã hoàn
  // thành. Route /block-puzzle bắt buộc đăng nhập (App.tsx), nên authUser
  // luôn tồn tại ở đây — tiến độ lưu THẬT trên MongoDB theo tài khoản
  // (block-puzzle API), bền vững qua nhiều thiết bị/trình duyệt. localStorage
  // chỉ dùng làm cache hiển thị tạm khi API lỗi mạng, không phải nguồn sự thật.
  const completedSlugsKey = `app_block_puzzle_completed_${authUser?.id || 'guest'}`;

  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(completedSlugsKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Nạp tiến độ thật từ server khi vào trang hoặc khi tài khoản đổi (không
  // reload trang giữa 2 lượt đăng nhập trong cùng phiên SPA).
  useEffect(() => {
    if (!authUser?.id) return;
    let cancelled = false;

    blockPuzzleApi
      .getProgress()
      .then((res) => {
        if (cancelled) return;
        const slugs = new Set(res.completedSlugs);
        setCompletedSlugs(slugs);
        try {
          localStorage.setItem(completedSlugsKey, JSON.stringify(Array.from(slugs)));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        // API lỗi (mất mạng...) — vẫn hiển thị được bằng cache localStorage
        // gần nhất thay vì chặn hẳn người dùng chơi tiếp.
        if (cancelled) return;
        try {
          const saved = localStorage.getItem(completedSlugsKey);
          setCompletedSlugs(saved ? new Set(JSON.parse(saved)) : new Set());
        } catch {
          setCompletedSlugs(new Set());
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedSlugsKey, authUser?.id]);

  const markCompleted = (slug: string, gameId: string) => {
    setCompletedSlugs((prev) => {
      if (prev.has(slug)) return prev;
      const next = new Set(prev).add(slug);
      try {
        localStorage.setItem(completedSlugsKey, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });

    // Ghi lên server khi đã đăng nhập — không chờ response mới cập nhật UI
    // (đã optimistic-update ở trên) vì đây không phải hành động cần xác nhận
    // trước khi tiếp tục chơi. Lỗi mạng không chặn trải nghiệm, nhưng cũng
    // đồng nghĩa tiến độ đó có thể chưa lên được server nếu request thất bại.
    if (authUser?.id) {
      blockPuzzleApi.markCompleted({ lessonSlug: slug, gameId }).catch(() => {
        /* best-effort — cache localStorage vẫn còn cho phiên hiện tại */
      });
    }
  };

  const isLessonUnlocked = (idx: number) => {
    if (idx === 0) return true;
    const prevLesson = blockLessons[idx - 1];
    return !!prevLesson && completedSlugs.has(prevLesson.slug);
  };

  const [selectedSlug, setSelectedSlug] = useState<string | null>(blockLessons[0]?.slug ?? null);

  // `teacherLessons` arrives asynchronously from App.tsx (starts as [] before the API call
  // resolves), so the useState initializer above often runs before any block lessons exist.
  // Once real data lands, default to the first lesson by `order` if nothing was picked yet —
  // and also snap away from any lesson that turns out to be locked (e.g. stale selection from
  // before the sequential-unlock feature existed).
  useEffect(() => {
    if (blockLessons.length === 0) return;
    setSelectedSlug((prev) => {
      const idx = prev ? blockLessons.findIndex((l) => l.slug === prev) : -1;
      if (idx !== -1 && isLessonUnlocked(idx)) return prev;
      return blockLessons[0].slug;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockLessons, completedSlugs]);
  const [placed, setPlaced] = useState<PlacedBlock[]>([]);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HOW_TO_PLAY_SEEN_KEY) !== 'true';
    } catch {
      return true;
    }
  });
  const closeHowToPlay = () => {
    setShowHowToPlay(false);
    try {
      localStorage.setItem(HOW_TO_PLAY_SEEN_KEY, 'true');
    } catch {
      /* ignore */
    }
  };

  // Step-by-step playback: robotStep holds the position/direction currently shown on the
  // grid while the animation plays; isAnimating disables editing/re-running mid-playback.
  const [simSteps, setSimSteps] = useState<SimStep[] | null>(null);
  const [robotStepIndex, setRobotStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeLesson = blockLessons.find((l) => l.slug === selectedSlug) ?? blockLessons[0];
  const puzzle = activeLesson?.blockPuzzle;

  const stopAnimation = () => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    setIsAnimating(false);
  };

  useEffect(() => stopAnimation, []);

  const resetPuzzle = () => {
    stopAnimation();
    setPlaced([]);
    setResult(null);
    setHintLevel(0);
    setSimSteps(null);
    setRobotStepIndex(0);
  };

  const handleSelectLesson = (slug: string) => {
    if (!authUser) {
      showToast('Vui lòng đăng nhập để chơi Block Puzzle.', 'info');
      navigate('/login');
      return;
    }
    const idx = blockLessons.findIndex((l) => l.slug === slug);
    if (idx === -1 || !isLessonUnlocked(idx)) return;
    setSelectedSlug(slug);
    resetPuzzle();
  };

  // Counts every block including nested children — used against `maxBlocks` so a container's
  // body counts toward the same budget as top-level blocks (no free nesting to dodge the limit).
  const countBlocks = (blocks: PlacedBlock[]): number =>
    blocks.reduce((sum, b) => sum + 1 + countBlocks(b.children ?? []), 0);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!puzzle || isAnimating) return;
    const { over, active } = event;
    if (!over) return;
    const command = active.data.current?.command as BlockCommand | undefined;
    if (!command) return;
    if (countBlocks(placed) >= puzzle.maxBlocks) return;

    const overId = String(over.id);
    const isContainerCommand = CONTAINER_KEYS.has(command.key);

    const newBlock: PlacedBlock = {
      instanceId: `${command.key}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      command,
      repeatTimes: command.key === 'REPEAT' ? 2 : undefined,
      children: isContainerCommand ? [] : undefined,
    };

    // Dropping on a specific gap ("gap-N") inserts at top-level index N. Dropping on
    // "child-gap-{parentInstanceId}-N" inserts into that parent's children at index N.
    // Dropping anywhere else inside a container's child zone ("child-zone-{parentInstanceId}",
    // e.g. missing every gap) still falls back to the END of that parent's children instead of
    // silently landing at top-level — otherwise a slightly-off drop looked like it "did nothing".
    const childGapMatch = overId.match(/^child-gap-(.+)-(\d+)$/);
    const childZoneMatch = overId.match(/^child-zone-(.+)$/);
    if (childGapMatch || childZoneMatch) {
      const parentId = childGapMatch ? childGapMatch[1] : childZoneMatch![1];
      if (isContainerCommand) {
        // Allow nesting a DIFFERENT container type one level deep (REPEAT inside
        // IF_OBSTACLE, or IF_OBSTACLE inside REPEAT) — this is the intended way
        // to combine loop + condition (e.g. "Lặp lại N lần { Nếu... }"). Still
        // block same-type nesting (REPEAT-in-REPEAT, IF-in-IF) and any nesting
        // past 1 level (parent already sitting inside another container).
        const parent = placed.find((b) => b.instanceId === parentId);
        const parentIsTopLevel = !!parent;
        if (!parentIsTopLevel || parent.command.key === command.key) return;
      }
      // The parent container may itself be nested one level inside another container
      // (e.g. dropping a plain move/turn block into an IF_OBSTACLE that lives inside a
      // REPEAT) — walk the whole tree, not just the top level, to find it.
      const insertIntoParent = (blocks: PlacedBlock[]): PlacedBlock[] =>
        blocks.map((b) => {
          if (b.instanceId === parentId) {
            const children = b.children ?? [];
            const childIdx = childGapMatch ? parseInt(childGapMatch[2], 10) : children.length;
            return { ...b, children: [...children.slice(0, childIdx), newBlock, ...children.slice(childIdx)] };
          }
          if (b.children) return { ...b, children: insertIntoParent(b.children) };
          return b;
        });
      setPlaced((prev) => insertIntoParent(prev));
    } else {
      const gapMatch = overId.match(/^gap-(\d+)$/);
      const insertIndex = gapMatch ? parseInt(gapMatch[1], 10) : placed.length;
      setPlaced((prev) => [...prev.slice(0, insertIndex), newBlock, ...prev.slice(insertIndex)]);
    }

    setResult(null);
    setSimSteps(null);
    setRobotStepIndex(0);
  };

  // Removes a block by instanceId wherever it is — top-level or nested inside a container.
  const removeBlockRecursive = (blocks: PlacedBlock[], instanceId: string): PlacedBlock[] =>
    blocks
      .filter((b) => b.instanceId !== instanceId)
      .map((b) => (b.children ? { ...b, children: removeBlockRecursive(b.children, instanceId) } : b));

  const removeBlock = (instanceId: string) => {
    if (isAnimating) return;
    setPlaced((prev) => removeBlockRecursive(prev, instanceId));
    setResult(null);
    setSimSteps(null);
    setRobotStepIndex(0);
  };

  const updateRepeatTimesRecursive = (blocks: PlacedBlock[], instanceId: string, times: number): PlacedBlock[] =>
    blocks.map((b) => {
      if (b.instanceId === instanceId) return { ...b, repeatTimes: Math.max(1, times) };
      if (b.children) return { ...b, children: updateRepeatTimesRecursive(b.children, instanceId, times) };
      return b;
    });

  const updateRepeatTimes = (instanceId: string, times: number) => {
    if (isAnimating) return;
    setPlaced((prev) => updateRepeatTimesRecursive(prev, instanceId, times));
  };

  const activeIndex = blockLessons.findIndex((l) => l.slug === activeLesson?.slug);
  const nextLesson = activeIndex !== -1 ? blockLessons[activeIndex + 1] : undefined;

  const goToNextLesson = () => {
    if (!nextLesson) return;
    setSelectedSlug(nextLesson.slug);
    resetPuzzle();
  };

  const STEP_ANIMATION_MS = 500;

  // Plays the robot moving one grid step at a time so children see exactly which move
  // caused a crash, instead of only reading a final win/lose message.
  const handleRun = () => {
    if (!puzzle || isAnimating) return;
    const sim = simulateRun(placed, puzzle);
    stopAnimation();
    setResult(null);
    setSimSteps(sim.steps);
    setRobotStepIndex(0);
    setIsAnimating(true);

    let idx = 0;
    animationTimerRef.current = setInterval(() => {
      idx += 1;
      if (idx >= sim.steps.length) {
        stopAnimation();
        setResult({ success: sim.success, message: sim.message });
        if (sim.success && activeLesson) {
          markCompleted(activeLesson.slug, activeLesson.blockPuzzle?.gameId || 'robot-ve-nha');
        }
        return;
      }
      setRobotStepIndex(idx);
    }, STEP_ANIMATION_MS);
  };

  if (games.length === 0) {
    return (
      <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]">
        <p className="text-sm font-semibold text-[var(--text-muted)]">
          Chưa có bài Block Puzzle nào được xuất bản.
        </p>
      </div>
    );
  }

  // ============ Screen 1: chọn game (trước khi vào danh sách bài của game đó) ============
  if (selectedGameId === null) {
    return (
      <div className="space-y-6 animate-fade-in pb-16">
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-cyan-900 text-white rounded-3xl p-6 md:p-8 shadow-xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white/10 border border-white/20">
            <Gamepad2 size={14} strokeWidth={2.5} />
            Block Puzzle — Lập Trình Không Cần Gõ Code
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2">Chọn Trò Chơi</h1>
          <p className="text-sm text-indigo-200 mt-1">Mỗi trò chơi là một chuỗi bài luyện tư duy lập trình qua kéo-thả khối lệnh.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => {
            const gameCompletedCount = game.lessons.filter((l) => completedSlugs.has(l.slug)).length;
            const isGameDone = gameCompletedCount === game.lessons.length;
            return (
              <button
                key={game.gameId}
                type="button"
                onClick={() => {
                  if (!authUser) {
                    showToast('Vui lòng đăng nhập để chơi Block Puzzle.', 'info');
                    navigate('/login');
                    return;
                  }
                  setSelectedGameId(game.gameId);
                }}
                className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 hover:shadow-md transition-all text-left cursor-pointer flex flex-col gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                  {isGameDone ? <Trophy size={22} strokeWidth={2} /> : <Puzzle size={22} strokeWidth={2} />}
                </div>
                <div>
                  <div className="font-extrabold text-base text-[var(--text-main)]">{game.gameTitle}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{game.lessons.length} bài</div>
                </div>
                <div className="mt-auto pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-bold">
                  <span className={isGameDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}>
                    {isGameDone ? 'Đã hoàn thành' : `Tiến độ: ${gameCompletedCount}/${game.lessons.length}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {showHowToPlay && <HowToPlayModal onClose={closeHowToPlay} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-cyan-900 text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => setSelectedGameId(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-200 hover:text-white cursor-pointer mb-2"
            >
              <ChevronLeft size={14} strokeWidth={2.5} /> Chọn trò chơi khác
            </button>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white/10 border border-white/20">
              <Puzzle size={14} strokeWidth={2.5} />
              Block Puzzle — Lập Trình Không Cần Gõ Code
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2">
              {activeLesson?.blockPuzzle?.gameTitle || 'Dẫn Robot Về Nhà'}
            </h1>
            <p className="text-sm text-indigo-200 mt-1">
              Kéo-thả các khối lệnh để giúp Robot vượt chướng ngại vật và tới đích!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer flex items-center justify-center"
            aria-label="Xem hướng dẫn cách chơi"
            title="Cách chơi"
          >
            <HelpCircle size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Lesson picker — a compact horizontal strip of numbered dots instead of a separate
          scrolling sidebar column, which felt disconnected from the play area. */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 flex items-center gap-2 overflow-x-auto">
        {blockLessons.map((l, idx) => {
          const meta = CONCEPT_META[l.blockPuzzle!.concept];
          const isActive = l.slug === activeLesson?.slug;
          const isCompleted = completedSlugs.has(l.slug);
          const isUnlocked = isLessonUnlocked(idx);
          return (
            <button
              key={l.slug}
              type="button"
              onClick={() => handleSelectLesson(l.slug)}
              disabled={!isUnlocked}
              title={isUnlocked ? l.title : `Hoàn thành Bài ${idx} trước để mở bài này`}
              className={`shrink-0 w-9 h-9 rounded-xl border text-xs font-black flex items-center justify-center transition-all relative ${
                !isUnlocked
                  ? 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                  : isActive
                  ? 'border-indigo-500 bg-indigo-600 text-white shadow-xs cursor-pointer'
                  : `border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:border-indigo-300 cursor-pointer ${meta.color}`
              }`}
            >
              {!isUnlocked ? (
                <Lock size={14} strokeWidth={2.5} />
              ) : isCompleted ? (
                <CheckCircle2 size={16} strokeWidth={2.5} />
              ) : (
                idx + 1
              )}
            </button>
          );
        })}
      </div>

      {/* Play area */}
      {puzzle && activeLesson && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-sm font-black text-[var(--text-main)]">{activeLesson.title}</h2>
              {(() => {
                const ConceptIcon = CONCEPT_META[puzzle.concept].Icon;
                return (
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${CONCEPT_META[puzzle.concept].color}`}>
                    <ConceptIcon size={12} strokeWidth={2.5} />
                    {CONCEPT_META[puzzle.concept].label}
                  </span>
                );
              })()}
            </div>
              <p className="text-sm text-[var(--text-main)] leading-relaxed flex items-start gap-1.5">
                <BookOpen size={16} strokeWidth={2} className="shrink-0 mt-0.5 text-indigo-500" />
                {puzzle.storyText}
              </p>

              {/* Grid */}
              {(() => {
                const currentStep = simSteps?.[robotStepIndex];
                const robotX = currentStep?.x ?? puzzle.startPosition.x;
                const robotY = currentStep?.y ?? puzzle.startPosition.y;
                const robotDir = currentStep?.direction ?? puzzle.startPosition.direction;
                const robotCrashedHere = currentStep?.hitWall && robotStepIndex === (simSteps?.length ?? 0) - 1;
                return (
                  <div
                    className="grid gap-1 mx-auto w-fit p-3 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)]"
                    style={{ gridTemplateColumns: `repeat(${puzzle.gridWidth}, 32px)` }}
                  >
                    {Array.from({ length: puzzle.gridHeight }).map((_, row) =>
                      Array.from({ length: puzzle.gridWidth }).map((_, col) => {
                        const isRobot = col === robotX && row === robotY;
                        const isGoal = col === puzzle.goalPosition.x && row === puzzle.goalPosition.y;
                        const isObstacle = puzzle.obstacles.some((o) => o.x === col && o.y === row);
                        const RobotDirIcon = DIRECTION_ARROW[robotDir];
                        return (
                          <div
                            key={`${row}-${col}`}
                            className={`w-8 h-8 rounded-md border flex items-center justify-center text-base transition-all duration-300 ${
                              isRobot && robotCrashedHere
                                ? 'border-2 border-red-500 bg-red-200 dark:bg-red-900/70 scale-125 shadow-[0_0_0_3px_rgba(239,68,68,0.35)] animate-shake z-10 relative'
                                : isRobot
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                                : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                            }`}
                          >
                            {isRobot ? (
                              robotCrashedHere ? (
                                <Bomb size={18} strokeWidth={2.5} className="text-red-600 dark:text-red-400" />
                              ) : (
                                <RobotDirIcon size={18} strokeWidth={2.5} className="text-indigo-600 dark:text-indigo-400" />
                              )
                            ) : isGoal ? (
                              <Home size={18} strokeWidth={2.5} className="text-orange-500" />
                            ) : isObstacle ? (
                              <TreeDeciduous size={18} strokeWidth={2.5} className="text-amber-700 dark:text-amber-500" />
                            ) : (
                              ''
                            )}
                          </div>
                        );
                      }),
                    )}
                  </div>
                );
              })()}
            </div>

            <DndContext onDragEnd={handleDragEnd} collisionDetection={collisionDetectionStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Palette */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
                    <Wrench size={14} strokeWidth={2.5} />
                    Khối lệnh
                  </span>
                  {puzzle.availableBlocks.map((cmd) => (
                    <PaletteBlock key={cmd.key} command={cmd} />
                  ))}
                </div>

                {/* Sequence area */}
                <div className="md:col-span-2 space-y-3">
                  <span className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1.5">
                    <ClipboardList size={14} strokeWidth={2.5} />
                    Xếp khối lệnh theo thứ tự ({countBlocks(placed)}/{puzzle.maxBlocks})
                  </span>
                  <SequenceDropZone>
                    {placed.length === 0 && (
                      <span className="text-xs text-[var(--text-muted)] p-2">Kéo khối lệnh vào đây...</span>
                    )}
                    {/* A gap before the first block, then one after every block — dropping on a
                        gap inserts right there, so kids can slot a new block in the middle. */}
                    <InsertGap zoneId="gap-0" />
                    {placed.map((b, i) => (
                      <React.Fragment key={b.instanceId}>
                        <PlacedBlockItem
                          block={b}
                          index={i}
                          onRemove={removeBlock}
                          onUpdateRepeatTimes={updateRepeatTimes}
                        />
                        <InsertGap zoneId={`gap-${i + 1}`} />
                      </React.Fragment>
                    ))}
                  </SequenceDropZone>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleRun}
                      disabled={placed.length === 0 || isAnimating}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md cursor-pointer border-none disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isAnimating ? (
                        <>
                          <Bot size={14} strokeWidth={2.5} />
                          Đang chạy...
                        </>
                      ) : (
                        <>
                          <Play size={14} strokeWidth={2.5} />
                          Chạy Thử
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isAnimating}
                      onClick={() => {
                        setPlaced([]);
                        setResult(null);
                        setSimSteps(null);
                        setRobotStepIndex(0);
                      }}
                      className="px-4 py-2 rounded-xl bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-muted)] text-xs font-bold border border-[var(--border-color)] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <RotateCcw size={14} strokeWidth={2.5} />
                      Làm Lại
                    </button>
                  </div>

                  {result && (
                    <div
                      className={`p-4 rounded-2xl border-2 space-y-3 ${
                        result.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 animate-fade-in'
                          : 'bg-red-50 dark:bg-red-950/40 border-red-300'
                      }`}
                    >
                      <p
                        className={`text-sm font-black flex items-center gap-2 ${
                          result.success
                            ? 'text-emerald-800 dark:text-emerald-300'
                            : 'text-red-800 dark:text-red-300'
                        }`}
                      >
                        {result.success ? (
                          <PartyPopper size={18} strokeWidth={2.5} className="shrink-0" />
                        ) : (
                          <Bomb size={18} strokeWidth={2.5} className="shrink-0" />
                        )}
                        {result.message}
                      </p>
                      {result.success && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Unlock size={14} strokeWidth={2.5} />
                            Đã mở khoá bài tiếp theo!
                          </span>
                          {nextLesson ? (
                            <button
                              type="button"
                              onClick={goToNextLesson}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md cursor-pointer border-none animate-pulse flex items-center gap-1.5"
                            >
                              Bài Tiếp Theo
                              <ArrowRight size={14} strokeWidth={2.5} />
                            </button>
                          ) : (
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              <Trophy size={14} strokeWidth={2.5} />
                              Con đã hoàn thành tất cả 15 bài!
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DndContext>

            {/* Hints — simple sequential reveal, no cooldown, appropriate for young learners */}
            {activeLesson.hints && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2">
                <span className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1.5">
                  <Lightbulb size={14} strokeWidth={2.5} />
                  Gợi ý
                </span>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setHintLevel(lvl)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                        hintLevel === lvl
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)]'
                      }`}
                    >
                      Gợi ý {lvl}
                    </button>
                  ))}
                </div>
                {hintLevel > 0 && (
                  <p className="text-xs text-[var(--text-main)] p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    {hintLevel === 1 && activeLesson.hints.hint1}
                    {hintLevel === 2 && activeLesson.hints.hint2}
                    {hintLevel === 3 && activeLesson.hints.hint3}
                  </p>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default BlockPuzzlePage;
