import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';

interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints: string[];
  starterCode: {
    javascript: string;
    python: string;
  };
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

// Two Sum problem data (template)
const TWO_SUM_PROBLEM: Problem = {
  id: 10,
  title: 'Two Sum',
  difficulty: 'Easy',
  category: 'Array',
  description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
    },
    {
      input: 'nums = [3,2,4], target = 6',
      output: '[1,2]',
      explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
    },
    {
      input: 'nums = [3,3], target = 6',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
    }
  ],
  constraints: [
    '2 <= nums.length <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9',
    'Only one valid answer exists.'
  ],
  starterCode: {
    javascript: `function twoSum(nums, target) {
    // Write your solution here
    
}`,
    python: `def two_sum(nums, target):
    # Write your solution here
    pass`
  },
  testCases: [
    { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
    { input: '[3,2,4], 6', expectedOutput: '[1,2]' },
    { input: '[3,3], 6', expectedOutput: '[0,1]' }
  ]
};

function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  
  // Timer state (20 minutes = 1200 seconds)
  const [timeRemaining, setTimeRemaining] = useState(1200);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  
  // Code editor state
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [code, setCode] = useState(TWO_SUM_PROBLEM.starterCode.javascript);
  
  // Notes state
  const [notes, setNotes] = useState('');
  
  // Progress state
  const [solvedIn20Min, setSolvedIn20Min] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  // Test output state
  const [testOutput, setTestOutput] = useState('');
  
 const timerIntervalRef = useRef<number | null>(null);

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
    setCode(TWO_SUM_PROBLEM.starterCode[newLang]);
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
                  terminal@algorithmviz/blind75/{TWO_SUM_PROBLEM.title.toLowerCase().replace(/\s+/g, '-')}
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
                    {/* Problem Header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-[#4af626]">
                          {TWO_SUM_PROBLEM.title}
                        </h1>
                        <span className={`text-sm ${getDifficultyColor(TWO_SUM_PROBLEM.difficulty)}`}>
                          {TWO_SUM_PROBLEM.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Category: {TWO_SUM_PROBLEM.category}</p>
                    </div>

                    {/* Timer Section */}
                    <div className="mb-6 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-xs">20-Minute Challenge</span>
                        <span className={`text-2xl font-bold font-mono ${getTimerColor()}`}>
                          {formatTime(timeRemaining)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {!timerStarted ? (
                          <button
                            onClick={startTimer}
                            className="flex-1 px-3 py-2 bg-[#4af626] text-black rounded hover:bg-[#3de515] transition text-xs font-semibold"
                          >
                            Start Timer
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={isTimerRunning ? pauseTimer : startTimer}
                              className="flex-1 px-3 py-2 border border-[#4af626] text-[#4af626] rounded hover:bg-[rgba(74,246,38,0.1)] transition text-xs"
                            >
                              {isTimerRunning ? 'Pause' : 'Resume'}
                            </button>
                            <button
                              onClick={resetTimer}
                              className="px-3 py-2 border border-gray-600 text-gray-400 rounded hover:border-gray-400 transition text-xs"
                            >
                              Reset
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Problem Description */}
                    <div className="mb-6">
                      <h2 className="text-[#4af626] text-sm font-bold mb-2">Description</h2>
                      <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
                        {TWO_SUM_PROBLEM.description}
                      </p>
                    </div>

                    {/* Examples */}
                    <div className="mb-6">
                      <h2 className="text-[#4af626] text-sm font-bold mb-2">Examples</h2>
                      {TWO_SUM_PROBLEM.examples.map((example, idx) => (
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
                        {TWO_SUM_PROBLEM.constraints.map((constraint, idx) => (
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
                            onChange={(e) => setCompleted(e.target.checked)}
                            className="w-4 h-4 accent-[#4af626]"
                          />
                          Completed
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-[#4af626] transition">
                          <input
                            type="checkbox"
                            checked={solvedIn20Min}
                            onChange={(e) => setSolvedIn20Min(e.target.checked)}
                            className="w-4 h-4 accent-[#4af626]"
                          />
                          Solved in 20 minutes
                        </label>
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div>
                      <h2 className="text-[#4af626] text-sm font-bold mb-2">Personal Notes</h2>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your notes, insights, or mistakes here..."
                        className="w-full h-32 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-gray-300 text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-[#4af626] resize-none"
                      />
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

                  {/* Code Editor (Simple Textarea for now) */}
                  <div className="flex-1 overflow-auto">
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-full p-4 bg-[#0d0d0d] text-gray-300 text-sm font-mono focus:outline-none resize-none"
                      spellCheck={false}
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
    </div>
  );
}

export default ProblemPage;
