const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'product_images');

function getRealImages() {
  const allFiles = fs.readdirSync(UPLOADS_DIR);
  let realPool = [];

  for (let file of allFiles) {
    if (!file.endsWith('.jpg') && !file.endsWith('.png')) continue;
    
    const filePath = path.join(UPLOADS_DIR, file);
    const stats = fs.statSync(filePath);
    
    // Ignore garbage/placeholder images based on exact file signatures found earlier
    if (stats.size === 98900) continue; // Cat placeholder
    if (stats.size === 48077) continue; // Ad banner placeholder
    if (stats.size === 41417) continue; // Another repeating
    if (stats.size === 37987) continue; // Another repeating

    realPool.push({
      fileName: file,
      path: `/uploads/product_images/${file}`,
      lowerName: file.toLowerCase()
    });
  }
  return realPool;
}

// Very basic fuzzy scoring
function scoreMatch(prodName, brandName, fileName) {
  let score = 0;
  const terms = (prodName + ' ' + (brandName||'')).toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
  for (let term of terms) {
    if (term.length > 2 && fileName.includes(term)) {
      score++;
    }
  }
  return score;
}

async function run() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3307,
    user: 'julie_app',
    password: 'julie_demo_123',
    database: 'julie_cosmetics',
  });
  const conn = await pool.getConnection();

  console.log('--- MAPPING REAL IMAGES ---');
  let realImages = getRealImages();
  console.log(`Found ${realImages.length} real authentic images in directory.`);

  try {
    // We only touch products that I created recently AND are not Skincare (since Skincare got custom AI ones)
    const [prods] = await conn.query(`
      SELECT p.product_id, p.product_name, b.brand_name, c.category_name 
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id >= 245
      AND c.category_name NOT LIKE '%Skincare%' AND c.category_name NOT LIKE '%Chăm sóc da%'
    `);

    for (let p of prods) {
      // Find best matching image
      let bestMatch = null;
      let highestScore = -1;

      for (let img of realImages) {
        let score = scoreMatch(p.product_name, p.brand_name, img.lowerName);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = img;
        }
      }

      // Fallback: If no good match, just find a random one that is likely in the same category visually
      if (highestScore === 0 || !bestMatch) {
         let fallbackKeywords = [];
         if (p.category_name.toLowerCase().includes('makeup')) fallbackKeywords = ['lip', 'matte', 'foundation', 'concealer', 'cushion', 'mascara', 'tint'];
         if (p.category_name.toLowerCase().includes('perfume')) fallbackKeywords = ['parfum', 'toilette', 'cologne', 'spray', 'oud'];
         if (p.category_name.toLowerCase().includes('hair')) fallbackKeywords = ['shampoo', 'hair', 'oil', 'repair'];
         if (p.category_name.toLowerCase().includes('body')) fallbackKeywords = ['body', 'lotion', 'shower', 'gel', 'cream'];

         let poolChoices = realImages.filter(img => fallbackKeywords.some(kw => img.lowerName.includes(kw)));
         if (poolChoices.length === 0) poolChoices = realImages; // absolute fallback
         bestMatch = poolChoices[Math.floor(Math.random() * poolChoices.length)];
      }

      // Map it and Update DB
      await conn.query('UPDATE products SET image_url = ? WHERE product_id = ?', [
        bestMatch.path,
        p.product_id
      ]);

      console.log(`Updated ID ${p.product_id} (${p.product_name}) => ${bestMatch.fileName} (Score: ${highestScore})`);
    }

    console.log('--- SUCCESSFUL UPDATE ---');

  } catch (err) {
      console.error(err);
  } finally {
      conn.release();
      await pool.end();
  }
}

run().catch(console.error);
