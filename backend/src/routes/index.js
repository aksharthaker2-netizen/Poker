// src/routes/index.js
const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/friends', require('./friendRoutes'));
router.use('/leaderboard', require('./leaderboardRoutes'));

module.exports = router;