import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { ComplexityInfo, LinkedListNode, LinkedListHistoryState } from '../../types/visualization';
import { useVisualizationControls } from '../../hooks/useVisualizationControls';
import { useHistory } from '../../hooks/useHistory';
import { useAnimatedSleep } from '../../hooks/useAnimatedSleep';
import { getAlgorithmInfo, getAlgorithmNames } from '../../data/algorithmData';
import PlaybackControls from '../shared/PlaybackControls';
import SpeedControl from '../shared/SpeedControl';
import LinkedListNodes from '../shared/LinkedListNodes';
import AlgorithmInfoPanel from '../shared/AlgorithmInfoPanel';
import XRayCodeViewer from '../shared/XRayCodeViewer';

// Generate unique IDs for nodes
let nodeIdCounter = 0;
const generateNodeId = (): string => {
  nodeIdCounter += 1;
  return `node-${nodeIdCounter}`;
};

function LinkedListVisualizer() {
  // List state
  const [nodes, setNodes] = useState<LinkedListNode[]>([]);
  const [listSize, setListSize] = useState(5);

  // Operation selection
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<ComplexityInfo | null>(null);

  // Input value for operations
  const [inputValue, setInputValue] = useState<number>(42);

  // Visualization state
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [comparingNodeIds, setComparingNodeIds] = useState<string[]>([]);
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);
  const [foundNodeId, setFoundNodeId] = useState<string | null>(null);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [operationMessage, setOperationMessage] = useState<string>('');
  const [operationResult, setOperationResult] = useState<'success' | 'not-found' | null>(null);

  // Hooks
  const controls = useVisualizationControls();
  const { history, saveToHistory, clearHistory } = useHistory<LinkedListHistoryState>();

  // Create snapshot for history
  const createSnapshot = useCallback((): LinkedListHistoryState => {
    return {
      nodes: nodes.map(n => ({ ...n })),
      currentNodeId,
      comparingNodeIds: [...comparingNodeIds],
      visitedNodeIds: [...visitedNodeIds],
      foundNodeId,
      currentLine,
      message: operationMessage,
      operationResult,
    };
  }, [nodes, currentNodeId, comparingNodeIds, visitedNodeIds, foundNodeId, currentLine, operationMessage, operationResult]);

  const { sleep, animationSpeed, setAnimationSpeed } = useAnimatedSleep({
    pauseRef: controls.pauseRef,
    cancelRef: controls.cancelRef,
    stepForwardRef: controls.stepForwardRef,
    onBeforeSleep: () => saveToHistory(createSnapshot()),
  });

  // Reset visualization state
  const resetVisualizationState = useCallback(() => {
    setCurrentNodeId(null);
    setComparingNodeIds([]);
    setVisitedNodeIds([]);
    setFoundNodeId(null);
    setCurrentLine(null);
    setOperationMessage('');
    setOperationResult(null);
    clearHistory();
  }, [clearHistory]);

  // Generate random linked list
  const generateRandomList = useCallback(() => {
    const newNodes: LinkedListNode[] = [];
    for (let i = 0; i < listSize; i++) {
      newNodes.push({
        id: generateNodeId(),
        value: Math.floor(Math.random() * 99) + 1,
      });
    }
    setNodes(newNodes);
    resetVisualizationState();
  }, [listSize, resetVisualizationState]);

  // Handle operation selection
  const handleOperationChange = (operationName: string) => {
    setSelectedOperation(operationName);
    const info = getAlgorithmInfo('linked-list', operationName);
    setCurrentAlgorithm(info);
    resetVisualizationState();
  };

  // Step back function
  const stepBack = useCallback(() => {
    if (history.length === 0) return;

    if (controls.isRunning) {
      controls.pauseRef.current = true;
      controls.setIsPaused(true);
    }

    const previousState = history[history.length - 1];
    setNodes(previousState.nodes);
    setCurrentNodeId(previousState.currentNodeId);
    setComparingNodeIds(previousState.comparingNodeIds);
    setVisitedNodeIds(previousState.visitedNodeIds);
    setFoundNodeId(previousState.foundNodeId);
    setCurrentLine(previousState.currentLine);
    setOperationMessage(previousState.message);
    setOperationResult(previousState.operationResult);
  }, [history, controls]);

  // ============================================
  // LINKED LIST OPERATIONS
  // ============================================

  const searchOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      setCurrentLine(2);
      setOperationMessage(`Searching for value: ${inputValue}`);
      await sleep(400);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        setCurrentNodeId(node.id);
        setCurrentLine(4);
        setOperationMessage(`Checking node at index ${i}: value = ${node.value}`);
        await sleep(500);

        setCurrentLine(5);
        if (node.value === inputValue) {
          setFoundNodeId(node.id);
          setOperationResult('success');
          setCurrentLine(6);
          setOperationMessage(`Found ${inputValue} at index ${i}!`);
          await sleep(500);
          return;
        }

        setVisitedNodeIds(prev => [...prev, node.id]);
        setCurrentLine(8);
        await sleep(400);
      }

      setCurrentLine(11);
      setOperationResult('not-found');
      setOperationMessage(`Value ${inputValue} not found in the list`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Operation error:', error);
      }
    } finally {
      setCurrentNodeId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const insertAtHeadOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      setCurrentLine(2);
      setOperationMessage(`Creating new node with value: ${inputValue}`);
      await sleep(500);

      const newNode: LinkedListNode = {
        id: generateNodeId(),
        value: inputValue,
      };

      setCurrentLine(3);
      setOperationMessage(`Setting new node's next to current head`);
      await sleep(500);

      setNodes(prev => [newNode, ...prev]);
      setFoundNodeId(newNode.id);
      setOperationResult('success');
      setCurrentLine(4);
      setOperationMessage(`Inserted ${inputValue} at head successfully!`);
      await sleep(500);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Operation error:', error);
      }
    } finally {
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const insertAtTailOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      const newNode: LinkedListNode = {
        id: generateNodeId(),
        value: inputValue,
      };

      setCurrentLine(2);
      setOperationMessage(`Creating new node with value: ${inputValue}`);
      await sleep(500);

      if (nodes.length === 0) {
        setCurrentLine(4);
        setOperationMessage('List is empty, new node becomes head');
        await sleep(500);
        setNodes([newNode]);
        setFoundNodeId(newNode.id);
        setOperationResult('success');
        setOperationMessage(`Inserted ${inputValue} as head (list was empty)`);
        return;
      }

      setCurrentLine(7);
      setOperationMessage('Traversing to find the tail...');
      await sleep(400);

      // Traverse to find tail
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        setCurrentNodeId(node.id);
        setCurrentLine(8);
        setOperationMessage(`At node ${i}: value = ${node.value}`);
        await sleep(400);

        if (i < nodes.length - 1) {
          setVisitedNodeIds(prev => [...prev, node.id]);
        }
      }

      setCurrentLine(10);
      setOperationMessage(`Found tail, appending new node`);
      await sleep(500);

      setNodes(prev => [...prev, newNode]);
      setFoundNodeId(newNode.id);
      setOperationResult('success');
      setCurrentLine(12);
      setOperationMessage(`Inserted ${inputValue} at tail successfully!`);
      await sleep(500);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Operation error:', error);
      }
    } finally {
      setCurrentNodeId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const deleteOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      if (nodes.length === 0) {
        setCurrentLine(2);
        setOperationResult('not-found');
        setOperationMessage('List is empty, nothing to delete');
        await sleep(500);
        return;
      }

      setCurrentLine(4);
      setOperationMessage(`Searching for node with value: ${inputValue}`);
      await sleep(400);

      // Check if head should be deleted
      if (nodes[0].value === inputValue) {
        setCurrentNodeId(nodes[0].id);
        setCurrentLine(5);
        setOperationMessage(`Found ${inputValue} at head, removing it`);
        await sleep(500);

        setCurrentLine(6);
        setNodes(prev => prev.slice(1));
        setOperationResult('success');
        setOperationMessage(`Deleted ${inputValue} from head`);
        await sleep(500);
        return;
      }

      // Search for node to delete
      setCurrentLine(9);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        setCurrentNodeId(node.id);
        setCurrentLine(10);
        setOperationMessage(`Checking node at index ${i}: value = ${node.value}`);
        await sleep(400);

        // Check next node
        if (i < nodes.length - 1 && nodes[i + 1].value === inputValue) {
          setCurrentLine(11);
          setComparingNodeIds([nodes[i + 1].id]);
          setOperationMessage(`Found ${inputValue} at index ${i + 1}, updating pointers`);
          await sleep(500);

          setCurrentLine(12);
          setNodes(prev => [...prev.slice(0, i + 1), ...prev.slice(i + 2)]);
          setOperationResult('success');
          setOperationMessage(`Deleted ${inputValue} successfully!`);
          await sleep(500);
          return;
        }

        setVisitedNodeIds(prev => [...prev, node.id]);
      }

      setCurrentLine(17);
      setOperationResult('not-found');
      setOperationMessage(`Value ${inputValue} not found in the list`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Operation error:', error);
      }
    } finally {
      setCurrentNodeId(null);
      setComparingNodeIds([]);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const reverseOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      if (nodes.length === 0) {
        setOperationResult('not-found');
        setOperationMessage('List is empty, nothing to reverse');
        await sleep(500);
        return;
      }

      setCurrentLine(2);
      setOperationMessage('Initializing: prev = null, current = head');
      await sleep(500);

      const reversedNodes: LinkedListNode[] = [];

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        setCurrentNodeId(node.id);
        setCurrentLine(5);
        setOperationMessage(`Processing node at index ${i}: value = ${node.value}`);
        await sleep(400);

        setCurrentLine(6);
        setOperationMessage(`Saving next pointer, reversing current's pointer`);
        await sleep(400);

        // Build reversed list
        reversedNodes.unshift({ ...node });

        setCurrentLine(8);
        setOperationMessage(`Moving prev and current forward`);
        await sleep(400);

        setVisitedNodeIds(prev => [...prev, node.id]);
      }

      setCurrentLine(11);
      setOperationMessage('Updating list with reversed order');
      await sleep(500);

      setNodes(reversedNodes);
      setOperationResult('success');
      setOperationMessage('List reversed successfully!');
      await sleep(500);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') {
        console.error('Operation error:', error);
      }
    } finally {
      setCurrentNodeId(null);
      setVisitedNodeIds([]);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  // Run the selected operation
  const runSelectedOperation = () => {
    switch (selectedOperation) {
      case 'Search':
        searchOperation();
        break;
      case 'Insert at Head':
        insertAtHeadOperation();
        break;
      case 'Insert at Tail':
        insertAtTailOperation();
        break;
      case 'Delete':
        deleteOperation();
        break;
      case 'Reverse':
        reverseOperation();
        break;
    }
  };

  // Step forward function
  const stepForward = () => {
    if (controls.isRunning) {
      controls.advanceStep();
    } else {
      if (!selectedOperation) {
        alert('Please select an operation first!');
        return;
      }
      controls.startStepMode();
      clearHistory();
      runSelectedOperation();
    }
  };

  // Play/Pause handler
  const handlePlayPause = () => {
    if (controls.isRunning) {
      controls.togglePause();
    } else {
      if (!selectedOperation) {
        alert('Please select an operation first!');
        return;
      }
      controls.pauseRef.current = false;
      clearHistory();
      runSelectedOperation();
    }
  };

  // Reset handler
  const handleReset = async () => {
    await controls.reset();
    resetVisualizationState();
    generateRandomList();
  };

  // Variables display for X-Ray Code Viewer
  const renderVariables = () => {
    const currentIndex = currentNodeId ? nodes.findIndex(n => n.id === currentNodeId) : -1;
    return (
      <>
        <div className="flex gap-3 flex-wrap">
          {selectedOperation !== 'Reverse' && <span>target={inputValue}</span>}
          {currentNodeId && <span>current=[{currentIndex}]</span>}
          {selectedOperation === 'Reverse' && <span>prev={currentIndex > 0 ? `[${currentIndex - 1}]` : 'null'}</span>}
        </div>
        <div className="mt-1">
          list=[{nodes.map(n => n.value).join(' → ')}] → null
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-[#161b22] border-b border-[#30363d]">
        {/* Left: Back to Home */}
        <Link
          to="/"
          className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition text-xs sm:text-sm whitespace-nowrap"
        >
          ← Back to Home
        </Link>

        {/* Center: Operation Selector */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">Operation:</span>
          <select
            className="bg-[#21262d] text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-[#30363d] focus:outline-none focus:border-[var(--accent)] cursor-pointer text-xs sm:text-sm flex-1 sm:flex-none"
            value={selectedOperation || ''}
            disabled={controls.isRunning}
            onChange={(e) => handleOperationChange(e.target.value)}
          >
            <option value="">Choose...</option>
            {getAlgorithmNames('linked-list').map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: List Size, Value Input, and Generate */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">Size</span>
            <input
              type="range"
              min={1}
              max={8}
              value={listSize}
              onChange={(e) => setListSize(Number(e.target.value))}
              disabled={controls.isRunning}
              className="w-16 sm:w-20 h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-[var(--accent)]"
            />
            <span className="bg-[#21262d] px-2 py-1 rounded text-xs font-mono w-6 text-center">
              {listSize}
            </span>
          </div>

          {/* Value input (for operations that need it) */}
          {selectedOperation && selectedOperation !== 'Reverse' && (
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
          )}

          <button
            onClick={generateRandomList}
            disabled={controls.isRunning}
            className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:bg-gray-600 disabled:cursor-not-allowed px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-xs sm:text-sm whitespace-nowrap"
          >
            Generate List
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 flex flex-col xl:flex-row gap-6">
        {/* Left Side - Visualization and Controls */}
        <div className="w-full xl:w-[60%] space-y-6">
          {/* Linked List Visualization */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">

            <div className="relative z-10">
              <h2 className="text-xl font-bold text-center mb-4">
                {selectedOperation ? `${selectedOperation}: Linked List Visualization` : 'Linked List Visualization'}
              </h2>

              {/* Operation Result Banner */}
              {operationResult && (
                <div
                  className={`px-4 py-2 rounded-lg mb-4 text-center font-semibold ${
                    operationResult === 'success'
                      ? 'bg-green-900/50 text-green-400 border border-green-500'
                      : 'bg-red-900/50 text-red-400 border border-red-500'
                  }`}
                >
                  {operationMessage}
                </div>
              )}

              {/* Linked List Nodes */}
              <LinkedListNodes
                nodes={nodes}
                currentNodeId={currentNodeId}
                comparingNodeIds={comparingNodeIds}
                visitedNodeIds={visitedNodeIds}
                foundNodeId={foundNodeId}
              />

              {/* Operation Message */}
              {operationMessage && !operationResult && (
                <div className="text-center text-sm sm:text-base text-gray-300 mt-4">
                  {operationMessage}
                </div>
              )}
            </div>
          </div>

          {/* Controls Panel */}
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

        {/* Right Side - Info Panels */}
        <div className="w-full xl:w-[40%] space-y-6">
          {/* Algorithm Info Panel */}
          {currentAlgorithm && <AlgorithmInfoPanel algorithm={currentAlgorithm} />}

          {/* X-Ray Code Viewer */}
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

export default LinkedListVisualizer;
