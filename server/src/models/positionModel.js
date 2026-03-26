const { pool } = require('../config/db');

const Position = {
  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT p.*, COUNT(ep.id) as employee_count
       FROM positions p
       LEFT JOIN employee_positions ep ON p.position_id = ep.position_id AND ep.end_date IS NULL
       GROUP BY p.position_id
       ORDER BY p.position_name ASC`
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM positions WHERE position_id = ?', [id]);
    return rows[0];
  },

  create: async ({ position_name, base_salary, description }) => {
    const [result] = await pool.query(
      'INSERT INTO positions (position_name, base_salary, description) VALUES (?, ?, ?)',
      [position_name, base_salary || 0, description || null]
    );
    return result.insertId;
  },

  update: async (id, { position_name, base_salary, description }) => {
    const [result] = await pool.query(
      'UPDATE positions SET position_name = ?, base_salary = ?, description = ? WHERE position_id = ?',
      [position_name, base_salary, description, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM positions WHERE position_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Position;
