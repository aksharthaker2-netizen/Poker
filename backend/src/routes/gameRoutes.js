// src/routes/gameRoutes.js
const express = require('express');
const router = express.Router();

const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { gameIdParamSchema, listGamesQuerySchema } = require('../validators/gameValidators');

router.use(authMiddleware);

router.get('/me', validateRequest(listGamesQuerySchema, 'query'), gameController.getMyGames);
router.get('/:gameId', validateRequest(gameIdParamSchema, 'params'), gameController.getGameDetail);

module.exports = router;