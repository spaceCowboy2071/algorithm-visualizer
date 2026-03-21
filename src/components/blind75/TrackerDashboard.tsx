import { useEffect } from 'react';
import type { TrackerState, ProblemProgress } from '../../hooks/useTrackerStore';
import type { Blind75Problem } from '../../data/blind75Problems';
import { CATEGORIES } from '../../data/blind75Problems';
import StatusBadge from './StatusBadge';

interface TrackerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  problems: Blind75Problem[];
  tracker: TrackerState;
}

const DEFAULT_PROGRESS: ProblemProgress = {
  status: 'not-started',
  solvedIndependently: false,
  solvedIn20Min: false,
  confidence: 0,
  attemptCount: 0,
  lastAttempted: '',
  timeComplexity: '',
  spaceComplexity: '',
  notes: '',
};

function TrackerDashboard({ isOpen, onClose, problems, tracker }: TrackerDashboardProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getProgress = (id: number) => tracker[id] ?? DEFAULT_PROGRESS;

  const allProgress = problems.map(p => getProgress(p.id));
  const solved = allProgress.filter(p => p.status === 'solved').length;
  const studied = allProgress.filter(p => p.status === 'studied').length;
  const inProgress = allProgress.filter(p => p.status === 'in-progress').length;
  const notStarted = problems.length - solved - studied - inProgress - allProgress.filter(p => p.status === 'review-needed').length;
  const solvedIndependently = allProgress.filter(p => p.solvedIndependently).length;
  const solvedIn20Min = allProgress.filter(p => p.solvedIn20Min).length;
  const withConfidence = allProgress.filter(p => p.confidence > 0);
  const avgConfidence = withConfidence.length > 0
    ? (withConfidence.reduce((sum, p) => sum + p.confidence, 0) / withConfidence.length).toFixed(1)
    : '—';
  const completionPct = Math.round((solved / problems.length) * 100);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(13, 13, 13, 0.92)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full max-w-3xl max-h-[80%] overflow-auto mx-4 p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#4af626] drop-shadow-[0_0_8px_rgba(74,246,38,0.4)]">
            Dashboard
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-red-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Primary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Solved" value={solved} accent="text-[#4af626]" />
          <StatCard label="Studied" value={studied} accent="text-blue-400" />
          <StatCard label="In Progress" value={inProgress} accent="text-yellow-400" />
          <StatCard label="Not Started" value={notStarted} accent="text-gray-400" />
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Independent" value={solvedIndependently} accent="text-emerald-400" />
          <StatCard label="Under 20 min" value={solvedIn20Min} accent="text-cyan-400" />
          <StatCard label="Avg Confidence" value={avgConfidence} accent="text-purple-400" />
          <StatCard label="Completion" value={`${completionPct}%`} accent="text-[#4af626]" />
        </div>

        {/* Per-Category Breakdown */}
        <h3 className="text-sm font-bold text-gray-400 mb-3">By Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map(category => {
            const catProblems = problems.filter(p => p.category === category);
            const catSolved = catProblems.filter(p => getProgress(p.id).status === 'solved').length;
            const catTotal = catProblems.length;
            const pct = catTotal > 0 ? (catSolved / catTotal) * 100 : 0;

            // Count statuses for the pills
            const catStudied = catProblems.filter(p => getProgress(p.id).status === 'studied').length;
            const catInProgress = catProblems.filter(p => getProgress(p.id).status === 'in-progress').length;
            const catReview = catProblems.filter(p => getProgress(p.id).status === 'review-needed').length;

            return (
              <div key={category} className="flex items-center gap-3">
                <span className="text-xs text-gray-300 w-40 shrink-0 truncate">{category}</span>
                <div className="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4af626] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-[#4af626] w-12 text-right">{catSolved}/{catTotal}</span>
                  {catStudied > 0 && <StatusBadge status="studied" size="sm" />}
                  {catInProgress > 0 && <StatusBadge status="in-progress" size="sm" />}
                  {catReview > 0 && <StatusBadge status="review-needed" size="sm" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded">
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
      <div className="text-[10px] text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default TrackerDashboard;
