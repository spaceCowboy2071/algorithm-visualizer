import type { HashBucket } from '../../types/visualization';

interface HashTableViewProps {
  buckets: HashBucket[];
  mode: 'chaining' | 'linear-probing';
  currentBucketIndex: number | null;
  currentEntryId: string | null;
  highlightedBucketIndices: number[];
  visitedEntryIds: string[];
  foundEntryId: string | null;
  hashComputationStep: string | null;
}

// Horizontal layout constants
const BUCKET_W = 50;
const BUCKET_H = 40;
const BUCKET_GAP = 6;
const CHAIN_NODE = 32;
const CHAIN_GAP = 6;
const ARROW_H = 16;
const LEFT_PAD = 20;
const TOP_PAD = 50;
const INDEX_HEIGHT = 20;

function HashTableView({
  buckets,
  mode,
  currentBucketIndex,
  currentEntryId,
  highlightedBucketIndices,
  visitedEntryIds,
  foundEntryId,
  hashComputationStep,
}: HashTableViewProps) {
  if (buckets.length === 0) {
    return (
      <div className="h-48 sm:h-56 lg:h-72 w-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2 opacity-30">Empty Table</div>
          <div className="text-sm">Generate a hash table to start</div>
        </div>
      </div>
    );
  }

  const maxChainLen = Math.max(...buckets.map(b => b.entries.length), 0);
  const chainHeight = mode === 'chaining'
    ? maxChainLen * (CHAIN_NODE + CHAIN_GAP + ARROW_H) + 30
    : 0;
  const totalWidth = LEFT_PAD * 2 + buckets.length * (BUCKET_W + BUCKET_GAP);
  const totalHeight = TOP_PAD + INDEX_HEIGHT + BUCKET_H + chainHeight + 20;

  const getBucketStroke = (idx: number): string => {
    if (currentBucketIndex === idx) return '#eab308';
    if (highlightedBucketIndices.includes(idx)) return '#ca8a04';
    return '#374151';
  };

  const getBucketStrokeWidth = (idx: number): number => {
    if (currentBucketIndex === idx || highlightedBucketIndices.includes(idx)) return 2.5;
    return 1.5;
  };

  const getEntryFill = (entryId: string): string => {
    if (foundEntryId === entryId) return 'url(#htGreen)';
    if (currentEntryId === entryId) return 'url(#htYellow)';
    if (visitedEntryIds.includes(entryId)) return 'url(#htGray)';
    return 'url(#htBlue)';
  };

  const getEntryStroke = (entryId: string): string => {
    if (foundEntryId === entryId) return '#059669';
    if (currentEntryId === entryId) return '#ca8a04';
    if (visitedEntryIds.includes(entryId)) return '#4b5563';
    return '#3b7de8';
  };

  return (
    <div className="h-48 sm:h-56 lg:h-72 w-full">
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="htBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5b9dff" />
            <stop offset="100%" stopColor="#3b7de8" />
          </linearGradient>
          <linearGradient id="htYellow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="htGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="htGray" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
          <linearGradient id="htRed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Hash computation banner */}
        {hashComputationStep && (
          <text
            x={totalWidth / 2}
            y={20}
            textAnchor="middle"
            fill="#eab308"
            fontSize={13}
            fontFamily="monospace"
            fontWeight="bold"
          >
            {hashComputationStep}
          </text>
        )}

        {/* Buckets — horizontal row */}
        {buckets.map((bucket, i) => {
          const x = LEFT_PAD + i * (BUCKET_W + BUCKET_GAP);
          const bucketY = TOP_PAD + INDEX_HEIGHT;

          return (
            <g key={i}>
              {/* Index label above bucket */}
              <text
                x={x + BUCKET_W / 2}
                y={TOP_PAD + INDEX_HEIGHT - 6}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={11}
                fontFamily="monospace"
              >
                {i}
              </text>

              {/* Bucket rectangle */}
              <rect
                x={x}
                y={bucketY}
                width={BUCKET_W}
                height={BUCKET_H}
                rx={4}
                fill="#1f2937"
                stroke={getBucketStroke(i)}
                strokeWidth={getBucketStrokeWidth(i)}
                strokeDasharray={highlightedBucketIndices.includes(i) && currentBucketIndex !== i ? '4 2' : undefined}
              />

              {mode === 'linear-probing' ? (
                // Linear probing: value inside bucket
                bucket.entries.length > 0 ? (
                  <g>
                    <rect
                      x={x + 4}
                      y={bucketY + 4}
                      width={BUCKET_W - 8}
                      height={BUCKET_H - 8}
                      rx={3}
                      fill={getEntryFill(bucket.entries[0].id)}
                      stroke={getEntryStroke(bucket.entries[0].id)}
                      strokeWidth={1.5}
                    />
                    <text
                      x={x + BUCKET_W / 2}
                      y={bucketY + BUCKET_H / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize={12}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {bucket.entries[0].key}
                    </text>
                  </g>
                ) : bucket.isDeleted ? (
                  <text
                    x={x + BUCKET_W / 2}
                    y={bucketY + BUCKET_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ef4444"
                    fontSize={10}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    DEL
                  </text>
                ) : (
                  <text
                    x={x + BUCKET_W / 2}
                    y={bucketY + BUCKET_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#4b5563"
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    empty
                  </text>
                )
              ) : (
                // Chaining: chain extends downward
                <>
                  {bucket.entries.length === 0 ? (
                    <text
                      x={x + BUCKET_W / 2}
                      y={bucketY + BUCKET_H + 16}
                      textAnchor="middle"
                      fill="#4b5563"
                      fontSize={9}
                      fontFamily="monospace"
                    >
                      null
                    </text>
                  ) : (
                    <>
                      {/* Arrow from bucket down to first chain node */}
                      <line
                        x1={x + BUCKET_W / 2}
                        y1={bucketY + BUCKET_H}
                        x2={x + BUCKET_W / 2}
                        y2={bucketY + BUCKET_H + ARROW_H}
                        stroke="#4b5563"
                        strokeWidth={1.5}
                      />

                      {bucket.entries.map((entry, ei) => {
                        const cx = x + BUCKET_W / 2;
                        const cy = bucketY + BUCKET_H + ARROW_H + ei * (CHAIN_NODE + CHAIN_GAP + ARROW_H) + CHAIN_NODE / 2;

                        return (
                          <g key={entry.id}>
                            {/* Chain node */}
                            <rect
                              x={cx - CHAIN_NODE / 2}
                              y={cy - CHAIN_NODE / 2}
                              width={CHAIN_NODE}
                              height={CHAIN_NODE}
                              rx={4}
                              fill={getEntryFill(entry.id)}
                              stroke={getEntryStroke(entry.id)}
                              strokeWidth={1.5}
                            />
                            <text
                              x={cx}
                              y={cy}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="white"
                              fontSize={11}
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {entry.key}
                            </text>

                            {/* Arrow to next or null */}
                            {ei < bucket.entries.length - 1 ? (
                              <line
                                x1={cx}
                                y1={cy + CHAIN_NODE / 2}
                                x2={cx}
                                y2={cy + CHAIN_NODE / 2 + CHAIN_GAP + ARROW_H}
                                stroke="#4b5563"
                                strokeWidth={1.5}
                              />
                            ) : (
                              <text
                                x={cx}
                                y={cy + CHAIN_NODE / 2 + 12}
                                textAnchor="middle"
                                fill="#4b5563"
                                fontSize={9}
                                fontFamily="monospace"
                              >
                                null
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default HashTableView;
