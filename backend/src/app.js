// src/app.js
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const rateLimiter = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // In development: allow any localhost/127.0.0.1 port so Vite can
      // start on 5173, 5174, etc. without CORS errors.
      if (env.NODE_ENV !== 'production') {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }
      // Production: only the explicit FRONTEND_URL is allowed
      if (origin === env.FRONTEND_URL) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// General ceiling for the whole REST surface — auth routes ALSO carry
// their own much stricter limiter (authRoutes.js), applied in addition
// to this one since it's the classic brute-force target. Every other
// route (friends, games, rooms, achievements, leaderboard) previously had
// no throttling at all.
app.use('/api', rateLimiter({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;