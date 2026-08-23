// src/routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();

const leaderboardController = require('../controllers/leaderboardController');
const authMiddleware = require('../middleware/authMiddleware');

// Requires login (not fully public) — keeps rating data from being
// scraped anonymously. Relax this if you want a public leaderboard page.
router.get('/', authMiddleware, leaderboardController.getGlobal);

module.exports = router;