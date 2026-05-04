// ── WhiteBoardPage ──
// Standalone /whiteboard route. Full-page layout with the dark CRT-terminal
// chrome (matches the rest of the app) wrapping a glossy whiteboard-themed
// <DrawingCanvas> in the center. Left side reserves space for a future Blind 75
// reference panel (Step 7); right side reserves space for a future collaboration
// panel.
//
// Visual metaphor: a bright whiteboard mounted on a dark wall. The page chrome
// is dark; the canvas inside is light.

import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DrawingCanvas, type SaveData } from '../components/shared/DrawingCanvas';
import { whiteboards as whiteboardsApi } from '../services/api';
import type { Stroke } from '../components/shared/drawingEngine';

function WhiteBoardPage() {
  const { user, isLoading: authLoading } = useAuth();
  // Reference panel is closed by default. Step 7 will wire the open-state
  // content (problem picker + description). For Step 5 we just reserve the
  // layout space — the toggle button works visually but doesn't reveal content.
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  // ── Hydration state ──
  // We gate the <DrawingCanvas> render on `loaded` because DrawingCanvas reads
  // initialStrokes once at mount via useState's lazy initializer. If we mount
  // it before hydration completes, the loaded data arrives too late and the
  // canvas stays blank. Brief blank window during the network call is the
  // tradeoff — same pattern as SketchZone.
  const [loaded, setLoaded] = useState(false);
  const [initialStrokes, setInitialStrokes] = useState<Stroke[]>([]);

  // Hydrate from server on mount. Critically, we wait for auth to RESOLVE
  // (authLoading === false) before deciding what to do — otherwise on page
  // refresh we'd see user=null first (silent refresh still in flight),
  // immediately mount DrawingCanvas with empty strokes, then have the loaded
  // data arrive too late to seed the canvas (initialStrokes is read once at
  // mount via lazy useState). The authLoading dep ensures we mount the canvas
  // exactly once, after auth state is settled.
  useEffect(() => {
    if (authLoading) return; // wait for silent-refresh-on-mount to settle

    if (!user) {
      setLoaded(true); // unauth'd: skip the fetch, canvas mounts blank
      return;
    }

    let cancelled = false;
    whiteboardsApi.get()
      .then(record => {
        if (cancelled) return;
        const data = record.strokeData;
        if (data.strokes && data.strokes.length > 0) {
          setInitialStrokes(data.strokes as Stroke[]);
        }
        setLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load whiteboard:', err);
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // Save handler — DrawingCanvas calls this with current strokes/dimensions
  // when the user clicks Save in the toolbar. DrawingCanvas tracks its own
  // save state machine (idle/saving/saved/error) based on this promise's
  // resolution. We don't pass a name because the whiteboard is 1-of-1 per
  // user and naming would be redundant.
  const handleSave = useCallback(async (data: SaveData) => {
    await whiteboardsApi.save({
      strokes: data.strokes,
      canvasWidth: data.canvasWidth,
      canvasHeight: data.canvasHeight,
    });
  }, []);

  return (
    <div className="h-screen bg-[#0d1117] font-mono text-[var(--accent)] flex flex-col">
      {/* Title bar — terminal-style, matches other pages. Username shows when
          authenticated, otherwise falls back to 'terminal'. */}
      <div className="bg-[#161b22] px-6 py-3 border-b border-[#30363d] flex items-center justify-between flex-shrink-0">
        <span className="text-gray-500 text-xs">
          {user?.displayName ?? 'terminal'}@algorithmviz/whiteboard
        </span>
        <Link
          to="/"
          className="text-gray-500 hover:text-[var(--accent)] text-xs transition"
        >
          ← Back
        </Link>
      </div>

      {/* Body — three columns: reference panel | canvas | chat panel.
          overflow-hidden so DrawingCanvas's ResizeObserver doesn't see
          scrollbars cycling. */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left: reference panel (Step 7 fills the open-state content). When
            closed it's a thin sidebar showing just the toggle button — a hint
            to the user that there's something there to expand. */}
        <div
          className={`bg-[#161b22] border-r border-[#30363d] transition-all duration-200 flex flex-col flex-shrink-0 ${
            isReferenceOpen ? 'w-[360px]' : 'w-[40px]'
          }`}
        >
          <button
            onClick={() => setIsReferenceOpen(prev => !prev)}
            className="w-full px-2 py-3 text-gray-500 hover:text-[var(--accent)] transition text-left text-sm flex-shrink-0"
            title={isReferenceOpen ? 'Collapse reference panel' : 'Open reference panel'}
          >
            {isReferenceOpen ? '◀' : '▶'}
          </button>
          {isReferenceOpen && (
            <div className="flex-1 px-3 pb-3 text-xs text-gray-500 overflow-auto">
              <p className="opacity-50 mt-2">Blind 75 reference — coming soon</p>
            </div>
          )}
        </div>

        {/* Center: drawing canvas. Gated on `loaded` so DrawingCanvas mounts
            with seeded strokes (it reads initialStrokes once at mount). The
            outer wrapper keeps its dimensions regardless of `loaded`, so the
            layout doesn't shift when the canvas pops in. */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loaded && (
            <DrawingCanvas
              initialStrokes={initialStrokes}
              theme="whiteboard"
              toolbarPosition="top"
              onSave={handleSave}
              saveDisabled={!user}
              saveTitle={user ? 'Save' : 'Sign in to save'}
              className="flex-1"
            />
          )}
        </div>

        {/* Right: chat / collab placeholder. Fixed width. Step 5 just shows
            "coming soon" — future work will wire WebRTC + Socket.io for
            2-person whiteboard sessions. */}
        <div className="w-[280px] bg-[#161b22] border-l border-[#30363d] flex items-center justify-center p-4 flex-shrink-0">
          <p className="text-gray-500 text-xs text-center opacity-60">
            Collaboration
            <br />
            <span className="opacity-50">coming soon</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default WhiteBoardPage;
