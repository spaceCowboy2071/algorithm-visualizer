import type { GraphData } from '../../types/visualization';

interface GraphViewProps {
  graph: GraphData;
  currentNodeId: string | null;
  visitedNodeIds: string[];
  visitedEdgeIds: string[];
  frontierNodeIds: string[];
  foundNodeId: string | null;
  highlightedPath: string[];
  highlightedEdgePath: string[];
  distances: Record<string, number>;
  topologicalOrder: string[];
}

const NODE_RADIUS = 22;
const SVG_WIDTH = 500;
const SVG_HEIGHT = 400;
const PAD = 50;

function GraphView({
  graph,
  currentNodeId,
  visitedNodeIds,
  visitedEdgeIds,
  frontierNodeIds,
  foundNodeId,
  highlightedPath,
  highlightedEdgePath,
  distances,
  topologicalOrder,
}: GraphViewProps) {
  if (graph.nodes.length === 0) {
    return (
      <div className="h-72 sm:h-96 lg:h-[500px] w-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2 opacity-30">Empty Graph</div>
          <div className="text-sm">Generate a graph to start</div>
        </div>
      </div>
    );
  }

  const scaleX = (nx: number) => PAD + nx * (SVG_WIDTH - 2 * PAD);
  const scaleY = (ny: number) => PAD + ny * (SVG_HEIGHT - 2 * PAD);

  const getNodeFill = (id: string): string => {
    if (foundNodeId === id) return 'url(#gGreen)';
    if (highlightedPath.includes(id)) return 'url(#gGreen)';
    if (currentNodeId === id) return 'url(#gYellow)';
    if (frontierNodeIds.includes(id)) return 'url(#gOrange)';
    if (visitedNodeIds.includes(id)) return 'url(#gGray)';
    return 'url(#gBlue)';
  };

  const getNodeStroke = (id: string): string => {
    if (foundNodeId === id || highlightedPath.includes(id)) return '#059669';
    if (currentNodeId === id) return '#ca8a04';
    if (frontierNodeIds.includes(id)) return '#ea580c';
    if (visitedNodeIds.includes(id)) return '#4b5563';
    return '#3b7de8';
  };

  const getEdgeColor = (id: string): string => {
    if (highlightedEdgePath.includes(id)) return '#10b981';
    if (visitedEdgeIds.includes(id)) return '#6b7280';
    return '#374151';
  };

  const getEdgeWidth = (id: string): number => {
    if (highlightedEdgePath.includes(id)) return 3;
    if (visitedEdgeIds.includes(id)) return 2;
    return 1.5;
  };

  // Offset edges slightly for directed graphs to avoid overlap with arrowheads
  const getEdgePoints = (edge: typeof graph.edges[0]) => {
    const src = graph.nodes.find(n => n.id === edge.source)!;
    const tgt = graph.nodes.find(n => n.id === edge.target)!;
    const sx = scaleX(src.x), sy = scaleY(src.y);
    const tx = scaleX(tgt.x), ty = scaleY(tgt.y);

    const dx = tx - sx, dy = ty - sy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x1: sx, y1: sy, x2: tx, y2: ty };

    const ux = dx / len, uy = dy / len;
    // Shorten line to stop at node border
    const offset = NODE_RADIUS + (graph.directed ? 6 : 2);
    return {
      x1: sx + ux * NODE_RADIUS,
      y1: sy + uy * NODE_RADIUS,
      x2: tx - ux * offset,
      y2: ty - uy * offset,
    };
  };

  const getEdgeMidpoint = (edge: typeof graph.edges[0]) => {
    const src = graph.nodes.find(n => n.id === edge.source)!;
    const tgt = graph.nodes.find(n => n.id === edge.target)!;
    const mx = (scaleX(src.x) + scaleX(tgt.x)) / 2;
    const my = (scaleY(src.y) + scaleY(tgt.y)) / 2;
    // Offset perpendicular to avoid overlap with edge line
    const dx = scaleX(tgt.x) - scaleX(src.x);
    const dy = scaleY(tgt.y) - scaleY(src.y);
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: mx + (-dy / len) * 12, y: my + (dx / len) * 12 };
  };

  const hasDistances = Object.keys(distances).length > 0;

  return (
    <div className="h-72 sm:h-96 lg:h-[500px] w-full">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="gBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5b9dff" />
            <stop offset="100%" stopColor="#3b7de8" />
          </linearGradient>
          <linearGradient id="gYellow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="gGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="gGray" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
          <linearGradient id="gOrange" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          {/* Arrowhead markers per color state */}
          <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <polygon points="0 0, 8 4, 0 8" fill="#374151" />
          </marker>
          <marker id="arrow-visited" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <polygon points="0 0, 8 4, 0 8" fill="#6b7280" />
          </marker>
          <marker id="arrow-path" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <polygon points="0 0, 8 4, 0 8" fill="#10b981" />
          </marker>
        </defs>

        {/* Edges */}
        {graph.edges.map(edge => {
          const pts = getEdgePoints(edge);
          const color = getEdgeColor(edge.id);
          const markerEnd = graph.directed
            ? highlightedEdgePath.includes(edge.id)
              ? 'url(#arrow-path)'
              : visitedEdgeIds.includes(edge.id)
                ? 'url(#arrow-visited)'
                : 'url(#arrow-default)'
            : undefined;
          return (
            <line
              key={edge.id}
              x1={pts.x1} y1={pts.y1}
              x2={pts.x2} y2={pts.y2}
              stroke={color}
              strokeWidth={getEdgeWidth(edge.id)}
              markerEnd={markerEnd}
            />
          );
        })}

        {/* Weight labels */}
        {graph.weighted && graph.edges.map(edge => {
          const mid = getEdgeMidpoint(edge);
          return (
            <text
              key={`w-${edge.id}`}
              x={mid.x} y={mid.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#d1d5db"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {edge.weight}
            </text>
          );
        })}

        {/* Nodes */}
        {graph.nodes.map(node => {
          const cx = scaleX(node.x);
          const cy = scaleY(node.y);
          return (
            <g key={node.id}>
              <circle
                cx={cx} cy={cy} r={NODE_RADIUS}
                fill={getNodeFill(node.id)}
                stroke={getNodeStroke(node.id)}
                strokeWidth={
                  currentNodeId === node.id || foundNodeId === node.id || highlightedPath.includes(node.id)
                    ? 3 : 1.5
                }
              />
              <text
                x={cx} y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize="14"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {node.label}
              </text>
              {/* Distance label for Dijkstra's */}
              {hasDistances && (
                <text
                  x={cx} y={cy + NODE_RADIUS + 14}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {distances[node.id] !== undefined
                    ? distances[node.id] === Infinity ? 'd=∞' : `d=${distances[node.id]}`
                    : ''}
                </text>
              )}
            </g>
          );
        })}

        {/* Topological order result */}
        {topologicalOrder.length > 0 && (
          <text
            x={SVG_WIDTH / 2} y={SVG_HEIGHT - 10}
            textAnchor="middle"
            fill="#10b981"
            fontSize="12"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Order: [{topologicalOrder.join(' → ')}]
          </text>
        )}
      </svg>
    </div>
  );
}

export default GraphView;
