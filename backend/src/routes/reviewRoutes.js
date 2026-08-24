// src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();

const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { gameIdParamSchema, handIdParamSchema } = require('../validators/gameValidators');

router.use(authMiddleware);

router.get('/game/:gameId', validateRequest(gameIdParamSchema, 'params'), reviewController.getReview);
router.get('/hand/:handId', validateRequest(handIdParamSchema, 'params'), reviewController.getHandActions);

module.exports = router;