// src/routes/gameRoutes.js
const express = require('express');
const router = express.Router();

const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/me', gameController.getMyGames);
router.get('/:gameId', gameController.getGameDetail);

module.exports = router;