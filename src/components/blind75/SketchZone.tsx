import { useState, useRef, useCallback, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';

interface SketchZoneProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: number;
}

type Tool = 'pencil' | 'brush' | 'rect' | 'circle' | 'line';
type Size = 'sm' | 'md' | 'lg';

interface Stroke {
  tool: Tool;
  color: string;
  size: Size;
  points: [number, number][];     // freehand (pencil/brush)
  startX?: number;                // shapes (rect/circle/line)
  startY?: number;
  endX?: number;
  endY?: number;
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
  }
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
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [inProgressStroke, setInProgressStroke] = useState<Stroke | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

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
      for (const s of strokes) drawStroke(ctx, s);
      if (inProgressStroke) drawStroke(ctx, inProgressStroke);
    };

    syncAndDraw();
    const observer = new ResizeObserver(syncAndDraw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [strokes, inProgressStroke]);

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
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const [x, y] = getCanvasCoords(e);
    setInProgressStroke(prev => {
      if (!prev) return null;
      if (prev.tool === 'pencil' || prev.tool === 'brush') {
        return { ...prev, points: [...prev.points, [x, y]] };
      }
      return { ...prev, endX: x, endY: y };
    });
  };

  const commitInProgressStroke = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (inProgressStroke) {
      setStrokes(prev => [...prev, inProgressStroke]);
      setRedoStack([]);
    }
    setInProgressStroke(null);
  };

  // ─── Toolbar action handlers ───
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, last]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setStrokes(prev => [...prev, last]);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
    setRedoStack([]);
    setInProgressStroke(null);
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
  ];

  const dividerClass = isLandscape ? 'w-px h-6' : 'h-px w-6';
  const groupDirection = isLandscape ? 'flex-row' : 'flex-col';

  const Toolbar = (
    <div
      className={`flex gap-2 items-center ${
        isLandscape ? 'flex-row px-3 py-2 border-b' : 'flex-col py-3 px-2 border-r'
      }`}
      style={{ background: PAPER_BG_DARKER, borderColor: PAPER_BORDER }}
    >
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

      <div style={{ background: PAPER_BORDER }} className={dividerClass} />

      {/* Actions */}
      <div className={`flex gap-1 ${groupDirection}`}>
        <button
          onClick={handleUndo}
          disabled={strokes.length === 0}
          title="Undo"
          className="p-1.5 rounded transition hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
          style={{ color: INK }}
        >
          <UndoIcon />
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
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
        <button
          disabled
          title="Save (coming in Step 6)"
          className="p-1.5 rounded transition opacity-30 cursor-not-allowed"
          style={{ color: INK }}
        >
          <SaveIcon />
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={INK} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: INK }}>
              Sketch Zone — Problem {problemId}
            </span>
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
            className="flex-1 overflow-hidden"
            style={{ background: PAPER_BG, minHeight: 0, minWidth: 0 }}
          >
            <canvas
              ref={canvasRef}
              className="cursor-crosshair touch-none"
              style={{ display: 'block', width: '100%', height: '100%' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={commitInProgressStroke}
              onMouseLeave={commitInProgressStroke}
            />
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
