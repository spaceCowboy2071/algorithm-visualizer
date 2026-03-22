import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { ComplexityInfo, GraphData, GraphNode, GraphEdge, GraphHistoryState } from '../../types/visualization';
import { useVisualizationControls } from '../../hooks/useVisualizationControls';
import { useHistory } from '../../hooks/useHistory';
import { useAnimatedSleep } from '../../hooks/useAnimatedSleep';
import { getAlgorithmInfo, getAlgorithmNames } from '../../data/algorithmData';
import PlaybackControls from '../shared/PlaybackControls';
import SpeedControl from '../shared/SpeedControl';
import GraphView from '../shared/GraphView';
import AlgorithmInfoPanel from '../shared/AlgorithmInfoPanel';
import XRayCodeViewer from '../shared/XRayCodeViewer';

let nodeIdCounter = 0;
let edgeIdCounter = 0;
const genNodeId = (): string => `gnode-${++nodeIdCounter}`;
const genEdgeId = (): string => `gedge-${++edgeIdCounter}`;

// ============================================
// GRAPH GENERATION
// ============================================

function generateNodePositions(count: number): GraphNode[] {
  const labels = 'ABCDEFGHIJKLMNOP'.split('');
  const nodes: GraphNode[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    nodes.push({
      id: genNodeId(),
      label: labels[i],
      x: 0.5 + 0.4 * Math.cos(angle),
      y: 0.5 + 0.4 * Math.sin(angle),
    });
  }
  return nodes;
}

function generateGraph(
  nodeCount: number,
  directed: boolean,
  weighted: boolean,
  isDAG: boolean,
): GraphData {
  const nodes = generateNodePositions(nodeCount);
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  const addEdge = (srcIdx: number, tgtIdx: number) => {
    const key = directed ? `${srcIdx}-${tgtIdx}` : `${Math.min(srcIdx, tgtIdx)}-${Math.max(srcIdx, tgtIdx)}`;
    if (edgeSet.has(key) || srcIdx === tgtIdx) return;
    edgeSet.add(key);
    edges.push({
      id: genEdgeId(),
      source: nodes[srcIdx].id,
      target: nodes[tgtIdx].id,
      weight: weighted ? Math.floor(Math.random() * 9) + 1 : 1,
    });
  };

  if (isDAG) {
    // DAG: shuffle order, only add forward edges
    const order = Array.from({ length: nodeCount }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    // Spanning chain to ensure connectivity
    for (let i = 0; i < nodeCount - 1; i++) {
      addEdge(order[i], order[i + 1]);
    }
    // Extra forward edges
    const extra = Math.floor(nodeCount * 0.6);
    for (let k = 0; k < extra; k++) {
      const i = Math.floor(Math.random() * (nodeCount - 1));
      const j = i + 1 + Math.floor(Math.random() * (nodeCount - i - 1));
      if (j < nodeCount) addEdge(order[i], order[j]);
    }
  } else {
    // Spanning tree (ensures connectivity)
    const shuffled = Array.from({ length: nodeCount }, (_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let i = 1; i < nodeCount; i++) {
      addEdge(shuffled[i], shuffled[Math.floor(Math.random() * i)]);
    }
    // Extra random edges
    const extra = Math.floor(nodeCount * 0.7);
    for (let k = 0; k < extra; k++) {
      const i = Math.floor(Math.random() * nodeCount);
      const j = Math.floor(Math.random() * nodeCount);
      addEdge(i, j);
    }
  }

  return { nodes, edges, directed, weighted };
}

// ============================================
// HELPERS
// ============================================

function buildAdjacencyList(graph: GraphData): Map<string, { nodeId: string; edgeId: string; weight: number }[]> {
  const adj = new Map<string, { nodeId: string; edgeId: string; weight: number }[]>();
  for (const node of graph.nodes) adj.set(node.id, []);
  for (const edge of graph.edges) {
    adj.get(edge.source)!.push({ nodeId: edge.target, edgeId: edge.id, weight: edge.weight });
    if (!graph.directed) {
      adj.get(edge.target)!.push({ nodeId: edge.source, edgeId: edge.id, weight: edge.weight });
    }
  }
  return adj;
}

function getNodeLabel(graph: GraphData, nodeId: string): string {
  return graph.nodes.find(n => n.id === nodeId)?.label ?? nodeId;
}

// ============================================
// COMPONENT
// ============================================

function GraphVisualizer() {
  // Graph state
  const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [], directed: false, weighted: false });
  const [nodeCount, setNodeCount] = useState(7);
  const [isDirected, setIsDirected] = useState(false);
  const [isWeighted, setIsWeighted] = useState(false);

  // Operation selection
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<ComplexityInfo | null>(null);

  // Input config
  const [startNodeId, setStartNodeId] = useState<string>('');
  const [targetNodeId, setTargetNodeId] = useState<string>('');

  // Visualization state
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);
  const [visitedEdgeIds, setVisitedEdgeIds] = useState<string[]>([]);
  const [frontierNodeIds, setFrontierNodeIds] = useState<string[]>([]);
  const [foundNodeId, setFoundNodeId] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [highlightedEdgePath, setHighlightedEdgePath] = useState<string[]>([]);
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [topologicalOrder, setTopologicalOrder] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [operationMessage, setOperationMessage] = useState<string>('');
  const [operationResult, setOperationResult] = useState<'success' | 'not-found' | null>(null);

  // Hooks
  const controls = useVisualizationControls();
  const { history, saveToHistory, clearHistory } = useHistory<GraphHistoryState>();

  const createSnapshot = useCallback((): GraphHistoryState => ({
    graph: JSON.parse(JSON.stringify(graph)),
    currentNodeId,
    visitedNodeIds: [...visitedNodeIds],
    visitedEdgeIds: [...visitedEdgeIds],
    frontierNodeIds: [...frontierNodeIds],
    foundNodeId,
    highlightedPath: [...highlightedPath],
    highlightedEdgePath: [...highlightedEdgePath],
    distances: { ...distances },
    topologicalOrder: [...topologicalOrder],
    currentLine,
    message: operationMessage,
    operationResult,
  }), [graph, currentNodeId, visitedNodeIds, visitedEdgeIds, frontierNodeIds, foundNodeId, highlightedPath, highlightedEdgePath, distances, topologicalOrder, currentLine, operationMessage, operationResult]);

  const { sleep, animationSpeed, setAnimationSpeed } = useAnimatedSleep({
    pauseRef: controls.pauseRef,
    cancelRef: controls.cancelRef,
    stepForwardRef: controls.stepForwardRef,
    onBeforeSleep: () => saveToHistory(createSnapshot()),
  });

  const resetVisualizationState = useCallback(() => {
    setCurrentNodeId(null);
    setVisitedNodeIds([]);
    setVisitedEdgeIds([]);
    setFrontierNodeIds([]);
    setFoundNodeId(null);
    setHighlightedPath([]);
    setHighlightedEdgePath([]);
    setDistances({});
    setTopologicalOrder([]);
    setCurrentLine(null);
    setOperationMessage('');
    setOperationResult(null);
    clearHistory();
  }, [clearHistory]);

  const generateNewGraph = useCallback(() => {
    const isDAG = isDirected; // DAGs only when directed (for topo sort)
    const newGraph = generateGraph(nodeCount, isDirected, isWeighted, isDAG && selectedOperation === 'Topological Sort');
    setGraph(newGraph);
    if (newGraph.nodes.length > 0) {
      setStartNodeId(newGraph.nodes[0].id);
      setTargetNodeId(newGraph.nodes[newGraph.nodes.length - 1].id);
    }
    resetVisualizationState();
  }, [nodeCount, isDirected, isWeighted, selectedOperation, resetVisualizationState]);

  const handleOperationChange = (operationName: string) => {
    setSelectedOperation(operationName);
    setCurrentAlgorithm(getAlgorithmInfo('graph', operationName));
    resetVisualizationState();
  };

  const getFilteredOperations = (): string[] => {
    const all = getAlgorithmNames('graph');
    return all.filter(name => {
      if (name === "Dijkstra's" && !isWeighted) return false;
      if (name === 'Topological Sort' && !isDirected) return false;
      return true;
    });
  };

  const handleDirectedChange = (directed: boolean) => {
    setIsDirected(directed);
    // Clear incompatible selection
    if (!directed && selectedOperation === 'Topological Sort') {
      setSelectedOperation(null);
      setCurrentAlgorithm(null);
    }
    resetVisualizationState();
  };

  const handleWeightedToggle = () => {
    const newWeighted = !isWeighted;
    setIsWeighted(newWeighted);
    if (!newWeighted && selectedOperation === "Dijkstra's") {
      setSelectedOperation(null);
      setCurrentAlgorithm(null);
    }
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
    setGraph(prev.graph);
    setCurrentNodeId(prev.currentNodeId);
    setVisitedNodeIds(prev.visitedNodeIds);
    setVisitedEdgeIds(prev.visitedEdgeIds);
    setFrontierNodeIds(prev.frontierNodeIds);
    setFoundNodeId(prev.foundNodeId);
    setHighlightedPath(prev.highlightedPath);
    setHighlightedEdgePath(prev.highlightedEdgePath);
    setDistances(prev.distances);
    setTopologicalOrder(prev.topologicalOrder);
    setCurrentLine(prev.currentLine);
    setOperationMessage(prev.message);
    setOperationResult(prev.operationResult);
  }, [history, controls]);

  // ============================================
  // BFS
  // ============================================
  const bfsOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      const adj = buildAdjacencyList(graph);
      const visited = new Set<string>();
      const queue: string[] = [startNodeId];
      visited.add(startNodeId);

      setCurrentLine(1);
      setOperationMessage(`Initializing BFS from node ${getNodeLabel(graph, startNodeId)}`);
      setFrontierNodeIds([startNodeId]);
      await sleep(500);

      setCurrentLine(3);
      setVisitedNodeIds([startNodeId]);
      await sleep(400);

      while (queue.length > 0) {
        const node = queue.shift()!;
        setCurrentNodeId(node);
        setFrontierNodeIds([...queue]);
        setCurrentLine(6);
        setOperationMessage(`Dequeue node ${getNodeLabel(graph, node)}, processing...`);
        await sleep(500);

        setCurrentLine(7);
        await sleep(300);

        const neighbors = adj.get(node) || [];
        for (const { nodeId: neighbor, edgeId } of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);

            setVisitedEdgeIds(prev => [...prev, edgeId]);
            setVisitedNodeIds(prev => [...prev, neighbor]);
            setFrontierNodeIds([...queue]);
            setCurrentLine(10);
            setOperationMessage(`Discovered node ${getNodeLabel(graph, neighbor)}, adding to queue`);
            await sleep(500);

            setCurrentLine(11);
            await sleep(300);
          }
        }
      }

      setCurrentNodeId(null);
      setFrontierNodeIds([]);
      setHighlightedPath([...visited]);
      setOperationResult('success');
      setOperationMessage(`BFS complete! Visited ${visited.size} nodes`);
    } catch (e) {
      if (e instanceof Error && e.message !== 'CANCELLED') console.error(e);
    } finally {
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  // ============================================
  // DFS
  // ============================================
  const dfsOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      const adj = buildAdjacencyList(graph);
      const visited = new Set<string>();
      const stack: string[] = [startNodeId];

      setCurrentLine(1);
      setOperationMessage(`Initializing DFS from node ${getNodeLabel(graph, startNodeId)}`);
      setFrontierNodeIds([startNodeId]);
      await sleep(500);

      while (stack.length > 0) {
        const node = stack.pop()!;
        setCurrentLine(5);
        setOperationMessage(`Pop node ${getNodeLabel(graph, node)} from stack`);
        await sleep(400);

        if (visited.has(node)) {
          setCurrentLine(7);
          setOperationMessage(`Node ${getNodeLabel(graph, node)} already visited, skip`);
          await sleep(300);
          continue;
        }

        visited.add(node);
        setCurrentNodeId(node);
        setVisitedNodeIds([...visited]);
        setCurrentLine(8);
        setOperationMessage(`Visit node ${getNodeLabel(graph, node)}`);
        await sleep(500);

        setCurrentLine(9);
        await sleep(300);

        const neighbors = adj.get(node) || [];
        for (const { nodeId: neighbor, edgeId } of neighbors) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
            setVisitedEdgeIds(prev => [...prev, edgeId]);
            setFrontierNodeIds([...stack]);
            setCurrentLine(11);
            setOperationMessage(`Push node ${getNodeLabel(graph, neighbor)} to stack`);
            await sleep(400);
          }
        }
      }

      setCurrentNodeId(null);
      setFrontierNodeIds([]);
      setHighlightedPath([...visited]);
      setOperationResult('success');
      setOperationMessage(`DFS complete! Visited ${visited.size} nodes`);
    } catch (e) {
      if (e instanceof Error && e.message !== 'CANCELLED') console.error(e);
    } finally {
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  // ============================================
  // DIJKSTRA'S
  // ============================================
  const dijkstraOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      const adj = buildAdjacencyList(graph);
      const dist: Record<string, number> = {};
      const prev: Record<string, string | null> = {};
      const prevEdge: Record<string, string | null> = {};
      const visited = new Set<string>();

      // Initialize distances
      setCurrentLine(1);
      setOperationMessage('Initializing distances to infinity');
      for (const node of graph.nodes) {
        dist[node.id] = Infinity;
        prev[node.id] = null;
        prevEdge[node.id] = null;
      }
      dist[startNodeId] = 0;
      setDistances({ ...dist });
      await sleep(500);

      setCurrentLine(5);
      setOperationMessage(`Set distance of ${getNodeLabel(graph, startNodeId)} to 0`);
      await sleep(400);

      while (visited.size < graph.nodes.length) {
        // Find unvisited node with min distance
        let u: string | null = null;
        let minDist = Infinity;
        for (const node of graph.nodes) {
          if (!visited.has(node.id) && dist[node.id] < minDist) {
            minDist = dist[node.id];
            u = node.id;
          }
        }

        if (u === null) break;

        setCurrentNodeId(u);
        setCurrentLine(8);
        setOperationMessage(`Select node ${getNodeLabel(graph, u)} (distance = ${dist[u]})`);
        await sleep(500);

        visited.add(u);
        setVisitedNodeIds([...visited]);
        setCurrentLine(10);
        await sleep(300);

        // Check if we reached target
        if (targetNodeId && u === targetNodeId) {
          // Reconstruct path
          const pathNodes: string[] = [];
          const pathEdges: string[] = [];
          let curr: string | null = u;
          while (curr !== null) {
            pathNodes.unshift(curr);
            if (prevEdge[curr]) pathEdges.unshift(prevEdge[curr]!);
            curr = prev[curr];
          }
          setHighlightedPath(pathNodes);
          setHighlightedEdgePath(pathEdges);
          setFoundNodeId(targetNodeId);
          setOperationResult('success');
          setOperationMessage(`Shortest path to ${getNodeLabel(graph, targetNodeId)} found! Distance = ${dist[u]}`);
          await sleep(500);
          return;
        }

        // Relax neighbors
        const neighbors = adj.get(u) || [];
        for (const { nodeId: v, edgeId, weight } of neighbors) {
          if (!visited.has(v)) {
            setVisitedEdgeIds(prev => [...prev, edgeId]);
            const alt = dist[u] + weight;
            setCurrentLine(13);
            setOperationMessage(`Check edge ${getNodeLabel(graph, u)} → ${getNodeLabel(graph, v)}: ${dist[u]} + ${weight} = ${alt} vs ${dist[v] === Infinity ? '∞' : dist[v]}`);
            await sleep(500);

            if (alt < dist[v]) {
              dist[v] = alt;
              prev[v] = u;
              prevEdge[v] = edgeId;
              setDistances({ ...dist });
              setCurrentLine(15);
              setOperationMessage(`Updated distance of ${getNodeLabel(graph, v)} to ${alt}`);
              await sleep(400);
            }
          }
        }
      }

      setCurrentNodeId(null);
      setOperationResult('success');
      setOperationMessage('Dijkstra\'s complete! All shortest distances computed');
    } catch (e) {
      if (e instanceof Error && e.message !== 'CANCELLED') console.error(e);
    } finally {
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  // ============================================
  // TOPOLOGICAL SORT (KAHN'S)
  // ============================================
  const topologicalSortOperation = async () => {
    controls.setIsRunning(true);
    resetVisualizationState();
    controls.cancelRef.current = false;

    try {
      const adj = buildAdjacencyList(graph);
      const inDegree: Record<string, number> = {};

      // Compute in-degrees
      setCurrentLine(1);
      setOperationMessage('Computing in-degrees for all nodes');
      for (const node of graph.nodes) {
        inDegree[node.id] = 0;
      }
      for (const edge of graph.edges) {
        inDegree[edge.target]++;
      }
      await sleep(500);

      // Initialize queue with in-degree 0 nodes
      const queue: string[] = [];
      setCurrentLine(6);
      for (const node of graph.nodes) {
        if (inDegree[node.id] === 0) {
          queue.push(node.id);
        }
      }
      setFrontierNodeIds([...queue]);
      setOperationMessage(`Nodes with in-degree 0: ${queue.map(id => getNodeLabel(graph, id)).join(', ')}`);
      await sleep(500);

      const result: string[] = [];
      setCurrentLine(11);

      while (queue.length > 0) {
        const node = queue.shift()!;
        setCurrentNodeId(node);
        setFrontierNodeIds([...queue]);
        setCurrentLine(13);
        setOperationMessage(`Dequeue node ${getNodeLabel(graph, node)}`);
        await sleep(500);

        result.push(getNodeLabel(graph, node));
        setVisitedNodeIds(prev => [...prev, node]);
        setTopologicalOrder([...result]);
        setCurrentLine(14);
        setOperationMessage(`Add ${getNodeLabel(graph, node)} to result: [${result.join(', ')}]`);
        await sleep(500);

        const neighbors = adj.get(node) || [];
        for (const { nodeId: neighbor, edgeId } of neighbors) {
          inDegree[neighbor]--;
          setVisitedEdgeIds(prev => [...prev, edgeId]);
          setCurrentLine(16);
          setOperationMessage(`Decrement in-degree of ${getNodeLabel(graph, neighbor)} to ${inDegree[neighbor]}`);
          await sleep(400);

          if (inDegree[neighbor] === 0) {
            queue.push(neighbor);
            setFrontierNodeIds([...queue]);
            setCurrentLine(18);
            setOperationMessage(`${getNodeLabel(graph, neighbor)} in-degree is 0, add to queue`);
            await sleep(400);
          }
        }
      }

      setCurrentNodeId(null);
      setFrontierNodeIds([]);

      if (result.length < graph.nodes.length) {
        setOperationResult('not-found');
        setOperationMessage(`Cycle detected! Only ${result.length} of ${graph.nodes.length} nodes ordered`);
      } else {
        setHighlightedPath(graph.nodes.filter(n => result.includes(n.label)).map(n => n.id));
        setOperationResult('success');
        setOperationMessage(`Topological order: [${result.join(' → ')}]`);
      }
    } catch (e) {
      if (e instanceof Error && e.message !== 'CANCELLED') console.error(e);
    } finally {
      setCurrentLine(null);
      controls.setIsRunning(false);
    }
  };

  // ============================================
  // CONTROL HANDLERS
  // ============================================

  const runSelectedOperation = () => {
    switch (selectedOperation) {
      case 'BFS': bfsOperation(); break;
      case 'DFS': dfsOperation(); break;
      case "Dijkstra's": dijkstraOperation(); break;
      case 'Topological Sort': topologicalSortOperation(); break;
    }
  };

  const stepForward = () => {
    if (controls.isRunning) {
      controls.advanceStep();
    } else {
      if (!selectedOperation) { alert('Please select an operation first!'); return; }
      if (graph.nodes.length === 0) { alert('Please generate a graph first!'); return; }
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
      if (graph.nodes.length === 0) { alert('Please generate a graph first!'); return; }
      controls.pauseRef.current = false;
      clearHistory();
      runSelectedOperation();
    }
  };

  const handleReset = async () => {
    await controls.reset();
    resetVisualizationState();
    generateNewGraph();
  };

  const renderVariables = () => (
    <>
      <div className="flex gap-3 flex-wrap">
        {startNodeId && <span>start={getNodeLabel(graph, startNodeId)}</span>}
        {selectedOperation === "Dijkstra's" && targetNodeId && (
          <span>target={getNodeLabel(graph, targetNodeId)}</span>
        )}
        {currentNodeId && <span>current={getNodeLabel(graph, currentNodeId)}</span>}
      </div>
      <div className="mt-1 text-[10px] opacity-60">
        V={graph.nodes.length}, E={graph.edges.length}, {isDirected ? 'directed' : 'undirected'}{isWeighted ? ', weighted' : ''}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-[#161b22] border-b border-[#30363d]">
        <Link to="/" className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition text-xs sm:text-sm whitespace-nowrap">
          ← Back to Home
        </Link>

        {/* Toggles + Operation Selector */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
          {/* Directed toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[#30363d]">
            <button
              onClick={() => handleDirectedChange(false)}
              disabled={controls.isRunning}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold transition ${
                !isDirected
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[#21262d] text-gray-400 hover:text-white'
              }`}
            >
              Undirected
            </button>
            <button
              onClick={() => handleDirectedChange(true)}
              disabled={controls.isRunning}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold transition ${
                isDirected
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[#21262d] text-gray-400 hover:text-white'
              }`}
            >
              Directed
            </button>
          </div>

          {/* Weighted toggle */}
          <button
            onClick={handleWeightedToggle}
            disabled={controls.isRunning}
            className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              isWeighted
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[#21262d] text-gray-400 border-[#30363d] hover:text-white'
            }`}
          >
            Weighted
          </button>

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

        {/* Node count, Start/Target, Generate */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">Nodes</span>
            <input
              type="range"
              min={5}
              max={10}
              value={nodeCount}
              onChange={(e) => setNodeCount(Number(e.target.value))}
              disabled={controls.isRunning}
              className="w-16 sm:w-20 h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-[var(--accent)]"
            />
            <span className="bg-[#21262d] px-2 py-1 rounded text-xs font-mono w-6 text-center">{nodeCount}</span>
          </div>

          {/* Start node */}
          {graph.nodes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-400">Start:</span>
              <select
                value={startNodeId}
                onChange={(e) => setStartNodeId(e.target.value)}
                disabled={controls.isRunning}
                className="bg-[#21262d] text-white px-2 py-1 rounded-lg border border-[#30363d] text-xs sm:text-sm"
              >
                {graph.nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Target node (Dijkstra's only) */}
          {graph.nodes.length > 0 && selectedOperation === "Dijkstra's" && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-400">Target:</span>
              <select
                value={targetNodeId}
                onChange={(e) => setTargetNodeId(e.target.value)}
                disabled={controls.isRunning}
                className="bg-[#21262d] text-white px-2 py-1 rounded-lg border border-[#30363d] text-xs sm:text-sm"
              >
                {graph.nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={generateNewGraph}
            disabled={controls.isRunning}
            className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:bg-gray-600 disabled:cursor-not-allowed px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-xs sm:text-sm whitespace-nowrap"
          >
            Generate Graph
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 flex flex-col xl:flex-row gap-6">
        {/* Left Side */}
        <div className="w-full xl:w-[60%] space-y-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-center mb-4">
                {selectedOperation ? `${selectedOperation}: Graph` : 'Graph Visualization'}
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

              <GraphView
                graph={graph}
                currentNodeId={currentNodeId}
                visitedNodeIds={visitedNodeIds}
                visitedEdgeIds={visitedEdgeIds}
                frontierNodeIds={frontierNodeIds}
                foundNodeId={foundNodeId}
                highlightedPath={highlightedPath}
                highlightedEdgePath={highlightedEdgePath}
                distances={distances}
                topologicalOrder={topologicalOrder}
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

export default GraphVisualizer;
