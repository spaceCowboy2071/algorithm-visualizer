import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { AlgorithmMode, ComplexityInfo, SortingHistoryState, SearchHistoryState } from '../../types/visualization';
import { useVisualizationControls } from '../../hooks/useVisualizationControls';
import { useHistory } from '../../hooks/useHistory';
import { useAnimatedSleep } from '../../hooks/useAnimatedSleep';
import { getAlgorithmInfo, getAlgorithmNames } from '../../data/algorithmData';
import PlaybackControls from '../shared/PlaybackControls';
import SpeedControl from '../shared/SpeedControl';
import ArrayBars from '../shared/ArrayBars';
import AlgorithmInfoPanel from '../shared/AlgorithmInfoPanel';
import XRayCodeViewer from '../shared/XRayCodeViewer';
import SearchResultBanner from '../shared/SearchResultBanner';

interface ArrayVisualizerProps {
  initialMode?: AlgorithmMode;
}

type HistoryState = SortingHistoryState | SearchHistoryState;

function ArrayVisualizer({ initialMode = 'sorting' }: ArrayVisualizerProps) {
  // Mode state
  const [mode, setMode] = useState<AlgorithmMode>(initialMode);

  // Array state
  const [array, setArray] = useState<number[]>(() => {
    if (initialMode === 'sorting') {
      return [30, 80, 50, 20, 90];
    }
    return [5, 12, 23, 34, 45, 56, 67, 78, 89, 95];
  });
  const [arraySize, setArraySize] = useState(initialMode === 'sorting' ? 10 : 10);

  // Algorithm selection
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<ComplexityInfo | null>(null);

  // Visualization state (shared)
  const [comparing, setComparing] = useState<number[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [comparisonMessage, setComparisonMessage] = useState<string>('');

  // Searching-specific state
  const [target, setTarget] = useState<number>(45);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);
  const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null);
  const [left, setLeft] = useState<number>(0);
  const [right, setRight] = useState<number>(9);
  const [mid, setMid] = useState<number | null>(null);

  // Hooks
  const controls = useVisualizationControls();
  const { history, saveToHistory, clearHistory } = useHistory<HistoryState>();

  // Create snapshot function for history
  const createSnapshot = useCallback((): HistoryState => {
    if (mode === 'sorting') {
      return {
        array: [...array],
        comparing: [...comparing],
        sortedIndices: [...sortedIndices],
        currentLine,
        message: comparisonMessage,
      };
    }
    return {
      array: [...array],
      comparing: [...comparing],
      sortedIndices: [...sortedIndices],
      currentLine,
      message: comparisonMessage,
      target,
      eliminatedIndices: [...eliminatedIndices],
      foundIndex,
      left,
      right,
      mid,
      searchResult,
    };
  }, [array, comparing, sortedIndices, currentLine, comparisonMessage, mode, target, eliminatedIndices, foundIndex, left, right, mid, searchResult]);

  const { sleep, animationSpeed, setAnimationSpeed } = useAnimatedSleep({
    pauseRef: controls.pauseRef,
    cancelRef: controls.cancelRef,
    stepForwardRef: controls.stepForwardRef,
    onBeforeSleep: () => saveToHistory(createSnapshot()),
  });

  // Helper function to generate a range of numbers
  const range = (start: number, end: number): number[] => {
    const result: number[] = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  };

  // Generate random array (for sorting)
  const generateRandomArray = useCallback(() => {
    const newArray = [];
    for (let i = 0; i < arraySize; i++) {
      newArray.push(Math.floor(Math.random() * 99) + 1);
    }
    setArray(newArray);
    setComparing([]);
    setCurrentLine(null);
    setSortedIndices([]);
    setComparisonMessage('');
    clearHistory();
  }, [arraySize, clearHistory]);

  // Reset search-specific state
  const resetSearchState = useCallback(() => {
    setComparing([]);
    setEliminatedIndices([]);
    setFoundIndex(null);
    setSearchResult(null);
    setLeft(0);
    setRight(array.length - 1);
    setMid(null);
    setCurrentLine(null);
    setComparisonMessage('');
    clearHistory();
  }, [array.length, clearHistory]);

  // Generate sorted array (for searching)
  const generateSortedArray = useCallback(() => {
    const arr: number[] = [];
    for (let i = 0; i < arraySize; i++) {
      arr.push(Math.floor(Math.random() * 99) + 1);
    }
    arr.sort((a, b) => a - b);
    setArray(arr);
    // Reset search state inline to avoid circular dependency
    setComparing([]);
    setEliminatedIndices([]);
    setFoundIndex(null);
    setSearchResult(null);
    setLeft(0);
    setRight(arr.length - 1);
    setMid(null);
    setCurrentLine(null);
    setComparisonMessage('');
    clearHistory();

    // 50% chance to include target in array
    if (Math.random() > 0.5 && arr.length > 0) {
      const randomIndex = Math.floor(Math.random() * arr.length);
      setTarget(arr[randomIndex]);
    }
  }, [arraySize, clearHistory]);

  const handleModeChange = (newMode: AlgorithmMode) => {
    setMode(newMode);
    setSelectedAlgorithm(null);
    setCurrentAlgorithm(null);
    setComparing([]);
    setSortedIndices([]);
    setCurrentLine(null);
    setComparisonMessage('');
    clearHistory();

    if (newMode === 'sorting') {
      setArraySize(10);
      generateRandomArray();
    } else {
      setArraySize(10);
      generateSortedArray();
    }
  };

  const handleAlgorithmChange = (algorithmName: string) => {
    setSelectedAlgorithm(algorithmName);
    const info = getAlgorithmInfo(mode, algorithmName);
    setCurrentAlgorithm(info);
    if (mode === 'searching') {
      resetSearchState();
    }
  };

  // Step back function
  const stepBack = useCallback(() => {
    if (history.length === 0) return;

    // Pause if currently running
    if (controls.isRunning) {
      controls.pauseRef.current = true;
      controls.setIsPaused(true);
    }

    // Get the previous state
    const previousState = history[history.length - 1];

    // Restore common state
    setArray(previousState.array);
    setComparing(previousState.comparing);
    setSortedIndices(previousState.sortedIndices);
    setCurrentLine(previousState.currentLine);
    setComparisonMessage(previousState.message);

    // Restore search-specific state if in searching mode
    if ('target' in previousState) {
      const searchState = previousState as SearchHistoryState;
      setTarget(searchState.target);
      setEliminatedIndices(searchState.eliminatedIndices);
      setFoundIndex(searchState.foundIndex);
      setLeft(searchState.left);
      setRight(searchState.right);
      setMid(searchState.mid);
      setSearchResult(searchState.searchResult);
    }
  }, [history, controls]);

  // ============================================
  // SORTING ALGORITHMS
  // ============================================

  const bubbleSort = async () => {
    controls.setIsRunning(true);
    setSortedIndices([]);
    controls.cancelRef.current = false;

    try {
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

        sorted.push(n - i - 1);
        setSortedIndices([...sorted]);
        await sleep(200);
      }

      sorted.push(0);
      setSortedIndices([...sorted]);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Sorting error:', error);
      }
    } finally {
      setComparing([]);
      setComparisonMessage('');
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const quickSort = async () => {
    controls.setIsRunning(true);
    setSortedIndices([]);
    controls.cancelRef.current = false;

    try {
      const arr = [...array];

      const partition = async (low: number, high: number): Promise<number> => {
        const pivot = arr[high];
        let i = low - 1;

        setCurrentLine(12);
        await sleep(300);

        for (let j = low; j < high; j++) {
          setCurrentLine(14);
          await sleep(200);

          setComparing([j, high]);
          setComparisonMessage(`Comparing ${arr[j]} with pivot ${pivot}`);

          if (arr[j] < pivot) {
            i++;
            setCurrentLine(16);
            await sleep(300);

            [arr[i], arr[j]] = [arr[j], arr[i]];
            setArray([...arr]);
            await sleep(300);
          }
        }

        setCurrentLine(19);
        await sleep(300);

        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        setArray([...arr]);

        setSortedIndices(prev => [...prev, i + 1]);
        await sleep(300);

        return i + 1;
      };

      const quickSortRecursive = async (low: number, high: number): Promise<void> => {
        if (low < high) {
          setCurrentLine(2);
          await sleep(200);

          const pivotIndex = await partition(low, high);

          setCurrentLine(4);
          await sleep(200);

          await quickSortRecursive(low, pivotIndex - 1);

          setCurrentLine(5);
          await sleep(200);

          await quickSortRecursive(pivotIndex + 1, high);
        } else if (low === high) {
          setSortedIndices(prev => [...prev, low]);
        }
      };

      await quickSortRecursive(0, arr.length - 1);
      setSortedIndices(Array.from({ length: arr.length }, (_, i) => i));
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Sorting error:', error);
      }
    } finally {
      setComparing([]);
      setComparisonMessage('');
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const mergeSort = async () => {
    controls.setIsRunning(true);
    setSortedIndices([]);
    controls.cancelRef.current = false;

    try {
      const arr = [...array];

      const merge = async (leftIdx: number, midIdx: number, rightIdx: number) => {
        const leftArr = arr.slice(leftIdx, midIdx + 1);
        const rightArr = arr.slice(midIdx + 1, rightIdx + 1);

        let i = 0, j = 0, k = leftIdx;

        setCurrentLine(12);
        await sleep(200);

        while (i < leftArr.length && j < rightArr.length) {
          setCurrentLine(14);
          await sleep(200);

          setComparing([leftIdx + i, midIdx + 1 + j]);
          setComparisonMessage(`Comparing ${leftArr[i]} and ${rightArr[j]}`);

          if (leftArr[i] <= rightArr[j]) {
            setCurrentLine(16);
            await sleep(300);

            arr[k] = leftArr[i];
            i++;
          } else {
            setCurrentLine(19);
            await sleep(300);

            arr[k] = rightArr[j];
            j++;
          }

          setArray([...arr]);
          k++;
          await sleep(300);
        }

        while (i < leftArr.length) {
          setCurrentLine(25);
          await sleep(200);

          arr[k] = leftArr[i];
          setArray([...arr]);
          i++;
          k++;
          await sleep(200);
        }

        while (j < rightArr.length) {
          setCurrentLine(31);
          await sleep(200);

          arr[k] = rightArr[j];
          setArray([...arr]);
          j++;
          k++;
          await sleep(200);
        }

        const newSorted: number[] = [];
        for (let idx = leftIdx; idx <= rightIdx; idx++) {
          newSorted.push(idx);
        }
        setSortedIndices(prev => [...new Set([...prev, ...newSorted])]);
        await sleep(300);
      };

      const mergeSortRecursive = async (leftIdx: number, rightIdx: number): Promise<void> => {
        if (leftIdx < rightIdx) {
          setCurrentLine(2);
          await sleep(200);

          const midIdx = Math.floor((leftIdx + rightIdx) / 2);

          setCurrentLine(4);
          await sleep(200);

          await mergeSortRecursive(leftIdx, midIdx);

          setCurrentLine(5);
          await sleep(200);

          await mergeSortRecursive(midIdx + 1, rightIdx);

          setCurrentLine(7);
          await sleep(200);

          await merge(leftIdx, midIdx, rightIdx);
        }
      };

      await mergeSortRecursive(0, arr.length - 1);
      setSortedIndices(Array.from({ length: arr.length }, (_, i) => i));
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Sorting error:', error);
      }
    } finally {
      setComparing([]);
      setComparisonMessage('');
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  // ============================================
  // SEARCHING ALGORITHMS
  // ============================================

  const binarySearch = async () => {
    controls.setIsRunning(true);
    resetSearchState();
    controls.cancelRef.current = false;

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
      controls.setIsRunning(false);
    }
  };

  const linearSearch = async () => {
    controls.setIsRunning(true);
    resetSearchState();
    controls.cancelRef.current = false;

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
      controls.setIsRunning(false);
    }
  };

  const jumpSearch = async () => {
    controls.setIsRunning(true);
    resetSearchState();
    controls.cancelRef.current = false;

    try {
      const n = array.length;
      let step = Math.floor(Math.sqrt(n));
      let prev = 0;

      setCurrentLine(2);
      setComparisonMessage(`Array size: ${n}, Jump step: ${step}`);
      await sleep(500);

      while (array[Math.min(step, n) - 1] < target) {
        setCurrentLine(6);
        setComparing([Math.min(step, n) - 1]);
        setComparisonMessage(`Jumping: checking index ${Math.min(step, n) - 1} = ${array[Math.min(step, n) - 1]}`);
        await sleep(500);

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
      controls.setIsRunning(false);
    }
  };

  const interpolationSearch = async () => {
    controls.setIsRunning(true);
    resetSearchState();
    controls.cancelRef.current = false;

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
      controls.setIsRunning(false);
    }
  };

  // Run the selected algorithm
  const runSelectedAlgorithm = () => {
    if (mode === 'sorting') {
      switch (selectedAlgorithm) {
        case 'Bubble Sort':
          bubbleSort();
          break;
        case 'Quick Sort':
          quickSort();
          break;
        case 'Merge Sort':
          mergeSort();
          break;
      }
    } else {
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
    }
  };

  // Step forward function
  const stepForward = () => {
    if (controls.isRunning) {
      controls.advanceStep();
    } else {
      if (!selectedAlgorithm) {
        alert('Please select an algorithm first!');
        return;
      }

      controls.startStepMode();
      clearHistory();
      runSelectedAlgorithm();
    }
  };

  // Play/Pause handler
  const handlePlayPause = () => {
    if (controls.isRunning) {
      controls.togglePause();
    } else {
      if (!selectedAlgorithm) {
        alert('Please select an algorithm first!');
        return;
      }

      controls.pauseRef.current = false;
      clearHistory();
      runSelectedAlgorithm();
    }
  };

  // Reset handler
  const handleReset = async () => {
    await controls.reset();
    setComparisonMessage('');
    setComparing([]);
    setSortedIndices([]);
    setCurrentLine(null);
    clearHistory();

    if (mode === 'sorting') {
      generateRandomArray();
    } else {
      resetSearchState();
      generateSortedArray();
    }
  };

  // Determine if pointers should be shown
  const showPointers = mode === 'searching' &&
    (selectedAlgorithm === 'Binary Search' || selectedAlgorithm === 'Interpolation Search');

  // Variables display for X-Ray Code Viewer
  const renderVariables = () => {
    if (mode === 'sorting') {
      return (
        <>
          <div className="flex gap-3 flex-wrap">
            <span>i=0</span>
            <span>j=3</span>
            <span>temp=null</span>
          </div>
          <div className="mt-1">arr=[{array.join(', ')}]</div>
        </>
      );
    }
    return (
      <>
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
      </>
    );
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

        {/* Center: Mode and Algorithm Selector */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Mode Selector */}
          <select
            className="bg-gray-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer text-xs sm:text-sm"
            value={mode}
            disabled={controls.isRunning}
            onChange={(e) => handleModeChange(e.target.value as AlgorithmMode)}
          >
            <option value="sorting">Sorting</option>
            <option value="searching">Searching</option>
          </select>

          {/* Algorithm Selector */}
          <select
            className="bg-gray-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer text-xs sm:text-sm flex-1 sm:flex-none"
            value={selectedAlgorithm || ''}
            disabled={controls.isRunning}
            onChange={(e) => handleAlgorithmChange(e.target.value)}
          >
            <option value="">Choose...</option>
            {getAlgorithmNames(mode).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Array Size, Target (if searching), and Generate */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
              {mode === 'sorting' ? 'Array Size' : 'Size'}
            </span>
            <input
              type="range"
              min={mode === 'sorting' ? 1 : 5}
              max={mode === 'sorting' ? 10 : 15}
              value={arraySize}
              onChange={(e) => setArraySize(Number(e.target.value))}
              disabled={controls.isRunning}
              className="w-16 sm:w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-blue-500"
            />
            <span className="bg-gray-700 px-2 py-1 rounded text-xs font-mono w-6 text-center">
              {arraySize}
            </span>
          </div>

          {/* Target input (searching only) */}
          {mode === 'searching' && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-400">Target:</span>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                disabled={controls.isRunning}
                className="w-16 sm:w-20 bg-gray-700 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
              />
            </div>
          )}

          <button
            onClick={mode === 'sorting' ? generateRandomArray : generateSortedArray}
            disabled={controls.isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-xs sm:text-sm whitespace-nowrap"
          >
            {mode === 'sorting' ? 'Generate Array' : 'Generate Sorted Array'}
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
              <h2 className="text-xl font-bold text-center mb-4 sm:mb-8">
                {selectedAlgorithm ? `${selectedAlgorithm}: Array Visualization` : 'Array Visualization'}
              </h2>

              {/* Search Result Banner (searching mode only) */}
              {mode === 'searching' && searchResult && (
                <SearchResultBanner
                  result={searchResult}
                  target={target}
                  foundIndex={foundIndex}
                />
              )}

              {/* Array Bars */}
              <ArrayBars
                array={array}
                comparing={comparing}
                sortedIndices={sortedIndices}
                eliminatedIndices={eliminatedIndices}
                foundIndex={foundIndex}
                showPointers={showPointers}
                left={left}
                right={right}
                mid={mid}
                mode={mode}
              />

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
            <PlaybackControls
              onStepBack={stepBack}
              onPlayPause={handlePlayPause}
              onStepForward={stepForward}
              onReset={handleReset}
              isRunning={controls.isRunning}
              isPaused={controls.isPaused}
              canStepBack={history.length > 0}
              disabled={!selectedAlgorithm && !controls.isRunning}
            />
            <SpeedControl speed={animationSpeed} onSpeedChange={setAnimationSpeed} />
          </div>
        </div>

        {/* Right Side - Info Panels */}
        <div className="w-full lg:w-[40%] space-y-6">
          {/* Algorithm Info Panel */}
          {currentAlgorithm && <AlgorithmInfoPanel algorithm={currentAlgorithm} />}

          {/* X-Ray Code Viewer */}
          {selectedAlgorithm && currentAlgorithm && (
            <XRayCodeViewer
              code={currentAlgorithm.code}
              currentLine={currentLine}
              variables={renderVariables()}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ArrayVisualizer;
