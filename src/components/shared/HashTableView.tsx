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

const BUCKET_W = 56;
const BUCKET_H = 40;
const BUCKET_GAP = 4;
const CHAIN_NODE = 34;
const CHAIN_GAP = 8;
const ARROW_W = 20;
const LEFT_PAD = 70;
const TOP_PAD = 50;

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
  const chainWidth = mode === 'chaining'
    ? maxChainLen * (CHAIN_NODE + CHAIN_GAP + ARROW_W) + 40
    : 0;
  const totalWidth = LEFT_PAD + BUCKET_W + chainWidth + 40;
  const totalHeight = TOP_PAD + buckets.length * (BUCKET_H + BUCKET_GAP) + 10;

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

        {/* Buckets */}
        {buckets.map((bucket, i) => {
          const y = TOP_PAD + i * (BUCKET_H + BUCKET_GAP);
          const bucketX = LEFT_PAD;

          return (
            <g key={i}>
              {/* Index label */}
              <text
                x={LEFT_PAD - 10}
                y={y + BUCKET_H / 2}
                textAnchor="end"
                dominantBaseline="central"
                fill="#9ca3af"
                fontSize={12}
                fontFamily="monospace"
              >
                [{i}]
              </text>

              {/* Bucket rectangle */}
              <rect
                x={bucketX}
                y={y}
                width={BUCKET_W}
                height={BUCKET_H}
                rx={4}
                fill="#1f2937"
                stroke={getBucketStroke(i)}
                strokeWidth={getBucketStrokeWidth(i)}
                strokeDasharray={highlightedBucketIndices.includes(i) && currentBucketIndex !== i ? '4 2' : undefined}
              />

              {mode === 'linear-probing' ? (
                // Linear probing: show value inside bucket
                bucket.entries.length > 0 ? (
                  <g>
                    <rect
                      x={bucketX + 4}
                      y={y + 4}
                      width={BUCKET_W - 8}
                      height={BUCKET_H - 8}
                      rx={3}
                      fill={getEntryFill(bucket.entries[0].id)}
                      stroke={getEntryStroke(bucket.entries[0].id)}
                      strokeWidth={1.5}
                    />
                    <text
                      x={bucketX + BUCKET_W / 2}
                      y={y + BUCKET_H / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize={13}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {bucket.entries[0].key}
                    </text>
                  </g>
                ) : bucket.isDeleted ? (
                  <text
                    x={bucketX + BUCKET_W / 2}
                    y={y + BUCKET_H / 2}
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
                    x={bucketX + BUCKET_W / 2}
                    y={y + BUCKET_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#4b5563"
                    fontSize={10}
                    fontFamily="monospace"
                  >
                    empty
                  </text>
                )
              ) : (
                // Chaining: show chain extending right
                <>
                  {bucket.entries.length === 0 ? (
                    <text
                      x={bucketX + BUCKET_W + 12}
                      y={y + BUCKET_H / 2}
                      dominantBaseline="central"
                      fill="#4b5563"
                      fontSize={10}
                      fontFamily="monospace"
                    >
                      null
                    </text>
                  ) : (
                    <>
                      {/* Arrow from bucket to first chain node */}
                      <line
                        x1={bucketX + BUCKET_W}
                        y1={y + BUCKET_H / 2}
                        x2={bucketX + BUCKET_W + ARROW_W}
                        y2={y + BUCKET_H / 2}
                        stroke="#4b5563"
                        strokeWidth={1.5}
                        markerEnd="url(#htArrow)"
                      />

                      {bucket.entries.map((entry, ei) => {
                        const cx = bucketX + BUCKET_W + ARROW_W + ei * (CHAIN_NODE + CHAIN_GAP + ARROW_W) + CHAIN_NODE / 2;
                        const cy = y + BUCKET_H / 2;

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
                              fontSize={12}
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {entry.key}
                            </text>

                            {/* Arrow to next or null */}
                            {ei < bucket.entries.length - 1 ? (
                              <line
                                x1={cx + CHAIN_NODE / 2}
                                y1={cy}
                                x2={cx + CHAIN_NODE / 2 + CHAIN_GAP + ARROW_W}
                                y2={cy}
                                stroke="#4b5563"
                                strokeWidth={1.5}
                              />
                            ) : (
                              <text
                                x={cx + CHAIN_NODE / 2 + 10}
                                y={cy}
                                dominantBaseline="central"
                                fill="#4b5563"
                                fontSize={10}
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
