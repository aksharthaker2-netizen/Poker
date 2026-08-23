// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Room from './pages/Room';
import Game from './pages/Game';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Friends from './pages/Friends';

function RequireAuth({ children }) {
  const hasSession = Boolean(localStorage.getItem('accessToken'));
  return hasSession ? children : <Navigate to="/login" replace />;
}

const protect = (element) => <RequireAuth>{element}</RequireAuth>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={protect(<Home />)} />
        <Route path="/room/:roomId" element={protect(<Room />)} />
        <Route path="/game/:roomId" element={protect(<Game />)} />
        <Route path="/profile" element={protect(<Profile />)} />
        <Route path="/leaderboard" element={protect(<Leaderboard />)} />
        <Route path="/friends" element={protect(<Friends />)} />
      </Routes>
    </BrowserRouter>
  );
}