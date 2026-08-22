// src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Creates (or returns the existing) socket connection, authenticated via
 * the JWT the backend's socketAuthMiddleware expects at handshake time.
 */
export function connectSocket() {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('accessToken');

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect_error', (err) => {
    // Most commonly: missing/expired token. Surface it — a silent
    // reconnect loop against an invalid token just spins forever.
    console.error('[Socket] connection error:', err.message);
  });

  return socket;
}

export function getSocket() {
  if (!socket) return connectSocket();
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Wraps socket.io's callback-style emit (server calls `callback({success, ...})`)
 * as a Promise, so components can `await` room/game actions instead of
 * nesting callbacks.
 */
export function emitWithAck(event, payload, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    const timer = setTimeout(() => {
      reject(new Error(`"${event}" timed out waiting for server response`));
    }, timeoutMs);

    s.emit(event, payload, (response) => {
      clearTimeout(timer);
      if (response?.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || `"${event}" failed`));
      }
    });
  });
}