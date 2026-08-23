// src/store/gameStore.js
import { create } from 'zustand';

const initialState = {
  gameState: 'WAITING', // WAITING | PRE_FLOP | FLOP | TURN | RIVER | SHOWDOWN
  communityCards: [],
  players: [], // [{id, chips, status}] — public info only, from GAME_STATE_UPDATED
  potSize: 0,
  highestBet: 0,
  nextPlayerId: null,

  // Private — only ever set from the YOUR_HAND event on MY OWN socket
  // channel. Never populate this from any room-wide broadcast.
  myHoleCards: null,

  // Exact legal-actions info for whoever's turn is next, computed
  // server-side (bettingManager.getLegalActions). Public — every client
  // gets the same value, it just describes the CURRENT actor's options,
  // not private info. null when no one needs to act (WAITING/SHOWDOWN).
  actionInfo: null,

  // Only populated at SHOWDOWN
  showdownResults: null,
  finalBalances: null,
  revealedHands: null
};

export const useGameStore = create((set) => ({
  ...initialState,

  setMyHand: (holeCards) => set({ myHoleCards: holeCards }),

  applyGameStateUpdate: (payload) =>
    set({
      gameState: payload.state,
      communityCards: payload.communityCards ?? [],
      players: payload.players ?? [],
      potSize: payload.potSize ?? 0,
      highestBet: payload.highestBet ?? 0,
      nextPlayerId: payload.nextPlayerId ?? null,
      actionInfo: payload.actionInfo ?? null,
      showdownResults: payload.results ?? null,
      finalBalances: payload.finalBalances ?? null,
      revealedHands: payload.revealedHands ?? null
    }),

  applyGameStarted: (payload) =>
    set({
      gameState: payload.state,
      communityCards: payload.communityCards ?? [],
      potSize: payload.potSize ?? 0,
      nextPlayerId: payload.turnData?.currentActorId ?? null,
      // actionInfo isn't included on GAME_STARTED itself — the
      // GAME_STATE_UPDATED that immediately follows (from
      // broadcastAndCheckBot kicking off the first turn) fills it in.
      actionInfo: null,
      showdownResults: null,
      finalBalances: null,
      revealedHands: null
    }),

  resetGame: () => set(initialState)
}));