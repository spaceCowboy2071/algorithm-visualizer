import { useState } from 'react';

interface ComplexityInfo {
  name: string;
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
  };
  spaceComplexity: string;
  explanations: {
    how: string;
    when: string;
    where: string;
    why: string;
  };
}

function ArrayVisualizer() {
  const [array, setArray] = useState([30, 80, 50, 20, 90]);
  const [isSorting, setIsSorting] = useState(false);
  const [comparing, setComparing] = useState<number[]>([]);
  const [showComplexity, setShowComplexity] = useState(false);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<ComplexityInfo | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const [showXRay, setShowXRay] = useState(true);
  const [xRayEnabled, setXRayEnabled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'javascript' | 'python'>('javascript');
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [showContext, setShowContext] = useState(true);
  const [activeTab, setActiveTab] = useState<'how' | 'when' | 'where' | 'why'>('how');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null);
  const [arraySize, setArraySize] = useState(10);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);

  const BUBBLE_SORT_INFO: ComplexityInfo = {
    name: "Bubble Sort",
    timeComplexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)"
    },
    spaceComplexity: "O(1)",
    explanations: {
      how: "Bubble Sort repeatedly steps through the array, compares adjacent elements, and swaps them if they're in the wrong order. The largest values 'bubble up' to the end with each pass. This continues until no more swaps are needed, meaning the array is sorted.",
      when: "Use Bubble Sort for small datasets (< 50 elements) or when the data is nearly sorted. It's also useful for educational purposes to understand basic sorting concepts. However, it's rarely used in production due to poor performance on large datasets.",
      where: "Bubble Sort is typically found in educational codebases, embedded systems with memory constraints, or as a subroutine in hybrid sorting algorithms. You might see it in interview questions or algorithm courses, but rarely in production applications.",
      why: "Choose Bubble Sort when: (1) the dataset is very small, (2) simplicity is more important than performance, (3) you need a stable sort with O(1) space complexity, or (4) the data is already nearly sorted, where it can achieve O(n) performance."
    }
  };

  const BUBBLE_SORT_CODE = {
    javascript: `function bubbleSort(arr) {
  const n = arr.length;
  
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  
  return arr;
}`,
    python: `def bubble_sort(arr):
    n = len(arr)
    
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                # Swap elements
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    
    return arr`
  };

  const generateRandomArray = () => {
    const newArray = [];
    for (let i = 0; i < arraySize; i++) {
      newArray.push(Math.floor(Math.random() * 99) + 1);
    }
    setArray(newArray);
    setComparing([]);
    setCurrentLine(null);
    setSelectedAlgorithm(null);
    setSortedIndices([]);
  };

  const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const bubbleSort = async () => {
    setSelectedAlgorithm('Bubble Sort');
    setIsSorting(true);
    setShowComplexity(true);
    setCurrentAlgorithm(BUBBLE_SORT_INFO);
    setXRayEnabled(true);
    setSortedIndices([]); // Clear any previous sorted state
    
    const arr = [...array];
    const n = arr.length;
    const sorted: number[] = [];

    setCurrentLine(2);
    await sleep(300);

    for (let i = 0; i < n - 1; i++) {
      setCurrentLine(4);
      await sleep(300);
      
      for (let j = 0; j < n - i - 1; j++) {
        setCurrentLine(5);
        await sleep(300);
        
        setComparing([j, j + 1]);
        setCurrentLine(6);
        await sleep(300);

        if (arr[j] > arr[j + 1]) {
          setCurrentLine(8);
          await sleep(300);
          
          const temp = arr[j];
          
          setCurrentLine(9);
          await sleep(300);
          arr[j] = arr[j + 1];
          
          setCurrentLine(10);
          await sleep(300);
          arr[j + 1] = temp;

          setArray([...arr]);
          await sleep(300);
        }
      }
      
      // After each pass, the element at position (n - i - 1) is in its final sorted position
      sorted.push(n - i - 1);
      setSortedIndices([...sorted]);
      await sleep(200);
    }

    // Mark first element as sorted too (it's sorted when we finish)
    sorted.push(0);
    setSortedIndices([...sorted]);

    setComparing([]);
    setCurrentLine(null);
    setIsSorting(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      {/* Left Sidebar - Algorithm Buttons */}
      <div className="w-48 border-r border-gray-800 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
          Algorithms
        </h3>
        <button
          onClick={bubbleSort}
          disabled={isSorting}
          className={`w-full ${
            selectedAlgorithm === 'Bubble Sort'
              ? 'bg-green-700'
              : 'bg-green-600 hover:bg-green-700'
          } disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg font-semibold transition text-sm`}
        >
          {isSorting && selectedAlgorithm === 'Bubble Sort' ? 'Sorting...' : 'Bubble Sort'}
        </button>
        {/* Future algorithm buttons will go here */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pl-6 pr-6 lg:pr-8 py-6 space-y-6">
        {/* Array Visualization Container */}
        <div className="bg-gray-800 border-2 border-gray-700 rounded-lg shadow-2xl w-full lg:max-w-3xl overflow-hidden">
          {/* Header */}
          <div className="p-3 border-2 border-gray-700 bg-gray-900">
            <h2 className="text-lg font-bold text-white text-center">
              {selectedAlgorithm ? `${selectedAlgorithm}: Array Visualization` : 'Array Visualization'}
            </h2>
          </div>
          
          {/* Array Bars */}
          <div className="p-4">
            {/* Bars with indices */}
            <div className="flex items-end justify-center gap-2" style={{ height: '200px' }}>
              {array.map((value, index) => (
                <div key={index} className="flex flex-col items-center justify-end h-full">
                  {/* Bar */}
                  <div
                    className={`w-12 sm:w-16 flex items-center justify-center transition-all duration-300 rounded-t-md ${
                      comparing.includes(index) ? 'bg-red-500' : sortedIndices.includes(index) ? 'bg-green-500' : ''
                    }`}
                    style={{ 
                      height: `${(value / 100) * 170}px`, 
                      minHeight: '25px',
                      background: comparing.includes(index) 
                        ? undefined 
                        : sortedIndices.includes(index)
                        ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(180deg, #5b9dff 0%, #3b7de8 100%)',
                      boxShadow: comparing.includes(index)
                        ? undefined
                        : sortedIndices.includes(index)
                        ? '0 4px 15px rgba(16, 185, 129, 0.3)'
                        : '0 4px 15px rgba(91, 157, 255, 0.3)'
                    }}
                  >
                    <span className="text-white text-xs sm:text-sm font-bold">{value}</span>
                  </div>
                  
                  {/* Index below bar */}
                  <span className="text-gray-400 text-xs font-mono mt-1.5">
                    {index}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Array Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-3 border-2 border-gray-700 bg-gray-900">
            {/* Left: Array Size Slider */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-gray-300 text-xs font-semibold whitespace-nowrap">
                Array Size:
              </label>
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={arraySize}
                  onChange={(e) => setArraySize(Number(e.target.value))}
                  disabled={isSorting}
                  className="w-32 sm:w-40 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-blue-500"
                />
                <span className="text-blue-400 font-mono text-xs font-bold w-5 text-center">
                  {arraySize}
                </span>
              </div>
            </div>

            {/* Right: Generate Button */}
            <button
              onClick={generateRandomArray}
              disabled={isSorting}
              className="bg-slate-600 hover:bg-slate-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
            >
              <span>🔄</span>
              <span>Generate Array</span>
            </button>
          </div>
        </div>

        {/* X-Ray Code Viewer - Inline */}
        {showXRay && (
          <div className="bg-gray-900 border-2 border-gray-700 rounded-lg w-full lg:max-w-3xl shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-2.5 border-b border-gray-700 gap-2">
              <h2 className="text-base font-bold text-white">X-Ray Code Viewer</h2>
              
              {/* Language Tabs */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentLanguage('javascript')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition text-xs ${
                    currentLanguage === 'javascript'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  JavaScript
                </button>
                <button
                  onClick={() => setCurrentLanguage('python')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition text-xs ${
                    currentLanguage === 'python'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Python
                </button>
              </div>

              <button
                onClick={() => {
                  setShowXRay(false);
                  setShowContext(false);
                }}
                className="text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition text-xs"
              >
                Close X-Ray
              </button>
            </div>

            {/* Code Display */}
            <div className="overflow-auto p-4 bg-gray-950 max-h-80">
              <pre className="text-xs font-mono leading-tight">
                {BUBBLE_SORT_CODE[currentLanguage].split('\n').map((line, index) => {
                  const lineNumber = index + 1;
                  const isActive = currentLine === lineNumber;
                  
                  return (
                    <div
                      key={index}
                      className={`px-2 py-0.5 ${
                        isActive 
                          ? 'bg-yellow-900 bg-opacity-50 border-l-4 border-green-500' 
                          : ''
                      }`}
                    >
                      <span className="text-gray-500 select-none mr-3 inline-block w-4 text-right">
                        {lineNumber}
                      </span>
                      <code className={isActive ? 'text-green-400 font-bold' : 'text-gray-300'}>
                        {line}
                      </code>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        )}

        {/* X-Ray Button - Bottom Left (only show when hidden) */}
        {xRayEnabled && !showXRay && (
          <button
            onClick={() => setShowXRay(true)}
            className="fixed bottom-8 left-56 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition shadow-lg flex items-center gap-2 text-sm"
          >
            <span className="text-lg">👁️</span>
            <span>Show X-Ray</span>
          </button>
        )}
      </div>

      {/* Unified Complexity & Context Panel - Right Side */}
      {showComplexity && currentAlgorithm && (
        <div className="hidden lg:block fixed top-20 right-8 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-2xl w-80 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {/* Complexity Section */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-white mb-3">{currentAlgorithm.name}</h3>
            
            <div className="space-y-2.5">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 mb-1.5">Time Complexity</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Best:</span>
                    <span className="text-green-400 font-mono">{currentAlgorithm.timeComplexity.best}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Average:</span>
                    <span className="text-yellow-400 font-mono">{currentAlgorithm.timeComplexity.average}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Worst:</span>
                    <span className="text-red-400 font-mono">{currentAlgorithm.timeComplexity.worst}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-2.5">
                <h4 className="text-xs font-semibold text-gray-400 mb-1.5">Space Complexity</h4>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Extra Space:</span>
                  <span className="text-blue-400 font-mono">{currentAlgorithm.spaceComplexity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Context Section */}
          {showContext && (
            <div className="border-t-2 border-gray-700 p-4">
              {/* Tabs */}
              <div className="flex gap-0.5 mb-3 border-b border-gray-700">
                {(['how', 'when', 'where', 'why'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1.5 font-semibold capitalize transition relative text-xs ${
                      activeTab === tab
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="text-gray-300 text-xs leading-relaxed">
                <p>{currentAlgorithm.explanations[activeTab]}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ArrayVisualizer;