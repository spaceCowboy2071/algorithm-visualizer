import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getProblemById, type Problem } from '../data/problemsData';
import { getVisualizerPath } from '../data/problemVisualizers';
import { PROBLEMS } from '../data/blind75Problems';
import { useTrackerStore } from '../hooks/useTrackerStore';
import StatusEditDropdown from '../components/blind75/StatusEditDropdown';
import { executeCode, setPyodideStatusCallback } from '../services/codeRunner';
import { validateComplexity } from '../utils/complexityValidator';
import TestResults from '../components/shared/TestResults';
import SubmitResultModal from '../components/shared/SubmitResultModal';
import type { TestRunResult } from '../types/visualization';

function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const problemId = id || '10';

  // Timer state (20 minutes = 1200 seconds)
  const [timeRemaining, setTimeRemaining] = useState(1200);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  // Code editor state
  const [language, setLanguage] = useState<'javascript' | 'python'>('python');
  const [code, setCode] = useState('');

  // Tracker store
  const { getProgress, updateProgress } = useTrackerStore();
  const blind75Problem = PROBLEMS.find(p => p.id === Number(problemId));
  const progress = getProgress(Number(problemId));

  // Notes state (local for textarea, synced to store)
  const [notes, setNotes] = useState(progress.notes);

  // Notes modal state
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isNotesFullscreen, setIsNotesFullscreen] = useState(false);
  const [notesPosition, setNotesPosition] = useState({ x: 0, y: 0 });
  const [notesSize, setNotesSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
  const notesModalRef = useRef<HTMLDivElement>(null);

  // Progress panel state
  const [isProgressOpen, setIsProgressOpen] = useState(false);

  // Tab state for left panel
  const [activeTab, setActiveTab] = useState<'description' | 'visualizer'>('description');

  // Test execution state
  const [testResult, setTestResult] = useState<TestRunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<TestRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState<'run' | 'submit' | null>(null);
  const [pyodideStatus, setPyodideStatus] = useState<string | null>(null);

  // Subscribe to Pyodide loading updates from the Web Worker
  useEffect(() => {
    setPyodideStatusCallback((status) => setPyodideStatus(status));
    return () => setPyodideStatusCallback(null);
  }, []);

  const timerIntervalRef = useRef<number | null>(null);
  
  // Load problem data
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load problem on mount
  const loadedProblem = getProblemById(Number(problemId));
  if (loadedProblem && loadedProblem !== problem) {
    setProblem(loadedProblem);
    setIsLoading(false);
  } else if (!loadedProblem && !problem) {
    navigate('/blind75');
  }

  // Sync localStorage to state when problem or language changes
  // Uses the "store previous rendering info in state" pattern supported by React
  const [prevSyncKey, setPrevSyncKey] = useState('');
  const visualizerPath = getVisualizerPath(Number(problemId));

  const syncKey = `${problemId}_${language}`;
  if (problem && syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);

    setCode(problem.starterCode[language]);
    setNotes(getProgress(Number(problemId)).notes);
    setActiveTab('description');
  }

  // Save notes to tracker store whenever they change
  useEffect(() => {
    if (notes !== progress.notes) {
      updateProgress(Number(problemId), { notes });
    }
  }, [notes, problemId, progress.notes, updateProgress]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timeRemaining]);

  // Notes modal mouse handlers (must be before early return)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !isNotesFullscreen) {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - notesSize.width));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - notesSize.height));
      setNotesPosition({ x: newX, y: newY });
    }
    if (resizeDirection && !isNotesFullscreen) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const minWidth = 300;
      const minHeight = 200;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.posX;
      let newY = resizeStart.posY;

      // Handle horizontal resizing
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

      // Handle vertical resizing
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

      setNotesSize({ width: newWidth, height: newHeight });
      setNotesPosition({ x: newX, y: newY });
    }
  }, [isDragging, resizeDirection, dragOffset, notesSize, isNotesFullscreen, resizeStart]);

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

  // If problem is still loading, show loading state
  if (isLoading || !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-[var(--accent)] font-mono">
        <div>Loading problem...</div>
      </div>
    );
  }

  const startTimer = () => {
    if (!timerStarted) {
      // First start — increment attempt count
      updateProgress(Number(problemId), { attemptCount: progress.attemptCount + 1 });
    }
    setIsTimerRunning(true);
    setTimerStarted(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeRemaining(1200);
    setTimerStarted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining > 300) return 'text-[var(--accent)]'; // > 5 min: green
    if (timeRemaining > 60) return 'text-yellow-500'; // > 1 min: yellow
    return 'text-red-500'; // < 1 min: red
  };

  const handleLanguageChange = (newLang: 'javascript' | 'python') => {
    setLanguage(newLang);
    setCode(problem.starterCode[newLang]);
  };

  const runTests = async () => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setRunningAction('run');
    setTestResult(null);
    const result = await executeCode(code, language, problem);
    setTestResult(result);
    setIsRunning(false);
    setRunningAction(null);
  };

  const submitCode = async () => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setRunningAction('submit');
    setSubmitResult(null);
    const result = await executeCode(code, language, problem);
    setSubmitResult(result);
    setIsRunning(false);
    setRunningAction(null);
    // Auto-update tracker on all-pass
    if (result.allPassed) {
      updateProgress(Number(problemId), { status: 'solved' });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'Hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Notes modal functions
  const openNotesModal = () => {
    const width = window.innerWidth * 0.6;
    const height = window.innerHeight * 0.6;
    setNotesSize({ width, height });
    setNotesPosition({
      x: (window.innerWidth - width) / 2,
      y: (window.innerHeight - height) / 2
    });
    setIsNotesOpen(true);
    setIsNotesFullscreen(false);
  };

  const closeNotesModal = () => {
    setIsNotesOpen(false);
  };

  const toggleNotesFullscreen = () => {
    setIsNotesFullscreen(!isNotesFullscreen);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.notes-header')) {
      setIsDragging(true);
      const rect = notesModalRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: notesSize.width,
      height: notesSize.height,
      posX: notesPosition.x,
      posY: notesPosition.y
    });
  };

  return (
    <div className="h-screen bg-[#0d1117] text-white font-mono flex flex-col overflow-hidden">
      {/* Terminal Window */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Terminal Title Bar */}
              <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
                <span className="text-gray-500 text-xs font-mono">
                  terminal@algorithmviz/blind75/{problem.title.toLowerCase().replace(/\s+/g, '-')}
                </span>
                <button
                  onClick={() => setIsProgressOpen(!isProgressOpen)}
                  className={`px-3 py-1 border rounded text-xs font-semibold font-mono transition ${
                    isProgressOpen
                      ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-[#30363d] text-gray-400 hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  }`}
                >
                  Progress
                </button>
                <Link
                  to="/blind75"
                  className="text-gray-500 hover:text-[var(--accent)] text-xs transition"
                >
                  ← Back to Problems
                </Link>
              </div>

              {/* Progress Overlay */}
              {isProgressOpen && (
                <div
                  className="absolute inset-0 z-40 flex items-center justify-center"
                  style={{ background: 'rgba(13, 17, 23, 0.85)', backdropFilter: 'blur(4px)' }}
                  onClick={(e) => { if (e.target === e.currentTarget) setIsProgressOpen(false); }}
                >
                  <div className="w-full max-w-md mx-4 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl font-mono overflow-hidden">
                    {/* Overlay Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-[#30363d]">
                      <h2 className="text-sm font-bold text-[var(--accent)]">Progress</h2>
                      <button
                        onClick={() => setIsProgressOpen(false)}
                        className="p-1 text-gray-400 hover:text-red-500 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Overlay Body — structured grid */}
                    <div className="p-5 space-y-4">
                      {/* Row 1: Status */}
                      <div className="grid grid-cols-[100px_1fr] items-center">
                        <span className="text-xs text-gray-500">Status</span>
                        <div>
                          <StatusEditDropdown
                            currentStatus={progress.status}
                            onStatusChange={(status) => updateProgress(Number(problemId), { status })}
                          />
                        </div>
                      </div>

                      <div className="border-t border-[#30363d]" />

                      {/* Row 2: Confidence */}
                      <div className="grid grid-cols-[100px_1fr] items-center">
                        <span className="text-xs text-gray-500">Confidence</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              onClick={() => updateProgress(Number(problemId), { confidence: n })}
                              className={`w-7 h-7 rounded text-xs font-bold transition ${
                                progress.confidence >= n
                                  ? 'bg-[var(--accent)] text-black'
                                  : 'bg-[#21262d] text-gray-500 hover:text-[var(--accent)]'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[#30363d]" />

                      {/* Row 3 & 4: Checkboxes */}
                      <div className="grid grid-cols-[100px_1fr] items-center">
                        <span className="text-xs text-gray-500">Independent</span>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={progress.solvedIndependently}
                            onChange={(e) => updateProgress(Number(problemId), { solvedIndependently: e.target.checked })}
                            className="w-4 h-4 accent-[var(--accent)]"
                          />
                          <span className="ml-2 text-xs text-gray-400">Solved without help</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-[100px_1fr] items-center">
                        <span className="text-xs text-gray-500">Under 20 min</span>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={progress.solvedIn20Min}
                            onChange={(e) => updateProgress(Number(problemId), { solvedIn20Min: e.target.checked })}
                            className="w-4 h-4 accent-[var(--accent)]"
                          />
                          <span className="ml-2 text-xs text-gray-400">Solved within time</span>
                        </label>
                      </div>

                      <div className="border-t border-[#30363d]" />

                      {/* Row 5: Attempts */}
                      <div className="grid grid-cols-[100px_1fr] items-center">
                        <span className="text-xs text-gray-500">Attempts</span>
                        <span className="text-xs text-gray-300">{progress.attemptCount}</span>
                      </div>

                      {/* Row 6: Last Attempted */}
                      <div className="grid grid-cols-[100px_1fr] items-center">
                        <span className="text-xs text-gray-500">Last Attempt</span>
                        <span className="text-xs text-gray-300">{progress.lastAttempted || '—'}</span>
                      </div>

                      {/* Row 7: Pattern */}
                      {blind75Problem && (
                        <div className="grid grid-cols-[100px_1fr] items-center">
                          <span className="text-xs text-gray-500">Pattern</span>
                          <span className="text-xs text-gray-300">{blind75Problem.pattern}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Problem Description / Visualizer */}
                <div className="w-1/2 border-r border-[#30363d] flex flex-col overflow-hidden">
                  {/* Tab Bar - only shown when a visualizer exists */}
                  {visualizerPath && (
                    <div className="flex border-b border-[#30363d] bg-[#161b22] shrink-0">
                      <button
                        onClick={() => setActiveTab('description')}
                        className={`px-4 py-2 text-xs font-semibold font-mono transition ${
                          activeTab === 'description'
                            ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[#0d1117]'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Description
                      </button>
                      <button
                        onClick={() => setActiveTab('visualizer')}
                        className={`px-4 py-2 text-xs font-semibold font-mono transition ${
                          activeTab === 'visualizer'
                            ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[#0d1117]'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Visualizer
                      </button>
                    </div>
                  )}

                  {/* Tab Content */}
                  {activeTab === 'visualizer' && visualizerPath ? (
                    <iframe
                      src={visualizerPath}
                      title={`${problem.title} Visualizer`}
                      className="flex-1 w-full border-0"
                    />
                  ) : (
                  <div className="flex-1 overflow-auto">
                  <div className="p-6 font-mono text-sm">
                    {/* Problem Header with Timer */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        {/* Left side: Title + Difficulty */}
                        <div className="flex items-center gap-3">
                          <h1 className="text-2xl font-bold text-[var(--accent)]">
                            {problem.title}
                          </h1>
                          <span className={`text-sm ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </div>

                        {/* Right side: Timer + Notes Icon */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-3 px-3 py-2 bg-[#161b22] border border-[#30363d] rounded">
                            <span className={`text-xl font-bold font-mono ${getTimerColor()}`}>
                              {formatTime(timeRemaining)}
                            </span>
                            <div className="flex gap-1">
                              {!timerStarted ? (
                                <button
                                  onClick={startTimer}
                                  className="px-2 py-1 bg-[var(--accent)] text-black rounded hover:bg-[var(--accent-hover)] transition text-xs font-semibold"
                                >
                                  Start
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={isTimerRunning ? pauseTimer : startTimer}
                                    className="px-2 py-1 border border-[var(--accent)] text-[var(--accent)] rounded hover:bg-[var(--accent)]/10 transition text-xs"
                                  >
                                    {isTimerRunning ? 'Pause' : 'Resume'}
                                  </button>
                                  <button
                                    onClick={resetTimer}
                                    className="px-2 py-1 border border-[#30363d] text-gray-400 rounded hover:border-gray-400 transition text-xs"
                                  >
                                    Reset
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {/* Notes Icon Button */}
                          <button
                            onClick={openNotesModal}
                            className="flex items-center gap-1.5 px-2 py-1 bg-[#161b22] border border-[#30363d] rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition text-gray-400 text-xs"
                            title="Open Personal Notes"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Notes</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">Category: {problem.category}</p>
                    </div>

                    {/* Problem Description */}
                    <div className="mb-6">
                      <h2 className="text-[var(--accent)] text-sm font-bold mb-2">Description</h2>
                      <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
                        {problem.description}
                      </p>
                    </div>

                    {/* Examples */}
                    <div className="mb-6">
                      <h2 className="text-[var(--accent)] text-sm font-bold mb-2">Examples</h2>
                      {problem.examples.map((example, idx) => (
                        <div key={idx} className="mb-4 p-3 bg-[#161b22] border border-[#30363d] rounded">
                          <p className="text-gray-400 text-xs mb-1">
                            <span className="text-[var(--accent)]">Input:</span> {example.input}
                          </p>
                          <p className="text-gray-400 text-xs mb-1">
                            <span className="text-[var(--accent)]">Output:</span> {example.output}
                          </p>
                          <p className="text-gray-500 text-xs">
                            <span className="text-gray-600">Explanation:</span> {example.explanation}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Constraints */}
                    <div className="mb-6">
                      <h2 className="text-[var(--accent)] text-sm font-bold mb-2">Constraints</h2>
                      <ul className="text-gray-400 text-xs space-y-1">
                        {problem.constraints.map((constraint, idx) => (
                          <li key={idx}>• {constraint}</li>
                        ))}
                      </ul>
                    </div>


                  </div>
                  </div>
                  )}
                </div>

                {/* Right Panel - Code Editor */}
                <div className="w-1/2 flex flex-col overflow-hidden">
                  {/* Language Selector */}
                  <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLanguageChange('javascript')}
                        className={`px-4 py-2 rounded text-xs font-semibold transition ${
                          language === 'javascript'
                            ? 'bg-[var(--accent)] text-black'
                            : 'bg-[#161b22] text-gray-400 hover:text-[var(--accent)]'
                        }`}
                      >
                        JavaScript
                      </button>
                      <button
                        onClick={() => handleLanguageChange('python')}
                        className={`px-4 py-2 rounded text-xs font-semibold transition ${
                          language === 'python'
                            ? 'bg-[var(--accent)] text-black'
                            : 'bg-[#161b22] text-gray-400 hover:text-[var(--accent)]'
                        }`}
                      >
                        Python
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={runTests}
                        disabled={isRunning}
                        className="px-4 py-2 bg-[#161b22] text-[var(--accent)] border border-[var(--accent)] rounded hover:bg-[var(--accent)] hover:text-black transition text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {runningAction === 'run' ? '⟳ Running...' : '▶ Run'}
                      </button>
                      <button
                        onClick={submitCode}
                        disabled={isRunning}
                        className="px-4 py-2 bg-[var(--accent)] text-black rounded hover:bg-[var(--accent-hover)] transition text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {runningAction === 'submit' ? '⟳ Submitting...' : '⏎ Submit'}
                      </button>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 overflow-hidden min-h-0">
                    <Editor
                      height="100%"
                      language={language}
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: 'monospace',
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        lineNumbers: 'on',
                        folding: true,
                        bracketPairColorization: { enabled: true },
                        tabSize: language === 'python' ? 4 : 2,
                        insertSpaces: true,
                        detectIndentation: false,
                      }}
                    />
                  </div>

                  {/* Complexity Bar */}
                  {(() => {
                    const accepted = problem.acceptedComplexities;
                    const hasInput = progress.timeComplexity.trim() && progress.spaceComplexity.trim();
                    const validation = hasInput && accepted?.length
                      ? validateComplexity(progress.timeComplexity, progress.spaceComplexity, accepted)
                      : null;
                    const inputBorder = validation === null
                      ? 'border-[#30363d]'
                      : validation.match
                        ? 'border-green-500/40'
                        : 'border-red-500/30';

                    return (
                      <div className="flex items-center gap-4 px-4 py-2 border-t border-[#30363d] bg-[#161b22] shrink-0 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">Time</span>
                          <input
                            type="text"
                            value={progress.timeComplexity}
                            onChange={(e) => updateProgress(Number(problemId), { timeComplexity: e.target.value })}
                            placeholder="O(n)"
                            className={`w-20 px-2 py-0.5 bg-[#0d1117] border ${inputBorder} rounded text-xs text-gray-300 font-mono focus:outline-none focus:border-[var(--accent)]`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">Space</span>
                          <input
                            type="text"
                            value={progress.spaceComplexity}
                            onChange={(e) => updateProgress(Number(problemId), { spaceComplexity: e.target.value })}
                            placeholder="O(1)"
                            className={`w-20 px-2 py-0.5 bg-[#0d1117] border ${inputBorder} rounded text-xs text-gray-300 font-mono focus:outline-none focus:border-[var(--accent)]`}
                          />
                        </div>
                        {validation !== null && (
                          <div className="flex items-center gap-1.5 ml-auto">
                            {validation.match ? (
                              <>
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {validation.approach && (
                                  <span className="text-[10px] text-green-400/70">{validation.approach}</span>
                                )}
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 text-red-400/70" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {(accepted?.length ?? 0) > 1 && (
                                  <span className="text-[10px] text-gray-500">{accepted?.length} valid approaches</span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Test Output Panel (Run only — Submit uses modal) */}
                  {(testResult || runningAction === 'run') && (
                    <div className="border-t border-[#30363d] bg-[#161b22] max-h-64 overflow-auto shrink-0">
                      {runningAction === 'run' ? (
                        <div className="p-4 text-xs text-gray-400 font-mono animate-pulse">
                          {pyodideStatus === 'loading'
                            ? 'Loading Python runtime (first time only)...'
                            : 'Running tests...'}
                        </div>
                      ) : testResult ? (
                        <TestResults result={testResult} />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>

      {/* Submit Result Modal */}
      {submitResult && (
        <SubmitResultModal
          result={submitResult}
          onClose={() => setSubmitResult(null)}
        />
      )}

      {/* Notes Modal */}
      {isNotesOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Modal */}
          <div
            ref={notesModalRef}
            className={`pointer-events-auto flex flex-col bg-[#0d1117] border-2 border-[#30363d] rounded-lg shadow-2xl overflow-hidden ${
              isDragging ? 'cursor-grabbing' : ''
            }`}
            style={isNotesFullscreen ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              borderRadius: 0
            } : {
              position: 'fixed',
              top: notesPosition.y,
              left: notesPosition.x,
              width: notesSize.width,
              height: notesSize.height
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Modal Header */}
            <div className="notes-header flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d] cursor-grab select-none">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-[var(--accent)] text-sm font-bold font-mono">Personal Notes</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleNotesFullscreen}
                  className="p-1.5 text-gray-400 hover:text-[var(--accent)] transition rounded hover:bg-[#21262d]"
                  title={isNotesFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isNotesFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  )}
                </button>
                {/* Close Button */}
                <button
                  onClick={closeNotesModal}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition rounded hover:bg-[#21262d]"
                  title="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-4 overflow-hidden">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes, insights, or mistakes here..."
                className="w-full h-full p-3 bg-[#161b22] border border-[#30363d] rounded text-gray-300 text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            {/* Resize Handles - only when not fullscreen */}
            {!isNotesFullscreen && (
              <>
                {/* Corner handles */}
                <div
                  className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                />
                <div
                  className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                />
                <div
                  className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                />
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                />
                {/* Edge handles */}
                <div
                  className="absolute top-0 left-3 right-3 h-1 cursor-n-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                />
                <div
                  className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                />
                <div
                  className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                />
                <div
                  className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProblemPage;