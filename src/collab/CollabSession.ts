import { getSignalUrl } from './signalUrl';
import type { CollabStatus, SignalInbound } from './types';

// Free public STUN server. STUN only helps the two peers discover their own
// public-facing address so they can attempt a direct connection; it relays no
// data. (TURN — an actual relay for ~10% of restrictive networks — is deferred
// with the voice feature.)
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

interface CollabCallbacks {
  onStatus?: (status: CollabStatus) => void;
  onMessage?: (data: unknown) => void; // a parsed app-level DataChannel message
}

/**
 * Framework-agnostic 2-person collaboration session.
 *
 * Owns the signaling WebSocket + the RTCPeerConnection + the DataChannel, and
 * implements the WebRTC "perfect negotiation" pattern so the two browsers never
 * deadlock exchanging offers. Once the DataChannel opens, `send()` ships JSON
 * directly to the other peer and `onMessage` delivers what arrives — this class
 * is deliberately ignorant of WHAT flows through (strokes, cursors, chat). That
 * payload contract is defined by the callers in later steps.
 */
export class CollabSession {
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;

  // Perfect-negotiation bookkeeping.
  private polite = false; // assigned by the server at join time
  private makingOffer = false;
  private ignoreOffer = false;

  private closed = false;

  private readonly roomId: string;
  private readonly callbacks: CollabCallbacks;

  constructor(roomId: string, callbacks: CollabCallbacks) {
    this.roomId = roomId;
    this.callbacks = callbacks;
  }

  connect(): void {
    this.setStatus('connecting');
    const ws = new WebSocket(getSignalUrl());
    this.ws = ws;
    ws.onopen = () => this.signal({ type: 'join', room: this.roomId });
    ws.onmessage = (ev) => {
      void this.handleSignal(JSON.parse(ev.data as string) as SignalInbound);
    };
    ws.onclose = () => {
      if (!this.closed) this.setStatus('disconnected');
    };
  }

  /** Send an app-level message to the peer over the DataChannel (no-op until open). */
  send(data: unknown): void {
    if (this.channel?.readyState === 'open') {
      this.channel.send(JSON.stringify(data));
    }
  }

  /** Tear everything down and return to idle. */
  disconnect(): void {
    this.cleanup();
    this.setStatus('idle');
  }

  // --- signaling -----------------------------------------------------------

  private async handleSignal(msg: SignalInbound): Promise<void> {
    switch (msg.type) {
      case 'joined':
        this.polite = msg.polite;
        this.createPeerConnection();
        // If a peer is already present we're the second (polite) arrival and an
        // offer is coming; otherwise we wait for someone to join.
        this.setStatus(msg.peerPresent ? 'connecting' : 'waiting');
        break;

      case 'peer-joined':
        // We're the impolite peer and someone just arrived. Creating the
        // DataChannel triggers `negotiationneeded`, which sends the offer.
        this.setStatus('connecting');
        this.createDataChannel();
        break;

      case 'peer-left':
        this.teardownPeer();
        this.setStatus('peer-left');
        break;

      case 'room-full':
        this.setStatus('room-full');
        this.cleanup();
        break;

      case 'offer':
      case 'answer':
        await this.handleDescription(msg.sdp);
        break;

      case 'ice-candidate':
        await this.handleCandidate(msg.candidate);
        break;
    }
  }

  private signal(msg: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  // --- WebRTC --------------------------------------------------------------

  private createPeerConnection(): void {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) this.signal({ type: 'ice-candidate', candidate });
    };

    pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await pc.setLocalDescription(); // implicit createOffer
        this.signal({ type: 'offer', sdp: pc.localDescription! });
      } catch (err) {
        console.error('[collab] negotiation failed', err);
      } finally {
        this.makingOffer = false;
      }
    };

    // The polite peer doesn't create the channel — it receives it here.
    pc.ondatachannel = ({ channel }) => this.attachChannel(channel);
  }

  private createDataChannel(): void {
    if (!this.pc) return;
    this.attachChannel(this.pc.createDataChannel('collab'));
  }

  private attachChannel(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.onopen = () => this.setStatus('connected');
    channel.onclose = () => {
      if (!this.closed) this.setStatus('peer-left');
    };
    channel.onmessage = (ev) => {
      let data: unknown;
      try {
        data = JSON.parse(ev.data as string);
      } catch {
        data = ev.data;
      }
      this.callbacks.onMessage?.(data);
    };
  }

  private async handleDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.pc;
    if (!pc) return;

    // Offer collision: a remote offer arrives while we're mid-offer or not in a
    // stable state. The impolite peer ignores it; the polite peer rolls back
    // and accepts. This is the crux of perfect negotiation.
    const offerCollision =
      sdp.type === 'offer' && (this.makingOffer || pc.signalingState !== 'stable');
    this.ignoreOffer = !this.polite && offerCollision;
    if (this.ignoreOffer) return;

    await pc.setRemoteDescription(sdp);
    if (sdp.type === 'offer') {
      await pc.setLocalDescription(); // implicit createAnswer
      this.signal({ type: 'answer', sdp: pc.localDescription! });
    }
  }

  private async handleCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.pc;
    if (!pc) return;
    try {
      await pc.addIceCandidate(candidate);
    } catch (err) {
      // A candidate can fail to apply if we ignored the offer it belonged to —
      // that's expected, not an error worth surfacing.
      if (!this.ignoreOffer) throw err;
    }
  }

  // --- teardown ------------------------------------------------------------

  private setStatus(status: CollabStatus): void {
    this.callbacks.onStatus?.(status);
  }

  private teardownPeer(): void {
    this.channel?.close();
    this.channel = null;
    this.pc?.close();
    this.pc = null;
  }

  private cleanup(): void {
    this.closed = true;
    this.teardownPeer();
    if (this.ws) {
      this.ws.onclose = null; // don't fire a 'disconnected' status on intentional close
      this.ws.close();
      this.ws = null;
    }
  }
}
