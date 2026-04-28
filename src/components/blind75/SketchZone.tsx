import { useState, useRef, useCallback, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { sketches as sketchesApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface SketchZoneProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: number;
}

// StrokeTool = tools that produce a drawn stroke on the canvas.
// Tool = everything the toolbar can select, including non-stroke-producing tools
// like the eraser. Keeping these separate means drawStroke's switch stays
// exhaustive and we can't accidentally create a Stroke with tool: 'eraser'.
type StrokeTool = 'pencil' | 'brush' | 'rect' | 'circle' | 'line' | 'grid';
type Tool = StrokeTool | 'eraser';
type Size = 'sm' | 'md' | 'lg';

interface Stroke {
  tool: StrokeTool;
  color: string;
  size: Size;
  points: [number, number][];     // freehand (pencil/brush)
  startX?: number;                // shapes (rect/circle/line/grid)
  startY?: number;
  endX?: number;
  endY?: number;
  rows?: number;                  // grid only
  cols?: number;                  // grid only
}

const PAPER_BG = '#EBDFCE';
const PAPER_BG_DARKER = '#d4c5b0';
const PAPER_BORDER = '#a89478';
const INK = '#3a2e1f';

const INITIAL_VIEWPORT_FRACTION = 0.6;
const MIN_VIEWPORT_FRACTION = 0.25;

// Paper-friendly inks — no neon/bright colors that would clash with the aesthetic.
const INK_PALETTE = [
  '#3a2e1f', // black ink
  '#5c3a1f', // sepia brown
  '#1e3a5f', // navy
  '#2d5016', // forest green
  '#7a1f2e', // burgundy
  '#c2531a', // burnt orange
  '#c49a2e', // mustard
  '#4a2d5f', // plum
];

// Stroke widths in pixels per size tier.
const SIZE_PX: Record<Size, number> = { sm: 2, md: 4, lg: 8 };

// Eraser hit-test radius per size tier — larger than stroke width so the
// eraser feels forgiving (you don't need pixel-perfect aim).
const ERASER_RADIUS: Record<Size, number> = { sm: 12, md: 20, lg: 32 };

// Cap on undo depth. 100 is generous for a whiteboard scratchpad; beyond this
// the oldest snapshot is dropped so memory stays bounded.
const MAX_HISTORY = 100;

interface History {
  snapshots: Stroke[][];
  index: number;
}

// ─── Drawing primitives ───
// Each tool gets its own rendering path. Pencil/brush use the freehand `points`
// array; rect/circle/line use the start/end coordinate fields.
function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = SIZE_PX[s.size];
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (s.tool) {
    case 'pencil': {
      if (s.points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(s.points[0][0], s.points[0][1]);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i][0], s.points[i][1]);
      }
      ctx.stroke();
      return;
    }
    case 'brush': {
      if (s.points.length === 0) return;
      const outline = getStroke(s.points, {
        size: SIZE_PX[s.size] * 2,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      });
      if (outline.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(outline[0][0], outline[0][1]);
      for (let i = 1; i < outline.length; i++) {
        ctx.lineTo(outline[i][0], outline[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'rect': {
      if (s.startX === undefined || s.startY === undefined || s.endX === undefined || s.endY === undefined) return;
      const x = Math.min(s.startX, s.endX);
      const y = Math.min(s.startY, s.endY);
      const w = Math.abs(s.endX - s.startX);
      const h = Math.abs(s.endY - s.startY);
      ctx.strokeRect(x, y, w, h);
      return;
    }
    case 'circle': {
      if (s.startX === undefined || s.startY === undefined || s.endX === undefined || s.endY === undefined) return;
      const cx = (s.startX + s.endX) / 2;
      const cy = (s.startY + s.endY) / 2;
      const rx = Math.abs(s.endX - s.startX) / 2;
      const ry = Math.abs(s.endY - s.startY) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    case 'line': {
      if (s.startX === undefined || s.startY === undefined || s.endX === undefined || s.endY === undefined) return;
      ctx.beginPath();
      ctx.moveTo(s.startX, s.startY);
      ctx.lineTo(s.endX, s.endY);
      ctx.stroke();
      return;
    }
    case 'grid': {
      if (s.startX === undefined || s.startY === undefined || s.endX === undefined || s.endY === undefined) return;
      const x1 = Math.min(s.startX, s.endX);
      const y1 = Math.min(s.startY, s.endY);
      const x2 = Math.max(s.startX, s.endX);
      const y2 = Math.max(s.startY, s.endY);
      const w = x2 - x1;
      const h = y2 - y1;
      const rows = Math.max(1, s.rows ?? 1);
      const cols = Math.max(1, s.cols ?? 1);
      // Outer frame.
      ctx.strokeRect(x1, y1, w, h);
      // Interior dividers — single beginPath/stroke pair for efficiency.
      ctx.beginPath();
      for (let i = 1; i < cols; i++) {
        const x = x1 + (w * i) / cols;
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
      }
      for (let i = 1; i < rows; i++) {
        const y = y1 + (h * i) / rows;
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
      }
      ctx.stroke();
      return;
    }
  }
}

// ─── Hit-test helpers ───
// Used by the eraser (and later, the selector tool) to decide whether a cursor
// position "touches" a given stroke. All tests treat strokes as outlines
// (consistent with how drawStroke renders them — no filled shapes).

// Shortest distance from point p to the segment a→b.
function distToSegment(p: [number, number], a: [number, number], b: [number, number]): number {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  // Project p onto the line, clamp to [0, 1] so we stay within the segment.
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function isStrokeHit(p: [number, number], s: Stroke, threshold: number): boolean {
  switch (s.tool) {
    case 'pencil':
    case 'brush': {
      // Freehand — check distance to every consecutive-point segment.
      if (s.points.length === 0) return false;
      if (s.points.length === 1) return Math.hypot(p[0] - s.points[0][0], p[1] - s.points[0][1]) < threshold;
      for (let i = 1; i < s.points.length; i++) {
        if (distToSegment(p, s.points[i - 1], s.points[i]) < threshold) return true;
      }
      return false;
    }
    case 'rect': {
      if (s.startX === undefined || s.startY === undefined || s.endX === undefined || s.endY === undefined) return false;
      const x1 = Math.min(s.startX, s.endX);
      const y1 = Math.min(s.startY, s.endY);
      const x2 = Math.max(s.startX, s.endX);
      const y2 = Math.max(s.startY, s.endY);
      // Rect is outlined, not filled — check all 4 edges.
      return (
        distToSegment(p, [x1, y1], [x2, y1]) < threshold ||
        distToSegment(p, [x2, y1], [x2, y2]) < threshold ||
        distToSegment(p, [x2, y2], [x1, y2]) < threshold ||
        distToSegment(p, [x1, y2], [x1, y1]) < threshold
      );
    }
    case 'circle': {
      if (s.startX === undefined || s.startY === undefined || s.endX === undefined || s.endY === undefined) return false;
      const cx = (s.startX + s.endX) / 2;
      const cy = (s.startY + s.endY) / 2;
      const rx = Math.abs(s.endX - s.startX) / 2;
      const ry = Math.abs(s.endY - s.startY) / 2;
      if (rx === 0 || ry === 0) return false;
      // Normalize to unit circle: point-on-ellipse satisfies nx²+ny² = 1.
      // |sqrt(nx²+ny²) - 1| is the approximate signed distance in normalized space;
      // multiplying by mean radius gets us back to canvas pixels (accurate enough
      // for hit detection, cheap to compute — no iterative solver needed).
      const nx = (p[0] - cx) / rx;
      const ny = (p[1] - cy) / ry;
      const meanR = (rx + ry) / 2;
      return Math.abs(Math.sqrt(nx * nx + ny * ny) - 1) * meanR < threshold;
    }
    case 'line': {
      if (s.startX === undefined || s.startY === undefined || s.endX === undefined || s.endY === undefined) return false;
      return distToSegment(p, [s.startX, s.startY], [s.endX, s.endY]) < threshold;
    }
    case 'grid': {
      if (s.startX === undefined || s.startY === undefined || s.endX === undefined || s.endY === undefined) return false;
      const x1 = Math.min(s.startX, s.endX);
      const y1 = Math.min(s.startY, s.endY);
      const x2 = Math.max(s.startX, s.endX);
      const y2 = Math.max(s.startY, s.endY);
      const w = x2 - x1;
      const h = y2 - y1;
      const rows = Math.max(1, s.rows ?? 1);
      const cols = Math.max(1, s.cols ?? 1);
      // Outer frame edges.
      if (
        distToSegment(p, [x1, y1], [x2, y1]) < threshold ||
        distToSegment(p, [x2, y1], [x2, y2]) < threshold ||
        distToSegment(p, [x2, y2], [x1, y2]) < threshold ||
        distToSegment(p, [x1, y2], [x1, y1]) < threshold
      ) return true;
      // Interior gridlines — eraser hits any line inside the grid.
      for (let i = 1; i < cols; i++) {
        const x = x1 + (w * i) / cols;
        if (distToSegment(p, [x, y1], [x, y2]) < threshold) return true;
      }
      for (let i = 1; i < rows; i++) {
        const y = y1 + (h * i) / rows;
        if (distToSegment(p, [x1, y], [x2, y]) < threshold) return true;
      }
      return false;
    }
  }
}

// Apply one eraser event (point + radius) to an array of strokes.
// - Freehand (pencil/brush): walks the point array, splits the stroke wherever
//   points fall inside the eraser circle. One stroke becomes 0, 1, or many
//   sub-strokes. Sub-strokes shorter than 2 points are dropped (no visible line).
// - Shapes (rect/circle/line): atomic units. Dropped entirely if the eraser
//   touches their outline; otherwise untouched.
// Returns `changed: false` if nothing was affected, so callers can skip
// triggering re-renders / history updates.
function eraseFromStrokes(
  strokes: Stroke[],
  ex: number,
  ey: number,
  er: number,
): { next: Stroke[]; changed: boolean } {
  const next: Stroke[] = [];
  let changed = false;
  for (const s of strokes) {
    if (s.tool === 'pencil' || s.tool === 'brush') {
      let buffer: [number, number][] = [];
      const parts: [number, number][][] = [];
      let touched = false;
      for (const [px, py] of s.points) {
        if (Math.hypot(px - ex, py - ey) < er) {
          if (buffer.length >= 2) parts.push(buffer);
          buffer = [];
          touched = true;
        } else {
          buffer.push([px, py]);
        }
      }
      if (buffer.length >= 2) parts.push(buffer);
      if (!touched) {
        next.push(s);
      } else {
        changed = true;
        for (const pts of parts) next.push({ ...s, points: pts });
      }
    } else {
      if (isStrokeHit([ex, ey], s, er)) {
        changed = true;
      } else {
        next.push(s);
      }
    }
  }
  return { next, changed };
}

function SketchZone({ isOpen, onClose, problemId }: SketchZoneProps) {
  if (!isOpen) return null;
  return <SketchZoneInner onClose={onClose} problemId={problemId} />;
}

function SketchZoneInner({ onClose, problemId }: Omit<SketchZoneProps, 'isOpen'>) {
  // Lazy-init from viewport at mount time. Fresh on each open because the outer
  // component remounts the inner when isOpen flips.
  const initialSize = () => ({
    width: window.innerWidth * INITIAL_VIEWPORT_FRACTION,
    height: window.innerHeight * INITIAL_VIEWPORT_FRACTION,
  });
  const initialPosition = () => {
    const w = window.innerWidth * INITIAL_VIEWPORT_FRACTION;
    const h = window.innerHeight * INITIAL_VIEWPORT_FRACTION;
    return { x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2 };
  };

  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0,
  });
  const windowRef = useRef<HTMLDivElement>(null);

  // Drawing state — tool/color/size selection + stroke history (with redo stack)
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [currentColor, setCurrentColor] = useState<string>(INK_PALETTE[0]);
  const [currentSize, setCurrentSize] = useState<Size>('md');
  // Grid tool dimensions — default 3x3 (sensible for matrix problems). 1 is
  // technically allowed (degenerates to a rect) but we don't bother forbidding
  // it. Cap at 20 so a fat-fingered input doesn't render hundreds of lines.
  const [gridRows, setGridRows] = useState(3);
  const [gridCols, setGridCols] = useState(3);
  // Snapshot-based history. Every mutation (add stroke, erase, paste, clear)
  // pushes a full snapshot of the strokes array. Undo/redo just slides `index`.
  // Snapshots share stroke references — they're immutable — so memory is cheap.
  const [history, setHistory] = useState<History>({ snapshots: [[]], index: 0 });
  const strokes = history.snapshots[history.index];
  const canUndo = history.index > 0;
  const canRedo = history.index < history.snapshots.length - 1;
  const pushSnapshot = useCallback((next: Stroke[]) => {
    setHistory(prev => {
      // Drop any "future" snapshots beyond current index — new edit invalidates redo.
      const base = prev.snapshots.slice(0, prev.index + 1);
      base.push(next);
      if (base.length > MAX_HISTORY) {
        return { snapshots: base.slice(-MAX_HISTORY), index: MAX_HISTORY - 1 };
      }
      return { snapshots: base, index: prev.index + 1 };
    });
  }, []);
  const [inProgressStroke, setInProgressStroke] = useState<Stroke | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // Eraser mid-drag state. workingStrokes holds the canvas state as it's being
  // mutated by an in-progress eraser drag — freehand strokes get split, shapes
  // get removed. Null means no drag is active. Committed as a single snapshot
  // on mouseup so one undo restores the whole drag.
  // didEraseRef tracks whether anything actually changed during the drag so we
  // don't push a no-op snapshot for a drag that touched nothing.
  const [workingStrokes, setWorkingStrokes] = useState<Stroke[] | null>(null);
  const isErasingRef = useRef(false);
  const didEraseRef = useRef(false);
  const visibleStrokes = workingStrokes ?? strokes;

  // Eraser cursor preview position (in canvas coords). Cleared when the mouse
  // leaves the canvas. The render is gated on currentTool === 'eraser', so a
  // stale value left over from a previous eraser session can't become visible
  // while a different tool is active.
  const [eraserCursor, setEraserCursor] = useState<[number, number] | null>(null);

  // Sketch metadata + persistence state
  const { user } = useAuth();
  const defaultName = `Sketch Zone — Problem ${problemId}`;
  const [sketchName, setSketchName] = useState<string>(defaultName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Hydrate from server on mount (auth'd users only). Unauth'd users start blank.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    sketchesApi.get(problemId)
      .then(record => {
        if (cancelled) return;
        const data = record.strokeData;
        if (data.strokes && data.strokes.length > 0) {
          // Replace the baseline snapshot, don't stack on top. Otherwise
          // hitting undo right after load would clear the whole sketch.
          setHistory({ snapshots: [data.strokes as Stroke[]], index: 0 });
        }
        if (data.name) {
          setSketchName(data.name);
        }
      })
      .catch(err => console.error('Failed to load sketch:', err));
    return () => { cancelled = true; };
  }, [problemId, user]);

  // Reset transient "saved"/"error" feedback after 1.5s
  useEffect(() => {
    if (saveState !== 'saved' && saveState !== 'error') return;
    const t = setTimeout(() => setSaveState('idle'), 1500);
    return () => clearTimeout(t);
  }, [saveState]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - size.width));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - size.height));
      setPosition({ x: newX, y: newY });
    }
    if (resizeDirection) {
      const minWidth = window.innerWidth * MIN_VIEWPORT_FRACTION;
      const minHeight = window.innerHeight * MIN_VIEWPORT_FRACTION;
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.posX;
      let newY = resizeStart.posY;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minWidth, resizeStart.width + deltaX);
      }
      if (resizeDirection.includes('w')) {
        const possibleWidth = resizeStart.width - deltaX;
        if (possibleWidth >= minWidth) {
          newWidth = possibleWidth;
          newX = resizeStart.posX + deltaX;
        }
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(minHeight, resizeStart.height + deltaY);
      }
      if (resizeDirection.includes('n')) {
        const possibleHeight = resizeStart.height - deltaY;
        if (possibleHeight >= minHeight) {
          newHeight = possibleHeight;
          newY = resizeStart.posY + deltaY;
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, resizeDirection, dragOffset, size, resizeStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setResizeDirection(null);
  }, []);

  useEffect(() => {
    if (isDragging || resizeDirection) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, resizeDirection, handleMouseMove, handleMouseUp]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.sketch-header')) {
      setIsDragging(true);
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    }
  };

  // ─── Canvas: keep drawing buffer in sync with display size and redraw ───
  // ResizeObserver handles ANY display-size change (window resize, parent
  // relayout, font load, etc.) — more robust than dep'ing on size.width/height.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const syncAndDraw = () => {
      const rect = canvas.getBoundingClientRect();
      const targetW = Math.floor(rect.width);
      const targetH = Math.floor(rect.height);
      if (targetW <= 0 || targetH <= 0) return;
      if (canvas.width !== targetW) canvas.width = targetW;
      if (canvas.height !== targetH) canvas.height = targetH;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of visibleStrokes) drawStroke(ctx, s);
      if (inProgressStroke) drawStroke(ctx, inProgressStroke);
    };

    syncAndDraw();
    const observer = new ResizeObserver(syncAndDraw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [visibleStrokes, inProgressStroke]);

  // ─── Canvas mouse handlers ───
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const [x, y] = getCanvasCoords(e);

    // Eraser: start a sweep. Also run the eraser at the initial point so a
    // single click (no subsequent mousemove) still erases whatever it lands on.
    if (currentTool === 'eraser') {
      isErasingRef.current = true;
      didEraseRef.current = false;
      const radius = ERASER_RADIUS[currentSize];
      const { next, changed } = eraseFromStrokes(strokes, x, y, radius);
      if (changed) didEraseRef.current = true;
      // Always set workingStrokes so visibleStrokes reflects the in-progress
      // erase even if the initial click missed everything.
      setWorkingStrokes(changed ? next : strokes);
      return;
    }

    isDrawingRef.current = true;
    if (currentTool === 'pencil' || currentTool === 'brush') {
      setInProgressStroke({
        tool: currentTool,
        color: currentColor,
        size: currentSize,
        points: [[x, y]],
      });
    } else {
      setInProgressStroke({
        tool: currentTool,
        color: currentColor,
        size: currentSize,
        points: [],
        startX: x, startY: y, endX: x, endY: y,
        // Grid carries its row/col counts on the stroke itself so each grid
        // can have different dimensions independent of the current toolbar state.
        ...(currentTool === 'grid' ? { rows: gridRows, cols: gridCols } : {}),
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = getCanvasCoords(e);

    // Track cursor position for the eraser preview whenever the eraser tool is
    // active — not just during an active drag. This is how the user sees where
    // the eraser will act before clicking.
    if (currentTool === 'eraser') setEraserCursor([x, y]);

    if (isErasingRef.current) {
      const radius = ERASER_RADIUS[currentSize];
      setWorkingStrokes(prev => {
        if (!prev) return prev;
        const { next, changed } = eraseFromStrokes(prev, x, y, radius);
        if (changed) didEraseRef.current = true;
        return changed ? next : prev;
      });
      return;
    }

    if (!isDrawingRef.current) return;
    setInProgressStroke(prev => {
      if (!prev) return null;
      if (prev.tool === 'pencil' || prev.tool === 'brush') {
        return { ...prev, points: [...prev.points, [x, y]] };
      }
      return { ...prev, endX: x, endY: y };
    });
  };

  const commitInProgressStroke = () => {
    // Eraser: commit the working stroke array as a single snapshot so one undo
    // restores the whole drag.
    if (isErasingRef.current) {
      isErasingRef.current = false;
      if (didEraseRef.current && workingStrokes) {
        pushSnapshot(workingStrokes);
      }
      didEraseRef.current = false;
      setWorkingStrokes(null);
      return;
    }
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (inProgressStroke) {
      pushSnapshot([...strokes, inProgressStroke]);
    }
    setInProgressStroke(null);
  };

  // Mouse-leaving the canvas: commit any in-progress drag AND clear the eraser
  // preview so the floating indicator doesn't stick around over the toolbar.
  const handleCanvasMouseLeave = () => {
    setEraserCursor(null);
    commitInProgressStroke();
  };

  // ─── Toolbar action handlers ───
  const handleUndo = () => {
    setHistory(prev => prev.index === 0 ? prev : { ...prev, index: prev.index - 1 });
  };

  const handleRedo = () => {
    setHistory(prev =>
      prev.index === prev.snapshots.length - 1 ? prev : { ...prev, index: prev.index + 1 }
    );
  };

  const handleClear = () => {
    if (strokes.length === 0 && !inProgressStroke) return;
    pushSnapshot([]);
    setInProgressStroke(null);
  };

  const handleSave = async () => {
    if (!user || saveState === 'saving') return;
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    setSaveState('saving');
    try {
      await sketchesApi.save(problemId, {
        name: sketchName,
        strokes,
        canvasWidth: rect ? Math.floor(rect.width) : 0,
        canvasHeight: rect ? Math.floor(rect.height) : 0,
      });
      setSaveState('saved');
    } catch (err) {
      console.error('Failed to save sketch:', err);
      setSaveState('error');
    }
  };

  const commitNameEdit = (newName: string) => {
    const trimmed = newName.trim();
    setSketchName(trimmed.length > 0 ? trimmed : defaultName);
    setIsEditingName(false);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX, y: e.clientY,
      width: size.width, height: size.height,
      posX: position.x, posY: position.y,
    });
  };

  const isLandscape = size.width >= size.height;

  const TOOLS: { id: Tool; label: string; Icon: () => React.ReactElement }[] = [
    { id: 'pencil', label: 'Pencil', Icon: PencilIcon },
    { id: 'brush', label: 'Brush', Icon: BrushIcon },
    { id: 'rect', label: 'Rectangle', Icon: RectIcon },
    { id: 'circle', label: 'Circle', Icon: CircleIcon },
    { id: 'line', label: 'Line', Icon: LineIcon },
    { id: 'grid', label: 'Grid', Icon: GridIcon },
    { id: 'eraser', label: 'Eraser', Icon: EraserIcon },
  ];

  const clampGridDim = (n: number) => Math.max(1, Math.min(20, Math.floor(n) || 1));

  const dividerClass = isLandscape ? 'w-px h-6' : 'h-px w-6';
  const groupDirection = isLandscape ? 'flex-row' : 'flex-col';

  // Visual color tint for the Save button based on its current state
  const saveBg =
    saveState === 'saved' ? '#9ec97a' :
    saveState === 'error' ? '#d97a7a' :
    'transparent';
  const saveTitle =
    !user ? 'Sign in to save' :
    saveState === 'saving' ? 'Saving…' :
    saveState === 'saved' ? 'Saved' :
    saveState === 'error' ? 'Save failed' :
    'Save';

  const Toolbar = (
    <div
      className={`flex gap-2 items-center ${
        isLandscape ? 'flex-row px-3 py-2 border-b' : 'flex-col py-3 px-2 border-r'
      }`}
      style={{ background: PAPER_BG_DARKER, borderColor: PAPER_BORDER }}
    >
      {/* Save (top-left) */}
      <button
        onClick={handleSave}
        disabled={!user || saveState === 'saving'}
        title={saveTitle}
        className="p-1.5 rounded transition hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
        style={{ color: INK, background: saveBg }}
      >
        <SaveIcon />
      </button>

      <div style={{ background: PAPER_BORDER }} className={dividerClass} />

      {/* Tool selector */}
      <div className={`flex gap-1 ${groupDirection}`}>
        {TOOLS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentTool(id)}
            title={label}
            className="p-1.5 rounded transition hover:bg-black/10"
            style={{
              color: INK,
              background: currentTool === id ? PAPER_BG : 'transparent',
              border: currentTool === id ? `1px solid ${INK}` : '1px solid transparent',
            }}
          >
            <Icon />
          </button>
        ))}
      </div>

      <div style={{ background: PAPER_BORDER }} className={dividerClass} />

      {/* Color palette */}
      <div className={`flex gap-1 ${groupDirection}`}>
        {INK_PALETTE.map(c => (
          <button
            key={c}
            onClick={() => setCurrentColor(c)}
            title={c}
            className="w-5 h-5 rounded-sm transition"
            style={{
              background: c,
              outline: currentColor === c ? `2px solid ${INK}` : 'none',
              outlineOffset: '1px',
              border: `1px solid ${PAPER_BORDER}`,
            }}
          />
        ))}
      </div>

      <div style={{ background: PAPER_BORDER }} className={dividerClass} />

      {/* Size selector */}
      <div className={`flex gap-1 ${groupDirection}`}>
        {(['sm', 'md', 'lg'] as Size[]).map(s => (
          <button
            key={s}
            onClick={() => setCurrentSize(s)}
            title={`Size ${s.toUpperCase()}`}
            className="px-1.5 py-0.5 text-[10px] font-bold rounded transition"
            style={{
              color: currentSize === s ? PAPER_BG : INK,
              background: currentSize === s ? INK : 'transparent',
              border: `1px solid ${PAPER_BORDER}`,
              minWidth: '24px',
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid dimensions — only shown when the grid tool is active. Same
          conditional-render pattern as the eraser cursor preview. */}
      {currentTool === 'grid' && (
        <>
          <div style={{ background: PAPER_BORDER }} className={dividerClass} />
          <div className={`flex gap-1 items-center ${groupDirection}`}>
            <input
              type="number"
              min={1}
              max={20}
              value={gridRows}
              onChange={e => setGridRows(clampGridDim(Number(e.target.value)))}
              title="Rows"
              className="text-[10px] font-bold rounded text-center"
              style={{
                color: INK,
                background: PAPER_BG,
                border: `1px solid ${PAPER_BORDER}`,
                width: '32px',
                height: '22px',
                padding: '0 2px',
              }}
            />
            <span className="text-[10px] font-bold" style={{ color: INK }}>×</span>
            <input
              type="number"
              min={1}
              max={20}
              value={gridCols}
              onChange={e => setGridCols(clampGridDim(Number(e.target.value)))}
              title="Columns"
              className="text-[10px] font-bold rounded text-center"
              style={{
                color: INK,
                background: PAPER_BG,
                border: `1px solid ${PAPER_BORDER}`,
                width: '32px',
                height: '22px',
                padding: '0 2px',
              }}
            />
          </div>
        </>
      )}

      <div style={{ background: PAPER_BORDER }} className={dividerClass} />

      {/* Actions */}
      <div className={`flex gap-1 ${groupDirection}`}>
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo"
          className="p-1.5 rounded transition hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ color: INK }}
        >
          <UndoIcon />
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo"
          className="p-1.5 rounded transition hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ color: INK }}
        >
          <RedoIcon />
        </button>
        <button
          onClick={handleClear}
          disabled={strokes.length === 0 && !inProgressStroke}
          title="Clear all"
          className="p-1.5 rounded transition hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ color: INK }}
        >
          <ClearIcon />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={windowRef}
        className={`pointer-events-auto absolute flex flex-col rounded-lg shadow-2xl overflow-hidden ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{
          top: position.y,
          left: position.x,
          width: size.width,
          height: size.height,
          background: PAPER_BG,
          border: `2px solid ${PAPER_BORDER}`,
        }}
        onMouseDown={handleHeaderMouseDown}
      >
        {/* Header (drag handle) */}
        <div
          className="sketch-header flex items-center justify-between px-4 py-2 cursor-grab select-none"
          style={{ background: PAPER_BG_DARKER, borderBottom: `1px solid ${PAPER_BORDER}` }}
        >
          <div className="flex items-center gap-2">
            {/* Pencil icon — click to toggle rename mode */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditingName(prev => !prev); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-0.5 rounded hover:bg-black/10 transition cursor-pointer"
              style={{ color: INK }}
              title={isEditingName ? 'Done renaming' : 'Rename sketch'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            {isEditingName ? (
              <input
                autoFocus
                defaultValue={sketchName}
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={(e) => commitNameEdit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitNameEdit((e.target as HTMLInputElement).value);
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                className="text-sm font-semibold bg-transparent border-b outline-none px-1"
                style={{ color: INK, borderColor: INK, minWidth: '200px' }}
              />
            ) : (
              <span className="text-sm font-semibold" style={{ color: INK }}>
                {sketchName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10 transition"
            style={{ color: INK }}
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — adaptive layout */}
        <div className={`flex-1 flex ${isLandscape ? 'flex-col' : 'flex-row'} overflow-hidden`}>
          {Toolbar}
          {/* Drawing canvas — fills remaining body area */}
          <div
            className="flex-1 overflow-hidden relative"
            style={{ background: PAPER_BG, minHeight: 0, minWidth: 0 }}
          >
            <canvas
              ref={canvasRef}
              className="touch-none"
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                cursor: currentTool === 'eraser' ? 'none' : 'crosshair',
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={commitInProgressStroke}
              onMouseLeave={handleCanvasMouseLeave}
            />
            {/* Eraser cursor preview — shows where the eraser will act, sized to
                the active radius. pointer-events: none so it can't steal events. */}
            {currentTool === 'eraser' && eraserCursor && (
              <div
                style={{
                  position: 'absolute',
                  left: eraserCursor[0] - ERASER_RADIUS[currentSize],
                  top: eraserCursor[1] - ERASER_RADIUS[currentSize],
                  width: ERASER_RADIUS[currentSize] * 2,
                  height: ERASER_RADIUS[currentSize] * 2,
                  pointerEvents: 'none',
                  borderRadius: '50%',
                  border: `1.5px dashed ${INK}`,
                  background: 'rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: INK,
                }}
              >
                <EraserIcon />
              </div>
            )}
          </div>
        </div>

        {/* Resize handles */}
        <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
        <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
        <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
        <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
        <div className="absolute top-0 left-3 right-3 h-1 cursor-n-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
        <div className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize" onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
        <div className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
        <div className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
      </div>
    </div>
  );
}

// ─── Tool icons (placeholder — Step 5 wires real handlers) ───

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.687a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  );
}

function RectIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="4" y="6" width="16" height="12" rx="1" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <line x1="5" y1="19" x2="19" y2="5" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon() {
  // 3x3 grid — outer rect plus two interior lines in each direction. Reads
  // immediately as "grid" at toolbar size.
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <line x1="9.33" y1="4" x2="9.33" y2="20" />
      <line x1="14.67" y1="4" x2="14.67" y2="20" />
      <line x1="4" y1="9.33" x2="20" y2="9.33" />
      <line x1="4" y1="14.67" x2="20" y2="14.67" />
    </svg>
  );
}

function EraserIcon() {
  // Old-school rectangular rubber eraser — horizontal block with a divider
  // line showing the two-tone body (like the classic pink/blue school eraser).
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round">
      <rect x="3" y="9" width="18" height="7" rx="1.5" />
      <line x1="10" y1="9" x2="10" y2="16" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

export default SketchZone;
