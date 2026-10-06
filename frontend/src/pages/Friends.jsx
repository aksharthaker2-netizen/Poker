// src/pages/Friends.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserX, UserCheck, Gamepad2, MessageSquare, X, Send } from 'lucide-react';
import { friendsApi } from '../services/api';
import { emitWithAck } from '../services/socket';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/SkeletonLoader';

const TABS = [
  { key: 'friends',  label: 'Friends'  },
  { key: 'pending',  label: 'Pending'  },
  { key: 'sent',     label: 'Sent'     },
];

function FriendCard({ friend, onInvite, onRemove, busyId }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-4 rounded-xl border border-border px-4 py-3 transition hover:border-gold/20 hover:bg-panel2"
      style={{ background: 'rgba(15,21,19,0.7)' }}
    >
      <Avatar username={friend.username} size="md" online={friend.online} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text truncate">{friend.username}</p>
        <p className="text-xs mt-0.5" style={{ color: friend.online ? '#2E9E6B' : '#4A5C54' }}>
          {friend.online ? '● Online' : '○ Offline'}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onInvite(friend.id)}
          disabled={!friend.online || busyId === friend.id}
          title="Invite to game"
          className="rounded-lg border border-border p-2 text-text-faint transition hover:border-gold/40 hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Gamepad2 size={14} />
        </button>
        <button
          onClick={() => onRemove(friend.friendshipId)}
          disabled={busyId === friend.friendshipId}
          title="Remove friend"
          className="rounded-lg border border-border p-2 text-text-faint transition hover:border-danger hover:text-danger disabled:opacity-40"
        >
          <UserX size={14} />
        </button>
      </div>
    </motion.li>
  );
}

function RequestCard({ request, onAccept, onDecline, busyId }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-4 rounded-xl border px-4 py-3"
      style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}
    >
      <Avatar username={request.requester.username} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text truncate">{request.requester.username}</p>
        <p className="text-xs text-text-faint mt-0.5">wants to be friends</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => onAccept(request.id)}
          disabled={busyId === request.id}
          className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          <UserCheck size={12} />
          Accept
        </button>
        <button
          onClick={() => onDecline(request.id)}
          disabled={busyId === request.id}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-muted transition hover:border-danger hover:text-danger disabled:opacity-50"
        >
          <X size={12} />
          Decline
        </button>
      </div>
    </motion.li>
  );
}

export default function Friends() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';

  const [activeTab, setActiveTab]   = useState('friends');
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [friends, setFriends]       = useState([]);
  const [requests, setRequests]     = useState([]);
  const [error, setError]           = useState(null);
  const [busyId, setBusyId]         = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

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
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { loadFriendsAndRequests(); }, [loadFriendsAndRequests]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await friendsApi.search(query.trim());
        setResults(data.users);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (targetUserId) => {
    setBusyId(targetUserId);
    try {
      await friendsApi.sendRequest(targetUserId);
      setResults((prev) => prev.filter((u) => u.id !== targetUserId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request');
    } finally { setBusyId(null); }
  };

  const handleAccept = async (friendshipId) => {
    setBusyId(friendshipId);
    try {
      await friendsApi.accept(friendshipId);
      await loadFriendsAndRequests();
    } finally { setBusyId(null); }
  };

  const handleDecline = async (friendshipId) => {
    setBusyId(friendshipId);
    try {
      await friendsApi.decline(friendshipId);
      setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    } finally { setBusyId(null); }
  };

  const handleRemove = async (friendshipId) => {
    setBusyId(friendshipId);
    try {
      await friendsApi.remove(friendshipId);
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
    } finally { setBusyId(null); }
  };

  const handleInvite = async (friendUserId) => {
    try {
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

  const onlineCount = friends.filter((f) => f.online).length;

  const tabsWithBadge = TABS.map((t) => ({
    ...t,
    badge: t.key === 'pending' && requests.length > 0 ? requests.length : undefined,
  }));

  return (
    <div className="page-enter mx-auto flex max-w-2xl flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text">Friends</h1>
          <p className="mt-1 text-sm text-text-muted">
            {friends.length} friends · <span className="text-success">{onlineCount} online</span>
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Search */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(15,21,19,0.75)', border: '1px solid #22302B' }}
      >
        <div className="border-b border-border/50 px-5 py-3.5 flex items-center gap-2">
          <Search size={14} className="text-text-faint" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Find Players</h2>
        </div>
        <div className="p-5">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username…"
              className="w-full rounded-xl border border-border bg-ink py-3 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-text-faint focus:border-gold focus:shadow-gold-sm"
            />
          </div>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-3 flex flex-col gap-2"
              >
                {results.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: 'rgba(15,28,24,0.6)', border: '1px solid #22302B' }}
                  >
                    <span className="flex items-center gap-3">
                      <Avatar username={u.username} size="sm" />
                      <span className="font-medium text-text">{u.username}</span>
                    </span>
                    <button
                      onClick={() => handleSendRequest(u.id)}
                      disabled={busyId === u.id}
                      className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
                    >
                      <UserPlus size={12} />
                      {busyId === u.id ? '…' : 'Add'}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ background: 'rgba(15,21,19,0.6)', border: '1px solid #22302B' }}
      >
        {tabsWithBadge.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-200"
              style={{ color: isActive ? '#0B1A10' : '#8B9A94' }}
            >
              {isActive && (
                <motion.div
                  layoutId="friends-tab"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: '#D4AF37', boxShadow: '0 2px 12px rgba(212,175,55,0.3)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                {tab.label}
                {tab.badge != null && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                    style={{
                      background: isActive ? 'rgba(11,26,16,0.3)' : 'rgba(212,175,55,0.15)',
                      color: isActive ? '#0B1A10' : '#D4AF37',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {pageLoading ? (
        <SkeletonList count={4} />
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'friends' && (
            <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {friends.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="No friends yet"
                  description="Search for players above and start building your poker network."
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  <AnimatePresence>
                    {friends.map((f) => (
                      <FriendCard
                        key={f.friendshipId}
                        friend={f}
                        onInvite={handleInvite}
                        onRemove={handleRemove}
                        busyId={busyId}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </motion.div>
          )}

          {activeTab === 'pending' && (
            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {requests.length === 0 ? (
                <EmptyState
                  icon="📬"
                  title="No pending requests"
                  description="Friend requests you receive will appear here."
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  <AnimatePresence>
                    {requests.map((r) => (
                      <RequestCard
                        key={r.id}
                        request={r}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        busyId={busyId}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </motion.div>
          )}

          {activeTab === 'sent' && (
            <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState
                icon="📤"
                title="No sent requests"
                description="Friend requests you've sent will appear here."
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}