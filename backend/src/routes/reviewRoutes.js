// src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();

const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/game/:gameId', reviewController.getReview);
router.get('/hand/:handId', reviewController.getHandActions);

module.exports = router;