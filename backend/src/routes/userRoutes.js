// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, userController.getProfile);
router.get('/:userId/stats', authMiddleware, userController.getStats);

module.exports = router;