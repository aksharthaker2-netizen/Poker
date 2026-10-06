// src/components/room/InviteFriendPanel.jsx
import { useState, useEffect } from 'react';
import { friendsApi } from '../../services/api';
import { emitWithAck } from '../../services/socket';

/**
 * Invites a friend into a room the user is ALREADY sitting in — separate
 * from Friends.jsx's invite flow, which always creates a brand-new room
 * (correct there, since you're not in one yet when browsing Friends).
 * This is what closes the actual gap: there was previously no way to
 * invite someone into a room you were already seated in.
 */
export default function InviteFriendPanel({ roomId }) {
  const username = localStorage.getItem('username') || '';
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState(null);
  const [invitingId, setInvitingId] = useState(null);
  const [sentTo, setSentTo] = useState(new Set());

  useEffect(() => {
    if (!open) return;
    friendsApi
      .list()
      .then(({ data }) => setFriends(data.friends))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load friends'));
  }, [open]);

  const handleInvite = async (friend) => {
    setInvitingId(friend.id);
    setError(null);
    try {
      await emitWithAck('SEND_GAME_INVITE', {
        senderName: username,
        targetUserId: friend.id,
        roomId
      });
      setSentTo((prev) => new Set(prev).add(friend.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setInvitingId(null);
    }
  };

  const onlineFriends = friends.filter((f) => f.online);

  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium text-gold transition hover:brightness-110"
      >
        {open ? 'Hide' : 'Invite a friend'} {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2">
          {error && <p className="text-xs text-danger">{error}</p>}

          {friends.length === 0 && !error && (
            <p className="text-xs text-faint">No friends yet — add some from the Friends page.</p>
          )}

          {friends.length > 0 && onlineFriends.length === 0 && (
            <p className="text-xs text-faint">None of your friends are online right now.</p>
          )}

          {onlineFriends.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                {friend.username}
              </span>
              <button
                onClick={() => handleInvite(friend)}
                disabled={invitingId === friend.id || sentTo.has(friend.id)}
                className="rounded-md border border-gold px-3 py-1 text-xs text-gold transition hover:bg-gold hover:text-ink disabled:opacity-50"
              >
                {sentTo.has(friend.id) ? 'Invited' : invitingId === friend.id ? '…' : 'Invite'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}