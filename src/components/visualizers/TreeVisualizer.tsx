import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { ComplexityInfo, TreeNodeData, TreeHistoryState } from '../../types/visualization';
import { useVisualizationControls } from '../../hooks/useVisualizationControls';
import { useHistory } from '../../hooks/useHistory';
import { useAnimatedSleep } from '../../hooks/useAnimatedSleep';
import { getAlgorithmInfo, getAlgorithmNames } from '../../data/algorithmData';
import PlaybackControls from '../shared/PlaybackControls';
import SpeedControl from '../shared/SpeedControl';
import TreeCanvas from '../shared/TreeCanvas';
import AlgorithmInfoPanel from '../shared/AlgorithmInfoPanel';
import XRayCodeViewer from '../shared/XRayCodeViewer';

// ============================================
// BST Runtime Node (recursive structure)
// ============================================

interface TreeNode {
  id: string;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

let nodeIdCounter = 0;
const genId = (): string => `tnode-${++nodeIdCounter}`;

// ============================================
// Serialization helpers (for history snapshots)
// ============================================

function serializeTree(root: TreeNode | null): { nodes: TreeNodeData[]; rootId: string | null } {
  if (!root) return { nodes: [], rootId: null };
  const flat: TreeNodeData[] = [];
  function walk(node: TreeNode) {
    flat.push({ id: node.id, value: node.value, leftId: node.left?.id ?? null, rightId: node.right?.id ?? null });
    if (node.left) walk(node.left);
    if (node.right) walk(node.right);
  }
  walk(root);
  return { nodes: flat, rootId: root.id };
}

function deserializeTree(nodes: TreeNodeData[], rootId: string | null): TreeNode | null {
  if (!rootId || nodes.length === 0) return null;
  const map = new Map<string, TreeNode>();
  for (const n of nodes) {
    map.set(n.id, { id: n.id, value: n.value, left: null, right: null });
  }
  for (const n of nodes) {
    const node = map.get(n.id)!;
    if (n.leftId) node.left = map.get(n.leftId) ?? null;
    if (n.rightId) node.right = map.get(n.rightId) ?? null;
  }
  return map.get(rootId) ?? null;
}

function cloneTree(root: TreeNode | null): TreeNode | null {
  if (!root) return null;
  return { id: root.id, value: root.value, left: cloneTree(root.left), right: cloneTree(root.right) };
}

// Generate a reasonably balanced BST from shuffled values
function generateRandomBST(size: number): TreeNode | null {
  const values = new Set<number>();
  while (values.size < size) {
    values.add(Math.floor(Math.random() * 99) + 1);
  }
  const arr = [...values];
  // Shuffle for random insertion order
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  let root: TreeNode | null = null;
  for (const val of arr) {
    root = bstInsert(root, val);
  }
  return root;
}

function bstInsert(root: TreeNode | null, value: number): TreeNode {
  const newNode: TreeNode = { id: genId(), value, left: null, right: null };
  if (!root) return newNode;
  let cur = root;
  while (true) {
    if (value < cur.value) {
      if (!cur.left) { cur.left = newNode; return root; }
      cur = cur.left;
    } else {
      if (!cur.right) { cur.right = newNode; return root; }
      cur = cur.right;
    }
  }
}

// Find a node by ID in the tree
function findNodeById(root: TreeNode | null, id: string): TreeNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  return findNodeById(root.left, id) ?? findNodeById(root.right, id);
}

// Collect all values (for display / picking a value to search/delete)
function collectValues(root: TreeNode | null): number[] {
  if (!root) return [];
  return [...collectValues(root.left), root.value, ...collectValues(root.right)];
}

// ============================================
// Component
// ============================================

function TreeVisualizer() {
  // Tree state
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [treeSize, setTreeSize] = useState(7);

  // Operation selection
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<ComplexityInfo | null>(null);

  // Input value for BST Insert/Search/Delete
  const [inputValue, setInputValue] = useState<number>(42);

  // Visualization state
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);
  const [foundNodeId, setFoundNodeId] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [operationMessage, setOperationMessage] = useState<string>('');
  const [operationResult, setOperationResult] = useState<'success' | 'not-found' | null>(null);

  // Traversal result accumulator
  const [traversalResult, setTraversalResult] = useState<number[]>([]);

  // Hooks
  const controls = useVisualizationControls();
  const { history, saveToHistory, clearHistory } = useHistory<TreeHistoryState>();

  const createSnapshot = useCallback((): TreeHistoryState => {
    const { nodes, rootId } = serializeTree(root);
    return {
      nodes,
      rootId,
      currentNodeId,
      visitedNodeIds: [...visitedNodeIds],
      foundNodeId,
      highlightedPath: [...highlightedPath],
      currentLine,
      message: operationMessage,
      operationResult,
    };
  }, [root, currentNodeId, visitedNodeIds, foundNodeId, highlightedPath, currentLine, operationMessage, operationResult]);

  const { sleep, animationSpeed, setAnimationSpeed } = useAnimatedSleep({
    pauseRef: controls.pauseRef,
    cancelRef: controls.cancelRef,
    stepForwardRef: controls.stepForwardRef,
    onBeforeSleep: () => saveToHistory(createSnapshot()),
  });

  // Reset visualization state
  const resetVisualizationState = useCallback(() => {
    setCurrentNodeId(null);
    setVisitedNodeIds([]);
    setFoundNodeId(null);
    setHighlightedPath([]);
    setCurrentLine(null);
    setOperationMessage('');
    setOperationResult(null);
    setTraversalResult([]);
    clearHistory();
  }, [clearHistory]);

  // Generate random tree
  const generateTree = useCallback(() => {
    setRoot(generateRandomBST(treeSize));
    resetVisualizationState();
  }, [treeSize, resetVisualizationState]);

  // Handle operation selection
  const handleOperationChange = (operationName: string) => {
    setSelectedOperation(operationName);
    setCurrentAlgorithm(getAlgorithmInfo('tree', operationName));
    resetVisualizationState();
  };

  // Step back
  const stepBack = useCallback(() => {
    if (history.length === 0) return;
    if (controls.isRunning) {
      controls.pauseRef.current = true;
      controls.setIsPaused(true);
    }
    const prev = history[history.length - 1];
    setRoot(deserializeTree(prev.nodes, prev.rootId));
    setCurrentNodeId(prev.currentNodeId);
    setVisitedNodeIds(prev.visitedNodeIds);
    setFoundNodeId(prev.foundNodeId);
    setHighlightedPath(prev.highlightedPath);
    setCurrentLine(prev.currentLine);
    setOperationMessage(prev.message);
    setOperationResult(prev.operationResult);
  }, [history, controls]);

  // ============================================
  // TREE OPERATIONS
  // ============================================

  const bstInsertOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      setCurrentLine(1);
      setOperationMessage(`Inserting value: ${inputValue}`);
      await sleep(400);

      if (!root) {
        setCurrentLine(4);
        setOperationMessage(`Tree is empty, creating root with value ${inputValue}`);
        await sleep(500);
        const newNode: TreeNode = { id: genId(), value: inputValue, left: null, right: null };
        setRoot(newNode);
        setFoundNodeId(newNode.id);
        setOperationResult('success');
        setOperationMessage(`Inserted ${inputValue} as root`);
        return;
      }

      const tree = cloneTree(root)!;
      let cur = tree;
      const path: string[] = [cur.id];

      setCurrentLine(8);
      setCurrentNodeId(cur.id);
      setHighlightedPath([cur.id]);
      await sleep(400);

      while (true) {
        if (inputValue < cur.value) {
          setCurrentLine(9);
          setOperationMessage(`${inputValue} < ${cur.value}, go left`);
          await sleep(400);

          if (!cur.left) {
            setCurrentLine(11);
            const newNode: TreeNode = { id: genId(), value: inputValue, left: null, right: null };
            cur.left = newNode;
            setRoot(tree);
            setFoundNodeId(newNode.id);
            path.push(newNode.id);
            setHighlightedPath([...path]);
            setOperationResult('success');
            setOperationMessage(`Inserted ${inputValue} as left child of ${cur.value}`);
            await sleep(500);
            return;
          }
          setVisitedNodeIds(prev => [...prev, cur.id]);
          cur = cur.left;
          path.push(cur.id);
          setCurrentNodeId(cur.id);
          setHighlightedPath([...path]);
          await sleep(300);
        } else {
          setCurrentLine(15);
          setOperationMessage(`${inputValue} >= ${cur.value}, go right`);
          await sleep(400);

          if (!cur.right) {
            setCurrentLine(17);
            const newNode: TreeNode = { id: genId(), value: inputValue, left: null, right: null };
            cur.right = newNode;
            setRoot(tree);
            setFoundNodeId(newNode.id);
            path.push(newNode.id);
            setHighlightedPath([...path]);
            setOperationResult('success');
            setOperationMessage(`Inserted ${inputValue} as right child of ${cur.value}`);
            await sleep(500);
            return;
          }
          setVisitedNodeIds(prev => [...prev, cur.id]);
          cur = cur.right;
          path.push(cur.id);
          setCurrentNodeId(cur.id);
          setHighlightedPath([...path]);
          await sleep(300);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') console.error(error);
    } finally {
      setCurrentNodeId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const bstSearchOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      setCurrentLine(2);
      setOperationMessage(`Searching for value: ${inputValue}`);
      await sleep(400);

      let cur = root;
      const path: string[] = [];

      while (cur) {
        path.push(cur.id);
        setCurrentNodeId(cur.id);
        setHighlightedPath([...path]);

        setCurrentLine(4);
        setOperationMessage(`Comparing with node: ${cur.value}`);
        await sleep(500);

        if (cur.value === inputValue) {
          setCurrentLine(5);
          setFoundNodeId(cur.id);
          setOperationResult('success');
          setOperationMessage(`Found ${inputValue}!`);
          await sleep(500);
          return;
        }

        setVisitedNodeIds(prev => [...prev, cur!.id]);

        if (inputValue < cur.value) {
          setCurrentLine(8);
          setOperationMessage(`${inputValue} < ${cur.value}, go left`);
          await sleep(400);
          cur = cur.left;
        } else {
          setCurrentLine(10);
          setOperationMessage(`${inputValue} > ${cur.value}, go right`);
          await sleep(400);
          cur = cur.right;
        }
      }

      setCurrentLine(13);
      setOperationResult('not-found');
      setOperationMessage(`Value ${inputValue} not found in the tree`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') console.error(error);
    } finally {
      setCurrentNodeId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const bstDeleteOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      setCurrentLine(2);
      setOperationMessage(`Deleting value: ${inputValue}`);
      await sleep(400);

      if (!root) {
        setOperationResult('not-found');
        setOperationMessage('Tree is empty');
        return;
      }

      // Search for the node first (visually)
      const tree = cloneTree(root)!;
      let cur: TreeNode | null = tree;
      let parent: TreeNode | null = null;
      let isLeft = false;
      const path: string[] = [];

      while (cur) {
        path.push(cur.id);
        setCurrentNodeId(cur.id);
        setHighlightedPath([...path]);
        setCurrentLine(4);
        setOperationMessage(`Comparing with node: ${cur.value}`);
        await sleep(500);

        if (cur.value === inputValue) break;

        setVisitedNodeIds(prev => [...prev, cur!.id]);
        parent = cur;

        if (inputValue < cur.value) {
          setCurrentLine(4);
          setOperationMessage(`${inputValue} < ${cur.value}, go left`);
          await sleep(400);
          isLeft = true;
          cur = cur.left;
        } else {
          setCurrentLine(6);
          setOperationMessage(`${inputValue} > ${cur.value}, go right`);
          await sleep(400);
          isLeft = false;
          cur = cur.right;
        }
      }

      if (!cur) {
        setOperationResult('not-found');
        setOperationMessage(`Value ${inputValue} not found in the tree`);
        return;
      }

      setFoundNodeId(cur.id);
      setCurrentLine(9);
      setOperationMessage(`Found ${inputValue}, determining deletion case...`);
      await sleep(600);

      // Case 1: Leaf
      if (!cur.left && !cur.right) {
        setCurrentLine(10);
        setOperationMessage(`Node ${inputValue} is a leaf, removing it`);
        await sleep(500);
        if (!parent) { setRoot(null); }
        else if (isLeft) { parent.left = null; setRoot(tree); }
        else { parent.right = null; setRoot(tree); }
      }
      // Case 2: One child
      else if (!cur.left || !cur.right) {
        const child = cur.left ?? cur.right;
        setCurrentLine(11);
        setOperationMessage(`Node ${inputValue} has one child, replacing with child ${child!.value}`);
        await sleep(500);
        if (!parent) { setRoot(child); }
        else if (isLeft) { parent.left = child; setRoot(tree); }
        else { parent.right = child; setRoot(tree); }
      }
      // Case 3: Two children
      else {
        setCurrentLine(14);
        setOperationMessage(`Node ${inputValue} has two children, finding inorder successor...`);
        await sleep(500);

        let successor = cur.right;
        setCurrentNodeId(successor.id);
        await sleep(400);

        while (successor.left) {
          setVisitedNodeIds(prev => [...prev, successor!.id]);
          successor = successor.left;
          setCurrentNodeId(successor.id);
          setCurrentLine(16);
          setOperationMessage(`Moving left to find successor: ${successor.value}`);
          await sleep(400);
        }

        setFoundNodeId(successor.id);
        setCurrentLine(18);
        setOperationMessage(`Successor is ${successor.value}, swapping with ${cur.value}`);
        await sleep(600);

        const successorVal = successor.value;
        // Delete the successor from right subtree
        cur.right = deleteNodeFromTree(cur.right, successorVal);
        cur.value = successorVal;
        // Update the ID so the visual tracks properly
        setRoot(tree);
      }

      setOperationResult('success');
      setOperationMessage(`Deleted ${inputValue} successfully`);
      await sleep(500);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') console.error(error);
    } finally {
      setCurrentNodeId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  // Helper: synchronous BST delete (for the successor removal in delete operation)
  function deleteNodeFromTree(node: TreeNode | null, value: number): TreeNode | null {
    if (!node) return null;
    if (value < node.value) { node.left = deleteNodeFromTree(node.left, value); return node; }
    if (value > node.value) { node.right = deleteNodeFromTree(node.right, value); return node; }
    if (!node.left) return node.right;
    if (!node.right) return node.left;
    let succ = node.right;
    while (succ.left) succ = succ.left;
    node.value = succ.value;
    node.right = deleteNodeFromTree(node.right, succ.value);
    return node;
  }

  // ============================================
  // TRAVERSAL OPERATIONS
  // ============================================

  const inorderOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;
    const result: number[] = [];

    try {
      if (!root) {
        setOperationMessage('Tree is empty');
        return;
      }

      setCurrentLine(3);
      setOperationMessage('Starting inorder traversal (Left, Visit, Right)');
      await sleep(400);

      const stack: TreeNode[] = [];
      let cur: TreeNode | null = root;

      while (cur || stack.length > 0) {
        while (cur) {
          setCurrentLine(7);
          setCurrentNodeId(cur.id);
          setOperationMessage(`Push ${cur.value} onto stack, go left`);
          await sleep(400);
          stack.push(cur);
          setHighlightedPath(stack.map(n => n.id));
          cur = cur.left;
        }

        cur = stack.pop()!;
        setCurrentLine(10);
        setCurrentNodeId(cur.id);
        result.push(cur.value);
        setTraversalResult([...result]);
        setOperationMessage(`Visit ${cur.value} → [${result.join(', ')}]`);
        await sleep(500);

        setVisitedNodeIds(prev => [...prev, cur!.id]);
        setCurrentLine(11);
        cur = cur.right;
      }

      setOperationResult('success');
      setOperationMessage(`Inorder: [${result.join(', ')}]`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') console.error(error);
    } finally {
      setCurrentNodeId(null);
      setHighlightedPath([]);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const preorderOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;
    const result: number[] = [];

    try {
      if (!root) { setOperationMessage('Tree is empty'); return; }

      setCurrentLine(3);
      setOperationMessage('Starting preorder traversal (Visit, Left, Right)');
      await sleep(400);

      const stack: TreeNode[] = [root];

      while (stack.length > 0) {
        const node = stack.pop()!;
        setCurrentLine(7);
        setCurrentNodeId(node.id);
        result.push(node.value);
        setTraversalResult([...result]);
        setOperationMessage(`Visit ${node.value} → [${result.join(', ')}]`);
        await sleep(500);

        setVisitedNodeIds(prev => [...prev, node.id]);

        if (node.right) {
          setCurrentLine(9);
          stack.push(node.right);
        }
        if (node.left) {
          setCurrentLine(10);
          stack.push(node.left);
        }
        await sleep(300);
      }

      setOperationResult('success');
      setOperationMessage(`Preorder: [${result.join(', ')}]`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') console.error(error);
    } finally {
      setCurrentNodeId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const postorderOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;
    const result: number[] = [];

    try {
      if (!root) { setOperationMessage('Tree is empty'); return; }

      setCurrentLine(3);
      setOperationMessage('Starting postorder traversal (Left, Right, Visit)');
      await sleep(400);

      const stack1: TreeNode[] = [root];
      const stack2: TreeNode[] = [];

      // Phase 1: Build stack2
      while (stack1.length > 0) {
        const node = stack1.pop()!;
        setCurrentLine(7);
        setCurrentNodeId(node.id);
        setOperationMessage(`Processing ${node.value} → push to stack2`);
        await sleep(400);
        stack2.push(node);

        if (node.left) stack1.push(node.left);
        if (node.right) stack1.push(node.right);
      }

      // Phase 2: Pop from stack2 for result
      setOperationMessage('Now popping from stack2 for result...');
      await sleep(400);

      while (stack2.length > 0) {
        const node = stack2.pop()!;
        setCurrentLine(14);
        setCurrentNodeId(node.id);
        result.push(node.value);
        setTraversalResult([...result]);
        setOperationMessage(`Visit ${node.value} → [${result.join(', ')}]`);
        await sleep(500);
        setVisitedNodeIds(prev => [...prev, node.id]);
      }

      setOperationResult('success');
      setOperationMessage(`Postorder: [${result.join(', ')}]`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') console.error(error);
    } finally {
      setCurrentNodeId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  const levelOrderOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;
    const result: number[] = [];

    try {
      if (!root) { setOperationMessage('Tree is empty'); return; }

      setCurrentLine(4);
      setOperationMessage('Starting level-order (BFS) traversal');
      await sleep(400);

      const queue: TreeNode[] = [root];

      while (queue.length > 0) {
        const node = queue.shift()!;
        setCurrentLine(7);
        setCurrentNodeId(node.id);
        result.push(node.value);
        setTraversalResult([...result]);
        setOperationMessage(`Visit ${node.value} → [${result.join(', ')}]`);
        await sleep(500);

        setVisitedNodeIds(prev => [...prev, node.id]);

        if (node.left) {
          setCurrentLine(9);
          queue.push(node.left);
          setOperationMessage(`Enqueue left child: ${node.left.value}`);
          await sleep(300);
        }
        if (node.right) {
          setCurrentLine(10);
          queue.push(node.right);
          setOperationMessage(`Enqueue right child: ${node.right.value}`);
          await sleep(300);
        }
      }

      setOperationResult('success');
      setOperationMessage(`Level-Order: [${result.join(', ')}]`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'CANCELLED') console.error(error);
    } finally {
      setCurrentNodeId(null);
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  // ============================================
  // CONTROL HANDLERS
  // ============================================

  const runSelectedOperation = () => {
    switch (selectedOperation) {
      case 'BST Insert': bstInsertOperation(); break;
      case 'BST Search': bstSearchOperation(); break;
      case 'BST Delete': bstDeleteOperation(); break;
      case 'Inorder Traversal': inorderOperation(); break;
      case 'Preorder Traversal': preorderOperation(); break;
      case 'Postorder Traversal': postorderOperation(); break;
      case 'Level-Order Traversal': levelOrderOperation(); break;
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
    generateTree();
  };

  // Determine if operation needs a value input
  const needsInput = selectedOperation && ['BST Insert', 'BST Search', 'BST Delete'].includes(selectedOperation);

  // Variables display for X-Ray Code Viewer
  const renderVariables = () => {
    const curNode = currentNodeId ? findNodeById(root, currentNodeId) : null;
    const isTraversal = selectedOperation?.includes('Traversal');
    return (
      <>
        <div className="flex gap-3 flex-wrap">
          {needsInput && <span>target={inputValue}</span>}
          {curNode && <span>current={curNode.value}</span>}
        </div>
        {isTraversal && traversalResult.length > 0 && (
          <div className="mt-1">result=[{traversalResult.join(', ')}]</div>
        )}
        {!isTraversal && root && (
          <div className="mt-1 text-[10px] opacity-60">
            values=[{collectValues(root).join(', ')}]
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-b border-gray-700">
        <Link to="/" className="text-blue-400 hover:text-blue-300 transition text-xs sm:text-sm whitespace-nowrap">
          ← Back to Home
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">Operation:</span>
          <select
            className="bg-gray-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer text-xs sm:text-sm flex-1 sm:flex-none"
            value={selectedOperation || ''}
            disabled={controls.isRunning}
            onChange={(e) => handleOperationChange(e.target.value)}
          >
            <option value="">Choose...</option>
            {getAlgorithmNames('tree').map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">Size</span>
            <input
              type="range"
              min={3}
              max={15}
              value={treeSize}
              onChange={(e) => setTreeSize(Number(e.target.value))}
              disabled={controls.isRunning}
              className="w-16 sm:w-20 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-blue-500"
            />
            <span className="bg-gray-700 px-2 py-1 rounded text-xs font-mono w-6 text-center">{treeSize}</span>
          </div>

          {needsInput && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-400">Value:</span>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(Number(e.target.value))}
                disabled={controls.isRunning}
                className="w-16 sm:w-20 bg-gray-700 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
              />
            </div>
          )}

          <button
            onClick={generateTree}
            disabled={controls.isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-xs sm:text-sm whitespace-nowrap"
          >
            Generate Tree
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 flex flex-col xl:flex-row gap-6">
        {/* Left Side - Visualization and Controls */}
        <div className="w-full xl:w-[60%] space-y-6">
          {/* Tree Visualization */}
          <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-xl"></div>
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-center mb-4">
                {selectedOperation ? `${selectedOperation}: BST Visualization` : 'Binary Search Tree Visualization'}
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

              <TreeCanvas
                root={root}
                currentNodeId={currentNodeId}
                visitedNodeIds={visitedNodeIds}
                foundNodeId={foundNodeId}
                highlightedPath={highlightedPath}
              />

              {operationMessage && !operationResult && (
                <div className="text-center text-sm sm:text-base text-gray-300 mt-4">
                  {operationMessage}
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
              disabled={!selectedOperation && !controls.isRunning}
            />
            <SpeedControl speed={animationSpeed} onSpeedChange={setAnimationSpeed} />
          </div>
        </div>

        {/* Right Side - Info Panels */}
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

export default TreeVisualizer;
