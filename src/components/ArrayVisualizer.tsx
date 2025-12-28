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
  const [showExplanation, setShowExplanation] = useState(true);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<ComplexityInfo | null>(null);

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

  const generateRandomArray = () => {
    const newArray = [];
    for (let i = 0; i < 10; i++) {
      newArray.push(Math.floor(Math.random() * 99) + 1);
    }
    setArray(newArray);
    setComparing([]);
    setShowComplexity(false);
    setCurrentAlgorithm(null);
  };

  const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const bubbleSort = async () => {
    setIsSorting(true);
    setShowComplexity(true);
    setCurrentAlgorithm(BUBBLE_SORT_INFO);
    
    const arr = [...array];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        setComparing([j, j + 1]);
        await sleep(300);

        if (arr[j] > arr[j + 1]) {
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;

          setArray([...arr]);
          await sleep(300);
        }
      }
    }

    setComparing([]);
    setIsSorting(false);
  };

  return (
    <div className="space-y-8 relative">
      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={generateRandomArray}
          disabled={isSorting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition"
        >
          Generate Random Array
        </button>

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