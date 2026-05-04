// ── ProblemDescription ──
// Reusable renderer for a Blind 75 problem's body content: description,
// examples, constraints. Pulled out of ProblemPage so the same JSX can be
// reused in the WhiteBoardPage reference panel without duplication.
//
// Body-only on purpose — the surrounding header (title, difficulty, timer,
// notes button) is consumer-specific. ProblemPage builds its own header with
// timer + notes; WhiteBoardPage builds a smaller header for its narrow side
// panel. Sharing a header would couple the two screens for no real win.

import type { Problem } from '../../data/problemsData';

interface ProblemDescriptionProps {
  problem: Problem;
}

export function ProblemDescription({ problem }: ProblemDescriptionProps) {
  return (
    <>
      {/* Description */}
      <div className="mb-6">
        <h2 className="text-[var(--accent)] text-sm font-bold mb-2">Description</h2>
        <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
          {problem.description}
        </p>
      </div>

      {/* Examples */}
      <div className="mb-6">
        <h2 className="text-[var(--accent)] text-sm font-bold mb-2">Examples</h2>
        {problem.examples.map((example, idx) => (
          <div key={idx} className="mb-4 p-3 bg-[#161b22] border border-[#30363d] rounded">
            <p className="text-gray-400 text-xs mb-1">
              <span className="text-[var(--accent)]">Input:</span> {example.input}
            </p>
            <p className="text-gray-400 text-xs mb-1">
              <span className="text-[var(--accent)]">Output:</span> {example.output}
            </p>
            <p className="text-gray-500 text-xs">
              <span className="text-gray-600">Explanation:</span> {example.explanation}
            </p>
          </div>
        ))}
      </div>

      {/* Constraints */}
      <div className="mb-6">
        <h2 className="text-[var(--accent)] text-sm font-bold mb-2">Constraints</h2>
        <ul className="text-gray-400 text-xs space-y-1">
          {problem.constraints.map((constraint, idx) => (
            <li key={idx}>• {constraint}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default ProblemDescription;
