#!/usr/bin/env node
/**
 * Julie Cosmetics — Update product image_url by category
 * Run: node server/scripts/update-product-images.js
 * Or: docker exec julie_server node scripts/update-product-images.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const CATEGORY_IMAGES = {
  // Parent categories
  1: '/products/serum-1.jpg',
  2: '/products/makeup-1.jpg',
  3: '/products/perfume-1.jpg',
  4: '/products/haircare-1.jpg',
  5: '/products/body-1.jpg',
  6: '/products/cleanser-1.jpg',

  // Skincare subcategories
  10: '/products/cleanser-1.jpg',
  11: '/products/toner-1.jpg',
  12: '/products/serum-1.jpg',
  13: '/products/cream-1.jpg',
  14: '/products/cream-1.jpg',
  15: '/products/cream-1.jpg',
  16: '/products/cream-1.jpg',
  17: '/products/cleanser-1.jpg',

  // Makeup subcategories
  20: '/products/makeup-1.jpg',
  21: '/products/makeup-1.jpg',
  22: '/products/makeup-1.jpg',
  23: '/products/makeup-1.jpg',
  24: '/products/makeup-1.jpg',
  25: '/products/makeup-1.jpg',

  // Perfume subcategories
  30: '/products/perfume-1.jpg',
  31: '/products/perfume-1.jpg',

  // Haircare subcategories
  40: '/products/haircare-1.jpg',
  41: '/products/haircare-1.jpg',
  42: '/products/haircare-1.jpg',

  // Body Care
  50: '/products/body-1.jpg',
  51: '/products/body-1.jpg',
  52: '/products/body-1.jpg',
};

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'julie_app',
    password: process.env.DB_PASSWORD || 'julie_demo_123',
    database: process.env.DB_NAME || 'julie_cosmetics',
    charset: 'utf8mb4_unicode_ci',
    waitForConnections: true,
  });

  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ Connected to database');

    let updated = 0;
    for (const [catId, imgUrl] of Object.entries(CATEGORY_IMAGES)) {
      // Only update products with NULL image or old placeholder images
      const [result] = await conn.query(
        `UPDATE products 
         SET image_url = ? 
         WHERE category_id = ? 
           AND (image_url IS NULL 
             OR image_url LIKE '%placeholder%' 
             OR image_url LIKE '%via.placeholder%'
             OR image_url LIKE '%product_images%')`,
        [imgUrl, catId]
      );
      if (result.affectedRows > 0) {
        console.log(`  Category ${catId}: updated ${result.affectedRows} products → ${imgUrl}`);
        updated += result.affectedRows;
      }
    }

    // Alternate serum images for category 12 for variety
    await conn.query(`
      UPDATE products p
      JOIN (
        SELECT product_id, ROW_NUMBER() OVER (ORDER BY product_id) AS rn
        FROM products WHERE category_id = 12
      ) AS ranked ON p.product_id = ranked.product_id
      SET p.image_url = CASE WHEN ranked.rn % 2 = 0 THEN '/products/serum-2.jpg' ELSE '/products/serum-1.jpg' END
      WHERE p.category_id = 12
    `);
    console.log('  Alternated serum-1 / serum-2 for category 12');

    // Fallback: any remaining NULL
    const [fallback] = await conn.query(
      `UPDATE products SET image_url = '/products/serum-1.jpg' WHERE image_url IS NULL`
    );
    if (fallback.affectedRows > 0) {
      console.log(`  Fallback: updated ${fallback.affectedRows} products with no category match`);
      updated += fallback.affectedRows;
    }

    const [[{ total, withImage }]] = await conn.query(`
      SELECT COUNT(*) as total, SUM(CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END) as withImage
      FROM products
    `);
    console.log(`\n✨ Done! ${updated} products updated. ${withImage}/${total} have images.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

run();
