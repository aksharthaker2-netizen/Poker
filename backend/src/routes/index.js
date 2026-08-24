// src/routes/index.js
const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/friends', require('./friendRoutes'));
router.use('/leaderboard', require('./leaderboardRoutes'));
router.use('/achievements', require('./achievementRoutes'));
router.use('/games', require('./gameRoutes'));
router.use('/rooms', require('./roomRoutes'));
router.use('/reviews', require('./reviewRoutes'));

module.exports = router;