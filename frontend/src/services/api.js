// src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
}

let refreshPromise = null;

/**
 * On a 401, try ONCE to silently refresh the access token (it's only
 * good for 15 minutes — without this, anyone mid-game would get booted
 * to a broken state the moment it expired). If refresh also fails, the
 * session is genuinely dead: clear it and bounce to /login.
 *
 * `refreshPromise` de-dupes concurrent 401s (e.g. several requests firing
 * around the same time) into a single refresh call instead of a stampede.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) throw new Error('No refresh token');

          refreshPromise = axios
            .post(`${API_URL}/api/auth/refresh`, { refreshToken })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const { data } = await refreshPromise;
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        clearSession();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (credentials) => api.post('/api/auth/login', credentials),
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return api.post('/api/auth/logout', { refreshToken });
  }
};

export const userApi = {
  getProfile: () => api.get('/api/users/me'),
  getStats: (userId) => api.get(`/api/users/${userId}/stats`)
};

export const friendsApi = {
  search: (q) => api.get(`/api/friends/search?q=${encodeURIComponent(q)}`),
  list: () => api.get('/api/friends'),
  listRequests: () => api.get('/api/friends/requests'),
  sendRequest: (targetUserId) => api.post('/api/friends/request', { targetUserId }),
  accept: (friendshipId) => api.post(`/api/friends/${friendshipId}/accept`),
  decline: (friendshipId) => api.post(`/api/friends/${friendshipId}/decline`),
  remove: (friendshipId) => api.delete(`/api/friends/${friendshipId}`)
};

export const leaderboardApi = {
  getGlobal: (period = 'GLOBAL') => api.get(`/api/leaderboard?period=${period}`)
};

export { clearSession };
export default api;