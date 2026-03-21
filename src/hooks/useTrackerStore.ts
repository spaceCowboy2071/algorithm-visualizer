import { useSyncExternalStore } from 'react';
import { PROBLEMS } from '../data/blind75Problems';

export type ProblemStatus = 'not-started' | 'studied' | 'in-progress' | 'review-needed' | 'solved';

export interface ProblemProgress {
  status: ProblemStatus;
  solvedIndependently: boolean;
  solvedIn20Min: boolean;
  confidence: number; // 1-5, 0 = unset
  attemptCount: number;
  lastAttempted: string; // ISO date string, '' = never
  timeComplexity: string;
  spaceComplexity: string;
  notes: string;
}

export type TrackerState = Record<number, ProblemProgress>;

const STORAGE_KEY = 'blind75_tracker';

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

function migrateOldKeys(): TrackerState | null {
  let migrated: TrackerState | null = null;

  for (const problem of PROBLEMS) {
    const id = problem.id;
    const oldSolved = localStorage.getItem(`blind75_problem_${id}_solved`);
    const oldCompleted = localStorage.getItem(`problem_${id}_completed`);
    const oldSolvedIn20 = localStorage.getItem(`problem_${id}_solved_in_20`);
    const oldNotes = localStorage.getItem(`problem_${id}_notes`);

    if (oldSolved !== null || oldCompleted !== null || oldSolvedIn20 !== null || oldNotes !== null) {
      if (!migrated) migrated = {};
      const progress: ProblemProgress = { ...DEFAULT_PROGRESS };

      if (oldSolved === 'true' || oldCompleted === 'true') {
        progress.status = 'solved';
      }
      if (oldSolvedIn20 === 'true') {
        progress.solvedIn20Min = true;
      }
      if (oldNotes) {
        progress.notes = oldNotes;
      }

      migrated[id] = progress;

      // Delete old keys (but NOT problem_${id}_code_${language})
      if (oldSolved !== null) localStorage.removeItem(`blind75_problem_${id}_solved`);
      if (oldCompleted !== null) localStorage.removeItem(`problem_${id}_completed`);
      if (oldSolvedIn20 !== null) localStorage.removeItem(`problem_${id}_solved_in_20`);
      if (oldNotes !== null) localStorage.removeItem(`problem_${id}_notes`);
    }
  }

  return migrated;
}

function loadState(): TrackerState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as TrackerState;
    } catch {
      // corrupted — fall through to migration
    }
  }

  // No existing tracker blob — try migrating old keys
  const migrated = migrateOldKeys();
  if (migrated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }

  return {};
}

// Module-level singleton store
let state: TrackerState = loadState();
const listeners: Set<() => void> = new Set();

const SYNC_EVENT = 'blind75-tracker-sync';

function emitChange() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  for (const listener of listeners) {
    listener();
  }
  // Sync across components that may not share the same subscription
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const handleSync = () => listener();
  window.addEventListener(SYNC_EVENT, handleSync);

  return () => {
    listeners.delete(listener);
    window.removeEventListener(SYNC_EVENT, handleSync);
  };
}

function getSnapshot(): TrackerState {
  return state;
}

function getProgress(id: number): ProblemProgress {
  return state[id] ?? DEFAULT_PROGRESS;
}

function updateProgress(id: number, partial: Partial<ProblemProgress>) {
  const current = getProgress(id);
  state = {
    ...state,
    [id]: {
      ...current,
      ...partial,
      lastAttempted: partial.lastAttempted ?? new Date().toISOString().split('T')[0],
    },
  };
  emitChange();
}

function resetProgress(id: number) {
  const { [id]: _, ...rest } = state;
  void _;
  state = rest;
  emitChange();
}

export function useTrackerStore() {
  const tracker = useSyncExternalStore(subscribe, getSnapshot);

  return {
    tracker,
    getProgress,
    updateProgress,
    resetProgress,
  };
}
