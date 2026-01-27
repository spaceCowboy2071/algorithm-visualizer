import type { AlgorithmMode } from '../../types/visualization';

interface ArrayBarsProps {
  array: number[];
  comparing: number[];
  sortedIndices: number[];
  eliminatedIndices?: number[];
  foundIndex?: number | null;
  showPointers?: boolean;
  left?: number;
  right?: number;
  mid?: number | null;
  mode: AlgorithmMode;
}

function ArrayBars({
  array,
  comparing,
  sortedIndices,
  eliminatedIndices = [],
  foundIndex = null,
  showPointers = false,
  left = 0,
  right = 0,
  mid = null,
  mode,
}: ArrayBarsProps) {
  const getBarStyle = (index: number): React.CSSProperties => {
    // Priority order matters - found first, then comparing, then eliminated, then sorted
    if (mode === 'searching' && foundIndex === index) {
      return {
        background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
        boxShadow: '0 6px 24px rgba(16, 185, 129, 0.6)',
      };
    }
    if (comparing.includes(index)) {
      return {
        background: 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)',
        boxShadow: '0 6px 24px rgba(234, 179, 8, 0.6)',
      };
    }
    if (mode === 'searching' && eliminatedIndices.includes(index)) {
      return {
        background: 'linear-gradient(180deg, #4b5563 0%, #374151 100%)',
        boxShadow: 'none',
        opacity: 0.4,
      };
    }
    if (sortedIndices.includes(index)) {
      return {
        background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
        boxShadow: '0 6px 24px rgba(16, 185, 129, 0.5)',
      };
    }
    return {
      background: 'linear-gradient(180deg, #5b9dff 0%, #3b7de8 100%)',
      boxShadow: '0 6px 24px rgba(91, 157, 255, 0.5)',
    };
  };

  return (
    <div className="h-64 sm:h-80 lg:h-96 flex items-end justify-center gap-2 sm:gap-3 lg:gap-4 mb-4 px-2">
      {array.map((value, index) => (
        <div
          key={index}
          className="flex flex-col items-center justify-end h-full"
          style={{
            flex: '0 1 80px',
            minWidth: mode === 'searching' ? '35px' : '40px',
            maxWidth: mode === 'searching' ? '80px' : '100px',
          }}
        >
          {/* Bar */}
          <div
            className="w-full flex items-center justify-center transition-all duration-300 rounded-t-lg"
            style={{
              height: `${(value / 100) * 85}%`,
              minHeight: '50px',
              ...getBarStyle(index),
            }}
          >
            <span className="text-white text-sm sm:text-lg font-bold">{value}</span>
          </div>

          {/* Index */}
          <span className="text-gray-400 text-xs sm:text-sm font-mono mt-2 sm:mt-3">
            {index}
          </span>

          {/* Pointer Labels (searching mode only) */}
          {showPointers && (
            <div className="flex justify-center gap-1 mt-1 text-xs font-mono h-4">
              {index === left && !eliminatedIndices.includes(index) && (
                <span className="text-blue-400 font-bold">L</span>
              )}
              {index === mid && <span className="text-yellow-400 font-bold">M</span>}
              {index === right && !eliminatedIndices.includes(index) && (
                <span className="text-purple-400 font-bold">R</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ArrayBars;
