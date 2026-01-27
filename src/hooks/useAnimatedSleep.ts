import { useRef, useState, useCallback } from 'react';

export interface UseAnimatedSleepReturn {
  sleep: (ms: number) => Promise<void>;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  animationSpeedRef: React.MutableRefObject<number>;
}

interface SleepOptions {
  pauseRef: React.MutableRefObject<boolean>;
  cancelRef: React.MutableRefObject<boolean>;
  stepForwardRef: React.MutableRefObject<boolean>;
  onBeforeSleep?: () => void;
}

export function useAnimatedSleep(options: SleepOptions): UseAnimatedSleepReturn {
  const { pauseRef, cancelRef, stepForwardRef, onBeforeSleep } = options;

  const [animationSpeed, setAnimationSpeedState] = useState(1);
  const animationSpeedRef = useRef(1);

  const setAnimationSpeed = useCallback((speed: number) => {
    setAnimationSpeedState(speed);
    animationSpeedRef.current = speed;
  }, []);

  const sleep = useCallback(async (ms: number) => {
    // Call the before-sleep callback (usually saves to history)
    onBeforeSleep?.();

    // Check if cancelled before sleeping
    if (cancelRef.current) {
      throw new Error('CANCELLED');
    }

    // Shift speed down by 0.25 so displayed 1x behaves like previous 0.75x
    // Use ref to get current speed value (allows changing speed during playback)
    const effectiveSpeed = Math.max(animationSpeedRef.current - 0.25, 0.05);
    const adjustedMs = ms / effectiveSpeed;

    // Normal delay
    await new Promise(resolve => setTimeout(resolve, adjustedMs));

    // Check for pause
    while (pauseRef.current && !cancelRef.current) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check for step forward mode
    if (stepForwardRef.current) {
      pauseRef.current = true;
      stepForwardRef.current = false; // One step done, reset flag
    }

    // Check if cancelled after sleeping
    if (cancelRef.current) {
      throw new Error('CANCELLED');
    }
  }, [pauseRef, cancelRef, stepForwardRef, onBeforeSleep]);

  return {
    sleep,
    animationSpeed,
    setAnimationSpeed,
    animationSpeedRef,
  };
}
