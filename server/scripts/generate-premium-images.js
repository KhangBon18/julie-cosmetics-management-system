const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { createCanvas, loadImage } = require('canvas');

const BRAIN_DIR = '/Users/heisenbon/.gemini/antigravity/brain/e923921c-08f9-455c-b529-6ff1c025bf34';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'products');

// Create uploads directory if not exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Map logical names to real files in the brain folder
function findBrainFile(prefix) {
  const files = fs.readdirSync(BRAIN_DIR);
  const found = files.find(f => f.startsWith(prefix) && f.endsWith('.png'));
  return found ? path.join(BRAIN_DIR, found) : null;
}

// 1. Array of the 10 Skincare images
const premiumSkincareImages = [
  'p1_la_roche_posay', 'p2_kiehls', 'p3_paulas_choice', 'p4_vichy', 'p5_eucerin',
  'p6_cosrx', 'p7_olay', 'p8_hada_labo', 'p9_skii', 'p10_mario_badescu'
];

async function generatePremiumImages() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3307,
    user: 'julie_app',
    password: 'julie_demo_123',
    database: 'julie_cosmetics',
  });
  
  const conn = await pool.getConnection();

  console.log('--- STARTING PREMIUM UPGRADE ---');

  try {
    // 1. Process Skincare
    console.log('Processing 10 AI Custom Skincare Images...');
    // We get the 10 skincare products I recently inserted (ID 245 onwards roughly)
    const [skincareProds] = await conn.query(`
      SELECT p.product_id, p.product_name 
      FROM products p JOIN categories c ON p.category_id = c.category_id 
      WHERE (c.category_name LIKE '%Skincare%' OR c.category_name LIKE '%Chăm sóc da%')
      AND p.product_id >= 245
      ORDER BY p.product_id DESC LIMIT 10
    `);

    for (let i = 0; i < skincareProds.length; i++) {
        if (i < premiumSkincareImages.length) {
            const brainFile = findBrainFile(premiumSkincareImages[i]);
            if (brainFile) {
                const newFileName = `premium_${skincareProds[i].product_id}_${Date.now()}.png`;
                const newPath = path.join(UPLOADS_DIR, newFileName);
                fs.copyFileSync(brainFile, newPath);
                
                await conn.query('UPDATE products SET image_url = ? WHERE product_id = ?', [
                    `/uploads/products/${newFileName}`,
                    skincareProds[i].product_id
                ]);
                console.log(`✅ Skincare (Custom AI) - upgraded ${skincareProds[i].product_name}`);
            }
        }
    }

    // 2. Process other categories with Canvas
    console.log('Processing Remaining Categories with Premium Canvas Rendering...');
    
    // Find the base images
    const baseMakeupPath = findBrainFile('base_makeup');
    const basePerfumePath = findBrainFile('base_perfume');
    const baseHaircarePath = findBrainFile('base_haircare');
    const baseBodycarePath = findBrainFile('base_bodycare');

    const [otherProds] = await conn.query(`
      SELECT p.product_id, p.product_name, c.category_name, b.brand_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.category_id 
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      WHERE c.category_name NOT LIKE '%Skincare%' AND c.category_name NOT LIKE '%Chăm sóc da%'
      AND p.product_id >= 245 -- Only process the newly seeded dummy products
    `);

    for (let p of otherProds) {
        let basePath;
        let color = '#000000';
        let xOffset = 0, yOffset = 0;
        let textAlign = 'center';
        let brandFont = 'bold 32px "Georgia"';
        let nameFont = '20px "Arial"';

        if (p.category_name.toLowerCase().includes('make')) {
            basePath = baseMakeupPath;
            // Black lipstick tube, gold text
            color = 'rgba(212, 175, 55, 0.9)'; // Gold
            xOffset = 512;
            yOffset = 550;
            brandFont = 'italic bold 36px "Times New Roman"';
            nameFont = '22px "Arial"';
        } else if (p.category_name.toLowerCase().includes('perfume')) {
            basePath = basePerfumePath;
            // Clear glass bottle, minimalist black text
            color = 'rgba(20, 20, 20, 0.85)';
            xOffset = 512;
            yOffset = 450;
            brandFont = 'bold 44px "Georgia"';
            nameFont = '24px "Georgia"';
        } else if (p.category_name.toLowerCase().includes('hair')) {
            basePath = baseHaircarePath;
            // White pump bottle, bold modern typography
            color = 'rgba(30, 30, 30, 0.9)';
            xOffset = 512;
            yOffset = 600;
            brandFont = 'bold 40px "Helvetica Neue", "Helvetica", sans-serif';
            nameFont = '22px "Helvetica Neue", "Helvetica", sans-serif';
        } else {
            basePath = baseBodycarePath;
            // White cream jar, classic serif
            color = 'rgba(50, 50, 50, 0.85)';
            xOffset = 512;
            yOffset = 550;
            brandFont = 'bold 42px "Times New Roman"';
            nameFont = '24px "Times New Roman"';
        }

        if (basePath) {
            const baseImage = await loadImage(basePath);
            const canvas = createCanvas(baseImage.width, baseImage.height);
            const ctx = canvas.getContext('2d');

            // Draw base
            ctx.drawImage(baseImage, 0, 0);

            // Set blend mode for realism (Multiply makes text sink into the object's shadows)
            if (color === '#000000' || color.startsWith('rgba(20') || color.startsWith('rgba(30')) {
                ctx.globalCompositeOperation = 'multiply';
            }

            // Draw Brand Name
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            
            let brandText = p.brand_name ? p.brand_name.toUpperCase() : 'JULIE';
            brandText = brandText.split('').join(' '); // Add tracking/letter-spacing manually
            ctx.font = brandFont;
            ctx.globalAlpha = 0.9;
            ctx.fillText(brandText, xOffset, yOffset);

            // Draw Product Name
            ctx.globalAlpha = 0.7; // Softer product name
            ctx.font = nameFont;
            
            // Wrap text if too long
            const maxW = 350;
            let words = p.product_name.split(' ');
            let line = '';
            let currentY = yOffset + 40;
            
            for(let n = 0; n < words.length; n++) {
              let testLine = line + words[n] + ' ';
              let metrics = ctx.measureText(testLine);
              let testWidth = metrics.width;
              if (testWidth > maxW && n > 0) {
                ctx.fillText(line, xOffset, currentY);
                line = words[n] + ' ';
                currentY += 30; // line height
              }
              else {
                line = testLine;
              }
            }
            ctx.fillText(line, xOffset, currentY);

            // Save to disk
            const outName = `premium_${p.product_id}_${Date.now()}.png`;
            const outPath = path.join(UPLOADS_DIR, outName);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outPath, buffer);

            // Update DB
            await conn.query('UPDATE products SET image_url = ? WHERE product_id = ?', [
                `/uploads/products/${outName}`,
                p.product_id
            ]);
            console.log(`✅ Canvas Rendered - upgraded ${p.product_name}`);
        }
    }

    console.log('--- ALL PREMIUM UPGRADES COMPLETE! ---');
  } catch (err) {
      console.error(err);
  } finally {
      conn.release();
      await pool.end();
  }
}

generatePremiumImages().catch(console.error);
