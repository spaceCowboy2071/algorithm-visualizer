// ── WhiteBoardPage ──
// Standalone /whiteboard route. Full-page layout with the dark CRT-terminal
// chrome (matches the rest of the app) wrapping a glossy whiteboard-themed
// <DrawingCanvas> in the center. Left side has a collapsible Blind 75
// reference panel (problem picker + description); right side reserves space
// for a future collaboration panel.
//
// Visual metaphor: a bright whiteboard mounted on a dark wall. The page chrome
// is dark; the canvas inside is light.

import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DrawingCanvas, type SaveData } from '../components/shared/DrawingCanvas';
import { whiteboards as whiteboardsApi } from '../services/api';
import type { Stroke } from '../components/shared/drawingEngine';
import { PROBLEMS, type Blind75Problem } from '../data/blind75Problems';
import { getProblemById } from '../data/problemsData';
import ProblemDescription from '../components/blind75/ProblemDescription';

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy': return 'text-green-500';
    case 'Medium': return 'text-yellow-500';
    case 'Hard': return 'text-red-500';
    default: return 'text-gray-500';
  }
}

function WhiteBoardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  // Reference panel state
  // selectedProblemId === null  → picker mode (search + list)
  // selectedProblemId !== null  → view mode (description for that problem)
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Hydration state (Step 6) ──
  const [loaded, setLoaded] = useState(false);
  const [initialStrokes, setInitialStrokes] = useState<Stroke[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoaded(true);
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

  const handleSave = useCallback(async (data: SaveData) => {
    await whiteboardsApi.save({
      strokes: data.strokes,
      canvasWidth: data.canvasWidth,
      canvasHeight: data.canvasHeight,
    });
  }, []);

  // ── Filtered problems for the picker ──
  const filteredProblems = PROBLEMS.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // ── Selected problem lookup ──
  const selectedBlind75 = selectedProblemId !== null
    ? PROBLEMS.find(p => p.id === selectedProblemId) ?? null
    : null;
  const selectedFullData = selectedProblemId !== null
    ? getProblemById(selectedProblemId)
    : null;

  return (
    <div className="h-screen bg-[#0d1117] font-mono text-[var(--accent)] flex flex-col">
      {/* Title bar */}
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

      {/* Body — three columns: reference panel | canvas | chat panel */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left: reference panel (Blind 75 picker + description) */}
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

          {isReferenceOpen && selectedProblemId === null && (
            // ── Picker mode: search + flat list of all 75 ──
            <div className="flex-1 flex flex-col overflow-hidden px-3 pb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search problems..."
                className="w-full px-2 py-1.5 mb-2 bg-[#0d1117] border border-[#30363d] rounded text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] transition flex-shrink-0"
              />
              <div className="flex-1 overflow-auto">
                {filteredProblems.length === 0 ? (
                  <p className="text-gray-600 text-xs italic mt-4">No matches</p>
                ) : (
                  <ul className="space-y-0.5">
                    {filteredProblems.map(p => (
                      <li key={p.id}>
                        <button
                          onClick={() => setSelectedProblemId(p.id)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-[#0d1117] transition group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-300 text-xs group-hover:text-[var(--accent)] truncate">
                              {p.title}
                            </span>
                            <span className={`text-[10px] flex-shrink-0 ${getDifficultyColor(p.difficulty)}`}>
                              {p.difficulty}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-600 truncate">
                            {p.category} · {p.pattern}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {isReferenceOpen && selectedProblemId !== null && selectedBlind75 && (
            // ── View mode: description for the selected problem ──
            <div className="flex-1 flex flex-col overflow-hidden px-3 pb-3">
              <button
                onClick={() => setSelectedProblemId(null)}
                className="text-left text-gray-500 hover:text-[var(--accent)] text-xs mb-3 flex-shrink-0 transition"
              >
                ← Back to list
              </button>
              <div className="mb-3 flex-shrink-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-[var(--accent)] text-sm font-bold">{selectedBlind75.title}</h3>
                  <span className={`text-xs ${getDifficultyColor(selectedBlind75.difficulty)}`}>
                    {selectedBlind75.difficulty}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600">
                  {selectedBlind75.category} · {selectedBlind75.pattern}
                </p>
              </div>
              <div className="flex-1 overflow-auto pr-1">
                {selectedFullData && <ProblemDescription problem={selectedFullData} />}
              </div>
            </div>
          )}
        </div>

        {/* Center: drawing canvas */}
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

        {/* Right: chat / collab placeholder */}
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
