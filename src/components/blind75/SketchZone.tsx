// ── SketchZone ──
// Floating window wrapper that hosts <DrawingCanvas> on Blind 75 problem pages.
// Owns the window chrome (drag, resize, 8 handles, header with rename + close)
// and the save/load wiring (sketchesApi.get on mount, sketchesApi.save via the
// Save button in DrawingCanvas's toolbar). Drawing state, toolbar, and canvas
// rendering all live inside <DrawingCanvas> — see src/components/shared/.

import { useState, useRef, useCallback, useEffect } from 'react';
import { sketches as sketchesApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Stroke } from '../shared/drawingEngine';
import { DrawingCanvas, type SaveData } from '../shared/DrawingCanvas';

interface SketchZoneProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: number;
}

// Floating-window theme — paper aesthetic for the chrome (header, borders,
// resize handles). The drawing surface inside has its own theme system; we
// pass `theme="paper"` to <DrawingCanvas> so the two stay visually unified.
const PAPER_BG = '#EBDFCE';
const PAPER_BG_DARKER = '#d4c5b0';
const PAPER_BORDER = '#a89478';
const INK = '#3a2e1f';

const INITIAL_VIEWPORT_FRACTION = 0.6;
const MIN_VIEWPORT_FRACTION = 0.25;

function SketchZone({ isOpen, onClose, problemId }: SketchZoneProps) {
  // Outer gate: when closed, return null. Inner component remounts fresh on
  // each open — fresh window position, fresh hydration, fresh drawing state.
  if (!isOpen) return null;
  return <SketchZoneInner onClose={onClose} problemId={problemId} />;
}

function SketchZoneInner({ onClose, problemId }: Omit<SketchZoneProps, 'isOpen'>) {
  // Lazy-init from viewport at mount time. Sidesteps React 19's
  // setState-in-effect lint rule.
  const initialSize = () => ({
    width: window.innerWidth * INITIAL_VIEWPORT_FRACTION,
    height: window.innerHeight * INITIAL_VIEWPORT_FRACTION,
  });
  const initialPosition = () => {
    const w = window.innerWidth * INITIAL_VIEWPORT_FRACTION;
    const h = window.innerHeight * INITIAL_VIEWPORT_FRACTION;
    return { x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2 };
  };

  // ── Window state ──
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0,
  });
  const windowRef = useRef<HTMLDivElement>(null);

  // ── Sketch metadata + hydration ──
  const { user } = useAuth();
  const defaultName = `Sketch Zone — Problem ${problemId}`;
  const [sketchName, setSketchName] = useState<string>(defaultName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [initialStrokes, setInitialStrokes] = useState<Stroke[]>([]);

  // Hydrate from server on mount (auth'd users only). We gate the
  // <DrawingCanvas> render on `loaded` so it mounts ONCE with the seeded
  // strokes — DrawingCanvas reads initialStrokes only at mount time. Brief
  // blank window during the network call is acceptable; it matches the
  // original's "empty canvas" period in spirit.
  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    sketchesApi.get(problemId)
      .then(record => {
        if (cancelled) return;
        const data = record.strokeData;
        if (data.strokes && data.strokes.length > 0) {
          setInitialStrokes(data.strokes as Stroke[]);
        }
        if (data.name) {
          setSketchName(data.name);
        }
        setLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load sketch:', err);
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [problemId, user]);

  // Save handler — DrawingCanvas calls this with current strokes/dimensions
  // when the user clicks Save in the toolbar. We inject the name (which lives
  // here, in the rename UI) and call the API. DrawingCanvas tracks its own
  // save state machine based on the resolution of this promise.
  const handleSave = useCallback(async (data: SaveData) => {
    await sketchesApi.save(problemId, {
      name: sketchName,
      ...data,
    });
  }, [problemId, sketchName]);

  // ── Drag/resize handlers ──
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

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX, y: e.clientY,
      width: size.width, height: size.height,
      posX: position.x, posY: position.y,
    });
  };

  const commitNameEdit = (newName: string) => {
    const trimmed = newName.trim();
    setSketchName(trimmed.length > 0 ? trimmed : defaultName);
    setIsEditingName(false);
  };

  const isLandscape = size.width >= size.height;

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
        {/* Header — drag handle + rename + close */}
        <div
          className="sketch-header flex items-center justify-between px-4 py-2 cursor-grab select-none"
          style={{ background: PAPER_BG_DARKER, borderBottom: `1px solid ${PAPER_BORDER}` }}
        >
          <div className="flex items-center gap-2">
            {/* Pencil icon — toggles rename mode */}
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

        {/* Body — DrawingCanvas takes over after hydration completes. The
            adaptive toolbar position is derived from window dimensions: top
            when wider than tall (landscape), side otherwise. */}
        {loaded && (
          <DrawingCanvas
            initialStrokes={initialStrokes}
            theme="paper"
            toolbarPosition={isLandscape ? 'top' : 'side'}
            onSave={handleSave}
            saveDisabled={!user}
            saveTitle={user ? 'Save' : 'Sign in to save'}
            className="flex-1 overflow-hidden"
          />
        )}

        {/* Resize handles — 4 corners + 4 edges */}
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

export default SketchZone;
