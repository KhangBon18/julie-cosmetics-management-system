const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'julie_cosmetics',
  });
  
  const [tables] = await pool.query('SHOW TABLES');
  for (let row of tables) {
    const tableName = Object.values(row)[0];
    const [create] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
    console.log(create[0]['Create Table'] + ';\n');
  }
  process.exit(0);
}
run();
