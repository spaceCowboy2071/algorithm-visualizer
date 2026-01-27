interface PlaybackControlsProps {
  onStepBack: () => void;
  onPlayPause: () => void;
  onStepForward: () => void;
  onReset: () => void;
  isRunning: boolean;
  isPaused: boolean;
  canStepBack: boolean;
  disabled: boolean;
}

function PlaybackControls({
  onStepBack,
  onPlayPause,
  onStepForward,
  onReset,
  isRunning,
  isPaused,
  canStepBack,
  disabled,
}: PlaybackControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-6">
      <button
        onClick={onStepBack}
        disabled={!canStepBack}
        className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
      >
        <span>⏮</span> <span className="hidden sm:inline">Step Back</span>
      </button>
      <button
        onClick={onPlayPause}
        disabled={disabled}
        className="px-4 sm:px-6 lg:px-7 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
      >
        <span>{isRunning ? (isPaused ? '▶' : '⏸') : '▶'}</span>
        <span className="hidden sm:inline">{isRunning ? (isPaused ? 'Resume' : 'Pause') : 'Play'}</span>
        <span className="sm:hidden">{isRunning ? (isPaused ? 'Resume' : 'Pause') : 'Play'}</span>
      </button>
      <button
        onClick={onStepForward}
        disabled={disabled}
        className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
      >
        <span className="hidden sm:inline">Step Forward</span> <span>⏭</span>
      </button>
      <button
        onClick={onReset}
        className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
      >
        <span>↻</span> <span className="hidden sm:inline">Reset</span>
      </button>
    </div>
  );
}

export default PlaybackControls;
