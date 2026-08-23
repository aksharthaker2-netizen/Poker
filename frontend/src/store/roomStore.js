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

  setRoom: (room, currentUserId) =>
    set({
      room,
      isHost: room?.hostId === currentUserId,
      error: null
    }),

  setError: (error) => set({ error }),

  clearRoom: () => set({ room: null, isHost: false, error: null })
}));