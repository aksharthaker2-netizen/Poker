// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { updateProfileSchema } = require('../validators/userValidators');

router.get('/me', authMiddleware, userController.getProfile);
router.patch('/me', authMiddleware, validateRequest(updateProfileSchema), userController.updateProfile);
router.get('/:userId/stats', authMiddleware, userController.getStats);

module.exports = router;