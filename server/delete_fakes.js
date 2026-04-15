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
  
  const [result] = await pool.query(
    "DELETE FROM products WHERE product_name LIKE 'Phấn Trang Điểm Makeup Pro %' OR product_name LIKE 'Dầu Gội Phục Hồi Hair Care Elite %' OR product_name LIKE 'Dưỡng Thể Body Care Premium %' OR product_name LIKE 'Nước Hoa Cao Cấp Perfume Aura %'"
  );
  console.log(`Deleted ${result.affectedRows} fake products.`);
  
  const [counts] = await pool.query(`
    SELECT c.category_id, c.category_name, COUNT(p.product_id) as count
    FROM categories c LEFT JOIN products p ON c.category_id = p.category_id
    GROUP BY c.category_id
  `);
  console.log("Current counts:");
  console.table(counts);
  process.exit(0);
}
run();
