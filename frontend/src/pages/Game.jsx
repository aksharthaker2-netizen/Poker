// src/pages/Game.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PokerTable from '../components/table/PokerTable';
import { useSocket } from '../hooks/useSocket';
import { emitWithAck } from '../services/socket';
import { useRoomStore } from '../store/roomStore';
import { useGameStore } from '../store/gameStore';

export default function Game() {
  const { roomId } = useParams();
  const socket = useSocket();
  const userId = localStorage.getItem('userId');

  const room = useRoomStore((s) => s.room);
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

  useEffect(() => {
    if (!socket) return;

    const onYourHand = ({ holeCards }) => setMyHand(holeCards);
    const onGameStateUpdated = (payload) => {
      setActionError(null);
      applyGameStateUpdate(payload);
    };

    socket.on('YOUR_HAND', onYourHand);
    socket.on('GAME_STATE_UPDATED', onGameStateUpdated);

    return () => {
      socket.off('YOUR_HAND', onYourHand);
      socket.off('GAME_STATE_UPDATED', onGameStateUpdated);
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

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F10] text-[#8B9A94]">
        Loading table…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F10] px-4 py-10">
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
        </div>
      )}
    </div>
  );
}   