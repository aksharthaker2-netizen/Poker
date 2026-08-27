// src/pages/GameHistory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamesApi } from '../services/api';

const CARD_LOOKUP = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };

function BoardCards({ board }) {
  if (!board || board.length === 0) return <span className="text-[#5A6B64]">—</span>;
  return (
    <span className="font-mono text-xs">
      {board.map((code, i) => {
        // Hand.board is stored as short codes like "Qs" (rank + first
        // letter of suit) — see persistenceService.persistCompletedHand.
        const rank = code.slice(0, -1);
        const suitLetter = code.slice(-1).toLowerCase();
        const suitName = Object.keys(CARD_LOOKUP).find((s) => s[0].toLowerCase() === suitLetter);
        const isRed = suitName === 'Hearts' || suitName === 'Diamonds';
        return (
          <span key={i} className={isRed ? 'text-[#B23A2E]' : 'text-[#EDEAE3]'}>
            {rank}
            {CARD_LOOKUP[suitName] || ''}{' '}
          </span>
        );
      })}
    </span>
  );
}

function GameDetail({ game, myUserId, onClose }) {
  return (
    <div className="rounded-lg border border-[#D4AF37]/30 bg-[#0F1513] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-[#8B9A94]">
          Room <span className="font-mono text-[#D4AF37]">{game.room.code}</span> · Big blind{' '}
          {game.room.bigBlind}
        </p>
        <button onClick={onClose} className="text-sm text-[#5A6B64] hover:text-[#EDEAE3]">
          Close
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {game.hands.map((hand) => {
          const myActions = hand.actions.filter((a) => a.userId === myUserId);
          const iWon = hand.winnerSeatId === myUserId;
          return (
            <li
              key={hand.id}
              className={`rounded border px-3 py-2 text-sm ${
                iWon ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5' : 'border-[#22302B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[#8B9A94]">Hand #{hand.handNumber}</span>
                <span className="font-mono text-xs text-[#8B9A94]">Pot: {hand.potSize}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <BoardCards board={hand.board} />
                {iWon && <span className="text-xs font-medium text-[#D4AF37]">You won</span>}
              </div>
              {myActions.length > 0 && (
                <p className="mt-1 text-xs text-[#5A6B64]">
                  Your actions: {myActions.map((a) => a.action).join(' → ')}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function GameHistory() {
  const navigate = useNavigate();
  const myUserId = localStorage.getItem('userId');
  const [games, setGames] = useState([]);
  const [expandedGame, setExpandedGame] = useState(null);
  const [error, setError] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(null);

  useEffect(() => {
    gamesApi
      .listMine()
      .then(({ data }) => setGames(data.games))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load game history'));
  }, []);

  const handleExpand = async (gameId) => {
    if (expandedGame?.id === gameId) {
      setExpandedGame(null);
      return;
    }
    setLoadingDetail(gameId);
    try {
      const { data } = await gamesApi.getDetail(gameId);
      setExpandedGame(data.game);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load game');
    } finally {
      setLoadingDetail(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F10] px-4 py-10 text-[#EDEAE3]">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Game history</h1>
          <button
            onClick={() => navigate('/')}
            className="rounded border border-[#22302B] px-3 py-1.5 text-sm hover:border-[#D4AF37]"
          >
            Back to lobby
          </button>
        </div>

        {error && <p className="text-sm text-[#B23A2E]">{error}</p>}

        {games.length === 0 && !error && (
          <p className="text-sm text-[#5A6B64]">No games played yet — go win some chips.</p>
        )}

        <ul className="flex flex-col gap-3">
          {games.map((game) => (
            <li key={game.id}>
              <button
                onClick={() => handleExpand(game.id)}
                className="flex w-full items-center justify-between rounded-lg border border-[#22302B] bg-[#0F1513] p-4 text-left transition hover:border-[#D4AF37]/40"
              >
                <div>
                  <p className="text-sm font-medium text-[#EDEAE3]">
                    Room {game.room.code} · {game._count.hands} hand
                    {game._count.hands === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-[#8B9A94]">
                    {new Date(game.startedAt).toLocaleString()} · {game.status}
                  </p>
                </div>
                <span className="text-[#5A6B64]">
                  {loadingDetail === game.id ? '…' : expandedGame?.id === game.id ? '▲' : '▼'}
                </span>
              </button>

              {expandedGame?.id === game.id && (
                <div className="mt-2">
                  <GameDetail
                    game={expandedGame}
                    myUserId={myUserId}
                    onClose={() => setExpandedGame(null)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}