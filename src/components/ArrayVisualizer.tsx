import { useState } from 'react';

interface ComplexityInfo {
  name: string;
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
  };
  spaceComplexity: string;
  explanation: string;
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

  const BUBBLE_SORT_INFO: ComplexityInfo = {
    name: "Bubble Sort",
    timeComplexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)"
    },
    spaceComplexity: "O(1)",
    explanation: "Bubble Sort repeatedly steps through the array, compares adjacent elements, and swaps them if they're in the wrong order. The largest values 'bubble up' to the end with each pass. This continues until no more swaps are needed, meaning the array is sorted."
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
    for (let i = 0; i < 10; i++) {
      newArray.push(Math.floor(Math.random() * 99) + 1);
    }
    setArray(newArray);
    setComparing([]);
    setShowComplexity(false);
    setCurrentAlgorithm(null);
    setXRayEnabled(false);
    setShowXRay(false);
  };

  const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const bubbleSort = async () => {
    setIsSorting(true);
    setShowComplexity(true);
    setCurrentAlgorithm(BUBBLE_SORT_INFO);
    setXRayEnabled(true);
    
    const arr = [...array];
    const n = arr.length;

    setCurrentLine(2); // const n = arr.length
    await sleep(300);

    for (let i = 0; i < n - 1; i++) {
      setCurrentLine(4); // outer for loop
      await sleep(300);
      
      for (let j = 0; j < n - i - 1; j++) {
        setCurrentLine(5); // inner for loop
        await sleep(300);
        
        setComparing([j, j + 1]);
        setCurrentLine(6); // if condition
        await sleep(300);

        if (arr[j] > arr[j + 1]) {
          setCurrentLine(8); // swap - line 1
          await sleep(300);
          
          const temp = arr[j];
          
          setCurrentLine(9); // swap - line 2
          await sleep(300);
          arr[j] = arr[j + 1];
          
          setCurrentLine(10); // swap - line 3
          await sleep(300);
          arr[j + 1] = temp;

          setArray([...arr]);
          await sleep(300);
        }
      }
    }

    setComparing([]);
    setCurrentLine(null);
    setIsSorting(false);
  };

  return (
    <div className="space-y-8 relative">
      {/* Algorithm Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={bubbleSort}
          disabled={isSorting}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition"
        >
          {isSorting ? 'Sorting...' : 'Bubble Sort'}
        </button>
      </div>

      {/* Array Visualization */}
      <div className="flex items-end justify-center gap-2 h-64">
        {array.map((value, index) => (
          <div
            key={index}
            className={`w-16 flex items-center justify-center transition-all duration-300 ${
              comparing.includes(index) ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ height: `${value}%` }}
          >
            <span className="text-white text-sm font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* Generate Array Button - Below Visualization */}
      <div className="flex justify-center">
        <button
          onClick={generateRandomArray}
          disabled={isSorting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Generate Random Array</span>
        </button>
      </div>

      {/* X-Ray Button - Bottom Left */}
      {xRayEnabled && (
        <button
          onClick={() => setShowXRay(!showXRay)}
          className="fixed bottom-8 left-8 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition shadow-lg flex items-center gap-2"
        >
          <span className="text-xl">👁️</span>
          <span>{showXRay ? 'Hide X-Ray' : 'Show X-Ray'}</span>
        </button>
      )}

            {/* X-Ray Code Viewer - Inline */}
      {showXRay && (
        <div className="bg-gray-900 border-2 border-gray-700 rounded-lg w-full max-w-4xl mx-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">X-Ray Code Viewer</h2>
            
            {/* Language Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentLanguage('javascript')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  currentLanguage === 'javascript'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                JavaScript
              </button>
              <button
                onClick={() => setCurrentLanguage('python')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  currentLanguage === 'python'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Python
              </button>
            </div>

            <button
              onClick={() => setShowXRay(false)}
              className="text-gray-400 hover:text-white text-2xl font-bold transition"
            >
              ×
            </button>
          </div>

          {/* Code Display */}
          <div className="overflow-auto p-6 bg-gray-950 max-h-96">
            <pre className="text-sm font-mono leading-relaxed">
              {BUBBLE_SORT_CODE[currentLanguage].split('\n').map((line, index) => {
                const lineNumber = index + 1;
                const isActive = currentLine === lineNumber;
                
                return (
                  <div
                    key={index}
                    className={`px-3 py-1 ${
                      isActive 
                        ? 'bg-yellow-900 bg-opacity-50 border-l-4 border-green-500' 
                        : ''
                    }`}
                  >
                    <span className="text-gray-500 select-none mr-4 inline-block w-6 text-right">
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

      {/* Complexity Info Box */}
      {showComplexity && currentAlgorithm && (
        <div className="fixed bottom-8 right-8 bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-2xl w-96">
          <h3 className="text-xl font-bold text-white mb-4">{currentAlgorithm.name}</h3>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Time Complexity</h4>
              <div className="space-y-1 text-sm">
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

            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Space Complexity</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Extra Space:</span>
                <span className="text-blue-400 font-mono">{currentAlgorithm.spaceComplexity}</span>
              </div>
            </div>

            {/* Explanation Section */}
            <div className="border-t border-gray-700 pt-3">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex items-center justify-between text-left text-sm font-semibold text-gray-400 hover:text-white transition"
              >
                <span>Explanation</span>
                <span className="text-lg">{showExplanation ? '−' : '+'}</span>
              </button>
              
              {showExplanation && (
                <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                  {currentAlgorithm.explanation}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArrayVisualizer;