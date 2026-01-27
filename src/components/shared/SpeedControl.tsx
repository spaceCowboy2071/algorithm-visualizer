interface SpeedControlProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
}

function SpeedControl({ speed, onSpeedChange }: SpeedControlProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4">
      <span className="text-xs sm:text-sm text-gray-400">Speed:</span>
      <input
        type="range"
        min="0.25"
        max="2"
        step="0.25"
        value={speed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        className="w-32 sm:w-48 lg:w-64 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <span className="text-xs sm:text-sm text-gray-400 font-mono w-8 sm:w-12">{speed.toFixed(2)}x</span>
    </div>
  );
}

export default SpeedControl;
