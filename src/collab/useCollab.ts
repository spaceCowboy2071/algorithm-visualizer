import { useCallback, useEffect, useRef, useState } from 'react';
import { CollabSession } from './CollabSession';
import type { CollabStatus } from './types';

interface UseCollabOptions {
  // Called with each parsed app-level message the peer sends over the
  // DataChannel. Held in a ref so changing it doesn't tear down the session.
  onMessage?: (data: unknown) => void;
}

/**
 * React wrapper around CollabSession. Returns the live status plus connect /
 * disconnect / send. The session itself lives in a ref so it persists across
 * re-renders; only `status` drives re-rendering.
 */
export function useCollab(options?: UseCollabOptions) {
  const [status, setStatus] = useState<CollabStatus>('idle');
  const sessionRef = useRef<CollabSession | null>(null);
  const onMessageRef = useRef(options?.onMessage);

  // Keep the message handler ref current without re-subscribing the session.
  useEffect(() => {
    onMessageRef.current = options?.onMessage;
  });

  const connect = useCallback((roomId: string) => {
    sessionRef.current?.disconnect();
    const session = new CollabSession(roomId, {
      onStatus: setStatus,
      onMessage: (data) => onMessageRef.current?.(data),
    });
    sessionRef.current = session;
    session.connect();
  }, []);

  const disconnect = useCallback(() => {
    sessionRef.current?.disconnect();
    sessionRef.current = null;
    setStatus('idle');
  }, []);

  const send = useCallback((data: unknown) => {
    sessionRef.current?.send(data);
  }, []);

  // Tear down the session if the component unmounts mid-call.
  useEffect(() => () => sessionRef.current?.disconnect(), []);

  return { status, connect, disconnect, send };
}
