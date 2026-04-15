const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), override: true });

const mysql = require('mysql2/promise');

const APPLY = process.argv.includes('--apply');
const DB_NAME = process.env.DB_NAME || 'julie_cosmetics';
const EXCLUDED_COLUMNS = new Set([
  'password_hash',
  'token_hash',
  'image_url',
  'tracking_code',
  'transaction_ref'
]);
const buildMojibakeWhere = (columnName) =>
  `\`${columnName}\` COLLATE utf8mb4_bin REGEXP 'Ã|Æ|Ä|Å'
   OR \`${columnName}\` COLLATE utf8mb4_bin LIKE '%áº%'
   OR \`${columnName}\` COLLATE utf8mb4_bin LIKE '%á»%'`;

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
    charset: 'utf8mb4_unicode_ci',
    waitForConnections: true
  });

  const conn = await pool.getConnection();

  try {
    const [textColumns] = await conn.query(
       `SELECT table_name AS table_name, column_name AS column_name
       FROM information_schema.columns
       WHERE table_schema = ?
         AND data_type IN ('char', 'varchar', 'text', 'mediumtext', 'longtext')
       ORDER BY table_name, ordinal_position`,
      [DB_NAME]
    );

    let totalRowsFixed = 0;
    let totalFieldsFixed = 0;

    for (const { table_name: tableName, column_name: columnName } of textColumns) {
      if (EXCLUDED_COLUMNS.has(columnName)) continue;

      const [countRows] = await conn.query(
        `SELECT COUNT(*) AS total
         FROM \`${tableName}\`
         WHERE \`${columnName}\` IS NOT NULL
           AND (${buildMojibakeWhere(columnName)})`
      );

      const affectedRows = Number(countRows[0]?.total || 0);
      if (!affectedRows) continue;

      if (APPLY) {
        await conn.query(
          `UPDATE \`${tableName}\`
           SET \`${columnName}\` = CONVERT(BINARY CONVERT(\`${columnName}\` USING latin1) USING utf8mb4)
           WHERE \`${columnName}\` IS NOT NULL
             AND (${buildMojibakeWhere(columnName)})`
        );
      }

      totalRowsFixed += affectedRows;
      totalFieldsFixed += affectedRows;
      console.log(`${APPLY ? 'UPDATED' : 'DRY-RUN'} ${tableName}.${columnName}: ${affectedRows} trường`);
    }

    if (!totalFieldsFixed) {
      console.log('Không phát hiện text bị lỗi mã hóa.');
    } else {
      console.log(`${APPLY ? 'Đã sửa' : 'Sẽ sửa'} tổng cộng ${totalFieldsFixed} trường.`);
    }
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Fix text encoding failed:', error);
  process.exit(1);
});
