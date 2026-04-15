const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const UPLOADS_DIR = path.join(__dirname, '..');

async function cleanup() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3307,
    user: 'julie_app',
    password: 'julie_demo_123',
    database: 'julie_cosmetics',
  });

  const conn = await pool.getConnection();

  console.log('--- SCANNING FOR JUNK PRODUCTS (Cats & Ads) ---');
  try {
    const [products] = await conn.query('SELECT product_id, product_name, image_url FROM products');
    
    let toDelete = [];
    
    for (const p of products) {
        // Exclude products I just generated (they have /uploads/products/ instead of /uploads/product_images/)
        // Actually my new ones are in /uploads/products/...
        // But let's check anything.
        if (!p.image_url) {
            toDelete.push(p.product_id);
            continue;
        }
        
        if (p.image_url.includes('unsplash.com')) {
            toDelete.push(p.product_id);
            continue;
        }

        // Check local files
        if (p.image_url.startsWith('/uploads/')) {
            const filePath = path.join(UPLOADS_DIR, p.image_url);
            if (!fs.existsSync(filePath)) {
                // toDelete.push(p.product_id); // Might be risky if it's just missing
                continue;
            }
            
            const stats = fs.statSync(filePath);
            
            // 98900 bytes = The Cat Image (Repeated 26 times)
            // 48077 bytes = The Banner Ad Image (Repeated 18 times)
            if (stats.size === 98900 || stats.size === 48077) {
                toDelete.push(p.product_id);
            }
        }
    }
    
    console.log(`Found ${toDelete.length} junk products to delete.`);
    
    if (toDelete.length > 0) {
        // Delete related records in dependent tables first
        // like product_images, product_skin_types, invoice_items, inventory_check_items...
        const ids = toDelete.join(',');
        
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query(`DELETE FROM product_images WHERE product_id IN (${ids})`);
        await conn.query(`DELETE FROM product_skin_types WHERE product_id IN (${ids})`);
        await conn.query(`DELETE FROM invoice_items WHERE product_id IN (${ids})`);
        await conn.query(`DELETE FROM import_receipt_items WHERE product_id IN (${ids})`);
        
        // Final delete
        const [res] = await conn.query(`DELETE FROM products WHERE product_id IN (${ids})`);
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log(`Successfully deleted ${res.affectedRows} junk products!`);
    }

  } catch (err) {
      console.error(err);
  } finally {
      conn.release();
      await pool.end();
  }
}

cleanup().catch(console.error);
