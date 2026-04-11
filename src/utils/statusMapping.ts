// ── Status Mapping ──
// The frontend uses kebab-case statuses (e.g., "review-needed") because that's
// what was established in Phase 1 with the tracker UI.
// The server uses snake_case / shorter names (e.g., "review", "not_started")
// following PostgreSQL conventions established in Phase 2.
//
// These two functions translate between the two formats so data can travel
// correctly between browser and server.

import type { ProblemStatus } from '../hooks/useTrackerStore';

// Server status strings (what PostgreSQL stores)
export type ServerStatus = 'not_started' | 'studied' | 'in_progress' | 'review' | 'solved';

const clientToServer: Record<ProblemStatus, ServerStatus> = {
  'not-started': 'not_started',
  'studied': 'studied',
  'in-progress': 'in_progress',
  'review-needed': 'review',
  'solved': 'solved',
};

const serverToClient: Record<ServerStatus, ProblemStatus> = {
  'not_started': 'not-started',
  'studied': 'studied',
  'in_progress': 'in-progress',
  'review': 'review-needed',
  'solved': 'solved',
};

/** Convert a frontend status to the format the server expects */
export function toServerStatus(status: ProblemStatus): ServerStatus {
  return clientToServer[status];
}

/** Convert a server status to the format the frontend expects */
export function toClientStatus(status: string): ProblemStatus {
  return serverToClient[status as ServerStatus] ?? 'not-started';
}
