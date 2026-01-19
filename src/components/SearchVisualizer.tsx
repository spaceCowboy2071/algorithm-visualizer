import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

interface SearchComplexityInfo {
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
  code?: {
    javascript: string;
    python: string;
  };
}

interface SearchHistoryState {
  array: number[];
  target: number;
  comparing: number[];
  eliminatedIndices: number[];
  foundIndex: number | null;
  left: number;
  right: number;
  mid: number | null;
  currentLine: number | null;
  message: string;
  searchResult: 'found' | 'not-found' | null;
}

function SearchVisualizer() {
  // Array & Search State
  const [array, setArray] = useState<number[]>([5, 12, 23, 34, 45, 56, 67, 78, 89, 95]);
  const [target, setTarget] = useState<number>(45);
  const [isSearching, setIsSearching] = useState(false);
  const [comparing, setComparing] = useState<number[]>([]);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);
  const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null);

  // Pointers
  const [left, setLeft] = useState<number>(0);
  const [right, setRight] = useState<number>(9);
  const [mid, setMid] = useState<number | null>(null);

  // UI State
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<SearchComplexityInfo | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'javascript' | 'python'>('javascript');
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'complexity' | 'how' | 'when' | 'where' | 'why'>('complexity');
  const [arraySize, setArraySize] = useState(10);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [comparisonMessage, setComparisonMessage] = useState<string>('');
  const [showComplexity, setShowComplexity] = useState(false);

  // History for step backward
  const [history, setHistory] = useState<SearchHistoryState[]>([]);

  // Control Refs
  const pauseRef = useRef(false);
  const cancelRef = useRef(false);
  const stepForwardRef = useRef(false);

  const showXRay = true;

  // Algorithm Info
  const BINARY_SEARCH_INFO: SearchComplexityInfo = {
    name: "Binary Search",
    timeComplexity: {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(log n)"
    },
    spaceComplexity: "O(1)",
    explanations: {
      how: "Binary Search repeatedly divides the search interval in half. It compares the target value to the middle element of the sorted array. If they're not equal, it eliminates the half where the target cannot lie and continues searching the remaining half until the target is found or the interval is empty.",
      when: "Use Binary Search when working with sorted arrays and you need fast lookups. It's ideal for large datasets where linear search would be too slow. The data must be sorted for binary search to work correctly.",
      where: "Binary Search is found everywhere: database indexing, dictionary lookups, spell checkers, version control (git bisect), finding bugs in sorted logs, and any system that needs efficient lookups in sorted data.",
      why: "Choose Binary Search when: (1) the array is sorted, (2) you need O(log n) search time instead of O(n), (3) you're searching frequently in a static dataset, or (4) the data is too large for linear search to be practical."
    }
  };

  const LINEAR_SEARCH_INFO: SearchComplexityInfo = {
    name: "Linear Search",
    timeComplexity: {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)"
    },
    spaceComplexity: "O(1)",
    explanations: {
      how: "Linear Search sequentially checks each element in the array from the beginning until it finds the target or reaches the end. It compares each element one by one with the target value.",
      when: "Use Linear Search when the data is unsorted, the dataset is small, you only need to search once, or when simplicity is more important than performance. It's also useful when elements are likely to be near the beginning.",
      where: "Linear Search is used in small datasets, unsorted collections, finding the first occurrence of an element, and situations where the overhead of sorting isn't justified. Common in scripts, small utilities, and prototypes.",
      why: "Choose Linear Search when: (1) the array is unsorted and sorting isn't worth it, (2) the dataset is small (< 100 elements), (3) you're only searching once, or (4) you need to find all occurrences of a value."
    }
  };

  const JUMP_SEARCH_INFO: SearchComplexityInfo = {
    name: "Jump Search",
    timeComplexity: {
      best: "O(1)",
      average: "O(√n)",
      worst: "O(√n)"
    },
    spaceComplexity: "O(1)",
    explanations: {
      how: "Jump Search works on sorted arrays by jumping ahead by fixed steps (typically √n) until finding a block where the target might exist. Then it performs a linear search within that block. It combines the benefits of linear and binary search.",
      when: "Use Jump Search when binary search's random access is expensive (like linked lists) but you still want better than linear time. It's a good middle ground when you need something faster than linear search but simpler than binary search.",
      where: "Jump Search is used in systems where jumping back is costly, searching in linked lists where random access is expensive, and educational settings to demonstrate search algorithm trade-offs.",
      why: "Choose Jump Search when: (1) you have a sorted array, (2) jumping forward is cheap but random access is expensive, (3) you want O(√n) time complexity, or (4) you need a simpler alternative to binary search for certain data structures."
    }
  };

  const INTERPOLATION_SEARCH_INFO: SearchComplexityInfo = {
    name: "Interpolation Search",
    timeComplexity: {
      best: "O(1)",
      average: "O(log log n)",
      worst: "O(n)"
    },
    spaceComplexity: "O(1)",
    explanations: {
      how: "Interpolation Search improves on binary search by estimating the position of the target based on its value relative to the values at the boundaries. Instead of always going to the middle, it calculates a probe position that's likely closer to the target if values are uniformly distributed.",
      when: "Use Interpolation Search when the data is sorted AND uniformly distributed. It performs exceptionally well when values are evenly spread across the range. For non-uniform distributions, it can degrade to linear time.",
      where: "Interpolation Search is used in databases with uniformly distributed keys, phone directories, dictionaries with evenly spaced entries, and any scenario where the data distribution is known to be uniform.",
      why: "Choose Interpolation Search when: (1) the array is sorted, (2) values are uniformly distributed, (3) you want potentially faster than O(log n) average case, or (4) you're working with large datasets where the distribution is predictable."
    }
  };

  // Code snippets
  const BINARY_SEARCH_CODE = {
    javascript: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    }

    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}`,
    python: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid

        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1`
  };

  const LINEAR_SEARCH_CODE = {
    javascript: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }

  return -1;
}`,
    python: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i

    return -1`
  };

  const JUMP_SEARCH_CODE = {
    javascript: `function jumpSearch(arr, target) {
  const n = arr.length;
  const step = Math.floor(Math.sqrt(n));
  let prev = 0;

  while (arr[Math.min(step, n) - 1] < target) {
    prev = step;
    step += Math.floor(Math.sqrt(n));
    if (prev >= n) return -1;
  }

  while (arr[prev] < target) {
    prev++;
    if (prev === Math.min(step, n)) return -1;
  }

  if (arr[prev] === target) return prev;
  return -1;
}`,
    python: `def jump_search(arr, target):
    n = len(arr)
    step = int(n ** 0.5)
    prev = 0

    while arr[min(step, n) - 1] < target:
        prev = step
        step += int(n ** 0.5)
        if prev >= n:
            return -1

    while arr[prev] < target:
        prev += 1
        if prev == min(step, n):
            return -1

    if arr[prev] == target:
        return prev
    return -1`
  };

  const INTERPOLATION_SEARCH_CODE = {
    javascript: `function interpolationSearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high && target >= arr[low] && target <= arr[high]) {
    if (low === high) {
      if (arr[low] === target) return low;
      return -1;
    }

    const pos = low + Math.floor(
      ((target - arr[low]) * (high - low)) /
      (arr[high] - arr[low])
    );

    if (arr[pos] === target) return pos;
    if (arr[pos] < target) low = pos + 1;
    else high = pos - 1;
  }

  return -1;
}`,
    python: `def interpolation_search(arr, target):
    low = 0
    high = len(arr) - 1

    while low <= high and target >= arr[low] and target <= arr[high]:
        if low == high:
            if arr[low] == target:
                return low
            return -1

        pos = low + int(
            ((target - arr[low]) * (high - low)) /
            (arr[high] - arr[low])
        )

        if arr[pos] == target:
            return pos
        if arr[pos] < target:
            low = pos + 1
        else:
            high = pos - 1

    return -1`
  };

  const getCodeForAlgorithm = () => {
    switch (selectedAlgorithm) {
      case 'Binary Search':
        return BINARY_SEARCH_CODE;
      case 'Linear Search':
        return LINEAR_SEARCH_CODE;
      case 'Jump Search':
        return JUMP_SEARCH_CODE;
      case 'Interpolation Search':
        return INTERPOLATION_SEARCH_CODE;
      default:
        return BINARY_SEARCH_CODE;
    }
  };

  // Helper function to generate a range of numbers
  const range = (start: number, end: number): number[] => {
    const result: number[] = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  };

  const generateSortedArray = () => {
    const arr: number[] = [];
    for (let i = 0; i < arraySize; i++) {
      arr.push(Math.floor(Math.random() * 99) + 1);
    }
    arr.sort((a, b) => a - b);
    setArray(arr);
    resetSearchState();

    // 50% chance to include target in array
    if (Math.random() > 0.5 && arr.length > 0) {
      const randomIndex = Math.floor(Math.random() * arr.length);
      setTarget(arr[randomIndex]);
    }
  };

  const resetSearchState = () => {
    setComparing([]);
    setEliminatedIndices([]);
    setFoundIndex(null);
    setSearchResult(null);
    setLeft(0);
    setRight(array.length - 1);
    setMid(null);
    setCurrentLine(null);
    setComparisonMessage('');
    setHistory([]);
  };

  const saveToHistory = () => {
    setHistory(prev => [...prev, {
      array: [...array],
      target,
      comparing: [...comparing],
      eliminatedIndices: [...eliminatedIndices],
      foundIndex,
      left,
      right,
      mid,
      currentLine,
      message: comparisonMessage,
      searchResult
    }]);
  };

  const sleep = async (ms: number) => {
    saveToHistory();

    if (cancelRef.current) {
      throw new Error('CANCELLED');
    }

    const adjustedMs = ms / animationSpeed;
    await new Promise(resolve => setTimeout(resolve, adjustedMs));

    while (pauseRef.current && !cancelRef.current) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (stepForwardRef.current) {
      pauseRef.current = true;
      stepForwardRef.current = false;
    }

    if (cancelRef.current) {
      throw new Error('CANCELLED');
    }
  };

  const binarySearch = async () => {
    setIsSearching(true);
    resetSearchState();
    cancelRef.current = false;

    try {
      let l = 0;
      let r = array.length - 1;
      setLeft(l);
      setRight(r);

      setCurrentLine(2);
      await sleep(400);
      setCurrentLine(3);
      await sleep(400);

      while (l <= r) {
        setCurrentLine(5);
        await sleep(400);

        const m = Math.floor((l + r) / 2);
        setMid(m);
        setComparing([m]);
        setCurrentLine(6);
        setComparisonMessage(`Checking middle element at index ${m}: ${array[m]}`);
        await sleep(500);

        if (array[m] === target) {
          setCurrentLine(8);
          setFoundIndex(m);
          setSearchResult('found');
          setComparisonMessage(`Found ${target} at index ${m}!`);
          await sleep(500);
          return;
        }

        if (array[m] < target) {
          setCurrentLine(12);
          setComparisonMessage(`${target} > ${array[m]}, eliminating left half`);
          setEliminatedIndices(prev => [...prev, ...range(l, m + 1)]);
          await sleep(500);
          l = m + 1;
          setLeft(l);
        } else {
          setCurrentLine(14);
          setComparisonMessage(`${target} < ${array[m]}, eliminating right half`);
          setEliminatedIndices(prev => [...prev, ...range(m, r + 1)]);
          await sleep(500);
          r = m - 1;
          setRight(r);
        }

        setMid(null);
        setComparing([]);
        await sleep(300);
      }

      setCurrentLine(18);
      setSearchResult('not-found');
      setComparisonMessage(`Target ${target} not found in array`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Search error:', error);
      }
    } finally {
      setComparing([]);
      setCurrentLine(null);
      setIsSearching(false);
    }
  };

  const linearSearch = async () => {
    setIsSearching(true);
    resetSearchState();
    cancelRef.current = false;

    try {
      setCurrentLine(2);
      await sleep(400);

      for (let i = 0; i < array.length; i++) {
        setComparing([i]);
        setComparisonMessage(`Checking element at index ${i}: ${array[i]}`);
        setCurrentLine(3);
        await sleep(500);

        if (array[i] === target) {
          setCurrentLine(4);
          setFoundIndex(i);
          setSearchResult('found');
          setComparisonMessage(`Found ${target} at index ${i}!`);
          await sleep(500);
          return;
        }

        setEliminatedIndices(prev => [...prev, i]);
        await sleep(300);
      }

      setCurrentLine(7);
      setSearchResult('not-found');
      setComparisonMessage(`Target ${target} not found in array`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Search error:', error);
      }
    } finally {
      setComparing([]);
      setCurrentLine(null);
      setIsSearching(false);
    }
  };

  const jumpSearch = async () => {
    setIsSearching(true);
    resetSearchState();
    cancelRef.current = false;

    try {
      const n = array.length;
      let step = Math.floor(Math.sqrt(n));
      let prev = 0;

      setCurrentLine(2);
      setComparisonMessage(`Array size: ${n}, Jump step: ${step}`);
      await sleep(500);

      // Jumping phase
      while (array[Math.min(step, n) - 1] < target) {
        setCurrentLine(6);
        setComparing([Math.min(step, n) - 1]);
        setComparisonMessage(`Jumping: checking index ${Math.min(step, n) - 1} = ${array[Math.min(step, n) - 1]}`);
        await sleep(500);

        // Mark jumped-over elements as eliminated
        setEliminatedIndices(prev_elim => [...prev_elim, ...range(prev, step)]);

        prev = step;
        step += Math.floor(Math.sqrt(n));

        if (prev >= n) {
          setCurrentLine(9);
          setSearchResult('not-found');
          setComparisonMessage(`Target ${target} not found - exceeded array bounds`);
          return;
        }
      }

      // Linear search phase within the block
      setComparisonMessage(`Target might be in block [${prev}, ${Math.min(step, n) - 1}]. Starting linear search.`);
      await sleep(500);

      while (array[prev] < target) {
        setCurrentLine(12);
        setComparing([prev]);
        setComparisonMessage(`Linear search: checking index ${prev} = ${array[prev]}`);
        await sleep(500);

        setEliminatedIndices(prev_elim => [...prev_elim, prev]);
        prev++;

        if (prev === Math.min(step, n)) {
          setCurrentLine(14);
          setSearchResult('not-found');
          setComparisonMessage(`Target ${target} not found in block`);
          return;
        }
      }

      // Check if found
      setComparing([prev]);
      setCurrentLine(16);
      await sleep(500);

      if (array[prev] === target) {
        setFoundIndex(prev);
        setSearchResult('found');
        setComparisonMessage(`Found ${target} at index ${prev}!`);
      } else {
        setCurrentLine(17);
        setSearchResult('not-found');
        setComparisonMessage(`Target ${target} not found in array`);
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Search error:', error);
      }
    } finally {
      setComparing([]);
      setCurrentLine(null);
      setIsSearching(false);
    }
  };

  const interpolationSearch = async () => {
    setIsSearching(true);
    resetSearchState();
    cancelRef.current = false;

    try {
      let low = 0;
      let high = array.length - 1;
      setLeft(low);
      setRight(high);

      setCurrentLine(2);
      await sleep(400);
      setCurrentLine(3);
      await sleep(400);

      while (low <= high && target >= array[low] && target <= array[high]) {
        setCurrentLine(5);
        await sleep(400);

        if (low === high) {
          setCurrentLine(6);
          setComparing([low]);
          setComparisonMessage(`Only one element left at index ${low}: ${array[low]}`);
          await sleep(500);

          if (array[low] === target) {
            setCurrentLine(7);
            setFoundIndex(low);
            setSearchResult('found');
            setComparisonMessage(`Found ${target} at index ${low}!`);
            return;
          }
          setCurrentLine(8);
          setSearchResult('not-found');
          setComparisonMessage(`Target ${target} not found`);
          return;
        }

        // Calculate probe position
        const pos = low + Math.floor(
          ((target - array[low]) * (high - low)) /
          (array[high] - array[low])
        );

        setMid(pos);
        setComparing([pos]);
        setCurrentLine(11);
        setComparisonMessage(`Interpolated position: ${pos}, value: ${array[pos]}`);
        await sleep(500);

        if (array[pos] === target) {
          setCurrentLine(15);
          setFoundIndex(pos);
          setSearchResult('found');
          setComparisonMessage(`Found ${target} at index ${pos}!`);
          return;
        }

        if (array[pos] < target) {
          setCurrentLine(16);
          setComparisonMessage(`${target} > ${array[pos]}, searching higher`);
          setEliminatedIndices(prev => [...prev, ...range(low, pos + 1)]);
          await sleep(500);
          low = pos + 1;
          setLeft(low);
        } else {
          setCurrentLine(17);
          setComparisonMessage(`${target} < ${array[pos]}, searching lower`);
          setEliminatedIndices(prev => [...prev, ...range(pos, high + 1)]);
          await sleep(500);
          high = pos - 1;
          setRight(high);
        }

        setMid(null);
        setComparing([]);
        await sleep(300);
      }

      setCurrentLine(20);
      setSearchResult('not-found');
      setComparisonMessage(`Target ${target} not found - outside bounds`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Search error:', error);
      }
    } finally {
      setComparing([]);
      setCurrentLine(null);
      setIsSearching(false);
    }
  };

  const runSelectedAlgorithm = () => {
    switch (selectedAlgorithm) {
      case 'Binary Search':
        binarySearch();
        break;
      case 'Linear Search':
        linearSearch();
        break;
      case 'Jump Search':
        jumpSearch();
        break;
      case 'Interpolation Search':
        interpolationSearch();
        break;
    }
  };

  const stepForward = () => {
    if (isSearching) {
      stepForwardRef.current = true;
      pauseRef.current = false;
    } else {
      if (!selectedAlgorithm) {
        alert('Please select an algorithm first!');
        return;
      }

      stepForwardRef.current = true;
      pauseRef.current = false;
      setHistory([]);
      runSelectedAlgorithm();
    }
  };

  const stepBack = () => {
    if (history.length === 0) return;

    if (isSearching) {
      pauseRef.current = true;
      setIsPaused(true);
    }

    const previousState = history[history.length - 1];

    setArray(previousState.array);
    setTarget(previousState.target);
    setComparing(previousState.comparing);
    setEliminatedIndices(previousState.eliminatedIndices);
    setFoundIndex(previousState.foundIndex);
    setLeft(previousState.left);
    setRight(previousState.right);
    setMid(previousState.mid);
    setCurrentLine(previousState.currentLine);
    setComparisonMessage(previousState.message);
    setSearchResult(previousState.searchResult);

    setHistory(prev => prev.slice(0, -1));
  };

  const getBarColor = (index: number) => {
    if (foundIndex === index) {
      return {
        background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
        boxShadow: '0 6px 24px rgba(16, 185, 129, 0.6)'
      };
    }
    if (comparing.includes(index)) {
      return {
        background: 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)',
        boxShadow: '0 6px 24px rgba(234, 179, 8, 0.6)'
      };
    }
    if (eliminatedIndices.includes(index)) {
      return {
        background: 'linear-gradient(180deg, #4b5563 0%, #374151 100%)',
        boxShadow: 'none',
        opacity: 0.4
      };
    }
    return {
      background: 'linear-gradient(180deg, #5b9dff 0%, #3b7de8 100%)',
      boxShadow: '0 6px 24px rgba(91, 157, 255, 0.5)'
    };
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-b border-gray-700">
        {/* Left: Back to Home */}
        <Link
          to="/"
          className="text-blue-400 hover:text-blue-300 transition text-xs sm:text-sm whitespace-nowrap"
        >
          ← Back to Home
        </Link>

        {/* Center: Algorithm Selector */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">Searching Algorithms:</span>
          <select
            className="bg-gray-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer text-xs sm:text-sm flex-1 sm:flex-none"
            value={selectedAlgorithm || ''}
            disabled={isSearching}
            onChange={(e) => {
              const algorithm = e.target.value;
              setSelectedAlgorithm(algorithm);
              resetSearchState();

              if (algorithm === 'Binary Search') {
                setShowComplexity(true);
                setCurrentAlgorithm(BINARY_SEARCH_INFO);
              } else if (algorithm === 'Linear Search') {
                setShowComplexity(true);
                setCurrentAlgorithm(LINEAR_SEARCH_INFO);
              } else if (algorithm === 'Jump Search') {
                setShowComplexity(true);
                setCurrentAlgorithm(JUMP_SEARCH_INFO);
              } else if (algorithm === 'Interpolation Search') {
                setShowComplexity(true);
                setCurrentAlgorithm(INTERPOLATION_SEARCH_INFO);
              } else {
                setShowComplexity(false);
                setCurrentAlgorithm(null);
              }
            }}
          >
            <option value="">Choose...</option>
            <option value="Binary Search">Binary Search</option>
            <option value="Linear Search">Linear Search</option>
            <option value="Jump Search">Jump Search</option>
            <option value="Interpolation Search">Interpolation Search</option>
          </select>
        </div>

        {/* Right: Array Size, Target, and Generate */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">Size</span>
            <input
              type="range"
              min="5"
              max="15"
              value={arraySize}
              onChange={(e) => setArraySize(Number(e.target.value))}
              disabled={isSearching}
              className="w-16 sm:w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-blue-500"
            />
            <span className="bg-gray-700 px-2 py-1 rounded text-xs font-mono w-6 text-center">
              {arraySize}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-400">Target:</span>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              disabled={isSearching}
              className="w-16 sm:w-20 bg-gray-700 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
            />
          </div>
          <button
            onClick={generateSortedArray}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-xs sm:text-sm whitespace-nowrap"
          >
            Generate Sorted Array
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Side - Visualization and Controls */}
        <div className="w-full lg:w-[60%] space-y-6">
          {/* Array Visualization */}
          <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700 rounded-xl shadow-2xl p-8 relative">
            {/* Shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-xl"></div>

            <div className="relative z-10">
              <h2 className="text-xl font-bold text-center mb-4">
                {selectedAlgorithm ? `${selectedAlgorithm}: Array Visualization` : 'Array Visualization'}
              </h2>

              {/* Search Result Banner */}
              {searchResult && (
                <div className={`px-4 py-2 rounded-lg mb-4 text-center font-semibold ${
                  searchResult === 'found'
                    ? 'bg-green-900/50 text-green-400 border border-green-500'
                    : 'bg-red-900/50 text-red-400 border border-red-500'
                }`}>
                  {searchResult === 'found'
                    ? `Target ${target} found at index ${foundIndex}!`
                    : `Target ${target} not found in array`}
                </div>
              )}

              {/* Array Bars Container */}
              <div className="h-64 sm:h-80 lg:h-96 flex items-end justify-center gap-2 sm:gap-3 lg:gap-4 mb-4 px-2">
                {array.map((value, index) => (
                  <div key={index} className="flex flex-col items-center justify-end h-full" style={{ flex: '0 1 80px', minWidth: '35px', maxWidth: '80px' }}>
                    {/* Bar */}
                    <div
                      className={`w-full flex items-center justify-center transition-all duration-300 rounded-t-lg`}
                      style={{
                        height: `${(value / 100) * 85}%`,
                        minHeight: '50px',
                        ...getBarColor(index)
                      }}
                    >
                      <span className="text-white text-sm sm:text-lg font-bold">{value}</span>
                    </div>

                    {/* Index */}
                    <span className="text-gray-400 text-xs sm:text-sm font-mono mt-2">
                      {index}
                    </span>

                    {/* Pointer Labels */}
                    <div className="flex justify-center gap-1 mt-1 text-xs font-mono h-4">
                      {(selectedAlgorithm === 'Binary Search' || selectedAlgorithm === 'Interpolation Search') && (
                        <>
                          {index === left && !eliminatedIndices.includes(index) && <span className="text-blue-400 font-bold">L</span>}
                          {index === mid && <span className="text-yellow-400 font-bold">M</span>}
                          {index === right && !eliminatedIndices.includes(index) && <span className="text-purple-400 font-bold">R</span>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison Message */}
              {comparisonMessage && (
                <div className="text-center text-sm sm:text-base text-gray-300 mb-4">
                  {comparisonMessage}
                </div>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6">
            {/* Playback Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-6">
              <button
                onClick={stepBack}
                disabled={history.length === 0}
                className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
              >
                <span>⏮</span> <span className="hidden sm:inline">Step Back</span>
              </button>
              <button
                onClick={() => {
                  if (isSearching) {
                    const newPauseState = !isPaused;
                    setIsPaused(newPauseState);
                    pauseRef.current = newPauseState;
                  } else {
                    if (!selectedAlgorithm) {
                      alert('Please select an algorithm first!');
                      return;
                    }

                    pauseRef.current = false;
                    setHistory([]);
                    runSelectedAlgorithm();
                  }
                }}
                disabled={!selectedAlgorithm && !isSearching}
                className="px-4 sm:px-6 lg:px-7 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
              >
                <span>{isSearching ? (isPaused ? '▶' : '⏸') : '▶'}</span>
                <span className="hidden sm:inline">{isSearching ? (isPaused ? 'Resume' : 'Pause') : 'Play'}</span>
                <span className="sm:hidden">{isSearching ? (isPaused ? 'Resume' : 'Pause') : 'Play'}</span>
              </button>
              <button
                onClick={stepForward}
                disabled={!selectedAlgorithm && !isSearching}
                className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
              >
                <span className="hidden sm:inline">Step Forward</span> <span>⏭</span>
              </button>
              <button
                onClick={async () => {
                  cancelRef.current = true;
                  pauseRef.current = false;
                  stepForwardRef.current = false;

                  await new Promise(resolve => setTimeout(resolve, 50));

                  setIsSearching(false);
                  setIsPaused(false);
                  resetSearchState();
                  generateSortedArray();
                }}
                className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
              >
                <span>↻</span> <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            {/* Speed Slider */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4">
              <span className="text-xs sm:text-sm text-gray-400">Speed:</span>
              <input
                type="range"
                min="0.25"
                max="2"
                step="0.25"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                className="w-32 sm:w-48 lg:w-64 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs sm:text-sm text-gray-400 font-mono w-8 sm:w-12">{animationSpeed.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Right Side - Info Panels */}
        <div className="w-full lg:w-[40%] space-y-6">
          {/* Unified Info Panel - Complexity + How/When/Where/Why */}
          {showComplexity && currentAlgorithm && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
              {/* Algorithm Name Header */}
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-4 py-2 border-b border-gray-700">
                <h3 className="font-bold text-white">{currentAlgorithm.name}</h3>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-700 bg-gray-750">
                {(['complexity', 'how', 'when', 'where', 'why'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-2 py-2 font-semibold capitalize transition text-xs ${
                      activeTab === tab
                        ? 'bg-purple-600 text-white border-b-2 border-purple-400'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content - Fixed Height */}
              <div className="h-32 overflow-y-auto">
                {activeTab === 'complexity' ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-750 border-b border-gray-700">
                        <th className="text-left py-2 px-4 text-gray-300 font-semibold text-xs"></th>
                        <th className="text-center py-2 px-4 text-gray-300 font-semibold text-xs">Time</th>
                        <th className="text-center py-2 px-4 text-gray-300 font-semibold text-xs">Space</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      <tr className="border-b border-gray-700/50">
                        <td className="py-2 px-4 text-gray-400">Best</td>
                        <td className="text-center py-2 px-4 font-mono text-green-400">{currentAlgorithm.timeComplexity.best}</td>
                        <td className="text-center py-2 px-4 font-mono text-blue-400">{currentAlgorithm.spaceComplexity}</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-2 px-4 text-gray-400">Average</td>
                        <td className="text-center py-2 px-4 font-mono text-yellow-400">{currentAlgorithm.timeComplexity.average}</td>
                        <td className="text-center py-2 px-4 font-mono text-blue-400">{currentAlgorithm.spaceComplexity}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 text-gray-400">Worst</td>
                        <td className="text-center py-2 px-4 font-mono text-red-400">{currentAlgorithm.timeComplexity.worst}</td>
                        <td className="text-center py-2 px-4 font-mono text-blue-400">{currentAlgorithm.spaceComplexity}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-gray-300 text-sm leading-relaxed">
                    <p>{currentAlgorithm.explanations[activeTab]}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* X-Ray Code Viewer */}
          {showXRay && selectedAlgorithm && (
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
                      <span>target={target}</span>
                      {(selectedAlgorithm === 'Binary Search' || selectedAlgorithm === 'Interpolation Search') && (
                        <>
                          <span>left={left}</span>
                          <span>right={right}</span>
                          {mid !== null && <span>mid={mid}</span>}
                        </>
                      )}
                    </div>
                    <div className="mt-1">arr=[{array.join(', ')}]</div>
                  </div>
                </div>
              </div>

              {/* Code */}
              <div className="overflow-auto p-3 bg-gray-950 max-h-96">
                <pre className="text-xs font-mono leading-relaxed">
                  {getCodeForAlgorithm()[currentLanguage].split('\n').map((line, index) => {
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

export default SearchVisualizer;
