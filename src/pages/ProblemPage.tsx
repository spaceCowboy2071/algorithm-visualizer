import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getProblemById, type Problem } from '../data/problemsData';

function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const problemId = id || '10';

  // Timer state (20 minutes = 1200 seconds)
  const [timeRemaining, setTimeRemaining] = useState(1200);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  // Code editor state
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [code, setCode] = useState('');

  // Notes state
  const [notes, setNotes] = useState('');

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

  // Progress state
  const [solvedIn20Min, setSolvedIn20Min] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Test output state
  const [testOutput, setTestOutput] = useState('');

  const timerIntervalRef = useRef<number | null>(null);
  
  // Load problem data
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load problem on mount
  useEffect(() => {
    const loadedProblem = getProblemById(Number(problemId));
    if (!loadedProblem) {
      navigate('/blind75');
      return;
    }
    setProblem(loadedProblem);
    setIsLoading(false);
  }, [problemId, navigate]);

  // Load problem-specific data when problem changes
  useEffect(() => {
    if (!problem) return;
    
    // Load saved data from localStorage
    const savedCode = localStorage.getItem(`problem_${problemId}_code_${language}`);
    const savedNotes = localStorage.getItem(`problem_${problemId}_notes`);
    const savedCompleted = localStorage.getItem(`problem_${problemId}_completed`);
    const savedSolvedIn20 = localStorage.getItem(`problem_${problemId}_solved_in_20`);
    
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(problem.starterCode[language]);
    }
    
    if (savedNotes) setNotes(savedNotes);
    else setNotes('');
    
    setCompleted(savedCompleted === 'true');
    setSolvedIn20Min(savedSolvedIn20 === 'true');
  }, [problem, problemId, language]);

  // Save code to localStorage whenever it changes
  useEffect(() => {
    if (!problem) return;
    if (code && code !== problem.starterCode[language]) {
      localStorage.setItem(`problem_${problemId}_code_${language}`, code);
    }
  }, [code, problemId, language, problem]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (notes) {
      localStorage.setItem(`problem_${problemId}_notes`, notes);
    }
  }, [notes, problemId]);

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
      <div className="min-h-screen flex items-center justify-center bg-black text-[#4af626] font-mono">
        <div>Loading problem...</div>
      </div>
    );
  }

  const startTimer = () => {
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
    if (timeRemaining > 300) return 'text-[#4af626]'; // > 5 min: green
    if (timeRemaining > 60) return 'text-yellow-500'; // > 1 min: yellow
    return 'text-red-500'; // < 1 min: red
  };

  const handleLanguageChange = (newLang: 'javascript' | 'python') => {
    setLanguage(newLang);
    // Load saved code for this language, or use starter code
    const savedCode = localStorage.getItem(`problem_${problemId}_code_${newLang}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(problem.starterCode[newLang]);
    }
  };

  const runTests = () => {
    // Simple test runner (placeholder - you'd implement actual execution)
    setTestOutput('Test runner not yet implemented. This is a placeholder for running your code against test cases.');
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
    <div 
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)' }}
    >
      {/* Monitor Container */}
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)]">
        {/* Monitor Frame */}
        <div className="flex-1 bg-black p-8 flex flex-col relative">
          <div className="flex-1 flex flex-col">
            {/* Terminal Window */}
            <div className="flex-1 bg-[#0d0d0d] border-2 border-[#1a1a1a] rounded-md shadow-2xl flex flex-col overflow-hidden">
              {/* Terminal Title Bar */}
              <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between">
                <span className="text-gray-500 text-xs font-mono">
                  terminal@algorithmviz/blind75/{problem.title.toLowerCase().replace(/\s+/g, '-')}
                </span>
                <Link 
                  to="/blind75"
                  className="text-gray-500 hover:text-[#4af626] text-xs transition"
                >
                  ← Back to Problems
                </Link>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Problem Description */}
                <div className="w-1/2 border-r border-[#2a2a2a] overflow-auto">
                  <div className="p-6 font-mono text-sm">
                    {/* Problem Header with Timer */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        {/* Left side: Title + Difficulty */}
                        <div className="flex items-center gap-3">
                          <h1 className="text-2xl font-bold text-[#4af626]">
                            {problem.title}
                          </h1>
                          <span className={`text-sm ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </div>

                        {/* Right side: Timer + Notes Icon */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-3 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded">
                            <span className={`text-xl font-bold font-mono ${getTimerColor()}`}>
                              {formatTime(timeRemaining)}
                            </span>
                            <div className="flex gap-1">
                              {!timerStarted ? (
                                <button
                                  onClick={startTimer}
                                  className="px-2 py-1 bg-[#4af626] text-black rounded hover:bg-[#3de515] transition text-xs font-semibold"
                                >
                                  Start
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={isTimerRunning ? pauseTimer : startTimer}
                                    className="px-2 py-1 border border-[#4af626] text-[#4af626] rounded hover:bg-[rgba(74,246,38,0.1)] transition text-xs"
                                  >
                                    {isTimerRunning ? 'Pause' : 'Resume'}
                                  </button>
                                  <button
                                    onClick={resetTimer}
                                    className="px-2 py-1 border border-gray-600 text-gray-400 rounded hover:border-gray-400 transition text-xs"
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
                            className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded hover:border-[#4af626] hover:text-[#4af626] transition text-gray-400 text-xs"
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
                      <h2 className="text-[#4af626] text-sm font-bold mb-2">Description</h2>
                      <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
                        {problem.description}
                      </p>
                    </div>

                    {/* Examples */}
                    <div className="mb-6">
                      <h2 className="text-[#4af626] text-sm font-bold mb-2">Examples</h2>
                      {problem.examples.map((example, idx) => (
                        <div key={idx} className="mb-4 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded">
                          <p className="text-gray-400 text-xs mb-1">
                            <span className="text-[#4af626]">Input:</span> {example.input}
                          </p>
                          <p className="text-gray-400 text-xs mb-1">
                            <span className="text-[#4af626]">Output:</span> {example.output}
                          </p>
                          <p className="text-gray-500 text-xs">
                            <span className="text-gray-600">Explanation:</span> {example.explanation}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Constraints */}
                    <div className="mb-6">
                      <h2 className="text-[#4af626] text-sm font-bold mb-2">Constraints</h2>
                      <ul className="text-gray-400 text-xs space-y-1">
                        {problem.constraints.map((constraint, idx) => (
                          <li key={idx}>• {constraint}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Progress Checkboxes */}
                    <div className="mb-6 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded">
                      <h2 className="text-[#4af626] text-sm font-bold mb-3">Progress</h2>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-[#4af626] transition">
                          <input
                            type="checkbox"
                            checked={completed}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setCompleted(checked);
                              localStorage.setItem(`problem_${problemId}_completed`, String(checked));
                            }}
                            className="w-4 h-4 accent-[#4af626]"
                          />
                          Completed
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-[#4af626] transition">
                          <input
                            type="checkbox"
                            checked={solvedIn20Min}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSolvedIn20Min(checked);
                              localStorage.setItem(`problem_${problemId}_solved_in_20`, String(checked));
                            }}
                            className="w-4 h-4 accent-[#4af626]"
                          />
                          Solved in 20 minutes
                        </label>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Panel - Code Editor */}
                <div className="w-1/2 flex flex-col">
                  {/* Language Selector */}
                  <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLanguageChange('javascript')}
                        className={`px-4 py-2 rounded text-xs font-semibold transition ${
                          language === 'javascript'
                            ? 'bg-[#4af626] text-black'
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-[#4af626]'
                        }`}
                      >
                        JavaScript
                      </button>
                      <button
                        onClick={() => handleLanguageChange('python')}
                        className={`px-4 py-2 rounded text-xs font-semibold transition ${
                          language === 'python'
                            ? 'bg-[#4af626] text-black'
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-[#4af626]'
                        }`}
                      >
                        Python
                      </button>
                    </div>
                    <button
                      onClick={runTests}
                      className="px-4 py-2 bg-[#4af626] text-black rounded hover:bg-[#3de515] transition text-xs font-semibold"
                    >
                      ▶ Run Tests
                    </button>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 overflow-hidden">
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
                        tabSize: 2,
                      }}
                    />
                  </div>

                  {/* Test Output Panel */}
                  {testOutput && (
                    <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a] max-h-48 overflow-auto">
                      <h3 className="text-[#4af626] text-xs font-bold mb-2">Test Output:</h3>
                      <pre className="text-gray-400 text-xs font-mono whitespace-pre-wrap">
                        {testOutput}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Power LED */}
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-[#4af626] rounded-full shadow-[0_0_8px_rgba(74,246,38,0.8)] animate-pulse"></div>
        </div>
      </div>

      {/* Monitor Stand */}
      <div
        className="h-20 flex justify-center items-start"
        style={{ background: 'linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)' }}
      >
        <div
          className="w-16 h-20 rounded-b shadow-md"
          style={{
            background: 'linear-gradient(180deg, #000000 0%, #2a2a2a 20%, #d4d4d4 60%, #a8a8a8 100%)'
          }}
        ></div>
      </div>

      {/* Notes Modal */}
      {isNotesOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Modal */}
          <div
            ref={notesModalRef}
            className={`pointer-events-auto flex flex-col bg-[#0d0d0d] border-2 border-[#2a2a2a] rounded-lg shadow-2xl overflow-hidden ${
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
            <div className="notes-header flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a] cursor-grab select-none">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#4af626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-[#4af626] text-sm font-bold font-mono">Personal Notes</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleNotesFullscreen}
                  className="p-1.5 text-gray-400 hover:text-[#4af626] transition rounded hover:bg-[#2a2a2a]"
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
                  className="p-1.5 text-gray-400 hover:text-red-500 transition rounded hover:bg-[#2a2a2a]"
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
                className="w-full h-full p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-gray-300 text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-[#4af626] resize-none"
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