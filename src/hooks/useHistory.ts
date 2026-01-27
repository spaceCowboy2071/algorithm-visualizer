import { useState, useCallback } from 'react';

export interface UseHistoryReturn<T> {
  history: T[];
  saveToHistory: (snapshot: T) => void;
  stepBack: () => T | null;
  clearHistory: () => void;
  canStepBack: boolean;
}

export function useHistory<T>(): UseHistoryReturn<T> {
  const [history, setHistory] = useState<T[]>([]);

  const saveToHistory = useCallback((snapshot: T) => {
    setHistory(prev => [...prev, snapshot]);
  }, []);

  const stepBack = useCallback((): T | null => {
    if (history.length === 0) return null;

    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    return previousState;
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    saveToHistory,
    stepBack,
    clearHistory,
    canStepBack: history.length > 0,
  };
}
