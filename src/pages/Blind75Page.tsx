import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PROBLEMS, CATEGORIES } from '../data/blind75Problems';
import { useTrackerStore } from '../hooks/useTrackerStore';
import { useAuth } from '../hooks/useAuth';
import StatusEditDropdown from '../components/blind75/StatusEditDropdown';
import TrackerDashboard from '../components/blind75/TrackerDashboard';

const BORDER_COLORS: Record<string, string> = {
  'not-started': 'border-[#30363d] hover:border-[var(--accent)]',
  'studied': 'border-blue-800 hover:border-blue-500',
  'in-progress': 'border-yellow-800 hover:border-yellow-500',
  'review-needed': 'border-orange-800 hover:border-orange-500',
  'solved': 'border-[var(--accent)]',
};

function Blind75Page() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const { tracker, getProgress, updateProgress } = useTrackerStore();
  const { user } = useAuth();

  const getCategoryProblems = (category: string) => {
    return PROBLEMS.filter(p => p.category === category);
  };

  const getCategoryStats = (category: string) => {
    const problems = getCategoryProblems(category);
    const solved = problems.filter(p => getProgress(p.id).status === 'solved').length;
    return { total: problems.length, solved };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'Hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const totalSolved = PROBLEMS.filter(p => getProgress(p.id).status === 'solved').length;

  return (
    <div className="min-h-screen bg-[#0d1117] font-mono text-[var(--accent)] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#161b22] px-6 py-3 border-b border-[#30363d] flex items-center justify-between">
        <span className="text-gray-500 text-xs">
          {user?.displayName ?? 'terminal'}@algorithmviz/blind75{selectedCategory ? `/${selectedCategory.toLowerCase().replace(/\s+/g, '-')}` : ''}
        </span>
        <Link
          to="/"
          className="text-gray-500 hover:text-[var(--accent)] text-xs transition"
        >
          ← Back
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto relative">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ filter: 'drop-shadow(0 0 10px var(--accent))' }}>
              <span className="text-[var(--accent)]">$ </span>Blind 75 Challenge
            </h1>
            <button
              onClick={() => setIsDashboardOpen(true)}
              className="px-3 py-1.5 border border-[var(--accent)] text-[var(--accent)] rounded text-xs font-semibold font-mono transition"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent) 10%, transparent)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Dashboard
            </button>
          </div>
          <p className="text-sm md:text-base opacity-80 ml-6">
            &gt; {totalSolved}/75 problems solved
          </p>
        </div>

        {/* Sign in banner for unauthenticated users */}
        {!user && (
          <div className="mb-6 px-4 py-3 border border-[#30363d] rounded-lg bg-[#161b22] flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Sign in to save your progress across devices.
            </span>
            <Link
              to="/"
              className="px-3 py-1 border border-[var(--accent)] text-[var(--accent)] rounded text-xs font-semibold font-mono hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] transition"
            >
              Sign In
            </Link>
          </div>
        )}

        {selectedCategory === null ? (
          /* ── Category Grid ── */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map(category => {
              const stats = getCategoryStats(category);
              const allSolved = stats.solved === stats.total;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`group relative p-6 border-2 rounded-lg transition-all hover:scale-[1.03] ${
                    allSolved
                      ? 'border-[var(--accent)] bg-[#161b22]'
                      : 'border-[#30363d] hover:border-[var(--accent)] bg-[#161b22]'
                  }`}
                  style={allSolved ? { backgroundColor: 'color-mix(in srgb, var(--accent) 5%, #161b22)' } : undefined}
                >
                  <div className="text-lg font-bold text-[var(--accent)] mb-3">
                    {category}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.solved}/{stats.total} solved
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.total > 0 ? (stats.solved / stats.total) * 100 : 0}%`, backgroundColor: 'var(--accent)' }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* ── Problem Grid for Selected Category ── */
          <div>
            {/* Back to categories */}
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-gray-500 hover:text-[var(--accent)] text-sm mb-6 transition"
            >
              ← All Categories
            </button>

            {/* Category header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[var(--accent)]">
                {selectedCategory}
              </h2>
              <span className="text-xs text-gray-500">
                {getCategoryStats(selectedCategory).solved}/{getCategoryStats(selectedCategory).total} solved
              </span>
            </div>

            {/* Problems grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {getCategoryProblems(selectedCategory).map(problem => {
                const progress = getProgress(problem.id);
                const borderClass = BORDER_COLORS[progress.status] ?? BORDER_COLORS['not-started'];
                const isSolved = progress.status === 'solved';

                return (
                  <div
                    key={problem.id}
                    className={`group relative p-4 border-2 rounded-lg transition-all bg-[#161b22] ${borderClass}`}
                    style={isSolved ? { backgroundColor: 'color-mix(in srgb, var(--accent) 5%, #161b22)' } : undefined}
                  >
                    {/* Top row: status dropdown + difficulty */}
                    <div className="flex items-center justify-between mb-3">
                      <StatusEditDropdown
                        currentStatus={progress.status}
                        onStatusChange={(status) => updateProgress(problem.id, { status })}
                      />
                      <span className={`text-xs font-semibold ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </div>

                    {/* Problem title (links to problem page) */}
                    <Link
                      to={`/blind75/problem/${problem.id}`}
                      className="block text-sm text-gray-300 hover:text-[var(--accent)] transition font-semibold mb-2 leading-snug"
                    >
                      {problem.title}
                    </Link>

                    {/* Pattern + LeetCode link */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-600 truncate mr-2">{problem.pattern}</span>
                      <a
                        href={problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-[var(--accent)] text-xs transition shrink-0"
                      >
                        LeetCode ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dashboard Overlay */}
        <TrackerDashboard
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          problems={PROBLEMS}
          tracker={tracker}
        />
      </div>
    </div>
  );
}

export default Blind75Page;
