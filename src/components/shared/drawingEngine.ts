import { getStroke } from 'perfect-freehand';

// ─── Type definitions ───
// StrokeTool = tools that produce a drawn stroke on the canvas.
// Tool = everything the toolbar can select, including non-stroke-producing tools
// like the eraser. Keeping these separate means drawStroke's switch stays
// exhaustive and we can't accidentally create a Stroke with tool: 'eraser'.
export type StrokeTool = 'pencil' | 'brush' | 'rect' | 'circle' | 'line' | 'grid';
export type Tool = StrokeTool | 'eraser' | 'selector';

export interface Rect { x1: number; y1: number; x2: number; y2: number }
export type Size = 'sm' | 'md' | 'lg';

export interface Stroke {
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

export interface History {
  snapshots: Stroke[][];
  index: number;
}

// ─── Constants (theme-independent) ───
// Stroke widths in pixels per size tier.
export const SIZE_PX: Record<Size, number> = { sm: 2, md: 4, lg: 8 };

// Eraser hit-test radius per size tier — larger than stroke width so the
// eraser feels forgiving (you don't need pixel-perfect aim).
export const ERASER_RADIUS: Record<Size, number> = { sm: 12, md: 20, lg: 32 };

// Cap on undo depth. 100 is generous for a whiteboard scratchpad; beyond this
// the oldest snapshot is dropped so memory stays bounded.
export const MAX_HISTORY = 100;

// ─── Drawing primitives ───
// Each tool gets its own rendering path. Pencil/brush use the freehand `points`
// array; rect/circle/line use the start/end coordinate fields.
export function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
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
// Used by the eraser (and the selector tool) to decide whether a cursor
// position "touches" a given stroke. All tests treat strokes as outlines
// (consistent with how drawStroke renders them — no filled shapes).

// Shortest distance from point p to the segment a→b. Internal helper —
// not exported because it's an implementation detail of isStrokeHit.
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

// ─── Erase / select / move helpers ───

// Apply one eraser event (point + radius) to an array of strokes.
// - Freehand (pencil/brush): walks the point array, splits the stroke wherever
//   points fall inside the eraser circle. One stroke becomes 0, 1, or many
//   sub-strokes. Sub-strokes shorter than 2 points are dropped (no visible line).
// - Shapes (rect/circle/line/grid): atomic units. Dropped entirely if the eraser
//   touches their outline; otherwise untouched.
// Returns `changed: false` if nothing was affected, so callers can skip
// triggering re-renders / history updates.
export function eraseFromStrokes(
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

// Mirror of eraseFromStrokes, but instead of dropping points inside the eraser
// circle, this KEEPS points inside the selection rectangle and splits whenever
// the stroke exits. Returns both halves so the caller can use one for move
// (selected = follows cursor, remaining = stays put) or both for duplicate
// (originals stay, selected gets cloned + translated).
//
// Shapes (rect/circle/line/grid) are routed atomically: included whole if the
// bbox intersects the selection, excluded entirely otherwise. Same Option-2
// hybrid rule as the eraser.
export function splitStrokesByRect(
  strokes: Stroke[],
  rect: Rect,
): { selected: Stroke[]; remaining: Stroke[] } {
  const selected: Stroke[] = [];
  const remaining: Stroke[] = [];
  for (const s of strokes) {
    if (s.tool === 'pencil' || s.tool === 'brush') {
      let inBuf: [number, number][] = [];
      let outBuf: [number, number][] = [];
      for (const [px, py] of s.points) {
        const isIn = px >= rect.x1 && px <= rect.x2 && py >= rect.y1 && py <= rect.y2;
        if (isIn) {
          if (outBuf.length >= 2) remaining.push({ ...s, points: outBuf });
          outBuf = [];
          inBuf.push([px, py]);
        } else {
          if (inBuf.length >= 2) selected.push({ ...s, points: inBuf });
          inBuf = [];
          outBuf.push([px, py]);
        }
      }
      if (inBuf.length >= 2) selected.push({ ...s, points: inBuf });
      if (outBuf.length >= 2) remaining.push({ ...s, points: outBuf });
    } else {
      // Shape: bbox intersection. rows/cols ride along untouched.
      const sx1 = Math.min(s.startX!, s.endX!);
      const sy1 = Math.min(s.startY!, s.endY!);
      const sx2 = Math.max(s.startX!, s.endX!);
      const sy2 = Math.max(s.startY!, s.endY!);
      const intersects = !(sx2 < rect.x1 || sx1 > rect.x2 || sy2 < rect.y1 || sy1 > rect.y2);
      if (intersects) selected.push(s);
      else remaining.push(s);
    }
  }
  return { selected, remaining };
}

// Shift a stroke by (dx, dy). Freehand: shift every point. Shapes: shift the
// start/end coords. Grid's rows/cols don't need touching — they're counts, not
// coordinates.
export function translateStroke(s: Stroke, dx: number, dy: number): Stroke {
  if (s.tool === 'pencil' || s.tool === 'brush') {
    return { ...s, points: s.points.map(([x, y]) => [x + dx, y + dy] as [number, number]) };
  }
  return {
    ...s,
    startX: (s.startX ?? 0) + dx,
    startY: (s.startY ?? 0) + dy,
    endX: (s.endX ?? 0) + dx,
    endY: (s.endY ?? 0) + dy,
  };
}

// Bounding box of any stroke — used to translate the selection rect along with
// content during move and after paste.
export function strokeBbox(s: Stroke): Rect {
  if (s.tool === 'pencil' || s.tool === 'brush') {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const [px, py] of s.points) {
      if (px < x1) x1 = px;
      if (py < y1) y1 = py;
      if (px > x2) x2 = px;
      if (py > y2) y2 = py;
    }
    return { x1, y1, x2, y2 };
  }
  return {
    x1: Math.min(s.startX!, s.endX!),
    y1: Math.min(s.startY!, s.endY!),
    x2: Math.max(s.startX!, s.endX!),
    y2: Math.max(s.startY!, s.endY!),
  };
}
