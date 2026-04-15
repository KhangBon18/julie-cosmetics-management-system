const { pool } = require('./src/config/db');
async function test() {
  const [rows] = await pool.query('SELECT product_id, product_name, image_url, brand_id, category_id FROM products LIMIT 50');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
test();
