// src/managers/seatManager.js

class SeatManager {
  /**
   * Initializes an empty array of seats for a new room.
   * @param {Number} maxPlayers - Maximum number of seats at the table
   * @returns {Array} An array of length maxPlayers filled with null
   */
  initializeSeats(maxPlayers) {
    return new Array(maxPlayers).fill(null);
  }

  /**
   * Assigns a player to the first available seat, or a specifically requested seat.
   * 
   * @param {Object} room - The room state object
   * @param {Object} player - The player object to sit down
   * @param {Number} requestedIndex - (Optional) Specific seat index 0 to maxPlayers-1
   * @returns {Number} The index of the assigned seat
   */
  takeSeat(room, player, requestedIndex = null) {
    // Ensure the seats array exists
    if (!room.seats) {
      room.seats = this.initializeSeats(room.settings.maxPlayers);
    }

    // Prevent a player from occupying multiple seats
    const existingIndex = room.seats.findIndex(s => s !== null && s.id === player.id);
    if (existingIndex !== -1) {
      return existingIndex; // They are already seated here
    }

    let seatIndex = -1;

    // Try to take the requested seat if provided
    if (requestedIndex !== null && requestedIndex >= 0 && requestedIndex < room.settings.maxPlayers) {
      if (room.seats[requestedIndex] === null) {
        seatIndex = requestedIndex;
      } else {
        throw new Error(`Seat ${requestedIndex} is already taken.`);
      }
    } else {
      // Find the very first empty seat (null)
      seatIndex = room.seats.findIndex(s => s === null);
      if (seatIndex === -1) {
        throw new Error('No seats available at this table.');
      }
    }

    // Assign the player to the static array index
    room.seats[seatIndex] = player;
    return seatIndex;
  }

  /**
   * Removes a player from their seat, replacing them with null.
   * This ensures the array length stays identical and other players do not shift.
   */
  leaveSeat(room, playerId) {
    if (!room.seats) return;
    
    const seatIndex = room.seats.findIndex(s => s !== null && s.id === playerId);
    if (seatIndex !== -1) {
      room.seats[seatIndex] = null;
    }
  }

  /**
   * Extracts only the currently seated players in their physical table order.
   * This is what gets passed to the GameEngine to deal cards.
   */
  getActivePlayers(room) {
    if (!room.seats) return [];
    // Filter out the nulls, leaving an ordered array of just the human/bot objects
    return room.seats.filter(seat => seat !== null);
  }
}

module.exports = new SeatManager();