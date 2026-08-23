// src/services/tokenService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/db');

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;

function hashToken(rawToken) {
  // Refresh tokens are opaque random strings, not JWTs — they're only
  // ever compared by hash, never decoded. SHA-256 is fine here (this
  // isn't a password, it's already 384 bits of random entropy).
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Issues a new refresh token. Only the RAW token is ever returned to the
 * caller/client — the DB only ever stores its hash, so a leaked database
 * dump doesn't hand out usable sessions.
 */
async function issueRefreshToken(userId, meta = {}) {
  const rawToken = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      userAgent: meta.userAgent || null,
      ipAddress: meta.ipAddress || null,
      expiresAt
    }
  });

  return rawToken;
}

/**
 * Validates a refresh token and rotates it: the presented token is
 * revoked and a brand new one is issued in the same call. Rotation means
 * a stolen refresh token can only ever be replayed once before this
 * catches the reuse (the legitimate owner's next refresh will fail
 * because their token was already revoked by the attacker's use — a
 * signal worth logging/alerting on in a production system).
 */
async function rotateRefreshToken(rawToken, meta = {}) {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.isRevoked || existing.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { isRevoked: true }
  });

  const newRawToken = await issueRefreshToken(existing.userId, meta);
  return { userId: existing.userId, newRawToken };
}

async function revokeRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { isRevoked: true }
  });
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken
};