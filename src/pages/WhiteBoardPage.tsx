// ── WhiteBoardPage ──
// Standalone /whiteboard route. Full-page layout with the dark CRT-terminal
// chrome (matches the rest of the app) wrapping a glossy whiteboard-themed
// <DrawingCanvas> in the center. Left side reserves space for a future Blind 75
// reference panel (Step 7); right side reserves space for a future collaboration
// panel.
//
// Visual metaphor: a bright whiteboard mounted on a dark wall. The page chrome
// is dark; the canvas inside is light.
//
// Step 5 ships the layout shell. Step 6 will add save/load wiring — for now,
// no `onSave` prop is passed to <DrawingCanvas>, so the Save button doesn't
// render at all (DrawingCanvas conditionally renders it only when onSave is
// provided).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DrawingCanvas } from '../components/shared/DrawingCanvas';

function WhiteBoardPage() {
  const { user } = useAuth();
  // Reference panel is closed by default. Step 7 will wire the open-state
  // content (problem picker + description). For Step 5 we just reserve the
  // layout space — the toggle button works visually but doesn't reveal content.
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

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

        {/* Center: drawing canvas. flex-col wrapper because DrawingCanvas's
            root is itself a flex container that lays out toolbar + canvas
            internally. */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DrawingCanvas
            theme="whiteboard"
            toolbarPosition="top"
            className="flex-1"
          />
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
