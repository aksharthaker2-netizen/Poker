// src/hooks/useRoom.js
import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { emitWithAck } from '../services/socket';
import { useRoomStore } from '../store/roomStore';
import { useGameStore } from '../store/gameStore';

/**
 * @param {string} currentUserId - the logged-in user's id (from your auth
 *   flow — read from wherever you store it after login, e.g. localStorage
 *   or an auth store). Only used client-side to compute `isHost`; the
 *   server never trusts anything the client sends as an id.
 */
export function useRoom(currentUserId) {
  const socket = useSocket();
  const { room, isHost, error, closedReason, setRoom, setError, setClosedReason, clearRoom } =
    useRoomStore();
  const applyGameStarted = useGameStore((s) => s.applyGameStarted);

  useEffect(() => {
    if (!socket) return;

    const onRoomUpdated = ({ room: updatedRoom }) => {
      setRoom(updatedRoom, currentUserId);
    };

    const onGameStarted = (payload) => {
      applyGameStarted(payload);
      setRoom({ ...room, status: 'PLAYING' }, currentUserId);
    };

    const onRoomClosed = ({ reason }) => {
      setClosedReason(reason || 'The room was closed.');
    };

    const onKicked = () => {
      setClosedReason('You were removed from the room by the host.');
    };

    socket.on('ROOM_UPDATED', onRoomUpdated);
    socket.on('GAME_STARTED', onGameStarted);
    socket.on('ROOM_CLOSED', onRoomClosed);
    socket.on('KICKED_FROM_ROOM', onKicked);

    return () => {
      socket.off('ROOM_UPDATED', onRoomUpdated);
      socket.off('GAME_STARTED', onGameStarted);
      socket.off('ROOM_CLOSED', onRoomClosed);
      socket.off('KICKED_FROM_ROOM', onKicked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentUserId]);

  const createRoom = useCallback(
    async (username, settings) => {
      try {
        const res = await emitWithAck('CREATE_ROOM', { username, settings });
        setRoom(res.room, currentUserId);
        return res.room;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [currentUserId, setRoom, setError]
  );

  const joinRoom = useCallback(
    async (roomId, username, requestedSeat = null) => {
      try {
        const res = await emitWithAck('JOIN_ROOM', { roomId, username, requestedSeat });
        setRoom(res.room, currentUserId);
        return res.room;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [currentUserId, setRoom, setError]
  );

  const addBot = useCallback(
    async (roomId, requestedSeat = null) => {
      try {
        const res = await emitWithAck('ADD_BOT', { roomId, requestedSeat });
        setRoom(res.room, currentUserId);
        return res.room;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [currentUserId, setRoom, setError]
  );

  const startGame = useCallback(
    async (roomId) => {
      try {
        await emitWithAck('START_GAME', { roomId });
        // GAME_STARTED event (handled above) drives the actual state
        // transition — this just confirms the request was accepted.
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [setError]
  );

  const leaveRoom = useCallback(
    async (roomId) => {
      try {
        await emitWithAck('LEAVE_ROOM', { roomId });
      } finally {
        // Clear local state regardless of server ack — the person is
        // navigating away either way, and a stale room in the store
        // would otherwise linger and confuse the next page they visit.
        clearRoom();
      }
    },
    [clearRoom]
  );

  const kickPlayer = useCallback(
    async (roomId, targetUserId) => {
      try {
        await emitWithAck('KICK_PLAYER', { roomId, targetUserId });
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [setError]
  );

  const removeBot = useCallback(
    async (roomId, botId) => {
      try {
        await emitWithAck('REMOVE_BOT', { roomId, botId });
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [setError]
  );

  const closeRoom = useCallback(
    async (roomId) => {
      try {
        await emitWithAck('CLOSE_ROOM', { roomId });
      } finally {
        // Same reasoning as leaveRoom — the room is gone either way.
        clearRoom();
      }
    },
    [clearRoom]
  );

  return {
    room,
    isHost,
    error,
    closedReason,
    createRoom,
    joinRoom,
    addBot,
    startGame,
    leaveRoom,
    kickPlayer,
    removeBot,
    closeRoom,
    clearRoom
  };
}