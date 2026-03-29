const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');

/**
 * Generate short-lived access token (15 minutes).
 */
const generateAccessToken = (userId, type = 'staff') => {
  return jwt.sign({ id: userId, type }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

/**
 * Generate long-lived refresh token (30 days) and store hash in DB.
 * @returns {string} raw refresh token to send to client
 */
const generateRefreshToken = async (userId, userType = 'staff', req = null) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, user_type, token_hash, device_info, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      userType,
      tokenHash,
      req?.get?.('User-Agent')?.substring(0, 255) || null,
      req?.ip || req?.connection?.remoteAddress || null,
      expiresAt
    ]
  );

  return rawToken;
};

/**
 * Verify refresh token: check hash exists, not expired, not revoked.
 * @returns {{ user_id, user_type }|null}
 */
const verifyRefreshToken = async (rawToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const [rows] = await pool.query(
    `SELECT token_id, user_id, user_type FROM refresh_tokens
     WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );

  return rows[0] || null;
};

/**
 * Revoke a specific refresh token.
 */
const revokeRefreshToken = async (rawToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?',
    [tokenHash]
  );
};

/**
 * Revoke ALL refresh tokens for a user (logout everywhere).
 */
const revokeAllUserTokens = async (userId, userType = 'staff') => {
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND user_type = ? AND revoked_at IS NULL',
    [userId, userType]
  );
};

// Backward-compatible: generateToken still works for 7d token (existing code)
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

module.exports = {
  generateToken,           // backward compat
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
};
