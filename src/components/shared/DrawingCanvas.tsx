// ── DrawingCanvas ──
// The reusable canvas + toolbar component. Hosts all drawing state (tool/color/
// size selection, snapshot history, in-progress drawing/erasing/selecting state)
// and the toolbar UI. Pure functions live in drawingEngine.ts; this file is
// where React, the DOM, and user interaction sit.
//
// Two consumers planned:
//   1. SketchZone (Blind 75 problem pages) — wraps in a paper-themed floating
//      window with a header for rename/close.
//   2. WhiteBoardPage (standalone /whiteboard route) — wraps in a full-page
//      layout with a Blind 75 reference panel and a future chat panel.
//
// Composition + reuse, not polymorphism. Both wrappers compose the same
// component with different chrome around it.

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Tool, Stroke, Rect, Size, History } from './drawingEngine';
import {
  ERASER_RADIUS,
  MAX_HISTORY,
  drawStroke,
  eraseFromStrokes,
  splitStrokesByRect,
  translateStroke,
  strokeBbox,
} from './drawingEngine';

// ─── Theme system ───
// Two predefined themes. Adding more is a one-entry-in-THEMES change. Callers
// pick by string name; colors are resolved internally so consumers don't touch
// hex codes.

export type DrawingTheme = 'paper' | 'whiteboard';

interface ThemeColors {
  canvasBg: string;     // drawing surface background
  panelBg: string;      // toolbar background
  border: string;       // dividers + button borders
  ink: string;          // text/icon color, selection rect, eraser preview
  inkPalette: string[]; // 8-color palette in the toolbar
}

const THEMES: Record<DrawingTheme, ThemeColors> = {
  // Paper — original SketchZone aesthetic. Warm beige with sepia inks. Reads as
  // "scratchpad on a desk."
  paper: {
    canvasBg: '#EBDFCE',
    panelBg: '#d4c5b0',
    border: '#a89478',
    ink: '#3a2e1f',
    inkPalette: [
      '#3a2e1f', // black ink
      '#5c3a1f', // sepia brown
      '#1e3a5f', // navy
      '#2d5016', // forest green
      '#7a1f2e', // burgundy
      '#c2531a', // burnt orange
      '#c49a2e', // mustard
      '#4a2d5f', // plum
    ],
  },
  // Whiteboard — slightly cool off-white surface with classic dry-erase marker
  // colors. Tinted away from pure-white for eye comfort against the dark page
  // chrome — closer to what real classroom/office whiteboards actually look
  // like in person.
  whiteboard: {
    canvasBg: '#e8eced',
    panelBg: '#d4d8db',
    border: '#888888',
    ink: '#1a1a1a',
    inkPalette: [
      '#000000', // black
      '#0066cc', // blue
      '#cc0000', // red
      '#008844', // green
      '#cc8800', // orange
      '#660066', // purple
      '#666666', // gray
      '#226633', // dark green
    ],
  },
};

// ─── Component API ───

export interface SaveData {
  strokes: Stroke[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface DrawingCanvasProps {
  /** Seed value for the snapshot history. Read once on mount; later changes
   *  are ignored. Callers that need to swap data should remount via the React
   *  `key` prop or a parent-level conditional render. */
  initialStrokes?: Stroke[];

  /** Color/typography theme. Defaults to `'paper'` for SketchZone parity. */
  theme?: DrawingTheme;

  /** Toolbar layout. `'top'` = horizontal ribbon above the canvas, `'side'` =
   *  vertical strip beside it, `'bottom-sheet'` = mobile-native pattern: the
   *  canvas fills the wrapper and one floating button at the bottom-right opens
   *  a sheet with all controls. The parent decides — DrawingCanvas can't
   *  measure its container without a feedback loop. */
  toolbarPosition?: 'top' | 'side' | 'bottom-sheet';

  /** Async save handler. If provided, the toolbar shows a Save button that
   *  calls this with the current state. DrawingCanvas tracks the save state
   *  machine internally based on the returned promise's resolution — green
   *  flash on success, red on rejection, transient (1.5s). */
  onSave?: (data: SaveData) => Promise<void>;

  /** Externally-controlled disabled state for the Save button (e.g. parent
   *  knows the user isn't authenticated). Combined with the internal saving
   *  state for the button's effective disabled. */
  saveDisabled?: boolean;

  /** Tooltip on the Save button. Use this to communicate why it's disabled
   *  (e.g. "Sign in to save"). */
  saveTitle?: string;

  /** Sizing wrapper class. Parent controls the outer dimensions. */
  className?: string;
}

// ─── Internal state types ───
// SelectorState is the discriminated union for the selector tool's state
// machine. Living inside the component so it's not part of the public API.

type SelectorState =
  | { mode: 'idle' }
  | { mode: 'drawing-rect'; rect: Rect }
  | { mode: 'selected'; rect: Rect; selected: Stroke[]; remaining: Stroke[] }
  | { mode: 'moving'; rect: Rect; selected: Stroke[]; remaining: Stroke[]; dx: number; dy: number; isDuplicate: boolean };

// Standard "paste-and-offset-it" displacement so the user can see the new
// copy without it landing exactly on top of the original.
const PASTE_OFFSET = 20;

// ─── Component ───

export function DrawingCanvas({
  initialStrokes = [],
  theme: themeName = 'paper',
  toolbarPosition = 'top',
  onSave,
  saveDisabled = false,
  saveTitle = 'Save',
  className = '',
}: DrawingCanvasProps) {
  const theme = THEMES[themeName];
  const isLandscape = toolbarPosition === 'top';

  // ── Drawing tool state ──
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [currentColor, setCurrentColor] = useState<string>(theme.inkPalette[0]);
  const [currentSize, setCurrentSize] = useState<Size>('md');

  // Grid tool dimensions — default 3x3 (sensible for matrix problems). Cap at
  // 20 so a fat-fingered input doesn't render hundreds of lines.
  const [gridRows, setGridRows] = useState(3);
  const [gridCols, setGridCols] = useState(3);

  // ── Snapshot-based history ──
  // Every mutation pushes a full snapshot. Undo/redo just slides `index`.
  // Snapshots share stroke references — strokes are immutable — so memory is
  // cheap. Initialized lazily from initialStrokes; later prop changes are
  // ignored by design (caller remounts to swap data).
  const [history, setHistory] = useState<History>(() => ({
    snapshots: [initialStrokes],
    index: 0,
  }));
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

  // ── Eraser mid-drag state ──
  // workingStrokes holds the canvas state mid-drag. Committed as a single
  // snapshot on mouseup so one undo restores the whole drag. didEraseRef
  // tracks whether anything actually changed during the drag so we don't push
  // a no-op snapshot.
  const [workingStrokes, setWorkingStrokes] = useState<Stroke[] | null>(null);
  const isErasingRef = useRef(false);
  const didEraseRef = useRef(false);

  // Eraser cursor preview position. Render is gated on currentTool === 'eraser',
  // so a stale value left over from a previous eraser session can't become
  // visible while a different tool is active.
  const [eraserCursor, setEraserCursor] = useState<[number, number] | null>(null);

  // ── Selector state machine ──
  const [selectorState, setSelectorState] = useState<SelectorState>({ mode: 'idle' });
  const [clipboard, setClipboard] = useState<Stroke[] | null>(null);
  const isSelectingRef = useRef(false);
  const isMovingRef = useRef(false);
  const moveStartRef = useRef<{ x: number; y: number } | null>(null);

  // Wrapping setCurrentTool ensures selection state never lingers across tool
  // switches. Doing it synchronously in the click-handler path avoids the
  // setState-in-effect anti-pattern.
  const switchTool = useCallback((next: Tool) => {
    setCurrentTool(prev => {
      if (prev === 'selector' && next !== 'selector') {
        setSelectorState({ mode: 'idle' });
      }
      return next;
    });
  }, []);

  // ── Render layer logic, in priority order ──
  //   1. Eraser drag in progress → show in-progress mutated strokes.
  //   2. Selector move/duplicate in progress → show originals (or remaining,
  //      for move) plus the translated selection floating with the cursor.
  //   3. Otherwise → just the committed strokes.
  // Has to live AFTER selectorState is declared (temporal dead zone gotcha
  // we hit before — TypeScript doesn't catch it because of the runtime
  // conditional).
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

  // ── Bottom-sheet open state (only used when toolbarPosition === 'bottom-sheet') ──
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // ── Save state machine ──
  // 'idle' → 'saving' → 'saved' | 'error' → 'idle' (after 1.5s)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Reset transient "saved" / "error" feedback after 1.5s
  useEffect(() => {
    if (saveState !== 'saved' && saveState !== 'error') return;
    const t = setTimeout(() => setSaveState('idle'), 1500);
    return () => clearTimeout(t);
  }, [saveState]);

  const handleSave = async () => {
    if (!onSave || saveDisabled || saveState === 'saving') return;
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    setSaveState('saving');
    try {
      await onSave({
        strokes,
        canvasWidth: rect ? Math.floor(rect.width) : 0,
        canvasHeight: rect ? Math.floor(rect.height) : 0,
      });
      setSaveState('saved');
    } catch (err) {
      console.error('DrawingCanvas save error:', err);
      setSaveState('error');
    }
  };

  // ── Selector keyboard shortcuts ──
  useEffect(() => {
    if (currentTool !== 'selector') return;
    const handler = (e: KeyboardEvent) => {
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

  // ── Canvas: keep drawing buffer in sync with display size and redraw ──
  // ResizeObserver handles ANY display-size change.
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

      // Selection rectangle overlay (drag preview OR committed selection)
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
        ctx.strokeStyle = theme.ink;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        // Very faint ink fill — works for both paper (sepia) and whiteboard (charcoal) themes
        ctx.fillStyle = theme.ink + '0d'; // append alpha hex (~5%)
        ctx.fillRect(ox, oy, ow, oh);
        ctx.strokeRect(ox, oy, ow, oh);
        ctx.restore();
      }
    };

    syncAndDraw();
    const observer = new ResizeObserver(syncAndDraw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [visibleStrokes, inProgressStroke, selectorState, theme.ink]);

  // ── Canvas pointer handlers ──
  // Pointer events unify mouse, touch, and pen — same `clientX/clientY`
  // shape as MouseEvent, but they actually fire on touchscreens. setPointerCapture
  // in the down handler keeps move/up firing on this canvas even if the user
  // drags their finger off the element mid-stroke.
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = getCanvasCoords(e);

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
          isDuplicate: e.altKey,
        });
        return;
      }
      isSelectingRef.current = true;
      setSelectorState({ mode: 'drawing-rect', rect: { x1: x, y1: y, x2: x, y2: y } });
      return;
    }

    if (currentTool === 'eraser') {
      isErasingRef.current = true;
      didEraseRef.current = false;
      const radius = ERASER_RADIUS[currentSize];
      const { next, changed } = eraseFromStrokes(strokes, x, y, radius);
      if (changed) didEraseRef.current = true;
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
        ...(currentTool === 'grid' ? { rows: gridRows, cols: gridCols } : {}),
      });
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [x, y] = getCanvasCoords(e);

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
    if (isSelectingRef.current && selectorState.mode === 'drawing-rect') {
      isSelectingRef.current = false;
      const r = selectorState.rect;
      const norm = {
        x1: Math.min(r.x1, r.x2), y1: Math.min(r.y1, r.y2),
        x2: Math.max(r.x1, r.x2), y2: Math.max(r.y1, r.y2),
      };
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
    if (isMovingRef.current && selectorState.mode === 'moving') {
      isMovingRef.current = false;
      moveStartRef.current = null;
      const { rect, selected, remaining, dx, dy, isDuplicate } = selectorState;
      if (dx === 0 && dy === 0 && !isDuplicate) {
        setSelectorState({ mode: 'selected', rect, selected, remaining });
        return;
      }
      const translated = selected.map(s => translateStroke(s, dx, dy));
      const nextStrokes = isDuplicate ? [...strokes, ...translated] : [...remaining, ...translated];
      pushSnapshot(nextStrokes);
      const newRect = { x1: rect.x1 + dx, y1: rect.y1 + dy, x2: rect.x2 + dx, y2: rect.y2 + dy };
      setSelectorState({
        mode: 'selected',
        rect: newRect,
        selected: translated,
        remaining: isDuplicate ? strokes : remaining,
      });
      return;
    }

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

  const handleCanvasPointerLeave = () => {
    setEraserCursor(null);
    commitInProgressStroke();
  };

  // ── Toolbar action handlers ──
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

  // Save button background tint per state
  const saveBg =
    saveState === 'saved' ? '#9ec97a' :
    saveState === 'error' ? '#d97a7a' :
    'transparent';
  const effectiveSaveTitle =
    saveDisabled ? saveTitle :
    saveState === 'saving' ? 'Saving…' :
    saveState === 'saved' ? 'Saved' :
    saveState === 'error' ? 'Save failed' :
    saveTitle;
  const saveButtonDisabled = saveDisabled || saveState === 'saving';

  const Toolbar = (
    <div
      className={`flex gap-2 items-center ${
        isLandscape ? 'flex-row px-3 py-2 border-b' : 'flex-col py-3 px-2 border-r'
      }`}
      style={{ background: theme.panelBg, borderColor: theme.border }}
    >
      {/* Save (only renders if onSave is provided) */}
      {onSave && (
        <>
          <button
            onClick={handleSave}
            disabled={saveButtonDisabled}
            title={effectiveSaveTitle}
            className="p-1.5 rounded transition hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
            style={{ color: theme.ink, background: saveBg }}
          >
            <SaveIcon />
          </button>
          <div style={{ background: theme.border }} className={dividerClass} />
        </>
      )}

      {/* Tool selector */}
      <div className={`flex gap-1 ${groupDirection}`}>
        {TOOLS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => switchTool(id)}
            title={label}
            className="p-1.5 rounded transition hover:bg-black/10"
            style={{
              color: theme.ink,
              background: currentTool === id ? theme.canvasBg : 'transparent',
              border: currentTool === id ? `1px solid ${theme.ink}` : '1px solid transparent',
            }}
          >
            <Icon />
          </button>
        ))}
      </div>

      <div style={{ background: theme.border }} className={dividerClass} />

      {/* Color palette */}
      <div className={`flex gap-1 ${groupDirection}`}>
        {theme.inkPalette.map(c => (
          <button
            key={c}
            onClick={() => setCurrentColor(c)}
            title={c}
            className="w-5 h-5 rounded-sm transition"
            style={{
              background: c,
              outline: currentColor === c ? `2px solid ${theme.ink}` : 'none',
              outlineOffset: '1px',
              border: `1px solid ${theme.border}`,
            }}
          />
        ))}
      </div>

      <div style={{ background: theme.border }} className={dividerClass} />

      {/* Size selector */}
      <div className={`flex gap-1 ${groupDirection}`}>
        {(['sm', 'md', 'lg'] as Size[]).map(s => (
          <button
            key={s}
            onClick={() => setCurrentSize(s)}
            title={`Size ${s.toUpperCase()}`}
            className="px-1.5 py-0.5 text-[10px] font-bold rounded transition"
            style={{
              color: currentSize === s ? theme.canvasBg : theme.ink,
              background: currentSize === s ? theme.ink : 'transparent',
              border: `1px solid ${theme.border}`,
              minWidth: '24px',
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid dimensions — only shown when the grid tool is active */}
      {currentTool === 'grid' && (
        <>
          <div style={{ background: theme.border }} className={dividerClass} />
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
                color: theme.ink,
                background: theme.canvasBg,
                border: `1px solid ${theme.border}`,
                width: '32px',
                height: '22px',
                padding: '0 2px',
              }}
            />
            <span className="text-[10px] font-bold" style={{ color: theme.ink }}>×</span>
            <input
              type="number"
              min={1}
              max={20}
              value={gridCols}
              onChange={e => setGridCols(clampGridDim(Number(e.target.value)))}
              title="Columns"
              className="text-[10px] font-bold rounded text-center"
              style={{
                color: theme.ink,
                background: theme.canvasBg,
                border: `1px solid ${theme.border}`,
                width: '32px',
                height: '22px',
                padding: '0 2px',
              }}
            />
          </div>
        </>
      )}

      <div style={{ background: theme.border }} className={dividerClass} />

      {/* Actions */}
      <div className={`flex gap-1 ${groupDirection}`}>
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo"
          className="p-1.5 rounded transition hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ color: theme.ink }}
        >
          <UndoIcon />
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo"
          className="p-1.5 rounded transition hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ color: theme.ink }}
        >
          <RedoIcon />
        </button>
        <button
          onClick={handleClear}
          disabled={strokes.length === 0 && !inProgressStroke}
          title="Clear all"
          className="p-1.5 rounded transition hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ color: theme.ink }}
        >
          <ClearIcon />
        </button>
      </div>
    </div>
  );

  // ── Shared canvas + eraser cursor JSX (used by all three layout variants) ──
  const CanvasElement = (
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
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={commitInProgressStroke}
      onPointerLeave={handleCanvasPointerLeave}
    />
  );

  const EraserCursorPreview = currentTool === 'eraser' && eraserCursor ? (
    <div
      style={{
        position: 'absolute',
        left: eraserCursor[0] - ERASER_RADIUS[currentSize],
        top: eraserCursor[1] - ERASER_RADIUS[currentSize],
        width: ERASER_RADIUS[currentSize] * 2,
        height: ERASER_RADIUS[currentSize] * 2,
        pointerEvents: 'none',
        borderRadius: '50%',
        border: `1.5px dashed ${theme.ink}`,
        background: 'rgba(255, 255, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.ink,
      }}
    >
      <EraserIcon />
    </div>
  ) : null;

  // ── Bottom-sheet variant (mobile) ──
  // Canvas fills the wrapper. One floating button bottom-right opens a sheet
  // with all controls stacked. Trades extra taps for clean canvas surface and
  // thumb-friendly reach — standard mobile drawing-app pattern.
  if (toolbarPosition === 'bottom-sheet') {
    const ActiveToolIcon = TOOLS.find(t => t.id === currentTool)?.Icon ?? PencilIcon;
    return (
      <div className={`relative ${className}`} style={{ background: theme.canvasBg }}>
        <div className="absolute inset-0 overflow-hidden">
          {CanvasElement}
          {EraserCursorPreview}
        </div>

        {/* Floating sheet trigger — shows current tool icon as visual feedback */}
        <button
          onClick={() => setIsSheetOpen(true)}
          className="absolute bottom-4 right-4 z-30 rounded-full p-3 shadow-lg active:scale-95 transition"
          style={{ background: theme.panelBg, color: theme.ink, border: `1px solid ${theme.border}` }}
          aria-label="Open tools"
        >
          <ActiveToolIcon />
        </button>

        {/* Sheet + scrim */}
        {isSheetOpen && (
          <>
            <div
              onClick={() => setIsSheetOpen(false)}
              className="absolute inset-0 bg-black/40 z-30"
              aria-hidden="true"
            />
            <div
              className="absolute bottom-0 left-0 right-0 z-40 rounded-t-xl px-4 pt-3 pb-5 shadow-xl"
              style={{ background: theme.panelBg, borderTop: `1px solid ${theme.border}` }}
            >
              {/* Drag-handle affordance */}
              <div
                className="mx-auto mb-3 rounded-full"
                style={{ width: 40, height: 4, background: theme.border }}
              />

              {/* Tools row */}
              <div className="flex items-center justify-between gap-1 mb-3">
                {TOOLS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => switchTool(id)}
                    title={label}
                    className="p-2 rounded transition flex-1"
                    style={{
                      color: theme.ink,
                      background: currentTool === id ? theme.canvasBg : 'transparent',
                      border: currentTool === id ? `1px solid ${theme.ink}` : `1px solid ${theme.border}`,
                    }}
                  >
                    <div className="flex justify-center"><Icon /></div>
                  </button>
                ))}
              </div>

              {/* Colors row */}
              <div className="flex items-center justify-between gap-1 mb-3">
                {theme.inkPalette.map(c => (
                  <button
                    key={c}
                    onClick={() => setCurrentColor(c)}
                    title={c}
                    className="w-8 h-8 rounded transition"
                    style={{
                      background: c,
                      outline: currentColor === c ? `2px solid ${theme.ink}` : 'none',
                      outlineOffset: '1px',
                      border: `1px solid ${theme.border}`,
                    }}
                  />
                ))}
              </div>

              {/* Sizes + grid inputs (when grid tool active) */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  {(['sm', 'md', 'lg'] as Size[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setCurrentSize(s)}
                      className="px-3 py-1.5 text-xs font-bold rounded transition"
                      style={{
                        color: currentSize === s ? theme.canvasBg : theme.ink,
                        background: currentSize === s ? theme.ink : 'transparent',
                        border: `1px solid ${theme.border}`,
                        minWidth: '40px',
                      }}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>

                {currentTool === 'grid' && (
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={gridRows}
                      onChange={e => setGridRows(clampGridDim(Number(e.target.value)))}
                      title="Rows"
                      className="text-xs font-bold rounded text-center"
                      style={{
                        color: theme.ink,
                        background: theme.canvasBg,
                        border: `1px solid ${theme.border}`,
                        width: 44,
                        height: 32,
                      }}
                    />
                    <span className="text-xs font-bold" style={{ color: theme.ink }}>×</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={gridCols}
                      onChange={e => setGridCols(clampGridDim(Number(e.target.value)))}
                      title="Columns"
                      className="text-xs font-bold rounded text-center"
                      style={{
                        color: theme.ink,
                        background: theme.canvasBg,
                        border: `1px solid ${theme.border}`,
                        width: 44,
                        height: 32,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Actions row: undo / redo / clear / save */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="Undo"
                  className="p-2 rounded transition disabled:opacity-30"
                  style={{ color: theme.ink, border: `1px solid ${theme.border}` }}
                >
                  <UndoIcon />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="Redo"
                  className="p-2 rounded transition disabled:opacity-30"
                  style={{ color: theme.ink, border: `1px solid ${theme.border}` }}
                >
                  <RedoIcon />
                </button>
                <button
                  onClick={handleClear}
                  disabled={strokes.length === 0 && !inProgressStroke}
                  title="Clear all"
                  className="p-2 rounded transition disabled:opacity-30"
                  style={{ color: theme.ink, border: `1px solid ${theme.border}` }}
                >
                  <ClearIcon />
                </button>

                {onSave && (
                  <button
                    onClick={handleSave}
                    disabled={saveButtonDisabled}
                    title={effectiveSaveTitle}
                    className="ml-auto px-4 py-2 rounded transition flex items-center gap-2 disabled:opacity-30"
                    style={{ color: theme.ink, background: saveBg !== 'transparent' ? saveBg : theme.canvasBg, border: `1px solid ${theme.ink}` }}
                  >
                    <SaveIcon />
                    <span className="text-xs font-bold">Save</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex ${isLandscape ? 'flex-col' : 'flex-row'} ${className}`}>
      {Toolbar}
      <div
        className="flex-1 overflow-hidden relative"
        style={{ background: theme.canvasBg, minHeight: 0, minWidth: 0 }}
      >
        {CanvasElement}
        {EraserCursorPreview}
      </div>
    </div>
  );
}

// ─── Tool icons ───

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
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="13" height="13" strokeDasharray="2.5 2" />
      <path d="M13 13 L21 13 L17.5 16.5 L20 20.5 L17.5 22 L15 18 L13 21 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GridIcon() {
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
