// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Room from './pages/Room';
import Game from './pages/Game';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Friends from './pages/Friends';
import GameHistory from './pages/GameHistory';
import RoomHistory from './pages/RoomHistory';
import Achievements from './pages/Achievements';
import AppShell from './components/layout/AppShell';

function RequireAuth({ children }) {
  const hasSession = Boolean(localStorage.getItem('accessToken'));
  return hasSession ? children : <Navigate to="/login" replace />;
}

// Every authenticated page gets the persistent nav shell EXCEPT Game.jsx,
// which stays deliberately full-bleed/immersive — see AppShell's doc comment.
const shell = (element) => (
  <RequireAuth>
    <AppShell>{element}</AppShell>
  </RequireAuth>
);
const bare = (element) => <RequireAuth>{element}</RequireAuth>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={shell(<Home />)} />
        <Route path="/room/:roomId" element={shell(<Room />)} />
        <Route path="/game/:roomId" element={bare(<Game />)} />
        <Route path="/profile" element={shell(<Profile />)} />
        <Route path="/leaderboard" element={shell(<Leaderboard />)} />
        <Route path="/friends" element={shell(<Friends />)} />
        <Route path="/games" element={shell(<GameHistory />)} />
        <Route path="/rooms" element={shell(<RoomHistory />)} />
        <Route path="/achievements" element={shell(<Achievements />)} />
      </Routes>
    </BrowserRouter>
  );
}
