// src/pages/Game.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wifi, Spade } from 'lucide-react';
import PokerTable from '../components/table/PokerTable';
import AICoachPanel from '../components/game/AICoachPanel';
import { useSocket } from '../hooks/useSocket';
import { emitWithAck } from '../services/socket';
import { useRoomStore } from '../store/roomStore';
import { useGameStore } from '../store/gameStore';

/* ── Overlay modals ─────────────────────────────────────────────────────── */
function ShowdownModal({ results }) {
  return (
    <div className="animate-scale-in mx-auto mt-4 max-w-md px-4">
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: 'rgba(13,18,16,0.97)',
          border: '1px solid rgba(212,175,55,0.4)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 48px rgba(212,175,55,0.18), 0 0 0 1px rgba(212,175,55,0.08)'
        }}
      >
        <div className="mb-1 text-4xl">🏆</div>
        <h3 className="mb-4 font-display text-xl font-semibold" style={{ color: '#D4AF37' }}>Showdown</h3>
        {results.map((pot, i) => (
          <div
            key={i}
            className="mb-2 last:mb-0 rounded-xl px-4 py-3"
            style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            <p className="text-sm" style={{ color: '#EDEAE3' }}>
              <span style={{ color: '#5A6B64' }}>Pot {i + 1} · </span>
              <span className="font-semibold">{pot.winners.map((w) => w.playerId).join(', ')}</span>
              {' '}won{' '}
              <span className="font-mono font-semibold" style={{ color: '#D4AF37' }}>{pot.payout}</span>
            </p>
          </div>
        ))}
        <p className="mt-4 text-xs" style={{ color: '#4A5C54' }}>Next hand starting soon…</p>
      </div>
    </div>
  );
}

function BustedBanner({ room, rebuying, rebuyError, onRebuy }) {
  return (
    <div className="animate-scale-in mx-auto mt-4 max-w-md px-4">
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: 'rgba(178,58,46,0.08)',
          border: '1px solid rgba(178,58,46,0.35)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 30px rgba(178,58,46,0.12)'
        }}
      >
        <div className="mb-2 text-4xl">💸</div>
        <h3 className="mb-1 font-display text-lg font-semibold" style={{ color: '#C0453A' }}>Out of Chips</h3>
        <p className="mb-4 text-sm" style={{ color: '#8B9A94' }}>Rebuy to continue playing from the next hand.</p>
        {rebuyError && (
          <p className="mb-3 rounded-xl border px-3 py-2 text-xs"
            style={{ background: 'rgba(178,58,46,0.1)', border: '1px solid rgba(178,58,46,0.3)', color: '#C0453A' }}>
            {rebuyError}
          </p>
        )}
        <button
          onClick={onRebuy}
          disabled={rebuying}
          className="btn-gold w-full rounded-xl py-3 text-sm"
        >
          {rebuying ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
              Rebuying…
            </span>
          ) : `Rebuy · ${room.settings?.startingChips ?? 1000} chips`}
        </button>
        <p className="mt-2 text-xs" style={{ color: '#4A5C54' }}>You'll be dealt back in from the next hand.</p>
      </div>
    </div>
  );
}

function GameEndedBanner({ reason, roomId, navigate }) {
  return (
    <div className="animate-scale-in mx-auto mt-4 max-w-md px-4">
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: 'rgba(13,18,16,0.95)',
          border: '1px solid rgba(34,48,43,0.8)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div className="mb-2 text-4xl">🎮</div>
        <h3 className="mb-2 font-display text-lg font-semibold" style={{ color: '#EDEAE3' }}>Game Over</h3>
        <p className="mb-4 text-sm" style={{ color: '#8B9A94' }}>{reason}</p>
        <button
          onClick={() => navigate(`/room/${roomId}`)}
          className="btn-gold rounded-xl px-6 py-2.5 text-sm"
        >
          Back to Waiting Room
        </button>
      </div>
    </div>
  );
}

/* ── Game page ─────────────────────────────────────────────────────────── */
export default function Game() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const userId = localStorage.getItem('userId');

  const room = useRoomStore((s) => s.room);
  const clearRoom = useRoomStore((s) => s.clearRoom);
  const resetGame = useGameStore((s) => s.resetGame);
  const {
    gameState,
    communityCards,
    players,
    potSize,
    nextPlayerId,
    actionInfo,
    myHoleCards,
    showdownResults,
    revealedHands,
    setMyHand,
    patchPlayerChips,
    applyGameStateUpdate
  } = useGameStore();

  const [actionError, setActionError] = useState(null);
  const [gameEndedReason, setGameEndedReason] = useState(null);
  const [rebuying, setRebuying] = useState(false);
  const [rebuyError, setRebuyError] = useState(null);
  const [currentHint, setCurrentHint] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onYourHand = ({ holeCards }) => {
      setMyHand(holeCards);
      setCurrentHint(null); // clear hint on new hand
    };
    const onGameStateUpdated = (payload) => {
      setActionError(null);
      applyGameStateUpdate(payload);
    };
    const onGameEnded = ({ reason }) => setGameEndedReason(reason);
    const onRoomClosed = ({ reason }) => {
      clearRoom(); resetGame();
      navigate('/', { state: { notice: reason || 'The room was closed.' } });
    };
    const onKicked = () => {
      clearRoom(); resetGame();
      navigate('/', { state: { notice: 'You were removed from the room by the host.' } });
    };

    socket.on('YOUR_HAND', onYourHand);
    socket.on('GAME_STATE_UPDATED', onGameStateUpdated);
    socket.on('GAME_ENDED', onGameEnded);
    socket.on('ROOM_CLOSED', onRoomClosed);
    socket.on('KICKED_FROM_ROOM', onKicked);

    return () => {
      socket.off('YOUR_HAND', onYourHand);
      socket.off('GAME_STATE_UPDATED', onGameStateUpdated);
      socket.off('GAME_ENDED', onGameEnded);
      socket.off('ROOM_CLOSED', onRoomClosed);
      socket.off('KICKED_FROM_ROOM', onKicked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const handleAction = async (action, additionalChips = 0) => {
    try {
      setActionError(null);
      await emitWithAck('PLAYER_ACTION', { roomId, action, additionalChips });
      // Record to history
      setActionHistory((prev) => [
        ...prev,
        { action, chips: action === 'FOLD' ? 0 : additionalChips || null, street: gameState, isGood: true }
      ].slice(-20));
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleLeaveTable = async () => {
    try {
      await emitWithAck('LEAVE_ROOM', { roomId });
    } finally {
      clearRoom(); resetGame();
      navigate('/');
    }
  };

  const handleRebuy = async () => {
    setRebuying(true); setRebuyError(null);
    try {
      const res = await emitWithAck('REBUY', { roomId });
      patchPlayerChips(userId, res.newChips);
    } catch (err) {
      setRebuyError(err.message);
    } finally {
      setRebuying(false);
    }
  };

  const handleHintReceived = (hint) => setCurrentHint(hint);

  const myChips = players.find((p) => p.id === userId)?.chips
    ?? room?.seats?.find((s) => s && s.id === userId)?.chips;
  const isBustedOut = room?.status === 'PLAYING' && myChips === 0;
  const isMyTurn = actionInfo?.playerId === userId;

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0B0F10' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-14 w-14 animate-spin rounded-full"
            style={{ border: '3px solid rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }}
          />
          <p className="text-sm" style={{ color: '#5A6B64' }}>Loading table…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout" style={{ background: '#0B0F10' }}>
      {/* ── Main game area ──────────────────────────────────────────── */}
      <div className="game-layout-main">
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-5 py-3 shrink-0"
          style={{
            background: 'rgba(11,15,16,0.95)',
            borderBottom: '1px solid rgba(29,43,38,0.8)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Brand */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 transition group"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)' }}
            >
              <Spade size={15} style={{ color: '#D4AF37' }} />
            </div>
            <span
              className="font-display text-base font-semibold hidden sm:block"
              style={{ color: '#EDEAE3' }}
            >
              PokerAI
            </span>
          </button>

          {/* Room ID */}
          <div
            className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid rgba(34,48,43,0.8)' }}
          >
            <span className="text-xs font-mono" style={{ color: '#5A6B64' }}>Room</span>
            <span className="text-xs font-mono font-semibold" style={{ color: '#D4AF37' }}>
              {room.id?.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {/* Game state */}
          {gameState && (
            <div
              className="chip"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}
            >
              {gameState}
            </div>
          )}

          <div className="flex-1" />

          {/* Connection */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
            style={{
              background: 'rgba(46,158,107,0.08)',
              border: '1px solid rgba(46,158,107,0.2)',
              color: '#2E9E6B',
            }}
          >
            <Wifi size={11} />
            <span>Live</span>
          </div>

          <button
            onClick={handleLeaveTable}
            className="btn-danger rounded-lg px-3 py-1.5 text-sm"
            style={{ padding: '6px 14px' }}
          >
            Leave
          </button>
        </div>

        {/* Table area — fills remaining vertical space */}
        <div className="flex-1 overflow-hidden flex flex-col px-4 pt-4 pb-3 min-h-0">
          <PokerTable
            room={room}
            gameState={gameState}
            communityCards={communityCards}
            potSize={potSize}
            players={players}
            nextPlayerId={nextPlayerId}
            actionInfo={actionInfo}
            myUserId={userId}
            myHoleCards={myHoleCards}
            revealedHands={revealedHands}
            showdownResults={showdownResults}
            onAction={handleAction}
            onHintReceived={handleHintReceived}
            actionError={actionError}
          />
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'SHOWDOWN' && showdownResults && (
            <motion.div
              key="showdown"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-0 bottom-28 z-30"
            >
              <ShowdownModal results={showdownResults} />
            </motion.div>
          )}
          {gameEndedReason && (
            <motion.div key="ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-x-0 bottom-24 z-30">
              <GameEndedBanner reason={gameEndedReason} roomId={roomId} navigate={navigate} />
            </motion.div>
          )}
          {isBustedOut && !gameEndedReason && (
            <motion.div key="busted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-x-0 bottom-24 z-30">
              <BustedBanner
                room={room}
                rebuying={rebuying}
                rebuyError={rebuyError}
                onRebuy={handleRebuy}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── AI Coach right panel ─────────────────────────────────────── */}
      <div className="game-layout-sidebar">
        <AICoachPanel
          hint={currentHint}
          gameState={gameState}
          potSize={potSize}
          street={gameState}
          actionHistory={actionHistory}
          isMyTurn={isMyTurn}
        />
      </div>
    </div>
  );
}
