// src/routes/roomRoutes.js
const express = require('express');
const router = express.Router();

const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { listRoomsQuerySchema } = require('../validators/roomValidators');

router.use(authMiddleware);

router.get('/mine', validateRequest(listRoomsQuerySchema, 'query'), roomController.getMyRooms);

module.exports = router;