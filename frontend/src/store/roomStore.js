// src/store/roomStore.js
import { create } from 'zustand';

/**
 * Room shape mirrors exactly what roomManager.js sends over ROOM_UPDATED /
 * inside CREATE_ROOM / JOIN_ROOM acks:
 * { id, hostId, settings: {maxPlayers, bigBlind, startingChips},
 *   seats: [null | {id, username, chips, status, isBot}], status }
 */
export const useRoomStore = create((set) => ({
  room: null,
  isHost: false,
  error: null,
  // Set when the room is closed by the host, or when I get kicked —
  // Room.jsx/Game.jsx watch this to navigate away with an explanation.
  closedReason: null,

  setRoom: (room, currentUserId) =>
    set({
      room,
      isHost: room?.hostId === currentUserId,
      error: null
    }),

  setError: (error) => set({ error }),
  setClosedReason: (reason) => set({ closedReason: reason }),

  clearRoom: () => set({ room: null, isHost: false, error: null, closedReason: null })
}));
