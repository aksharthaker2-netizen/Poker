    // src/services/api.js
    import axios from 'axios';

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
    });

    // Attach the access token to every request.
    api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
    });

    // On 401, the token is dead — clear it so the app falls back to the
    // login screen instead of retrying with a stale credential forever.
    api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        }
        return Promise.reject(error);
    }
    );

    export const authApi = {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (data) => api.post('/api/auth/register', data),
    refresh: () => api.post('/api/auth/refresh')
    };

    export const userApi = {
    getProfile: () => api.get('/api/users/me'),
    getStats: (userId) => api.get(`/api/users/${userId}/stats`)
    };

    export const leaderboardApi = {
    getGlobal: (period = 'GLOBAL') => api.get(`/api/leaderboard?period=${period}`)
    };

    export default api;