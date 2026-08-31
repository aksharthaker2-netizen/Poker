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
    // FIX: `origin: '*'` combined with `credentials: true` is actually
    // rejected outright by browsers (the CORS spec disallows a wildcard
    // origin alongside credentialed requests) — this was silently broken
    // whenever FRONTEND_URL wasn't set. We also don't use cookies at all
    // (Bearer tokens only, read from the Authorization header), so
    // `credentials: true` shouldn't be here regardless.
    origin: env.FRONTEND_URL || '*' // set FRONTEND_URL explicitly in production
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