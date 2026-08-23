// src/routes/roomRoutes.js
const express = require('express');
const router = express.Router();

const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/mine', roomController.getMyRooms);

module.exports = router;