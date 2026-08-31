// src/socket/roomSocket.js
const roomManager = require('../managers/roomManager');
const botManager = require('../managers/botManager');
const presenceManager = require('../managers/presenceManager');
const seatManager = require('../managers/seatManager');
const { dealPrivateHands, broadcastAndCheckBot, handlePlayerLeaving, closeRoom } = require('./gameFlowManager');
const validateSocketPayload = require('../middleware/validateSocketPayload');
const { enforceRateLimit } = require('../utils/socketRateLimiter');
const {
  createRoomSchema,
  joinRoomSchema,
  roomIdOnlySchema,
  addBotSchema,
  kickPlayerSchema,
  removeBotSchema,
  changeSeatSchema
} = require('../validators/socketValidators');

module.exports = function registerRoomHandlers(io, socket) {
  // Trusted identity, verified once by socketAuthMiddleware at connection.
  // NEVER read the acting user's id from payload.user / payload.userId —
  // that would let any client impersonate any other player.
  const userId = socket.data.userId;

  // 1. CREATE A NEW ROOM
  socket.on('CREATE_ROOM', async (payload, callback) => {
    try {
      enforceRateLimit(`${userId}:CREATE_ROOM`, 5, 60_000);
      const { username, settings, requestedSeat } = validateSocketPayload(createRoomSchema, payload);

      const newRoom = await roomManager.createRoom(userId, settings);
      socket.join(newRoom.id);

      // Automatically put the host into a seat — requestedSeat lets the
      // host pick where to sit at their own empty table (there's no
      // occupancy conflict possible here since nobody else has joined yet).
      const updatedRoom = roomManager.joinRoom(
        newRoom.id,
        {
          id: userId,
          username: username || socket.data.username,
          chips: settings?.startingChips
        },
        requestedSeat
      );

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
      enforceRateLimit(`${userId}:JOIN_ROOM`, 15, 60_000);
      const { roomId, username, requestedSeat } = validateSocketPayload(joinRoomSchema, payload);

      const updatedRoom = roomManager.joinRoom(
        roomId,
        { id: userId, username: username || socket.data.username },
        requestedSeat
      );
      socket.join(roomId);
      presenceManager.setInGame(userId, roomId);

      console.log(`[Room] ${username} joined room ${roomId}`);
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
      enforceRateLimit(`${userId}:ADD_BOT`, 30, 60_000);
      const { roomId, requestedSeat } = validateSocketPayload(addBotSchema, payload);
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
      enforceRateLimit(`${userId}:START_GAME`, 10, 60_000);
      const { roomId } = validateSocketPayload(roomIdOnlySchema, payload);
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

  // 5. LEAVE THE ROOM
  socket.on('LEAVE_ROOM', async (payload, callback) => {
    try {
      enforceRateLimit(`${userId}:LEAVE_ROOM`, 15, 60_000);
      const { roomId } = validateSocketPayload(roomIdOnlySchema, payload);

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

  // 6. HOST: KICK A HUMAN PLAYER
  socket.on('KICK_PLAYER', async (payload, callback) => {
    try {
      enforceRateLimit(`${userId}:KICK_PLAYER`, 20, 60_000);
      const { roomId, targetUserId } = validateSocketPayload(kickPlayerSchema, payload);
      const room = roomManager.getRoom(roomId);

      if (!room) throw new Error('Room not found.');
      if (room.hostId !== userId) throw new Error('Only the table host can remove players.');
      if (targetUserId === userId) throw new Error('Use Leave Room to remove yourself.');

      const targetSeat = room.seats.find((s) => s && s.id === targetUserId);
      if (!targetSeat) throw new Error('Player is not seated in this room.');
      if (targetSeat.isBot) throw new Error('Use Remove Bot for bot seats.');

      // Reuses the exact same removal policy as a self-initiated leave —
      // safe-immediately if WAITING, marked for between-hands removal if
      // PLAYING. See handlePlayerLeaving's doc comment for the full
      // reasoning; it doesn't care WHO decided the player should leave.
      await handlePlayerLeaving(io, roomId, targetUserId, { immediate: true });

      // Tell the kicked player's OWN client directly — ROOM_UPDATED alone
      // (everyone else already got it) doesn't make it obvious to THEM
      // specifically that they were removed rather than just seeing seats
      // shift around.
      io.to(`user:${targetUserId}`).emit('KICKED_FROM_ROOM', { roomId });

      console.log(`[Room] Host kicked ${targetUserId} from room ${roomId}`);
      if (typeof callback === 'function') callback({ success: true });
    } catch (error) {
      console.error('[Room Error - Kick]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 7. HOST: REMOVE A BOT
  socket.on('REMOVE_BOT', async (payload, callback) => {
    try {
      enforceRateLimit(`${userId}:REMOVE_BOT`, 30, 60_000);
      const { roomId, botId } = validateSocketPayload(removeBotSchema, payload);
      const room = roomManager.getRoom(roomId);

      if (!room) throw new Error('Room not found.');
      if (room.hostId !== userId) throw new Error('Only the table host can remove bots.');

      const targetSeat = room.seats.find((s) => s && s.id === botId);
      if (!targetSeat) throw new Error('Bot is not seated in this room.');
      if (!targetSeat.isBot) throw new Error('That seat is not a bot.');

      // Same underlying mechanism as KICK_PLAYER / LEAVE_ROOM — bots
      // aren't special-cased here, see handlePlayerLeaving's doc comment
      // for why that's safe (bots never get treated as "disconnected" for
      // turn-taking purposes; this flag only matters to the between-hands
      // prune).
      await handlePlayerLeaving(io, roomId, botId, { immediate: true });

      console.log(`[Room] Host removed bot ${botId} from room ${roomId}`);
      if (typeof callback === 'function') callback({ success: true });
    } catch (error) {
      console.error('[Room Error - Remove Bot]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 8. HOST: CLOSE THE ROOM
  socket.on('CLOSE_ROOM', async (payload, callback) => {
    try {
      enforceRateLimit(`${userId}:CLOSE_ROOM`, 10, 60_000);
      const { roomId } = validateSocketPayload(roomIdOnlySchema, payload);
      const room = roomManager.getRoom(roomId);

      if (!room) throw new Error('Room not found.');
      if (room.hostId !== userId) throw new Error('Only the table host can close the room.');

      await closeRoom(io, roomId, 'The host closed the room');

      console.log(`[Room] Host closed room ${roomId}`);
      if (typeof callback === 'function') callback({ success: true });
    } catch (error) {
      console.error('[Room Error - Close]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 9. CHANGE SEAT (self-service — this is how seat selection actually
  // works: you can't meaningfully pick a seat before joining since you
  // don't know the room's occupancy yet, so this lets anyone already
  // seated move to an empty seat while still in the lobby).
  socket.on('CHANGE_SEAT', (payload, callback) => {
    try {
      enforceRateLimit(`${userId}:CHANGE_SEAT`, 15, 60_000);
      const { roomId, requestedSeat } = validateSocketPayload(changeSeatSchema, payload);
      const room = roomManager.getRoom(roomId);

      if (!room) throw new Error('Room not found.');
      if (room.status === 'PLAYING') throw new Error('Cannot change seats while a hand is in progress.');
      if (requestedSeat >= room.seats.length) throw new Error('Invalid seat number.');
      if (room.seats[requestedSeat] !== null) throw new Error('That seat is already taken.');

      const currentSeat = room.seats.find((s) => s && s.id === userId);
      if (!currentSeat) throw new Error('You are not seated in this room.');

      // Move by freeing the old seat and re-taking a new one with the
      // SAME player object — preserves chips/status rather than resetting
      // them, which a leave+rejoin would otherwise do.
      seatManager.leaveSeat(room, userId);
      seatManager.takeSeat(room, currentSeat, requestedSeat);

      io.to(roomId).emit('ROOM_UPDATED', { room });
      if (typeof callback === 'function') callback({ success: true, room });
    } catch (error) {
      console.error('[Room Error - Change Seat]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // 10. REBUY — top up chips after busting. See rebuy-safety note below.
  socket.on('REBUY', (payload, callback) => {
    try {
      enforceRateLimit(`${userId}:REBUY`, 10, 60_000);
      const { roomId } = validateSocketPayload(roomIdOnlySchema, payload);
      const room = roomManager.getRoom(roomId);

      if (!room) throw new Error('Room not found.');

      const seat = room.seats.find((s) => s && s.id === userId);
      if (!seat) throw new Error('You are not seated in this room.');

      const livePlayer = room.game ? room.game.players.find((p) => p.id === userId) : null;
      const currentChips = livePlayer ? livePlayer.chips : seat.chips;

      if (currentChips > 0) throw new Error('You still have chips — no need to rebuy.');

      const rebuyAmount = room.settings.startingChips || 1000;

      // SAFETY: unlike removing a player, TOPPING UP chips is always safe
      // regardless of hand state — a busted player (chips === 0) is
      // already excluded from every pot's eligibility this hand (they
      // went all-in and lost, or folded), so increasing `chips` on their
      // EXISTING object never affects current pot math. The only two
      // cases are: (a) still present in game.players from busting this/
      // last hand — top up directly; (b) already dropped by a PREVIOUS
      // startHand()'s busted-filter — re-add them fresh for the next hand.
      if (livePlayer) {
        livePlayer.chips = rebuyAmount;
      } else if (room.game) {
        room.game.players.push({ id: userId, chips: rebuyAmount, status: 'WAITING' });
        // turnManager keeps its OWN player list, separate from
        // game.players — without this they'd be dealt cards next hand
        // but never actually get a turn.
        room.game.turnManager.addPlayer(userId);
      }

      seat.chips = rebuyAmount;

      io.to(roomId).emit('ROOM_UPDATED', { room });
      console.log(`[Room] ${userId} rebought ${rebuyAmount} chips in room ${roomId}`);
      if (typeof callback === 'function') callback({ success: true, newChips: rebuyAmount });
    } catch (error) {
      console.error('[Room Error - Rebuy]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });
};