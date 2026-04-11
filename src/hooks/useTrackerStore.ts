import { useSyncExternalStore } from 'react';
import { PROBLEMS } from '../data/blind75Problems';
import { progress as progressApi, type ProgressRecord } from '../services/api';
import { toServerStatus, toClientStatus } from '../utils/statusMapping';

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

// ── Auth Awareness ──
// This flag tells the store whether to sync with the server or not.
// AuthContext calls setAuthenticated() after login/logout.
// When true: changes fire-and-forget PUT to server, localStorage is not used.
// When false: changes live only in memory (no persistence at all).
let authenticated = false;

export function setAuthenticated(value: boolean) {
  authenticated = value;
}

// ── Legacy Migration (old scattered localStorage keys → single blob) ──
// This migrates from the Phase 1 checkbox system to the tracker blob.
// Separate from the server migration — this handles the old key format.
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

// ── Load initial state from localStorage ──
// This runs once on module load. If the user is not logged in, this gives them
// their existing localStorage data for the session. If they ARE logged in,
// hydrateFromServer() will overwrite this state shortly after.
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

// ── Module-level singleton store ──
let state: TrackerState = loadState();
const listeners: Set<() => void> = new Set();

const SYNC_EVENT = 'blind75-tracker-sync';

function emitChange() {
  // Notify all React subscribers so the UI re-renders
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

// ── Convert a ProblemProgress to the shape the server PUT endpoint expects ──
function toServerPayload(problemProgress: Partial<ProblemProgress>) {
  const payload: Record<string, unknown> = {};

  if (problemProgress.status !== undefined) {
    payload.status = toServerStatus(problemProgress.status);
  }
  if (problemProgress.solvedIndependently !== undefined) {
    payload.solvedIndependently = problemProgress.solvedIndependently;
  }
  if (problemProgress.solvedIn20Min !== undefined) {
    payload.solvedIn20Min = problemProgress.solvedIn20Min;
  }
  if (problemProgress.confidence !== undefined) {
    payload.confidence = problemProgress.confidence;
  }
  if (problemProgress.attemptCount !== undefined) {
    payload.attemptCount = problemProgress.attemptCount;
  }
  if (problemProgress.timeComplexity !== undefined) {
    payload.timeComplexity = problemProgress.timeComplexity;
  }
  if (problemProgress.spaceComplexity !== undefined) {
    payload.spaceComplexity = problemProgress.spaceComplexity;
  }
  if (problemProgress.notes !== undefined) {
    payload.notes = problemProgress.notes;
  }

  return payload;
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

  // Fire-and-forget: sync to server if authenticated
  if (authenticated) {
    progressApi.upsert(id, toServerPayload(partial)).catch(err => {
      console.warn(`[tracker] Background save failed for problem ${id}:`, err);
    });
  }
}

function resetProgress(id: number) {
  const { [id]: _, ...rest } = state;
  void _;
  state = rest;
  emitChange();

  // Reset on server by setting all fields back to defaults
  if (authenticated) {
    progressApi.upsert(id, toServerPayload(DEFAULT_PROGRESS)).catch(err => {
      console.warn(`[tracker] Background reset failed for problem ${id}:`, err);
    });
  }
}

// ── Server Integration Functions ──
// Called by AuthContext — not by components directly.

/** Replace in-memory state with data fetched from the server. */
export function hydrateFromServer(records: ProgressRecord[]) {
  const hydrated: TrackerState = {};

  for (const record of records) {
    hydrated[record.problemId] = {
      status: toClientStatus(record.status),
      solvedIndependently: record.solvedIndependently,
      solvedIn20Min: record.solvedIn20Min,
      confidence: record.confidence,
      attemptCount: record.attemptCount,
      lastAttempted: record.lastAttempted ?? '',
      timeComplexity: record.timeComplexity ?? '',
      spaceComplexity: record.spaceComplexity ?? '',
      notes: record.notes ?? '',
    };
  }

  state = hydrated;
  emitChange();
}

/** Empty the store (called on logout). */
export function clearState() {
  state = {};
  emitChange();
}

/**
 * One-time migration: push existing localStorage tracker data to the server,
 * then clear localStorage. Returns true if there was data to migrate.
 *
 * Called by AuthContext on signup — if the user had progress before creating
 * an account, we don't want to lose it.
 */
export async function migrateLocalStorageToServer(): Promise<boolean> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  let localData: TrackerState;
  try {
    localData = JSON.parse(raw) as TrackerState;
  } catch {
    return false;
  }

  const problemIds = Object.keys(localData).map(Number);
  if (problemIds.length === 0) return false;

  // Push each problem's progress to the server in parallel
  const uploads = problemIds.map(id => {
    const progress = localData[id];
    return progressApi.upsert(id, toServerPayload(progress)).catch(err => {
      console.warn(`[tracker] Migration failed for problem ${id}:`, err);
    });
  });

  await Promise.all(uploads);

  // Clear localStorage — server is now the source of truth
  localStorage.removeItem(STORAGE_KEY);

  return true;
}

// ── React Hook ──

export function useTrackerStore() {
  const tracker = useSyncExternalStore(subscribe, getSnapshot);

  return {
    tracker,
    getProgress,
    updateProgress,
    resetProgress,
  };
}
