// src/pages/Friends.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendsApi } from '../services/api';
import { emitWithAck } from '../services/socket';

function Section({ title, children }) {
  return (
    <div className="rounded-lg border border-[#22302B] bg-[#0F1513] p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8B9A94]">{title}</h2>
      {children}
    </div>
  );
}

export default function Friends() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadFriendsAndRequests = useCallback(async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendsApi.list(),
        friendsApi.listRequests()
      ]);
      setFriends(friendsRes.data.friends);
      setRequests(requestsRes.data.requests);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load friends');
    }
  }, []);

  useEffect(() => {
    loadFriendsAndRequests();
  }, [loadFriendsAndRequests]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await friendsApi.search(query.trim());
        setResults(data.users);
      } catch {
        setResults([]);
      }
    }, 300); // debounce so we're not searching on every keystroke
    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (targetUserId) => {
    setBusyId(targetUserId);
    try {
      await friendsApi.sendRequest(targetUserId);
      setResults((prev) => prev.filter((u) => u.id !== targetUserId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request');
    } finally {
      setBusyId(null);
    }
  };

  const handleAccept = async (friendshipId) => {
    setBusyId(friendshipId);
    try {
      await friendsApi.accept(friendshipId);
      await loadFriendsAndRequests();
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (friendshipId) => {
    setBusyId(friendshipId);
    try {
      await friendsApi.decline(friendshipId);
      setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (friendshipId) => {
    setBusyId(friendshipId);
    try {
      await friendsApi.remove(friendshipId);
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
    } finally {
      setBusyId(null);
    }
  };

  const handleInvite = async (friendUserId) => {
    try {
      // Invite them to a fresh room the sender creates on the spot.
      const room = await emitWithAck('CREATE_ROOM', {
        username,
        settings: { maxPlayers: 6, bigBlind: 20, startingChips: 1000 }
      });
      await emitWithAck('SEND_GAME_INVITE', {
        targetUserId: friendUserId,
        senderName: username,
        roomId: room.room.id
      });
      navigate(`/room/${room.room.id}`);
    } catch (err) {
      setError(err.message || 'Failed to send invite');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F10] px-4 py-10 text-[#EDEAE3]">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Friends</h1>
          <button
            onClick={() => navigate('/')}
            className="rounded border border-[#22302B] px-3 py-1.5 text-sm hover:border-[#D4AF37]"
          >
            Back to lobby
          </button>
        </div>

        {error && (
          <p className="rounded border border-[#B23A2E]/40 bg-[#B23A2E]/10 px-3 py-2 text-sm text-[#B23A2E]">
            {error}
          </p>
        )}

        <Section title="Add a friend">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username…"
            className="mb-3 w-full rounded border border-[#22302B] bg-[#0B0F10] px-3 py-2 text-sm text-[#EDEAE3] outline-none focus:border-[#D4AF37]"
          />
          {results.length > 0 && (
            <ul className="flex flex-col gap-2">
              {results.map((u) => (
                <li key={u.id} className="flex items-center justify-between text-sm">
                  <span>{u.username}</span>
                  <button
                    onClick={() => handleSendRequest(u.id)}
                    disabled={busyId === u.id}
                    className="rounded border border-[#D4AF37] px-3 py-1 text-xs text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0B0F10] disabled:opacity-50"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {requests.length > 0 && (
          <Section title={`Pending requests (${requests.length})`}>
            <ul className="flex flex-col gap-2">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span>{r.requester.username}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(r.id)}
                      disabled={busyId === r.id}
                      className="rounded border border-[#D4AF37] px-3 py-1 text-xs text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0B0F10] disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(r.id)}
                      disabled={busyId === r.id}
                      className="rounded border border-[#22302B] px-3 py-1 text-xs text-[#8B9A94] hover:border-[#B23A2E] hover:text-[#B23A2E] disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title={`Friends (${friends.length})`}>
          {friends.length === 0 ? (
            <p className="text-sm text-[#5A6B64]">No friends yet — search above to add some.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {friends.map((f) => (
                <li key={f.friendshipId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${f.online ? 'bg-[#4CAF50]' : 'bg-[#5A6B64]'}`}
                      title={f.online ? 'Online' : 'Offline'}
                    />
                    {f.username}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInvite(f.id)}
                      disabled={!f.online}
                      className="rounded border border-[#D4AF37] px-3 py-1 text-xs text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0B0F10] disabled:opacity-30"
                    >
                      Invite
                    </button>
                    <button
                      onClick={() => handleRemove(f.friendshipId)}
                      disabled={busyId === f.friendshipId}
                      className="rounded border border-[#22302B] px-3 py-1 text-xs text-[#8B9A94] hover:border-[#B23A2E] hover:text-[#B23A2E] disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
