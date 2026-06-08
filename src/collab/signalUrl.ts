// Derive the signaling WebSocket URL from the same env var the REST API uses.
// http://host:4000  -> ws://host:4000/ws
// https://cloudfront -> wss://cloudfront/ws
// The leading-anchored replace turns "https" into "wss" (the trailing "s"
// survives) and "http" into "ws".
export function getSignalUrl(): string {
  const api = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  return `${api.replace(/^http/, 'ws')}/ws`;
}
