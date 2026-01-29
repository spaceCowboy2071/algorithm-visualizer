import type { LinkedListNode } from '../../types/visualization';

interface LinkedListNodesProps {
  nodes: LinkedListNode[];
  currentNodeId: string | null;
  comparingNodeIds: string[];
  visitedNodeIds: string[];
  foundNodeId: string | null;
}

function LinkedListNodes({
  nodes,
  currentNodeId,
  comparingNodeIds,
  visitedNodeIds,
  foundNodeId,
}: LinkedListNodesProps) {
  const getNodeStyle = (nodeId: string): React.CSSProperties => {
    // Priority: found > current/comparing > visited > default
    if (foundNodeId === nodeId) {
      return {
        background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.6)',
        borderColor: '#10b981',
      };
    }
    if (currentNodeId === nodeId || comparingNodeIds.includes(nodeId)) {
      return {
        background: 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)',
        boxShadow: '0 4px 20px rgba(234, 179, 8, 0.6)',
        borderColor: '#eab308',
      };
    }
    if (visitedNodeIds.includes(nodeId)) {
      return {
        background: 'linear-gradient(180deg, #6b7280 0%, #4b5563 100%)',
        boxShadow: 'none',
        borderColor: '#6b7280',
        opacity: 0.7,
      };
    }
    return {
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
      <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">null</div>
          <div className="text-sm">Empty list - Generate a linked list to start</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center overflow-x-auto py-4">
      <div className="flex items-center gap-1 sm:gap-2 px-4">
        {/* HEAD label */}
        <div className="flex flex-col items-center mr-2">
          <span className="text-xs sm:text-sm text-purple-400 font-bold mb-1">HEAD</span>
          <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        {nodes.map((node, index) => (
          <div key={node.id} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center">
              {/* Current pointer indicator */}
              {currentNodeId === node.id && (
                <span className="text-xs text-yellow-400 font-bold mb-1 animate-pulse">current</span>
              )}
              {foundNodeId === node.id && currentNodeId !== node.id && (
                <span className="text-xs text-green-400 font-bold mb-1">found!</span>
              )}
              {currentNodeId !== node.id && foundNodeId !== node.id && (
                <span className="text-xs text-transparent mb-1">-</span>
              )}

              {/* Node box */}
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg border-2 flex items-center justify-center transition-all duration-300"
                style={getNodeStyle(node.id)}
              >
                <span className="text-white text-lg sm:text-xl lg:text-2xl font-bold">
                  {node.value}
                </span>
              </div>

              {/* Index label */}
              <span className="text-xs text-gray-500 mt-1 font-mono">[{index}]</span>
            </div>

            {/* Arrow to next node or null */}
            <div className="flex items-center mx-1 sm:mx-2">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-300"
                style={{ color: getArrowColor(node.id) }}
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
            </div>

            {/* Null terminator after last node */}
            {index === nodes.length - 1 && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-transparent mb-1">-</span>
                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-800/50">
                  <span className="text-gray-500 text-sm sm:text-base font-mono">null</span>
                </div>
                <span className="text-xs text-transparent mt-1">-</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LinkedListNodes;
