const { pool } = require('../config/db');

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 0.5; // 30 seconds

const LoginThrottler = {
  /**
   * Check if an identifier (username/phone) is currently throttled.
   * @returns {{ throttled: boolean, remaining: number, lockUntil: Date|null }}
   */
  check: async (identifier) => {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as fail_count, MAX(created_at) as last_attempt
       FROM login_attempts
       WHERE identifier = ? AND success = FALSE
       AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [identifier, WINDOW_MINUTES]
    );

    const failCount = rows[0]?.fail_count || 0;

    if (failCount >= MAX_ATTEMPTS) {
      const lastAttempt = new Date(rows[0].last_attempt);
      const lockUntil = new Date(lastAttempt.getTime() + LOCKOUT_MINUTES * 60 * 1000);
      
      if (new Date() < lockUntil) {
        return {
          throttled: true,
          remaining: 0,
          lockUntil,
          minutesLeft: Math.ceil((lockUntil - new Date()) / 60000)
        };
      }
    }

    return {
      throttled: false,
      remaining: MAX_ATTEMPTS - failCount,
      lockUntil: null
    };
  },

  /**
   * Log a login attempt (success or failure).
   */
  log: async ({ identifier, ipAddress, userAgent, success, failureReason }) => {
    try {
      await pool.query(
        `INSERT INTO login_attempts (identifier, ip_address, user_agent, success, failure_reason)
         VALUES (?, ?, ?, ?, ?)`,
        [identifier, ipAddress || '0.0.0.0', userAgent?.substring(0, 500) || null, success, failureReason || null]
      );
    } catch (error) {
      console.error('[LoginThrottler] Failed to log attempt:', error.message);
    }
  },

  /**
   * Clear successful — remove old failed attempts after successful login.
   * This prevents lockout after a successful auth.
   */
  clearFailed: async (identifier) => {
    try {
      await pool.query(
        'DELETE FROM login_attempts WHERE identifier = ? AND success = FALSE',
        [identifier]
      );
    } catch (error) {
      console.error('[LoginThrottler] Failed to clear:', error.message);
    }
  }
};

module.exports = LoginThrottler;
