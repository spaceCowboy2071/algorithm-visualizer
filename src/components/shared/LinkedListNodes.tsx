import { useRef, useState, useEffect } from 'react';
import type { LinkedListNode } from '../../types/visualization';

interface LinkedListNodesProps {
  nodes: LinkedListNode[];
  currentNodeId: string | null;
  comparingNodeIds: string[];
  visitedNodeIds: string[];
  foundNodeId: string | null;
}

interface DynamicSizes {
  nodeSize: number;
  fontSize: number;
  arrowSize: number;
  gap: number;
}

function LinkedListNodes({
  nodes,
  currentNodeId,
  comparingNodeIds,
  visitedNodeIds,
  foundNodeId,
}: LinkedListNodesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<DynamicSizes>({
    nodeSize: 64,
    fontSize: 20,
    arrowSize: 32,
    gap: 4,
  });

  // Calculate sizes based on container width and node count
  useEffect(() => {
    const calculateSizes = () => {
      if (!containerRef.current || nodes.length === 0) return;

      const containerWidth = containerRef.current.offsetWidth;
      const padding = 32; // Container padding
      const headLabelWidth = 50; // HEAD label + arrow
      const availableWidth = containerWidth - padding - headLabelWidth;

      // Each "unit" = node + arrow (except last node has null box instead)
      // Total elements: nodes.length nodes + nodes.length arrows + 1 null box
      const nodeCount = nodes.length;
      const arrowCount = nodes.length;
      const nullBoxCount = 1;

      // We want: (nodeCount + nullBoxCount) * nodeSize + arrowCount * arrowSize + gaps <= availableWidth
      // Assuming arrowSize = nodeSize * 0.5 and gap = nodeSize * 0.1
      // (nodeCount + 1) * nodeSize + nodeCount * 0.5 * nodeSize + (nodeCount * 2) * 0.1 * nodeSize <= availableWidth
      // nodeSize * ((nodeCount + 1) + nodeCount * 0.5 + nodeCount * 0.2) <= availableWidth
      // nodeSize * (nodeCount + 1 + nodeCount * 0.7) <= availableWidth
      // nodeSize <= availableWidth / (nodeCount * 1.7 + 1)

      const maxNodeSize = availableWidth / (nodeCount * 1.8 + 1.5);

      // Clamp between min and max sizes
      const minNodeSize = 32;
      const maxAllowedSize = 80;
      const nodeSize = Math.max(minNodeSize, Math.min(maxAllowedSize, maxNodeSize));

      // Scale other elements proportionally
      const fontSize = Math.max(10, nodeSize * 0.3);
      const arrowSize = Math.max(16, nodeSize * 0.5);
      const gap = Math.max(2, nodeSize * 0.08);

      setSizes({ nodeSize, fontSize, arrowSize, gap });
    };

    calculateSizes();

    // Recalculate on window resize
    window.addEventListener('resize', calculateSizes);
    return () => window.removeEventListener('resize', calculateSizes);
  }, [nodes.length]);

  const getNodeStyle = (nodeId: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: sizes.nodeSize,
      height: sizes.nodeSize,
      borderRadius: 8,
      borderWidth: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s',
    };

    if (foundNodeId === nodeId) {
      return {
        ...baseStyle,
        background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.6)',
        borderColor: '#10b981',
      };
    }
    if (currentNodeId === nodeId || comparingNodeIds.includes(nodeId)) {
      return {
        ...baseStyle,
        background: 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)',
        boxShadow: '0 4px 20px rgba(234, 179, 8, 0.6)',
        borderColor: '#eab308',
      };
    }
    if (visitedNodeIds.includes(nodeId)) {
      return {
        ...baseStyle,
        background: 'linear-gradient(180deg, #6b7280 0%, #4b5563 100%)',
        boxShadow: 'none',
        borderColor: '#6b7280',
        opacity: 0.7,
      };
    }
    return {
      ...baseStyle,
      background: 'linear-gradient(180deg, #5b9dff 0%, #3b7de8 100%)',
      boxShadow: '0 4px 20px rgba(91, 157, 255, 0.5)',
      borderColor: '#5b9dff',
    };
  };

  const getArrowColor = (nodeId: string): string => {
    if (foundNodeId === nodeId) return '#10b981';
    if (currentNodeId === nodeId || comparingNodeIds.includes(nodeId)) return '#eab308';
    if (visitedNodeIds.includes(nodeId)) return '#6b7280';
    return '#5b9dff';
  };

  if (nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="h-48 sm:h-56 lg:h-64 flex items-center justify-center text-gray-500"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">null</div>
          <div className="text-sm">Empty list - Generate a linked list to start</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-48 sm:h-56 lg:h-64 flex items-center justify-center py-4 px-4"
    >
      <div
        className="flex items-center justify-center"
        style={{ gap: sizes.gap }}
      >
        {/* HEAD label */}
        <div className="flex flex-col items-center" style={{ marginRight: sizes.gap }}>
          <span
            className="text-purple-400 font-bold mb-1"
            style={{ fontSize: Math.max(10, sizes.fontSize * 0.6) }}
          >
            HEAD
          </span>
          <svg
            style={{ width: sizes.arrowSize, height: sizes.arrowSize }}
            className="text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        {nodes.map((node, index) => (
          <div key={node.id} className="flex items-center" style={{ gap: sizes.gap }}>
            {/* Node */}
            <div className="flex flex-col items-center">
              {/* Current pointer indicator */}
              <span
                className={`font-bold mb-1 ${
                  currentNodeId === node.id
                    ? 'text-yellow-400 animate-pulse'
                    : foundNodeId === node.id && currentNodeId !== node.id
                    ? 'text-green-400'
                    : 'text-transparent'
                }`}
                style={{ fontSize: Math.max(8, sizes.fontSize * 0.5) }}
              >
                {currentNodeId === node.id ? 'current' : foundNodeId === node.id ? 'found!' : '-'}
              </span>

              {/* Node box */}
              <div style={getNodeStyle(node.id)}>
                <span
                  className="text-white font-bold"
                  style={{ fontSize: sizes.fontSize }}
                >
                  {node.value}
                </span>
              </div>

              {/* Index label */}
              <span
                className="text-gray-500 font-mono mt-1"
                style={{ fontSize: Math.max(8, sizes.fontSize * 0.5) }}
              >
                [{index}]
              </span>
            </div>

            {/* Arrow to next node or null */}
            <svg
              style={{
                width: sizes.arrowSize,
                height: sizes.arrowSize,
                color: getArrowColor(node.id),
                transition: 'color 0.3s',
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>

            {/* Null terminator after last node */}
            {index === nodes.length - 1 && (
              <div className="flex flex-col items-center">
                <span
                  className="text-transparent mb-1"
                  style={{ fontSize: Math.max(8, sizes.fontSize * 0.5) }}
                >
                  -
                </span>
                <div
                  className="rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-800/50"
                  style={{ width: sizes.nodeSize, height: sizes.nodeSize }}
                >
                  <span
                    className="text-gray-500 font-mono"
                    style={{ fontSize: Math.max(8, sizes.fontSize * 0.6) }}
                  >
                    null
                  </span>
                </div>
                <span
                  className="text-transparent mt-1"
                  style={{ fontSize: Math.max(8, sizes.fontSize * 0.5) }}
                >
                  -
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LinkedListNodes;
