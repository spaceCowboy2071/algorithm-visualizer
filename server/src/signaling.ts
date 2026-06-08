import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

// ---------------------------------------------------------------------------
// WebRTC signaling server (native `ws`).
//
// This server's ONLY job is the introduction: it lets two browsers find each
// other and exchange the metadata WebRTC needs (SDP offer/answer + ICE
// candidates) to open a direct peer-to-peer connection. Once that handshake
// completes, all strokes/cursors/chat flow browser-to-browser over the WebRTC
// DataChannel and never touch this server. We are a dumb pipe by design.
// ---------------------------------------------------------------------------

const MAX_PEERS_PER_ROOM = 2;

// In-memory room registry. Rooms are ephemeral — they exist only while a peer
// is connected and evaporate when the last peer leaves. Nothing is persisted.
const rooms = new Map<string, PeerSocket[]>();

// We tag each socket with the room it joined so close/relay handlers know where
// it belongs without scanning the whole registry.
interface PeerSocket extends WebSocket {
  roomId?: string;
}

// Messages the client may send us. `join` is handled locally; the rest are
// relayed verbatim to the other peer — we never look inside the WebRTC payload.
type SignalMessage =
  | { type: 'join'; room: string }
  | { type: 'offer'; sdp: unknown }
  | { type: 'answer'; sdp: unknown }
  | { type: 'ice-candidate'; candidate: unknown };

function send(ws: WebSocket, msg: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function leaveRoom(ws: PeerSocket): void {
  const { roomId } = ws;
  if (!roomId) return;

  const peers = rooms.get(roomId);
  ws.roomId = undefined;
  if (!peers) return;

  const remaining = peers.filter((p) => p !== ws);
  if (remaining.length === 0) {
    rooms.delete(roomId); // last one out — drop the room entirely
  } else {
    rooms.set(roomId, remaining);
    // Tell the survivor the other side left so it can tear down its peer
    // connection and update presence.
    remaining.forEach((p) => send(p, { type: 'peer-left' }));
  }
}

function handleJoin(ws: PeerSocket, room: string): void {
  if (ws.roomId) return; // ignore a duplicate join from the same socket

  const peers = rooms.get(room) ?? [];
  if (peers.length >= MAX_PEERS_PER_ROOM) {
    send(ws, { type: 'room-full' }); // 2-person sessions only
    return;
  }

  peers.push(ws);
  rooms.set(room, peers);
  ws.roomId = room;

  // Perfect-negotiation roles: the first peer in is "impolite" (it sends the
  // offer when a peer arrives); the second is "polite" (it waits for the
  // offer). Designating roles up front eliminates offer "glare" — both peers
  // offering at once and deadlocking.
  const isSecond = peers.length === MAX_PEERS_PER_ROOM;
  send(ws, { type: 'joined', polite: isSecond, peerPresent: isSecond });

  // When the second peer arrives, nudge the first (impolite) peer to kick off
  // the WebRTC offer.
  if (isSecond) {
    send(peers[0], { type: 'peer-joined' });
  }
}

function relay(ws: PeerSocket, msg: Record<string, unknown>): void {
  const peers = ws.roomId ? rooms.get(ws.roomId) : undefined;
  if (!peers) return;
  // Forward to everyone in the room except the sender (i.e. the one peer).
  peers.filter((p) => p !== ws).forEach((p) => send(p, msg));
}

export function attachSignaling(server: Server): WebSocketServer {
  // Scope WebSocket upgrades to /ws so CloudFront can route just this path and
  // the rest of the HTTP API is untouched. Same port as Express (4000).
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: PeerSocket) => {
    ws.on('message', (data) => {
      let msg: SignalMessage;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return; // ignore malformed frames rather than crashing the socket
      }

      switch (msg.type) {
        case 'join':
          if (typeof msg.room === 'string' && msg.room.length > 0) {
            handleJoin(ws, msg.room);
          }
          break;
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          relay(ws, msg);
          break;
        default:
          break; // unknown type — ignore
      }
    });

    ws.on('close', () => leaveRoom(ws));
    ws.on('error', () => leaveRoom(ws));
  });

  return wss;
}

// Exposed for tests/introspection. Returns the live registry.
export function getRooms(): Map<string, PeerSocket[]> {
  return rooms;
}
