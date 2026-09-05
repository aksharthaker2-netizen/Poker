// src/services/socket.js
import { io } from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;
let isRefreshing = false;

function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token available');

  const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  return data.accessToken;
}

/**
 * Creates (or returns the existing) socket connection, authenticated via
 * the JWT the backend's socketAuthMiddleware expects at handshake time.
 *
 * FIX: the access token is only 15 minutes old before it expires. Without
 * handling `connect_error`, a token expiring mid-session (or the socket
 * dropping and retrying after the token has aged) would leave the player
 * silently disconnected from their table with no path back in. On a
 * connection error, this tries ONE silent refresh and reconnects with the
 * new token before giving up and sending the player to /login.
 */
export function connectSocket() {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('accessToken');

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect_error', async (err) => {
      console.error('[Socket] connection error:', err.message);

      if (isRefreshing) return; // a refresh attempt is already in flight
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        socket.auth = { token: newToken };
        socket.connect();
      } catch (refreshError) {
        console.error('[Socket] Refresh failed, session is dead:', refreshError.message);
        clearSession();
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    });
  } else if (!socket.connected) {
    // Existing socket instance, just needs a fresh token + reconnect
    // (e.g. called again after a manual disconnect elsewhere in the app).
    socket.auth = { token };
    socket.connect();
  }

  return socket;
}

export function getSocket() {
  if (!socket) return connectSocket();
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners('connect_error');
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
