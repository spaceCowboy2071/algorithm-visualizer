// src/components/shared/TestResults.tsx
// Renders per-test-case pass/fail results with collapsible details.
// Replaces the old <pre> text output in ProblemPage.

import { useState } from 'react';
import type { TestRunResult, TestCaseResult } from '../../types/visualization';

interface TestResultsProps {
  result: TestRunResult;
}

function TestCaseRow({ tc, index }: { tc: TestCaseResult; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#30363d] rounded mb-1.5">
      {/* Summary row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-[#1c2128] transition text-left"
      >
        <span className={tc.passed ? 'text-green-400' : 'text-red-400'}>
          {tc.passed ? '✓' : '✗'}
        </span>
        <span className="text-gray-400">Test {index + 1}</span>
        <span className={`ml-auto text-[10px] ${tc.passed ? 'text-green-600' : 'text-red-600'}`}>
          {tc.passed ? 'Passed' : tc.status === 'runtime-error-other' ? 'Error' : 'Failed'}
        </span>
        <span className="text-gray-600 text-[10px]">{expanded ? '▾' : '▸'}</span>
      </button>

      {/* Detail panel — shown when expanded */}
      {expanded && (
        <div className="px-3 pb-2 text-[11px] font-mono space-y-1 border-t border-[#30363d]">
          <div className="pt-1.5">
            <span className="text-gray-500">Input: </span>
            <span className="text-gray-300">{JSON.stringify(tc.args)}</span>
          </div>
          <div>
            <span className="text-gray-500">Expected: </span>
            <span className="text-green-400">{JSON.stringify(tc.expected)}</span>
          </div>
          <div>
            <span className="text-gray-500">Actual: </span>
            <span className={tc.passed ? 'text-green-400' : 'text-red-400'}>
              {tc.actual !== null ? JSON.stringify(tc.actual) : 'null'}
            </span>
          </div>
          {tc.stderr && (
            <div>
              <span className="text-gray-500">Error: </span>
              <span className="text-red-400">{tc.stderr}</span>
            </div>
          )}
          {tc.time && (
            <div>
              <span className="text-gray-500">Time: </span>
              <span className="text-gray-400">{tc.time}s</span>
              {tc.memory && (
                <>
                  <span className="text-gray-600 mx-1">|</span>
                  <span className="text-gray-500">Memory: </span>
                  <span className="text-gray-400">{tc.memory} KB</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestResults({ result }: TestResultsProps) {
  // API-level error (network failure, missing key, etc.)
  if (result.error && result.results.length === 0) {
    return (
      <div className="p-3">
        <div className="text-red-400 text-xs font-mono whitespace-pre-wrap">
          {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Summary line */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-bold ${result.allPassed ? 'text-green-400' : 'text-red-400'}`}
        >
          {result.allPassed
            ? '✓ All tests passed!'
            : `✗ ${result.passed}/${result.total} tests passed`}
        </span>
        {result.results[0]?.time && (
          <span className="text-[10px] text-gray-600 ml-auto">
            {result.results[0].time}s
          </span>
        )}
      </div>

      {/* Execution-level error banner (TLE, compile error, etc.) */}
      {result.error && (
        <div className="mb-2 p-2 bg-red-900/20 border border-red-800/40 rounded text-xs text-red-400 font-mono whitespace-pre-wrap">
          {result.error}
        </div>
      )}

      {/* Per-test-case rows */}
      {result.results.map((tc, i) => (
        <TestCaseRow key={i} tc={tc} index={i} />
      ))}
    </div>
  );
}
