import { useState } from 'react';

function ArrayVisualizer() {
  const [array, setArray] = useState([30, 80, 50, 20, 90]);
  const [isSorting, setIsSorting] = useState(false);
  const [comparing, setComparing] = useState<number[]>([]);

  const generateRandomArray = () => {
    const newArray = [];
    for (let i = 0; i < 10; i++) {
      newArray.push(Math.floor(Math.random() * 99) + 1);
    }
    setArray(newArray);
    setComparing([]);
  };

  const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const bubbleSort = async () => {
    setIsSorting(true);
    const arr = [...array];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        // Highlight the bars being compared
        setComparing([j, j + 1]);
        await sleep(300);

        // Compare and swap if needed
        if (arr[j] > arr[j + 1]) {
          // Swap
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;

          // Update the visual array
          setArray([...arr]);
          await sleep(300);
        }
      }
    }

    setComparing([]);
    setIsSorting(false);
  };

  return (
    <div className="space-y-8">
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
    </div>
  );
}

export default ArrayVisualizer;