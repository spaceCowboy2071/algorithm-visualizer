import { useState, useRef, useCallback } from 'react';

export interface UseVisualizationControlsReturn {
  // State
  isRunning: boolean;
  isPaused: boolean;

  // Refs (for async access)
  pauseRef: React.MutableRefObject<boolean>;
  cancelRef: React.MutableRefObject<boolean>;
  stepForwardRef: React.MutableRefObject<boolean>;

  // Actions
  setIsRunning: (value: boolean) => void;
  setIsPaused: (value: boolean) => void;
  togglePause: () => void;
  startStepMode: () => void;
  advanceStep: () => void;
  reset: () => Promise<void>;
}

export function useVisualizationControls(): UseVisualizationControlsReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const pauseRef = useRef(false);
  const cancelRef = useRef(false);
  const stepForwardRef = useRef(false);

  const togglePause = useCallback(() => {
    const newPauseState = !isPaused;
    setIsPaused(newPauseState);
    pauseRef.current = newPauseState;
  }, [isPaused]);

  const startStepMode = useCallback(() => {
    stepForwardRef.current = true;
    pauseRef.current = false;
  }, []);

  const advanceStep = useCallback(() => {
    stepForwardRef.current = true;
    pauseRef.current = false;
  }, []);

  const reset = useCallback(async () => {
    // Cancel any ongoing operation
    cancelRef.current = true;
    pauseRef.current = false;
    stepForwardRef.current = false;

    // Give async functions time to see the cancel flag
    await new Promise(resolve => setTimeout(resolve, 50));

    // Reset state
    setIsRunning(false);
    setIsPaused(false);
    cancelRef.current = false;
  }, []);

  return {
    isRunning,
    isPaused,
    pauseRef,
    cancelRef,
    stepForwardRef,
    setIsRunning,
    setIsPaused,
    togglePause,
    startStepMode,
    advanceStep,
    reset,
  };
}
