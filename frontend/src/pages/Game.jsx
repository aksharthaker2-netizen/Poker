// src/pages/Game.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PokerTable from '../components/table/PokerTable';
import { useSocket } from '../hooks/useSocket';
import { emitWithAck } from '../services/socket';
import { useRoomStore } from '../store/roomStore';
import { useGameStore } from '../store/gameStore';

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
    highestBet,
    nextPlayerId,
    actionInfo,
    myHoleCards,
    showdownResults,
    revealedHands,
    setMyHand,
    applyGameStateUpdate
  } = useGameStore();

  const [actionError, setActionError] = useState(null);
  const [gameEndedReason, setGameEndedReason] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const onYourHand = ({ holeCards }) => setMyHand(holeCards);
    const onGameStateUpdated = (payload) => {
      setActionError(null);
      applyGameStateUpdate(payload);
    };
    // The table auto-deals the next hand ~6s after a showdown as long as
    // 2+ players still have chips (see gameFlowManager.scheduleNextHand).
    // This only fires when it genuinely can't continue.
    const onGameEnded = ({ reason }) => setGameEndedReason(reason);

    // Host closed the room, or I got kicked, WHILE I was at the table —
    // fully supported server-side (KICK_PLAYER/CLOSE_ROOM don't check
    // whether a game is in progress). Get out immediately.
    const onRoomClosed = ({ reason }) => {
      clearRoom();
      resetGame();
      navigate('/', { state: { notice: reason || 'The room was closed.' } });
    };
    const onKicked = () => {
      clearRoom();
      resetGame();
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
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleLeaveTable = async () => {
    try {
      // Leaving mid-game doesn't remove you instantly (see
      // gameFlowManager.handlePlayerLeaving) — it marks you disconnected
      // immediately, auto-folds you if it's currently your turn, and
      // your seat actually frees up before the next hand deals. The
      // frontend just needs to get out of the way now.
      await emitWithAck('LEAVE_ROOM', { roomId });
    } finally {
      clearRoom();
      resetGame();
      navigate('/');
    }
  };

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F10] text-[#8B9A94]">
        Loading table…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F10] px-4 py-10">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end">
        <button
          onClick={handleLeaveTable}
          className="rounded border border-[#22302B] px-3 py-1.5 text-sm text-[#8B9A94] transition hover:border-[#B23A2E] hover:text-[#B23A2E]"
        >
          Leave table
        </button>
      </div>

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
        onAction={handleAction}
        actionError={actionError}
      />

      {gameState === 'SHOWDOWN' && showdownResults && (
        <div className="mx-auto mt-6 max-w-md rounded-lg border border-[#D4AF37]/40 bg-[#0F1513] p-4 text-center text-[#EDEAE3]">
          <p className="mb-2 font-semibold text-[#D4AF37]">Showdown</p>
          {showdownResults.map((pot, i) => (
            <p key={i} className="text-sm">
              Pot {i + 1}: {pot.winners.map((w) => w.playerId).join(', ')} won {pot.payout}
            </p>
          ))}
          <p className="mt-2 text-xs text-[#5A6B64]">Next hand starting soon…</p>
        </div>
      )}

      {gameEndedReason && (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-lg border border-[#22302B] bg-[#0F1513] p-4 text-center">
          <p className="text-sm text-[#EDEAE3]">{gameEndedReason}</p>
          <button
            onClick={() => navigate(`/room/${roomId}`)}
            className="rounded bg-[#D4AF37] px-4 py-2 text-sm font-medium text-[#0B0F10] hover:brightness-110"
          >
            Back to waiting room
          </button>
        </div>
      )}
    </div>
  );
}