import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PROBLEMS, CATEGORIES } from '../data/blind75Problems';
import { useTrackerStore } from '../hooks/useTrackerStore';
import StatusEditDropdown from '../components/blind75/StatusEditDropdown';
import TrackerDashboard from '../components/blind75/TrackerDashboard';

const BORDER_COLORS: Record<string, string> = {
  'not-started': 'border-[#2a2a2a] hover:border-[#4af626]',
  'studied': 'border-blue-800 hover:border-blue-500',
  'in-progress': 'border-yellow-800 hover:border-yellow-500',
  'review-needed': 'border-orange-800 hover:border-orange-500',
  'solved': 'border-[#4af626] bg-[rgba(74,246,38,0.05)]',
};

function Blind75Page() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const { tracker, getProgress, updateProgress } = useTrackerStore();

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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)' }}
    >
      {/* Monitor Container */}
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)]">
        {/* Monitor Frame (Black Bezel) */}
        <div className="flex-1 bg-black p-8 flex flex-col relative">
          {/* Monitor Screen */}
          <div className="flex-1 flex flex-col">
            {/* Terminal Window */}
            <div className="flex-1 bg-[#0d0d0d] border-2 border-[#1a1a1a] rounded-md shadow-2xl flex flex-col overflow-hidden">
              {/* Terminal Title Bar */}
              <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between">
                <span className="text-gray-500 text-xs font-mono">
                  terminal@algorithmviz/blind75{selectedCategory ? `/${selectedCategory.toLowerCase().replace(/\s+/g, '-')}` : ''}
                </span>
                <Link
                  to="/"
                  className="text-gray-500 hover:text-[#4af626] text-xs transition"
                >
                  ← Back
                </Link>
              </div>

              {/* Terminal Body */}
              <div className="flex-1 flex flex-col p-8 text-[#4af626] font-mono overflow-auto relative">
                {/* Header Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-[0_0_10px_rgba(74,246,38,0.5)]">
                      <span className="text-[#4af626]">$ </span>Blind 75 Challenge
                    </h1>
                    <button
                      onClick={() => setIsDashboardOpen(true)}
                      className="px-3 py-1.5 border border-[#4af626] text-[#4af626] rounded text-xs font-semibold font-mono hover:bg-[rgba(74,246,38,0.1)] transition"
                    >
                      Dashboard
                    </button>
                  </div>
                  <p className="text-sm md:text-base opacity-80 ml-6">
                    &gt; {totalSolved}/75 problems solved
                  </p>
                </div>

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
                          className={`group relative p-6 border-2 rounded-lg transition-all hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(74,246,38,0.15)] ${
                            allSolved
                              ? 'border-[#4af626] bg-[rgba(74,246,38,0.05)]'
                              : 'border-[#2a2a2a] hover:border-[#4af626] bg-[#1a1a1a]'
                          }`}
                        >
                          <div className="text-lg font-bold text-[#4af626] mb-3 group-hover:drop-shadow-[0_0_6px_rgba(74,246,38,0.5)]">
                            {category}
                          </div>
                          <div className="text-xs text-gray-500">
                            {stats.solved}/{stats.total} solved
                          </div>
                          {/* Progress bar */}
                          <div className="mt-3 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#4af626] rounded-full transition-all duration-500"
                              style={{ width: `${stats.total > 0 ? (stats.solved / stats.total) * 100 : 0}%` }}
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
                      className="text-gray-500 hover:text-[#4af626] text-sm mb-6 transition"
                    >
                      ← All Categories
                    </button>

                    {/* Category header */}
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-[#4af626]">
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

                        return (
                          <div
                            key={problem.id}
                            className={`group relative p-4 border-2 rounded-lg transition-all hover:shadow-[0_0_15px_rgba(74,246,38,0.1)] bg-[#1a1a1a] ${borderClass}`}
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
                              className="block text-sm text-gray-300 hover:text-[#4af626] transition font-semibold mb-2 leading-snug"
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
                                className="text-gray-600 hover:text-[#4af626] text-xs transition shrink-0"
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
          </div>

          {/* Power LED */}
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-[#4af626] rounded-full shadow-[0_0_8px_rgba(74,246,38,0.8)] animate-pulse"></div>
        </div>
      </div>

      {/* Monitor Stand (Neck) */}
      <div
        className="h-20 flex justify-center items-start"
        style={{ background: 'linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)' }}
      >
        <div
          className="w-16 h-20 rounded-b shadow-md"
          style={{
            background: 'linear-gradient(180deg, #000000 0%, #2a2a2a 20%, #d4d4d4 60%, #a8a8a8 100%)'
          }}
        ></div>
      </div>
    </div>
  );
}

export default Blind75Page;
