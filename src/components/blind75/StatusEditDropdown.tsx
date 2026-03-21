import { useState, useRef, useEffect } from 'react';
import type { ProblemStatus } from '../../hooks/useTrackerStore';

const STATUS_OPTIONS: { value: ProblemStatus; label: string; color: string }[] = [
  { value: 'not-started', label: 'Not Started', color: 'text-gray-400' },
  { value: 'studied', label: 'Studied', color: 'text-blue-400' },
  { value: 'in-progress', label: 'In Progress', color: 'text-yellow-400' },
  { value: 'review-needed', label: 'Review Needed', color: 'text-orange-400' },
  { value: 'solved', label: 'Solved', color: 'text-[#4af626]' },
];

const TRIGGER_COLORS: Record<ProblemStatus, string> = {
  'not-started': 'border-gray-600 text-gray-400',
  'studied': 'border-blue-500 text-blue-400',
  'in-progress': 'border-yellow-500 text-yellow-400',
  'review-needed': 'border-orange-500 text-orange-400',
  'solved': 'border-[#4af626] text-[#4af626]',
};

interface StatusEditDropdownProps {
  currentStatus: ProblemStatus;
  onStatusChange: (status: ProblemStatus) => void;
}

function StatusEditDropdown({ currentStatus, onStatusChange }: StatusEditDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const currentOption = STATUS_OPTIONS.find(o => o.value === currentStatus)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`px-2 py-1 border rounded text-xs font-mono font-semibold transition hover:brightness-125 ${TRIGGER_COLORS[currentStatus]}`}
      >
        {currentOption.label}
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-40 bg-[#1a1a1a] border border-[#2a2a2a] rounded shadow-xl overflow-hidden">
          {STATUS_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStatusChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-mono transition hover:bg-[#2a2a2a] ${
                option.value === currentStatus ? `${option.color} bg-[#2a2a2a]` : 'text-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default StatusEditDropdown;
