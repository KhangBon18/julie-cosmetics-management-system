const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'database', 'migrations');

async function createConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'julie_cosmetics',
    charset: 'utf8mb4',
    multipleStatements: true
  });
}

function checksumFor(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function ensureTrackingTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      filename VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64) NULL COMMENT 'SHA256 of migration file'
    )
  `);
}

function stripTrailingDelimiter(buffer, delimiter) {
  const trimmedRight = buffer.replace(/\s+$/, '');
  return trimmedRight.slice(0, -delimiter.length).trim();
}

function splitSqlStatements(sql) {
  const statements = [];
  let delimiter = ';';
  let buffer = '';

  for (const line of sql.split(/\r?\n/)) {
    const delimiterMatch = line.match(/^\s*DELIMITER\s+(.+?)\s*$/i);
    if (delimiterMatch) {
      delimiter = delimiterMatch[1];
      continue;
    }

    buffer += `${line}\n`;
    if (buffer.trimEnd().endsWith(delimiter)) {
      const statement = stripTrailingDelimiter(buffer, delimiter);
      if (statement) statements.push(statement);
      buffer = '';
    }
  }

  const remaining = buffer.trim();
  if (remaining) statements.push(remaining);

  return statements;
}

async function isApplied(connection, version) {
  const [rows] = await connection.query(
    'SELECT 1 FROM schema_migrations WHERE version = ? LIMIT 1',
    [version]
  );
  return rows.length > 0;
}

async function run() {
  const connection = await createConnection();

  try {
    await ensureTrackingTable(connection);

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql') && /^\d+_/.test(file))
      .sort();

    let count = 0;
    for (const file of files) {
      if (await isApplied(connection, file)) continue;

      const absolutePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(absolutePath, 'utf8');
      const checksum = checksumFor(sql);

      console.log(`Applying: ${file}`);
      const statements = splitSqlStatements(sql);
      for (const statement of statements) {
        await connection.query(statement);
      }
      await connection.query(
        'INSERT IGNORE INTO schema_migrations (version, filename, checksum) VALUES (?, ?, ?)',
        [file, file, checksum]
      );
      count += 1;
      console.log('  ✓ Done');
    }

    console.log(`\nTotal new migrations applied: ${count}`);
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error('Migration runner failed:', error.message);
  process.exit(1);
});
