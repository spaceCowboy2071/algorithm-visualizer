import type { ProblemStatus } from '../../hooks/useTrackerStore';

const STATUS_CONFIG: Record<ProblemStatus, { label: string; bg: string; text: string }> = {
  'not-started': { label: 'Not Started', bg: 'bg-gray-700', text: 'text-gray-300' },
  'studied': { label: 'Studied', bg: 'bg-blue-900', text: 'text-blue-300' },
  'in-progress': { label: 'In Progress', bg: 'bg-yellow-900', text: 'text-yellow-300' },
  'review-needed': { label: 'Review', bg: 'bg-orange-900', text: 'text-orange-300' },
  'solved': { label: 'Solved', bg: 'bg-[rgba(74,246,38,0.15)]', text: 'text-[#4af626]' },
};

interface StatusBadgeProps {
  status: ProblemStatus;
  size?: 'sm' | 'md';
}

function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-block rounded-full font-semibold font-mono ${config.bg} ${config.text} ${sizeClass}`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;
