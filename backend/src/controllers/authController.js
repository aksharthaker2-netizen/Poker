// src/controllers/authController.js
const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const tokenService = require('../services/tokenService');

const BCRYPT_ROUNDS = 12;

function publicUser(user) {
  return { id: user.id, username: user.username, email: user.email };
}

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: { username, email, passwordHash }
    });

    // Every user needs a stats row for the leaderboard/profile pages to
    // work without null-checking everywhere downstream.
    await prisma.playerStats.create({ data: { userId: user.id } });

    const accessToken = tokenService.signAccessToken(user);
    const refreshToken = await tokenService.issueRefreshToken(user.id, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    return res.status(201).json({ accessToken, refreshToken, user: publicUser(user) });
  } catch (error) {
    console.error('[Auth] Register error:', error.message);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Deliberately the SAME error whether the email doesn't exist or the
    // password is wrong — distinguishing the two lets an attacker
    // enumerate which emails have accounts.
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'This account has been suspended' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() }
    });

    const accessToken = tokenService.signAccessToken(user);
    const refreshToken = await tokenService.issueRefreshToken(user.id, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    return res.json({ accessToken, refreshToken, user: publicUser(user) });
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    return res.status(500).json({ error: 'Login failed' });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;

    const { userId, newRawToken } = await tokenService.rotateRefreshToken(refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isBanned) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const accessToken = tokenService.signAccessToken(user);
    return res.json({ accessToken, refreshToken: newRawToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('[Auth] Logout error:', error.message);
    return res.status(500).json({ error: 'Logout failed' });
  }
}

module.exports = { register, login, refresh, logout };