import { useState } from 'react';
import { Link } from 'react-router-dom';

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
  const [comparisonMessage, setComparisonMessage] = useState<string>('');

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
        setComparisonMessage(`Comparing index ${j} and ${j + 1}`);
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
    setComparisonMessage('');
    setCurrentLine(null);
    setIsSorting(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        {/* Left: Back to Home */}
        <Link 
          to="/"
          className="text-blue-400 hover:text-blue-300 transition text-sm"
        >
          ← Back to Home
        </Link>
        
        {/* Center: Algorithm Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Select Algorithm</span>
          <select 
            className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer"
            value={selectedAlgorithm || ''}
            disabled={isSorting}
            onChange={(e) => {
              if (e.target.value === 'Bubble Sort') {
                bubbleSort();
              }
            }}
          >
            <option value="">Choose...</option>
            <option value="Bubble Sort">Bubble Sort</option>
          </select>
        </div>

        {/* Right: Array Size and Generate */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Array Size</span>
            <input
              type="range"
              min="1"
              max="10"
              value={arraySize}
              onChange={(e) => setArraySize(Number(e.target.value))}
              disabled={isSorting}
              className="w-32 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-blue-500"
            />
            <span className="bg-gray-700 px-3 py-1 rounded text-sm font-mono w-8 text-center">
              {arraySize}
            </span>
          </div>
          <button
            onClick={generateRandomArray}
            disabled={isSorting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-5 py-2 rounded-lg font-semibold transition text-sm"
          >
            Generate Array
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 flex gap-6">
        {/* Left Side - Visualization and Controls - 60% */}
        <div className="w-[60%] space-y-6">
          {/* Array Visualization */}
          <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700 rounded-xl shadow-2xl p-8 relative">
            {/* Shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-center mb-8">
                {selectedAlgorithm ? `${selectedAlgorithm}: Array Visualization` : 'Array Visualization'}
              </h2>
              
              {/* Array Bars Container */}
              <div className="h-96 flex items-end justify-center gap-4 mb-4">
                {array.map((value, index) => (
                  <div key={index} className="flex flex-col items-center justify-end h-full">
                    {/* Bar */}
                    <div
                      className={`w-24 flex items-center justify-center transition-all duration-300 rounded-t-lg`}
                      style={{ 
                        height: `${(value / 100) * 85}%`, 
                        minHeight: '50px',
                        background: comparing.includes(index) 
                          ? 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)'
                          : sortedIndices.includes(index)
                          ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(180deg, #5b9dff 0%, #3b7de8 100%)',
                        boxShadow: comparing.includes(index)
                          ? '0 6px 24px rgba(234, 179, 8, 0.6)'
                          : sortedIndices.includes(index)
                          ? '0 6px 24px rgba(16, 185, 129, 0.5)'
                          : '0 6px 24px rgba(91, 157, 255, 0.5)'
                      }}
                    >
                      <span className="text-white text-lg font-bold">{value}</span>
                    </div>
                    
                    {/* Index */}
                    <span className="text-gray-400 text-sm font-mono mt-3">
                      {index}
                    </span>
                  </div>
                ))}
              </div>

              {/* Comparison Message */}
              {comparisonMessage && (
                <div className="text-center text-base text-gray-300 mb-4">
                  {comparisonMessage}
                </div>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6">
            {/* Playback Buttons */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button 
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                disabled={true}
              >
                <span>⏮</span> Step Back
              </button>
              <button 
                onClick={bubbleSort}
                disabled={isSorting}
                className="px-7 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition font-semibold text-sm flex items-center gap-2"
              >
                <span>{isSorting ? '⏸' : '▶'}</span> {isSorting ? 'Pause' : 'Play'}
              </button>
              <button 
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                disabled={true}
              >
                Step Forward <span>⏭</span>
              </button>
              <button 
                onClick={generateRandomArray}
                disabled={isSorting}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 rounded-lg transition text-sm flex items-center gap-2"
              >
                <span>↻</span> Reset
              </button>
            </div>

            {/* Speed Slider */}
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm text-gray-400">Speed:</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                defaultValue="1"
                disabled={true}
                className="w-64 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-blue-500"
              />
              <span className="text-sm text-gray-400 font-mono w-12">1x</span>
            </div>
          </div>
        </div>

        {/* Right Side - Info Panels - 40% */}
        <div className="w-[40%] space-y-6">
          {/* Complexity Table */}
          {showComplexity && currentAlgorithm && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-gray-700 bg-gray-750">
                <h3 className="text-lg font-bold">{currentAlgorithm.name}</h3>
              </div>
              
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-750 border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold text-xs"></th>
                    <th className="text-center py-3 px-4 text-gray-300 font-semibold text-xs">Time Complexity</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-semibold text-xs">Space Complexity</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="border-b border-gray-700/50">
                    <td className="py-3 px-4 text-gray-400">Best</td>
                    <td className="text-center py-3 px-4 font-mono text-green-400">{currentAlgorithm.timeComplexity.best}</td>
                    <td className="text-center py-3 px-4 font-mono text-blue-400 row-span-3">{currentAlgorithm.spaceComplexity}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-3 px-4 text-gray-400">Average</td>
                    <td className="text-center py-3 px-4 font-mono text-yellow-400">{currentAlgorithm.timeComplexity.average}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-400">Worst</td>
                    <td className="text-center py-3 px-4 font-mono text-red-400">{currentAlgorithm.timeComplexity.worst}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* How/When/Where/Why Tabs */}
          {showContext && currentAlgorithm && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
              <div className="flex border-b border-gray-700">
                {(['how', 'when', 'where', 'why'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-3 font-semibold capitalize transition text-sm ${
                      activeTab === tab
                        ? 'bg-gray-750 text-white border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-750/50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-5 text-gray-300 text-sm leading-relaxed">
                <p>{currentAlgorithm.explanations[activeTab]}</p>
              </div>
            </div>
          )}

          {/* X-Ray Code Viewer */}
          {showXRay && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-750">
                <h3 className="text-sm font-bold">X-Ray Code Viewer</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentLanguage('javascript')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                      currentLanguage === 'javascript'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    JavaScript
                  </button>
                  <button
                    onClick={() => setCurrentLanguage('python')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                      currentLanguage === 'python'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    Python
                  </button>
                </div>
              </div>

              {/* Variables */}
              <div className="bg-gray-900 border-b border-gray-700 px-3 py-2">
                <div className="flex items-start gap-3 text-xs">
                  <div className="font-semibold text-gray-300 min-w-fit">Variables:</div>
                  <div className="font-mono text-gray-400 flex-1">
                    <div className="flex gap-3 flex-wrap">
                      <span>i=0</span>
                      <span>j=3</span>
                      <span>temp=null</span>
                    </div>
                    <div className="mt-1">arr=[{array.join(', ')}]</div>
                  </div>
                </div>
              </div>

              {/* Code */}
              <div className="overflow-auto p-3 bg-gray-950 max-h-72">
                <pre className="text-xs font-mono leading-relaxed">
                  {BUBBLE_SORT_CODE[currentLanguage].split('\n').map((line, index) => {
                    const lineNumber = index + 1;
                    const isActive = currentLine === lineNumber;
                    
                    return (
                      <div
                        key={index}
                        className={`px-2 py-0.5 ${
                          isActive 
                            ? 'bg-yellow-900 bg-opacity-50 border-l-4 border-yellow-500' 
                            : ''
                        }`}
                      >
                        <span className="text-gray-500 select-none mr-3 inline-block w-5 text-right">
                          {lineNumber}
                        </span>
                        <code className={isActive ? 'text-yellow-400 font-bold' : 'text-gray-300'}>
                          {line}
                        </code>
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArrayVisualizer;