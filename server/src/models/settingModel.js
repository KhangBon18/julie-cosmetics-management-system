const { pool } = require('../config/db');

const Setting = {
  // Get all settings (admin)
  findAll: async (category) => {
    let query = 'SELECT * FROM settings';
    const params = [];
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY category, setting_key';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get public settings only (public API)
  findPublic: async () => {
    const [rows] = await pool.query(
      'SELECT setting_key, setting_value, data_type FROM settings WHERE is_public = TRUE ORDER BY setting_key'
    );
    // Transform to key-value object
    const result = {};
    for (const row of rows) {
      result[row.setting_key] = castValue(row.setting_value, row.data_type);
    }
    return result;
  },

  // Get single setting by key
  findByKey: async (key) => {
    const [rows] = await pool.query('SELECT * FROM settings WHERE setting_key = ?', [key]);
    if (!rows[0]) return null;
    return { ...rows[0], parsed_value: castValue(rows[0].setting_value, rows[0].data_type) };
  },

  // Update setting value
  update: async (key, value, updatedBy) => {
    const [result] = await pool.query(
      'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
      [String(value), updatedBy || null, key]
    );
    return result.affectedRows;
  },

  // Bulk update settings
  bulkUpdate: async (settings, updatedBy) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const { key, value } of settings) {
        await connection.query(
          'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
          [String(value), updatedBy || null, key]
        );
      }
      await connection.commit();
      return settings.length;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get settings as key-value map (for internal use, cached)
  getMap: async (category) => {
    let query = 'SELECT setting_key, setting_value, data_type FROM settings';
    const params = [];
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    const [rows] = await pool.query(query, params);
    const map = {};
    for (const row of rows) {
      map[row.setting_key] = castValue(row.setting_value, row.data_type);
    }
    return map;
  }
};

// Helper: cast string value to appropriate type
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

module.exports = Setting;
