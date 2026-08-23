// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Room from './pages/Room';
import Game from './pages/Game';

/**
 * Guards routes that need a logged-in session. Checked client-side only
 * for UX (instant redirect, no flash of broken content) — the backend
 * remains the actual enforcement point: every REST call carries the
 * token via api.js's interceptor, and the socket connection itself is
 * rejected by socketAuthMiddleware if the token is missing/invalid.
 */
function RequireAuth({ children }) {
  const hasSession = Boolean(localStorage.getItem('accessToken'));
  return hasSession ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <RequireAuth>
              <Room />
            </RequireAuth>
          }
        />
        <Route
          path="/game/:roomId"
          element={
            <RequireAuth>
              <Game />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}