// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// --- Security & Utility Middleware ---
app.use(helmet()); // Sets secure HTTP headers
app.use(cors({
  origin: process.env.CLIENT_URL || '*', // Allow frontend to connect
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json()); // Parse incoming JSON payloads
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
// We will mount routes here later (e.g., app.use('/api/auth', authRoutes))

// --- Health Check Endpoint ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'PokerAI Backend is operational',
    timestamp: new Date().toISOString()
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(`[Error]: ${err.message}`);
  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

module.exports = app;