import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'http';
import type { AddressInfo } from 'net';
import { WebSocket, type WebSocketServer } from 'ws';
import { attachSignaling } from '../src/signaling';

// ---------------------------------------------------------------------------
// Signaling server tests.
//
// Unlike the route tests (supertest against the Express app, hitting Postgres),
// these need a REAL listening server because WebSockets require a live socket.
// The signaling layer touches no database — we stand up a bare http.Server on
// an ephemeral port, attach the signaling layer, and drive it with real ws
// clients. Each test uses a unique room name so the shared in-memory registry
// can't leak state between tests.
// ---------------------------------------------------------------------------

let httpServer: Server;
let wss: WebSocketServer;
let url: string;
const openSockets: WebSocket[] = [];

beforeAll(async () => {
  httpServer = createServer();
  wss = attachSignaling(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;
  url = `ws://localhost:${port}/ws`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => wss.close(() => resolve()));
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

afterEach(async () => {
  // Close every socket opened during the test so its 'close' handler drains the
  // room out of the registry before the next test runs.
  await Promise.all(openSockets.splice(0).map(closeSocket));
});

// --- helpers ---------------------------------------------------------------

function connect(): Promise<WebSocket> {
  const ws = new WebSocket(url);
  openSockets.push(ws);
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
    ws.on('error', () => {}); // permanent no-op so late close-race errors never go unhandled
  });
}

function closeSocket(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) return resolve();
    ws.once('close', () => resolve());
    ws.close();
  });
}

/**
 * Attach a message collector to a socket. Returns `next()`, which resolves with
 * the next parsed message in arrival order (buffering ones that arrive before
 * the test asks for them). Call this immediately after connect(), before
 * sending anything, so no server message is missed.
 */
function listen(ws: WebSocket) {
  const queue: Record<string, unknown>[] = [];
  const waiters: Array<(m: Record<string, unknown>) => void> = [];
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString()) as Record<string, unknown>;
    const waiter = waiters.shift();
    if (waiter) waiter(msg);
    else queue.push(msg);
  });
  return {
    next(): Promise<Record<string, unknown>> {
      const queued = queue.shift();
      if (queued) return Promise.resolve(queued);
      return new Promise((resolve) => waiters.push(resolve));
    },
  };
}

const join = (room: string) => JSON.stringify({ type: 'join', room });

// --- tests -----------------------------------------------------------------

describe('signaling server', () => {
  it('assigns perfect-negotiation roles when two peers join the same room', async () => {
    const a = await connect();
    const am = listen(a);
    a.send(join('room-roles'));
    // First peer in: impolite (it will send the offer), no peer yet.
    expect(await am.next()).toEqual({ type: 'joined', polite: false, peerPresent: false });

    const b = await connect();
    const bm = listen(b);
    b.send(join('room-roles'));
    // Second peer in: polite, and a peer is already present.
    expect(await bm.next()).toEqual({ type: 'joined', polite: true, peerPresent: true });

    // The first peer is nudged that someone joined — its cue to start the offer.
    expect(await am.next()).toEqual({ type: 'peer-joined' });
  });

  it('relays offer, answer, and ice-candidate to the other peer verbatim', async () => {
    const a = await connect();
    const am = listen(a);
    a.send(join('room-relay'));
    await am.next(); // joined

    const b = await connect();
    const bm = listen(b);
    b.send(join('room-relay'));
    await bm.next(); // joined
    await am.next(); // peer-joined

    a.send(JSON.stringify({ type: 'offer', sdp: 'OFFER_SDP' }));
    expect(await bm.next()).toEqual({ type: 'offer', sdp: 'OFFER_SDP' });

    b.send(JSON.stringify({ type: 'answer', sdp: 'ANSWER_SDP' }));
    expect(await am.next()).toEqual({ type: 'answer', sdp: 'ANSWER_SDP' });

    a.send(JSON.stringify({ type: 'ice-candidate', candidate: { sdpMid: '0' } }));
    expect(await bm.next()).toEqual({ type: 'ice-candidate', candidate: { sdpMid: '0' } });
  });

  it('rejects a third peer with room-full and keeps the existing pair intact', async () => {
    const a = await connect();
    const am = listen(a);
    a.send(join('room-cap'));
    await am.next();

    const b = await connect();
    const bm = listen(b);
    b.send(join('room-cap'));
    await bm.next();
    await am.next(); // peer-joined

    const c = await connect();
    const cm = listen(c);
    c.send(join('room-cap'));
    expect(await cm.next()).toEqual({ type: 'room-full' });
  });

  it('notifies the surviving peer when the other disconnects', async () => {
    const a = await connect();
    const am = listen(a);
    a.send(join('room-leave'));
    await am.next();

    const b = await connect();
    const bm = listen(b);
    b.send(join('room-leave'));
    await bm.next();
    await am.next(); // peer-joined

    await closeSocket(b);
    expect(await am.next()).toEqual({ type: 'peer-left' });
  });

  it('does not relay messages between different rooms', async () => {
    const a = await connect();
    const am = listen(a);
    a.send(join('room-x'));
    await am.next();

    const b = await connect();
    const bm = listen(b);
    b.send(join('room-y'));
    await bm.next();

    a.send(JSON.stringify({ type: 'offer', sdp: 'X_ONLY' }));
    // B is in a different room — it must receive nothing. Race the message
    // against a short timeout; the timeout winning proves isolation.
    const result = await Promise.race([
      bm.next(),
      new Promise<string>((resolve) => setTimeout(() => resolve('TIMEOUT'), 200)),
    ]);
    expect(result).toBe('TIMEOUT');
  });

  it('ignores malformed and unknown messages without dropping the connection', async () => {
    const a = await connect();
    const am = listen(a);
    a.send(join('room-malformed'));
    await am.next();

    a.send('this is not json');
    a.send(JSON.stringify({ type: 'totally-unknown' }));

    // The socket is still healthy: a second peer joining still triggers the
    // normal peer-joined notification on A.
    const b = await connect();
    const bm = listen(b);
    b.send(join('room-malformed'));
    await bm.next();
    expect(await am.next()).toEqual({ type: 'peer-joined' });
  });
});
