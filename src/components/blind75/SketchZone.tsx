import { useState, useRef, useCallback, useEffect } from 'react';
import { sketches as sketchesApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Tool, Stroke, Rect, Size, History } from '../shared/drawingEngine';
import {
  ERASER_RADIUS,
  MAX_HISTORY,
  drawStroke,
  eraseFromStrokes,
  splitStrokesByRect,
  translateStroke,
  strokeBbox,
} from '../shared/drawingEngine';

interface SketchZoneProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: number;
}

// Theme colors for the paper aesthetic. These will migrate into DrawingCanvas's
// theme system in a follow-up sub-step; for now they're referenced by both the
// floating-window chrome and the toolbar/canvas inside.
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

  // Eraser cursor preview position (in canvas coords). Cleared when the mouse
  // leaves the canvas. The render is gated on currentTool === 'eraser', so a
  // stale value left over from a previous eraser session can't become visible
  // while a different tool is active.
  const [eraserCursor, setEraserCursor] = useState<[number, number] | null>(null);

  // Selector state machine. Single discriminated union holds whichever data
  // the current mode needs — keeps related state from drifting out of sync.
  // `idle`        — no selection, no drag in progress.
  // `drawing-rect` — user is dragging a selection rectangle.
  // `selected`    — selection committed; user can drag inside to move,
  //                 Alt-drag to duplicate, or use keyboard (Esc/Del/Ctrl-CXV).
  // `moving`      — user is dragging selected content. isDuplicate=false → move
  //                 (originals lifted); true → duplicate (originals stay, copy floats).
  type SelectorState =
    | { mode: 'idle' }
    | { mode: 'drawing-rect'; rect: Rect }
    | { mode: 'selected'; rect: Rect; selected: Stroke[]; remaining: Stroke[] }
    | { mode: 'moving'; rect: Rect; selected: Stroke[]; remaining: Stroke[]; dx: number; dy: number; isDuplicate: boolean };
  const [selectorState, setSelectorState] = useState<SelectorState>({ mode: 'idle' });
  // Clipboard persists across selections / tool switches. Independent state so
  // copy-then-switch-tool-then-paste doesn't lose the buffer.
  const [clipboard, setClipboard] = useState<Stroke[] | null>(null);
  // Track which mouse button started the active drag so the selector's
  // mousemove handler can route into the right branch.
  const isSelectingRef = useRef(false);
  const isMovingRef = useRef(false);
  const moveStartRef = useRef<{ x: number; y: number } | null>(null);

  // Wrapping setCurrentTool ensures selection state never lingers across tool
  // switches — the underlying strokes can drift out from under a stale
  // selection if e.g. the user erases something while still "in" the selector.
  // Doing it here (synchronously, in the click handler path) avoids the
  // setState-in-effect anti-pattern that the lint rule warns about.
  const switchTool = useCallback((next: Tool) => {
    setCurrentTool(prev => {
      if (prev === 'selector' && next !== 'selector') {
        setSelectorState({ mode: 'idle' });
      }
      return next;
    });
  }, []);

  // Standard "paste-and-offset-it" displacement so the user can see the new
  // copy without it landing exactly on top of the original.
  const PASTE_OFFSET = 20;

  // Render layer logic, in priority order:
  //   1. Eraser drag in progress → show the in-progress mutated strokes.
  //   2. Selector move/duplicate in progress → show originals (or remaining,
  //      for move) plus the translated selection floating with the cursor.
  //   3. Otherwise → just the committed strokes.
  // Has to live AFTER selectorState is declared (temporal dead zone), so it
  // can't be co-located with the eraser state above.
  let visibleStrokes: Stroke[];
  if (workingStrokes) {
    visibleStrokes = workingStrokes;
  } else if (selectorState.mode === 'moving') {
    const { selected, remaining, dx, dy, isDuplicate } = selectorState;
    const translated = selected.map(s => translateStroke(s, dx, dy));
    visibleStrokes = isDuplicate ? [...strokes, ...translated] : [...remaining, ...translated];
  } else {
    visibleStrokes = strokes;
  }

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

  // Keyboard shortcuts for the selector. Document-level listener — the canvas
  // doesn't take focus reliably. Gated on currentTool === 'selector' so we
  // don't intercept these globally.
  // - Escape: deselect.
  // - Delete/Backspace: drop the selected content from the canvas.
  // - Ctrl/Cmd+C: copy selected → clipboard (canvas unchanged).
  // - Ctrl/Cmd+X: cut selected → clipboard, drop from canvas.
  // - Ctrl/Cmd+V: paste clipboard at PASTE_OFFSET, becomes the new selection.
  useEffect(() => {
    if (currentTool !== 'selector') return;
    const handler = (e: KeyboardEvent) => {
      // Don't hijack typing into the rename / grid number inputs.
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      const mod = e.ctrlKey || e.metaKey;
      if (e.key === 'Escape' && selectorState.mode !== 'idle') {
        setSelectorState({ mode: 'idle' });
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectorState.mode === 'selected') {
        e.preventDefault();
        pushSnapshot(selectorState.remaining);
        setSelectorState({ mode: 'idle' });
        return;
      }
      if (mod && e.key.toLowerCase() === 'c' && selectorState.mode === 'selected') {
        e.preventDefault();
        setClipboard(selectorState.selected);
        return;
      }
      if (mod && e.key.toLowerCase() === 'x' && selectorState.mode === 'selected') {
        e.preventDefault();
        setClipboard(selectorState.selected);
        pushSnapshot(selectorState.remaining);
        setSelectorState({ mode: 'idle' });
        return;
      }
      if (mod && e.key.toLowerCase() === 'v' && clipboard && clipboard.length > 0) {
        e.preventDefault();
        const pasted = clipboard.map(s => translateStroke(s, PASTE_OFFSET, PASTE_OFFSET));
        const next = [...strokes, ...pasted];
        pushSnapshot(next);
        // The pasted content becomes the new selection so the user can drag
        // it into position immediately.
        const bboxes = pasted.map(strokeBbox);
        const x1 = Math.min(...bboxes.map(b => b.x1));
        const y1 = Math.min(...bboxes.map(b => b.y1));
        const x2 = Math.max(...bboxes.map(b => b.x2));
        const y2 = Math.max(...bboxes.map(b => b.y2));
        setSelectorState({
          mode: 'selected',
          rect: { x1, y1, x2, y2 },
          selected: pasted,
          remaining: strokes,
        });
        return;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [currentTool, selectorState, clipboard, strokes, pushSnapshot]);

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

      // Selection rectangle overlay (drag preview OR committed selection).
      // During a move/duplicate drag, translate the rect along with the content.
      let overlay: Rect | null = null;
      if (selectorState.mode === 'drawing-rect' || selectorState.mode === 'selected') {
        overlay = selectorState.rect;
      } else if (selectorState.mode === 'moving') {
        const r = selectorState.rect;
        overlay = {
          x1: r.x1 + selectorState.dx, y1: r.y1 + selectorState.dy,
          x2: r.x2 + selectorState.dx, y2: r.y2 + selectorState.dy,
        };
      }
      if (overlay) {
        const ox = Math.min(overlay.x1, overlay.x2);
        const oy = Math.min(overlay.y1, overlay.y2);
        const ow = Math.abs(overlay.x2 - overlay.x1);
        const oh = Math.abs(overlay.y2 - overlay.y1);
        ctx.save();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.fillStyle = 'rgba(58, 46, 31, 0.05)';  // very faint INK fill
        ctx.fillRect(ox, oy, ow, oh);
        ctx.strokeRect(ox, oy, ow, oh);
        ctx.restore();
      }
    };

    syncAndDraw();
    const observer = new ResizeObserver(syncAndDraw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [visibleStrokes, inProgressStroke, selectorState]);

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

    // Selector: three branches depending on current state.
    // - If a selection is committed AND the click landed inside its rect →
    //   start a move (or a duplicate, if Alt is held at mousedown).
    // - Otherwise (no selection, or click outside an existing one) → start
    //   drawing a new selection rectangle. Any prior selection is dropped.
    if (currentTool === 'selector') {
      if (
        selectorState.mode === 'selected' &&
        x >= selectorState.rect.x1 && x <= selectorState.rect.x2 &&
        y >= selectorState.rect.y1 && y <= selectorState.rect.y2
      ) {
        isMovingRef.current = true;
        moveStartRef.current = { x, y };
        setSelectorState({
          ...selectorState,
          mode: 'moving',
          dx: 0,
          dy: 0,
          // Lock duplicate intent at mousedown — releasing Alt mid-drag should
          // NOT switch back to move mode.
          isDuplicate: e.altKey,
        });
        return;
      }
      // Click outside any committed selection (or no selection yet) → start
      // drawing a new rect.
      isSelectingRef.current = true;
      setSelectorState({ mode: 'drawing-rect', rect: { x1: x, y1: y, x2: x, y2: y } });
      return;
    }

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

    // Selector: extending a drag-rect, or translating an in-progress move.
    if (isSelectingRef.current && selectorState.mode === 'drawing-rect') {
      setSelectorState({
        mode: 'drawing-rect',
        rect: { ...selectorState.rect, x2: x, y2: y },
      });
      return;
    }
    if (isMovingRef.current && selectorState.mode === 'moving' && moveStartRef.current) {
      const start = moveStartRef.current;
      setSelectorState({ ...selectorState, dx: x - start.x, dy: y - start.y });
      return;
    }

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
    // Selector: finishing a drag-rect → split strokes by the rect, transition
    // to 'selected' (or back to idle if nothing was caught).
    if (isSelectingRef.current && selectorState.mode === 'drawing-rect') {
      isSelectingRef.current = false;
      // Normalize rect so x1<=x2, y1<=y2 (user might drag in any direction).
      const r = selectorState.rect;
      const norm = {
        x1: Math.min(r.x1, r.x2), y1: Math.min(r.y1, r.y2),
        x2: Math.max(r.x1, r.x2), y2: Math.max(r.y1, r.y2),
      };
      // Tiny drag (basically a click) or empty selection → just deselect.
      if (norm.x2 - norm.x1 < 3 || norm.y2 - norm.y1 < 3) {
        setSelectorState({ mode: 'idle' });
        return;
      }
      const { selected, remaining } = splitStrokesByRect(strokes, norm);
      if (selected.length === 0) {
        setSelectorState({ mode: 'idle' });
        return;
      }
      setSelectorState({ mode: 'selected', rect: norm, selected, remaining });
      return;
    }
    // Selector: finishing a move/duplicate → commit the resulting strokes as a
    // snapshot. The new selection rect is the old rect translated by (dx,dy)
    // so the user can keep manipulating from where they dropped.
    if (isMovingRef.current && selectorState.mode === 'moving') {
      isMovingRef.current = false;
      moveStartRef.current = null;
      const { rect, selected, remaining, dx, dy, isDuplicate } = selectorState;
      // Click-without-drag inside the selection (dx/dy still 0) → no real
      // mutation, so don't push a no-op snapshot. Just snap back to 'selected'.
      if (dx === 0 && dy === 0 && !isDuplicate) {
        setSelectorState({ mode: 'selected', rect, selected, remaining });
        return;
      }
      const translated = selected.map(s => translateStroke(s, dx, dy));
      const nextStrokes = isDuplicate ? [...strokes, ...translated] : [...remaining, ...translated];
      pushSnapshot(nextStrokes);
      const newRect = { x1: rect.x1 + dx, y1: rect.y1 + dy, x2: rect.x2 + dx, y2: rect.y2 + dy };
      // After move, the new "selected" is the translated copy in its new home,
      // and "remaining" is everything else on the canvas. After duplicate, same
      // logic — selection now points at the duplicate, not the original.
      setSelectorState({
        mode: 'selected',
        rect: newRect,
        selected: translated,
        remaining: isDuplicate ? strokes : remaining,
      });
      return;
    }

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
    { id: 'selector', label: 'Selector (drag to select; drag inside to move; Alt-drag to duplicate; Ctrl+C/X/V)', Icon: SelectorIcon },
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
            onClick={() => switchTool(id)}
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
                cursor:
                  currentTool === 'eraser' ? 'none' :
                  currentTool === 'selector' && selectorState.mode === 'selected' ? 'move' :
                  'crosshair',
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

function SelectorIcon() {
  // Dashed rectangle with a small arrow cursor in the corner — reads as
  // "selection marquee" at toolbar size.
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="13" height="13" strokeDasharray="2.5 2" />
      <path d="M13 13 L21 13 L17.5 16.5 L20 20.5 L17.5 22 L15 18 L13 21 Z" fill="currentColor" stroke="none" />
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
