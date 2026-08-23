// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const rateLimiter = require('../middleware/rateLimiter');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/authValidators');

// Tight limit — register/login are the classic brute-force / credential-
// stuffing target. 20 attempts per 15 minutes per IP.
const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;