// src/routes/achievementRoutes.js
const express = require('express');
const router = express.Router();

const achievementController = require('../controllers/achievementController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', achievementController.listAll);
router.get('/me', achievementController.listMine);

module.exports = router;