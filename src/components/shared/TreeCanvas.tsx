interface RuntimeTreeNode {
  id: string;
  value: number;
  left: RuntimeTreeNode | null;
  right: RuntimeTreeNode | null;
}

interface PositionedNode {
  id: string;
  value: number;
  x: number;
  y: number;
  parentX: number | null;
  parentY: number | null;
}

interface TreeCanvasProps {
  root: RuntimeTreeNode | null;
  currentNodeId: string | null;
  visitedNodeIds: string[];
  foundNodeId: string | null;
  highlightedPath: string[];
}

const NODE_RADIUS = 22;
const H_SPACING = 56;
const V_SPACING = 64;
const PADDING = 40;

function calculatePositions(root: RuntimeTreeNode | null): {
  nodes: PositionedNode[];
  width: number;
  height: number;
} {
  if (!root) return { nodes: [], width: 0, height: 0 };

  // Step 1: Inorder traversal to assign horizontal indices
  let inorderIndex = 0;
  const posMap = new Map<string, { idx: number; depth: number }>();

  function assignIndex(node: RuntimeTreeNode | null, depth: number) {
    if (!node) return;
    assignIndex(node.left, depth + 1);
    posMap.set(node.id, { idx: inorderIndex, depth });
    inorderIndex++;
    assignIndex(node.right, depth + 1);
  }
  assignIndex(root, 0);

  // Step 2: Build positioned nodes with pixel coords
  const positioned: PositionedNode[] = [];
  let maxDepth = 0;

  function build(node: RuntimeTreeNode | null, px: number | null, py: number | null) {
    if (!node) return;
    const pos = posMap.get(node.id)!;
    const x = PADDING + pos.idx * H_SPACING;
    const y = PADDING + pos.depth * V_SPACING;
    maxDepth = Math.max(maxDepth, pos.depth);
    positioned.push({ id: node.id, value: node.value, x, y, parentX: px, parentY: py });
    build(node.left, x, y);
    build(node.right, x, y);
  }
  build(root, null, null);

  const totalNodes = positioned.length;
  const width = PADDING * 2 + Math.max((totalNodes - 1) * H_SPACING, 100);
  const height = PADDING * 2 + Math.max(maxDepth * V_SPACING, 60);

  return { nodes: positioned, width, height };
}

function TreeCanvas({ root, currentNodeId, visitedNodeIds, foundNodeId, highlightedPath }: TreeCanvasProps) {
  const { nodes, width, height } = calculatePositions(root);

  const getNodeFill = (id: string): string => {
    if (foundNodeId === id) return 'url(#treeGreen)';
    if (currentNodeId === id) return 'url(#treeYellow)';
    if (visitedNodeIds.includes(id)) return 'url(#treeGray)';
    return 'url(#treeBlue)';
  };

  const getNodeStroke = (id: string): string => {
    if (foundNodeId === id) return '#059669';
    if (currentNodeId === id) return '#ca8a04';
    if (visitedNodeIds.includes(id)) return '#4b5563';
    return '#3b7de8';
  };

  const getEdgeStroke = (childId: string): string => {
    if (highlightedPath.includes(childId)) return '#eab308';
    if (visitedNodeIds.includes(childId)) return '#4b5563';
    return '#374151';
  };

  if (!root) {
    return (
      <div className="h-48 sm:h-56 lg:h-72 w-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2 opacity-30">Empty Tree</div>
          <div className="text-sm">Generate a tree to start</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-48 sm:h-56 lg:h-72 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="treeBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5b9dff" />
            <stop offset="100%" stopColor="#3b7de8" />
          </linearGradient>
          <linearGradient id="treeYellow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="treeGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="treeGray" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
        </defs>

        {/* Edges (drawn first, behind nodes) */}
        {nodes
          .filter(n => n.parentX !== null && n.parentY !== null)
          .map(n => (
            <line
              key={`edge-${n.id}`}
              x1={n.parentX!}
              y1={n.parentY!}
              x2={n.x}
              y2={n.y}
              stroke={getEdgeStroke(n.id)}
              strokeWidth={2}
            />
          ))}

        {/* Nodes */}
        {nodes.map(n => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={NODE_RADIUS}
              fill={getNodeFill(n.id)}
              stroke={getNodeStroke(n.id)}
              strokeWidth={2}
            />
            <text
              x={n.x}
              y={n.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontWeight="bold"
              fontSize={14}
              fontFamily="monospace"
            >
              {n.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default TreeCanvas;
