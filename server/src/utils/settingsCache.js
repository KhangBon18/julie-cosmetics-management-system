const { pool } = require('../config/db');

// In-memory cache with TTL
let cache = {};
let lastFetch = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const SettingsCache = {
  /**
   * Get all settings as a key-value map. Cached for 5 minutes.
   * @returns {Object} { 'crm.points_per_10000': 1, 'crm.gold_threshold': 500, ... }
   */
  getAll: async () => {
    const now = Date.now();
    if (now - lastFetch < CACHE_TTL_MS && Object.keys(cache).length > 0) {
      return cache;
    }

    try {
      const [rows] = await pool.query('SELECT setting_key, setting_value, data_type FROM settings');
      const map = {};
      for (const row of rows) {
        map[row.setting_key] = castValue(row.setting_value, row.data_type);
      }
      cache = map;
      lastFetch = now;
      return map;
    } catch (error) {
      console.error('[SettingsCache] Failed to refresh:', error.message);
      return cache; // Return stale cache on error
    }
  },

  /**
   * Get a single setting value (uses cached data).
   */
  get: async (key, defaultValue = null) => {
    const all = await SettingsCache.getAll();
    return all[key] !== undefined ? all[key] : defaultValue;
  },

  /**
   * Force cache invalidation (call after settings update).
   */
  invalidate: () => {
    cache = {};
    lastFetch = 0;
  }
};

function castValue(value, dataType) {
  switch (dataType) {
    case 'number': return Number(value);
    case 'boolean': return value === 'true' || value === '1';
    case 'json':
      try { return JSON.parse(value); }
      catch { return value; }
    default: return value;
  }
}

module.exports = SettingsCache;
