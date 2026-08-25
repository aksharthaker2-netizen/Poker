// src/socket/roomSocket.js
const roomManager = require('../managers/roomManager');
const botManager = require('../managers/botManager');
const presenceManager = require('../managers/presenceManager');
const { dealPrivateHands, broadcastAndCheckBot, handlePlayerLeaving } = require('./gameFlowManager');

module.exports = function registerRoomHandlers(io, socket) {
  // Trusted identity, verified once by socketAuthMiddleware at connection.
  // NEVER read the acting user's id from payload.user / payload.userId —
  // that would let any client impersonate any other player.
  const userId = socket.data.userId;

  // 1. CREATE A NEW ROOM
  socket.on('CREATE_ROOM', async (payload, callback) => {
    try {
      const { username, settings } = payload;

      const newRoom = await roomManager.createRoom(userId, settings);
      socket.join(newRoom.id);

      // Automatically put the host into a seat
      const updatedRoom = roomManager.joinRoom(newRoom.id, {
        id: userId,
        username: username || socket.data.username,
        chips: settings?.startingChips
      });

      // FIX: this was never called anywhere, which meant
      // presenceManager.getUser(userId).roomId was always null and the
      // disconnect handler's whole cleanup path was unreachable dead code.
      presenceManager.setInGame(userId, newRoom.id);

      console.log(`[Room] ${username} created room ${newRoom.id}`);
      if (typeof callback === 'function') callback({ success: true, room: updatedRoom });
    } catch (error) {
      console.error('[Room Error - Create]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 2. JOIN AN EXISTING ROOM
  socket.on('JOIN_ROOM', (payload, callback) => {
    try {
      const { roomId, username, requestedSeat } = payload;

      const updatedRoom = roomManager.joinRoom(
        roomId,
        { id: userId, username: username || socket.data.username },
        requestedSeat
      );
      socket.join(roomId);
      presenceManager.setInGame(userId, roomId);

      console.log(`[Room] ${username} joined room ${roomId}`);

      // Broadcast to EVERYONE in the room that the seats updated
      io.to(roomId).emit('ROOM_UPDATED', { room: updatedRoom });

      if (typeof callback === 'function') callback({ success: true, room: updatedRoom });
    } catch (error) {
      console.error('[Room Error - Join]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 3. ADD A BOT TO THE TABLE
  socket.on('ADD_BOT', (payload, callback) => {
    try {
      const { roomId, requestedSeat } = payload;
      const room = roomManager.getRoom(roomId);

      if (!room) throw new Error('Room not found.');
      if (room.hostId !== userId) throw new Error('Only the table host can add bots.');
      if (room.status === 'PLAYING') throw new Error('Cannot seat players while a hand is in progress.');

      const botProfile = botManager.createBotProfile();
      const updatedRoom = roomManager.joinRoom(roomId, botProfile, requestedSeat);

      console.log(`[Room] Host added bot ${botProfile.username} to room ${roomId}`);

      io.to(roomId).emit('ROOM_UPDATED', { room: updatedRoom });

      if (typeof callback === 'function') callback({ success: true, room: updatedRoom });
    } catch (error) {
      console.error('[Room Error - Add Bot]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 4. START THE GAME
  socket.on('START_GAME', async (payload, callback) => {
    try {
      const { roomId } = payload;
      const room = roomManager.getRoom(roomId);

      if (!room) throw new Error('Room not found.');
      if (room.hostId !== userId) throw new Error('Only the table host can start the game.');

      const { initialGameState } = await roomManager.startGame(roomId);
      console.log(`[Room] Game started in room ${roomId}`);

      // PUBLIC state only. NEVER include initialGameState.playerHands here —
      // that field contains every player's hole cards and must not be
      // broadcast to the whole room.
      io.to(roomId).emit('GAME_STARTED', {
        state: initialGameState.state,
        turnData: initialGameState.turnData,
        potSize: initialGameState.potSize,
        communityCards: room.game.communityCards
      });

      // Each seated human gets ONLY their own two cards, privately.
      dealPrivateHands(io, room);

      if (typeof callback === 'function') callback({ success: true });

      // Drive the turn forward through the SAME shared loop gameSocket.js
      // uses after every human action.
      await broadcastAndCheckBot(io, roomId, {
        state: initialGameState.state,
        nextPlayerId: initialGameState.turnData.currentActorId,
        potSize: initialGameState.potSize,
        highestBet: room.game.bettingManager.highestBet
      });
    } catch (error) {
      console.error('[Room Error - Start]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 5. LEAVE THE ROOM (new — this whole event didn't exist before)
  socket.on('LEAVE_ROOM', async (payload, callback) => {
    try {
      const { roomId } = payload;

      await handlePlayerLeaving(io, roomId, userId, { immediate: true });
      socket.leave(roomId);
      presenceManager.setOnline(userId);

      console.log(`[Room] ${userId} left room ${roomId}`);
      if (typeof callback === 'function') callback({ success: true });
    } catch (error) {
      console.error('[Room Error - Leave]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });
};