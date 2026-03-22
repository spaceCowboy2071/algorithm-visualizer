import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { ComplexityInfo, HashBucket, HashTableHistoryState } from '../../types/visualization';
import { useVisualizationControls } from '../../hooks/useVisualizationControls';
import { useHistory } from '../../hooks/useHistory';
import { useAnimatedSleep } from '../../hooks/useAnimatedSleep';
import { getAlgorithmInfo, getAlgorithmNames } from '../../data/algorithmData';
import PlaybackControls from '../shared/PlaybackControls';
import SpeedControl from '../shared/SpeedControl';
import HashTableView from '../shared/HashTableView';
import AlgorithmInfoPanel from '../shared/AlgorithmInfoPanel';
import XRayCodeViewer from '../shared/XRayCodeViewer';

let entryIdCounter = 0;
const genEntryId = (): string => `hentry-${++entryIdCounter}`;

function hashKey(key: number, size: number): number {
  return ((key % size) + size) % size; // handle negatives
}

function HashTableVisualizer() {
  // Hash table state
  const [buckets, setBuckets] = useState<HashBucket[]>([]);
  const [tableSize, setTableSize] = useState(7);
  const [collisionMode, setCollisionMode] = useState<'chaining' | 'linear-probing'>('chaining');

  // Operation selection
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<ComplexityInfo | null>(null);

  // Input value
  const [inputValue, setInputValue] = useState<number>(42);

  // Visualization state
  const [currentBucketIndex, setCurrentBucketIndex] = useState<number | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [highlightedBucketIndices, setHighlightedBucketIndices] = useState<number[]>([]);
  const [visitedEntryIds, setVisitedEntryIds] = useState<string[]>([]);
  const [foundEntryId, setFoundEntryId] = useState<string | null>(null);
  const [hashComputationStep, setHashComputationStep] = useState<string | null>(null);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [operationMessage, setOperationMessage] = useState<string>('');
  const [operationResult, setOperationResult] = useState<'success' | 'not-found' | null>(null);

  // Hooks
  const controls = useVisualizationControls();
  const { history, saveToHistory, clearHistory } = useHistory<HashTableHistoryState>();

  const createSnapshot = useCallback((): HashTableHistoryState => ({
    buckets: JSON.parse(JSON.stringify(buckets)),
    tableSize,
    mode: collisionMode,
    currentBucketIndex,
    currentEntryId,
    highlightedBucketIndices: [...highlightedBucketIndices],
    visitedEntryIds: [...visitedEntryIds],
    foundEntryId,
    hashComputationStep,
    currentLine,
    message: operationMessage,
    operationResult,
  }), [buckets, tableSize, collisionMode, currentBucketIndex, currentEntryId, highlightedBucketIndices, visitedEntryIds, foundEntryId, hashComputationStep, currentLine, operationMessage, operationResult]);

  const { sleep, animationSpeed, setAnimationSpeed } = useAnimatedSleep({
    pauseRef: controls.pauseRef,
    cancelRef: controls.cancelRef,
    stepForwardRef: controls.stepForwardRef,
    onBeforeSleep: () => saveToHistory(createSnapshot()),
  });

  const resetVisualizationState = useCallback(() => {
    setCurrentBucketIndex(null);
    setCurrentEntryId(null);
    setHighlightedBucketIndices([]);
    setVisitedEntryIds([]);
    setFoundEntryId(null);
    setHashComputationStep(null);
    setCurrentLine(null);
    setOperationMessage('');
    setOperationResult(null);
    clearHistory();
  }, [clearHistory]);

  // Generate hash table with some pre-populated values
  const generateTable = useCallback(() => {
    const newBuckets: HashBucket[] = Array.from({ length: tableSize }, (_, i) => ({
      index: i, entries: [],
    }));

    const count = Math.floor(tableSize * 0.6);
    const used = new Set<number>();
    while (used.size < count) {
      used.add(Math.floor(Math.random() * 99) + 1);
    }

    for (const val of used) {
      const idx = hashKey(val, tableSize);
      if (collisionMode === 'chaining') {
        newBuckets[idx].entries.push({ key: val, id: genEntryId() });
      } else {
        let probe = idx;
        while (newBuckets[probe].entries.length > 0) {
          probe = (probe + 1) % tableSize;
        }
        newBuckets[probe].entries.push({ key: val, id: genEntryId() });
      }
    }

    setBuckets(newBuckets);
    resetVisualizationState();
  }, [tableSize, collisionMode, resetVisualizationState]);

  const handleOperationChange = (operationName: string) => {
    setSelectedOperation(operationName);
    setCurrentAlgorithm(getAlgorithmInfo('hash-table', operationName));
    resetVisualizationState();
  };

  const handleModeChange = (mode: 'chaining' | 'linear-probing') => {
    setCollisionMode(mode);
    setSelectedOperation(null);
    setCurrentAlgorithm(null);
    resetVisualizationState();
    // Regenerate will happen when user clicks Generate
  };

  const getFilteredOperations = (): string[] => {
    const all = getAlgorithmNames('hash-table');
    return collisionMode === 'chaining'
      ? all.filter(n => n.includes('Chaining'))
      : all.filter(n => n.includes('Linear Probing'));
  };

  // Step back
  const stepBack = useCallback(() => {
    if (history.length === 0) return;
    if (controls.isRunning) {
      controls.pauseRef.current = true;
      controls.setIsPaused(true);
    }
    const prev = history[history.length - 1];
    setBuckets(prev.buckets);
    setCurrentBucketIndex(prev.currentBucketIndex);
    setCurrentEntryId(prev.currentEntryId);
    setHighlightedBucketIndices(prev.highlightedBucketIndices);
    setVisitedEntryIds(prev.visitedEntryIds);
    setFoundEntryId(prev.foundEntryId);
    setHashComputationStep(prev.hashComputationStep);
    setCurrentLine(prev.currentLine);
    setOperationMessage(prev.message);
    setOperationResult(prev.operationResult);
  }, [history, controls]);

  // Shared hash animation helper
  async function animateHash(key: number): Promise<number> {
    const idx = hashKey(key, tableSize);
    setCurrentLine(1);
    setOperationMessage(`Computing hash for key: ${key}`);
    await sleep(400);

    setHashComputationStep(`${key} % ${tableSize} = ${idx}`);
    setCurrentLine(2);
    setOperationMessage(`Hash index = ${key} % ${tableSize} = ${idx}`);
    await sleep(600);

    setCurrentBucketIndex(idx);
    setHighlightedBucketIndices([idx]);
    await sleep(400);
    return idx;
  }

  // ============================================
  // CHAINING OPERATIONS
  // ============================================

  const insertChainingOp = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;
    try {
      const idx = await animateHash(inputValue);

      setCurrentLine(3);
      setOperationMessage(`Appending ${inputValue} to chain at bucket [${idx}]`);
      await sleep(500);

      const newBuckets = JSON.parse(JSON.stringify(buckets)) as HashBucket[];
      const newEntry = { key: inputValue, id: genEntryId() };
      newBuckets[idx].entries.push(newEntry);
      setBuckets(newBuckets);
      setFoundEntryId(newEntry.id);
      setOperationResult('success');
      setOperationMessage(`Inserted ${inputValue} at bucket [${idx}]`);
      await sleep(500);
    } catch (e) {
      if (e instanceof Error && e.message !== 'CANCELLED') console.error(e);
    } finally {
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const searchChainingOp = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;
    try {
      const idx = await animateHash(inputValue);
      const chain = buckets[idx].entries;

      setCurrentLine(4);
      setOperationMessage(`Searching chain at bucket [${idx}] (${chain.length} entries)`);
      await sleep(400);

      for (let i = 0; i < chain.length; i++) {
        setCurrentEntryId(chain[i].id);
        setCurrentLine(5);
        setOperationMessage(`Comparing chain[${i}] = ${chain[i].key} with ${inputValue}`);
        await sleep(500);

        if (chain[i].key === inputValue) {
          setFoundEntryId(chain[i].id);
          setCurrentLine(6);
          setOperationResult('success');
          setOperationMessage(`Found ${inputValue} at bucket [${idx}], position ${i}`);
          await sleep(500);
          return;
        }
        setVisitedEntryIds(prev => [...prev, chain[i].id]);
      }

      setCurrentLine(9);
      setOperationResult('not-found');
      setOperationMessage(`${inputValue} not found in bucket [${idx}]`);
    } catch (e) {
      if (e instanceof Error && e.message !== 'CANCELLED') console.error(e);
    } finally {
      setCurrentEntryId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const deleteChainingOp = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;
    try {
      const idx = await animateHash(inputValue);
      const chain = buckets[idx].entries;

      setCurrentLine(4);
      setOperationMessage(`Searching chain at bucket [${idx}] for deletion`);
      await sleep(400);

      for (let i = 0; i < chain.length; i++) {
        setCurrentEntryId(chain[i].id);
        setCurrentLine(5);
        setOperationMessage(`Comparing chain[${i}] = ${chain[i].key} with ${inputValue}`);
        await sleep(500);

        if (chain[i].key === inputValue) {
          setFoundEntryId(chain[i].id);
          setCurrentLine(6);
          setOperationMessage(`Found ${inputValue}, removing from chain`);
          await sleep(500);

          const newBuckets = JSON.parse(JSON.stringify(buckets)) as HashBucket[];
          newBuckets[idx].entries.splice(i, 1);
          setBuckets(newBuckets);
          setOperationResult('success');
          setOperationMessage(`Deleted ${inputValue} from bucket [${idx}]`);
          await sleep(500);
          return;
        }
        setVisitedEntryIds(prev => [...prev, chain[i].id]);
      }

      setCurrentLine(9);
      setOperationResult('not-found');
      setOperationMessage(`${inputValue} not found in bucket [${idx}]`);
    } catch (e) {
      if (e instanceof Error && e.message !== 'CANCELLED') console.error(e);
    } finally {
      setCurrentEntryId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  // ============================================
  // LINEAR PROBING OPERATIONS
  // ============================================

  const insertProbingOp = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;
    try {
      const initialIdx = await animateHash(inputValue);
      let probe = initialIdx;
      const probed: number[] = [probe];

      setCurrentLine(4);
      while (buckets[probe].entries.length > 0 && !buckets[probe].isDeleted) {
        setOperationMessage(`Slot [${probe}] occupied (${buckets[probe].entries[0].key}), probing next...`);
        setHighlightedBucketIndices([...probed]);
        await sleep(500);

        probe = (probe + 1) % tableSize;
        if (probe === initialIdx) {
          setOperationResult('not-found');
          setOperationMessage('Table is full, cannot insert');
          return;
        }
        probed.push(probe);
        setCurrentBucketIndex(probe);
        setCurrentLine(5);
        await sleep(400);
      }

      setCurrentLine(7);
      setOperationMessage(`Found empty slot at [${probe}], inserting ${inputValue}`);
      await sleep(500);

      const newBuckets = JSON.parse(JSON.stringify(buckets)) as HashBucket[];
      const newEntry = { key: inputValue, id: genEntryId() };
      newBuckets[probe].entries = [newEntry];
      newBuckets[probe].isDeleted = false;
      setBuckets(newBuckets);
      setFoundEntryId(newEntry.id);
      setHighlightedBucketIndices(probed);
      setOperationResult('success');
      setOperationMessage(`Inserted ${inputValue} at slot [${probe}]${probe !== initialIdx ? ` (probed ${probed.length - 1} times)` : ''}`);
      await sleep(500);
    } catch (e) {
      if (e instanceof Error && e.message !== 'CANCELLED') console.error(e);
    } finally {
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const searchProbingOp = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;
    try {
      const initialIdx = await animateHash(inputValue);
      let probe = initialIdx;
      const probed: number[] = [];

      setCurrentLine(5);
      do {
        probed.push(probe);
        setCurrentBucketIndex(probe);
        setHighlightedBucketIndices([...probed]);

        const bucket = buckets[probe];

        if (bucket.entries.length === 0 && !bucket.isDeleted) {
          setCurrentLine(6);
          setOperationMessage(`Slot [${probe}] is empty, key not found`);
          await sleep(500);
          setOperationResult('not-found');
          setOperationMessage(`${inputValue} not found (empty slot at [${probe}])`);
          return;
        }

        if (bucket.entries.length > 0) {
          setCurrentEntryId(bucket.entries[0].id);
          setCurrentLine(7);
          setOperationMessage(`Checking slot [${probe}]: ${bucket.entries[0].key}`);
          await sleep(500);

          if (bucket.entries[0].key === inputValue) {
            setFoundEntryId(bucket.entries[0].id);
            setOperationResult('success');
            setOperationMessage(`Found ${inputValue} at slot [${probe}]`);
            await sleep(500);
            return;
          }
          setVisitedEntryIds(prev => [...prev, bucket.entries[0].id]);
        } else {
          // Tombstone — skip
          setCurrentLine(7);
          setOperationMessage(`Slot [${probe}] is DEL (tombstone), skipping...`);
          await sleep(400);
        }

        probe = (probe + 1) % tableSize;
        setCurrentLine(8);
        await sleep(300);
      } while (probe !== initialIdx);

      setOperationResult('not-found');
      setOperationMessage(`${inputValue} not found (full probe cycle)`);
    } catch (e) {
      if (e instanceof Error && e.message !== 'CANCELLED') console.error(e);
    } finally {
      setCurrentEntryId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const deleteProbingOp = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;
    try {
      const initialIdx = await animateHash(inputValue);
      let probe = initialIdx;
      const probed: number[] = [];

      setCurrentLine(5);
      do {
        probed.push(probe);
        setCurrentBucketIndex(probe);
        setHighlightedBucketIndices([...probed]);

        const bucket = buckets[probe];

        if (bucket.entries.length === 0 && !bucket.isDeleted) {
          setCurrentLine(6);
          setOperationMessage(`Slot [${probe}] is empty, key not found`);
          await sleep(500);
          setOperationResult('not-found');
          setOperationMessage(`${inputValue} not found`);
          return;
        }

        if (bucket.entries.length > 0) {
          setCurrentEntryId(bucket.entries[0].id);
          setCurrentLine(7);
          setOperationMessage(`Checking slot [${probe}]: ${bucket.entries[0].key}`);
          await sleep(500);

          if (bucket.entries[0].key === inputValue) {
            setFoundEntryId(bucket.entries[0].id);
            setCurrentLine(8);
            setOperationMessage(`Found ${inputValue}, marking as DEL (tombstone)`);
            await sleep(600);

            const newBuckets = JSON.parse(JSON.stringify(buckets)) as HashBucket[];
            newBuckets[probe].entries = [];
            newBuckets[probe].isDeleted = true;
            setBuckets(newBuckets);
            setOperationResult('success');
            setOperationMessage(`Deleted ${inputValue} from slot [${probe}] (tombstone placed)`);
            await sleep(500);
            return;
          }
          setVisitedEntryIds(prev => [...prev, bucket.entries[0].id]);
        } else {
          setOperationMessage(`Slot [${probe}] is DEL, skipping...`);
          await sleep(400);
        }

        probe = (probe + 1) % tableSize;
        setCurrentLine(9);
        await sleep(300);
      } while (probe !== initialIdx);

      setOperationResult('not-found');
      setOperationMessage(`${inputValue} not found`);
    } catch (e) {
      if (e instanceof Error && e.message !== 'CANCELLED') console.error(e);
    } finally {
      setCurrentEntryId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  // ============================================
  // CONTROL HANDLERS
  // ============================================

  const runSelectedOperation = () => {
    switch (selectedOperation) {
      case 'Insert (Chaining)': insertChainingOp(); break;
      case 'Search (Chaining)': searchChainingOp(); break;
      case 'Delete (Chaining)': deleteChainingOp(); break;
      case 'Insert (Linear Probing)': insertProbingOp(); break;
      case 'Search (Linear Probing)': searchProbingOp(); break;
      case 'Delete (Linear Probing)': deleteProbingOp(); break;
    }
  };

  const stepForward = () => {
    if (controls.isRunning) {
      controls.advanceStep();
    } else {
      if (!selectedOperation) { alert('Please select an operation first!'); return; }
      controls.startStepMode();
      clearHistory();
      runSelectedOperation();
    }
  };

  const handlePlayPause = () => {
    if (controls.isRunning) {
      controls.togglePause();
    } else {
      if (!selectedOperation) { alert('Please select an operation first!'); return; }
      controls.pauseRef.current = false;
      clearHistory();
      runSelectedOperation();
    }
  };

  const handleReset = async () => {
    await controls.reset();
    resetVisualizationState();
    generateTable();
  };

  const renderVariables = () => (
    <>
      <div className="flex gap-3 flex-wrap">
        <span>key={inputValue}</span>
        {currentBucketIndex !== null && <span>index={currentBucketIndex}</span>}
      </div>
      <div className="mt-1 text-[10px] opacity-60">
        size={tableSize}, mode={collisionMode}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-[#161b22] border-b border-[#30363d]">
        <span className="text-gray-500 text-xs font-mono whitespace-nowrap">terminal@algorithmviz/hash-tables</span>

        {/* Mode Toggle + Operation Selector */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex rounded-lg overflow-hidden border border-[#30363d]">
            <button
              onClick={() => handleModeChange('chaining')}
              disabled={controls.isRunning}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold transition ${
                collisionMode === 'chaining'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[#21262d] text-gray-400 hover:text-white'
              }`}
            >
              Chaining
            </button>
            <button
              onClick={() => handleModeChange('linear-probing')}
              disabled={controls.isRunning}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold transition ${
                collisionMode === 'linear-probing'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[#21262d] text-gray-400 hover:text-white'
              }`}
            >
              Linear Probing
            </button>
          </div>

          <select
            className="bg-[#21262d] text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-[#30363d] focus:outline-none focus:border-[var(--accent)] cursor-pointer text-xs sm:text-sm flex-1 sm:flex-none"
            value={selectedOperation || ''}
            disabled={controls.isRunning}
            onChange={(e) => handleOperationChange(e.target.value)}
          >
            <option value="">Choose...</option>
            {getFilteredOperations().map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Size, Value Input, Generate */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">Size</span>
            <input
              type="range"
              min={5}
              max={13}
              value={tableSize}
              onChange={(e) => setTableSize(Number(e.target.value))}
              disabled={controls.isRunning}
              className="w-16 sm:w-20 h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-[var(--accent)]"
            />
            <span className="bg-[#21262d] px-2 py-1 rounded text-xs font-mono w-6 text-center">{tableSize}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-400">Value:</span>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(Number(e.target.value))}
              disabled={controls.isRunning}
              className="w-16 sm:w-20 bg-[#21262d] text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[#30363d] focus:outline-none focus:border-[var(--accent)] text-xs sm:text-sm"
            />
          </div>

          <button
            onClick={generateTable}
            disabled={controls.isRunning}
            className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:bg-gray-600 disabled:cursor-not-allowed px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-xs sm:text-sm whitespace-nowrap"
          >
            Generate Table
          </button>
        </div>

        <Link to="/" className="text-gray-500 hover:text-[var(--accent)] text-xs transition whitespace-nowrap">← Back</Link>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 flex flex-col xl:flex-row gap-6">
        {/* Left Side */}
        <div className="w-full xl:w-[60%] space-y-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-center mb-4">
                {selectedOperation ? `${selectedOperation}: Hash Table` : 'Hash Table Visualization'}
              </h2>

              {operationResult && (
                <div className={`px-4 py-2 rounded-lg mb-4 text-center font-semibold ${
                  operationResult === 'success'
                    ? 'bg-green-900/50 text-green-400 border border-green-500'
                    : 'bg-red-900/50 text-red-400 border border-red-500'
                }`}>
                  {operationMessage}
                </div>
              )}

              <HashTableView
                buckets={buckets}
                mode={collisionMode}
                currentBucketIndex={currentBucketIndex}
                currentEntryId={currentEntryId}
                highlightedBucketIndices={highlightedBucketIndices}
                visitedEntryIds={visitedEntryIds}
                foundEntryId={foundEntryId}
                hashComputationStep={hashComputationStep}
              />

              {operationMessage && !operationResult && (
                <div className="text-center text-sm sm:text-base text-gray-300 mt-4">
                  {operationMessage}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl p-6">
            <PlaybackControls
              onStepBack={stepBack}
              onPlayPause={handlePlayPause}
              onStepForward={stepForward}
              onReset={handleReset}
              isRunning={controls.isRunning}
              isPaused={controls.isPaused}
              canStepBack={history.length > 0}
              disabled={!selectedOperation && !controls.isRunning}
            />
            <SpeedControl speed={animationSpeed} onSpeedChange={setAnimationSpeed} />
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full xl:w-[40%] space-y-6">
          {currentAlgorithm && <AlgorithmInfoPanel algorithm={currentAlgorithm} />}
          {selectedOperation && currentAlgorithm && (
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

export default HashTableVisualizer;
