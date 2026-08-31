// src/controllers/gameController.js
const gameRepository = require('../repositories/gameRepository');

async function getMyGames(req, res) {
  try {
    const games = await gameRepository.findManyByUser(req.userId, req.query.limit);
    return res.json({ games });
  } catch (error) {
    console.error('[Game] getMyGames error:', error.message);
    return res.status(500).json({ error: 'Failed to load game history' });
  }
}

async function getGameDetail(req, res) {
  try {
    const game = await gameRepository.findByIdWithHands(req.params.gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    // Only let someone view a game they actually played in.
    const played = game.hands.some((h) => h.actions.some((a) => a.userId === req.userId));
    if (!played) return res.status(403).json({ error: 'Not your game' });

    return res.json({ game });
  } catch (error) {
    console.error('[Game] getGameDetail error:', error.message);
    return res.status(500).json({ error: 'Failed to load game' });
  }
}

module.exports = { getMyGames, getGameDetail };