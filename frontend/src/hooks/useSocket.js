// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { getSocket, connectSocket } from '../services/socket';

/**
 * Ensures a live socket connection exists and returns it.
 * Does NOT disconnect on unmount — the socket is app-lifetime, shared
 * across pages (lobby -> room -> game), so a single component unmounting
 * (e.g. navigating from Room to Game) must not kill the connection.
 */
export function useSocket() {
  const socketRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = getSocket();
  }

  useEffect(() => {
    connectSocket();
  }, []);

  return socketRef.current;
}