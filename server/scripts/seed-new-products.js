const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const Jimp = require('jimp');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), override: true });

// Configuration for generated AI base images
const BASE_IMAGES = {
  skincare: '/Users/heisenbon/.gemini/antigravity/brain/e923921c-08f9-455c-b529-6ff1c025bf34/base_skincare_1776248489607.png',
  makeup: '/Users/heisenbon/.gemini/antigravity/brain/e923921c-08f9-455c-b529-6ff1c025bf34/base_makeup_1776248505059.png',
  perfume: '/Users/heisenbon/.gemini/antigravity/brain/e923921c-08f9-455c-b529-6ff1c025bf34/base_perfume_1776248542109.png',
  haircare: '/Users/heisenbon/.gemini/antigravity/brain/e923921c-08f9-455c-b529-6ff1c025bf34/base_haircare_1776248566487.png',
  bodycare: '/Users/heisenbon/.gemini/antigravity/brain/e923921c-08f9-455c-b529-6ff1c025bf34/base_bodycare_1776248582558.png',
};

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'products');

const dummyCatalog = [
  // --- SKINCARE ---
  { name: 'Hyalu B5 Serum', brand: 'La Roche-Posay', cat: 12, vol: '30ml', price: 950000, cost: 600000, type: 'Mọi loại da', base: 'skincare' },
  { name: 'Calendula Toner', brand: "Kiehl's", cat: 11, vol: '250ml', price: 1100000, cost: 700000, type: 'Da mụn', base: 'skincare' },
  { name: '2% BHA Liquid', brand: "Paula's Choice", cat: 11, vol: '118ml', price: 820000, cost: 500000, type: 'Da dầu/mụn', base: 'skincare' },
  { name: 'Mineral 89 Serum', brand: 'Vichy', cat: 12, vol: '50ml', price: 980000, cost: 650000, type: 'Da khô', base: 'skincare' },
  { name: 'ProAcne Gel', brand: 'Eucerin', cat: 10, vol: '200ml', price: 490000, cost: 250000, type: 'Da dầu/mụn', base: 'skincare' },
  { name: 'Low pH Clean', brand: 'Cosrx', cat: 10, vol: '150ml', price: 320000, cost: 180000, type: 'Mọi loại da', base: 'skincare' },
  { name: 'Retinol24 Night', brand: 'Olay', cat: 12, vol: '30ml', price: 450000, cost: 280000, type: 'Da lão hóa', base: 'skincare' },
  { name: 'Advanced Lotion', brand: 'Hada Labo', cat: 11, vol: '170ml', price: 280000, cost: 150000, type: 'Da khô', base: 'skincare' },
  { name: 'Treatment Ess.', brand: 'SK-II', cat: 12, vol: '230ml', price: 4500000, cost: 3000000, type: 'Mọi loại da', base: 'skincare' },
  { name: 'Drying Lotion', brand: 'Mario Badescu', cat: 12, vol: '29ml', price: 550000, cost: 320000, type: 'Da mụn', base: 'skincare' },

  // --- MAKEUP ---
  { name: 'Rouge Lipstick', brand: 'Dior', cat: 22, vol: '3.5g', price: 1150000, cost: 700000, type: 'N/A', base: 'makeup' },
  { name: 'Allure Velvet', brand: 'Chanel', cat: 22, vol: '3.5g', price: 1200000, cost: 750000, type: 'N/A', base: 'makeup' },
  { name: 'Pur Couture', brand: 'YSL', cat: 22, vol: '3.8g', price: 1050000, cost: 650000, type: 'N/A', base: 'makeup' },
  { name: 'Pro Foundation', brand: 'Fenty Beauty', cat: 20, vol: '32ml', price: 1250000, cost: 780000, type: 'Mọi loại da', base: 'makeup' },
  { name: 'Light Foundation', brand: 'Nars', cat: 20, vol: '30ml', price: 1400000, cost: 850000, type: 'Da thường/khô', base: 'makeup' },
  { name: 'Matte Rev.', brand: 'Charlotte Til.', cat: 22, vol: '3.5g', price: 950000, cost: 600000, type: 'N/A', base: 'makeup' },
  { name: 'Lip Color Matte', brand: 'Tom Ford', cat: 22, vol: '3g', price: 1450000, cost: 900000, type: 'N/A', base: 'makeup' },
  { name: 'Skin Long-Wear', brand: 'Bobbi Brown', cat: 20, vol: '30ml', price: 1350000, cost: 820000, type: 'Da dầu/hỗn hợp', base: 'makeup' },
  { name: 'Deep Velvet', brand: 'Givenchy', cat: 22, vol: '3.4g', price: 1100000, cost: 680000, type: 'N/A', base: 'makeup' },
  { name: 'Shape Tape', brand: 'Tarte', cat: 27, vol: '10ml', price: 850000, cost: 500000, type: 'Mọi loại da', base: 'makeup' },

  // --- PERFUME ---
  { name: 'Bleu de Chanel', brand: 'Chanel', cat: 31, vol: '100ml', price: 3800000, cost: 2500000, type: 'N/A', base: 'perfume' },
  { name: 'Sauvage EDP', brand: 'Dior', cat: 31, vol: '100ml', price: 3500000, cost: 2200000, type: 'N/A', base: 'perfume' },
  { name: 'Black Orchid', brand: 'Tom Ford', cat: 30, vol: '100ml', price: 4200000, cost: 2800000, type: 'N/A', base: 'perfume' },
  { name: 'English Pear', brand: 'Jo Malone', cat: 30, vol: '100ml', price: 3900000, cost: 2600000, type: 'N/A', base: 'perfume' },
  { name: 'Santal 33', brand: 'Le Labo', cat: 30, vol: '50ml', price: 4800000, cost: 3100000, type: 'N/A', base: 'perfume' },
  { name: 'Gypsy Water', brand: 'Byredo', cat: 30, vol: '50ml', price: 4500000, cost: 2900000, type: 'N/A', base: 'perfume' },
  { name: 'Eros', brand: 'Versace', cat: 31, vol: '100ml', price: 2500000, cost: 1500000, type: 'N/A', base: 'perfume' },
  { name: 'Bloom EDP', brand: 'Gucci', cat: 30, vol: '100ml', price: 3300000, cost: 2100000, type: 'N/A', base: 'perfume' },
  { name: 'Black Opium', brand: 'YSL', cat: 30, vol: '90ml', price: 3400000, cost: 2150000, type: 'N/A', base: 'perfume' },
  { name: 'Aventus', brand: 'Creed', cat: 31, vol: '100ml', price: 7500000, cost: 5000000, type: 'N/A', base: 'perfume' },

  // --- HAIRCARE ---
  { name: 'No.4 Shampoo', brand: 'Olaplex', cat: 40, vol: '250ml', price: 850000, cost: 500000, type: 'N/A', base: 'haircare' },
  { name: 'Elixir Ultime', brand: 'Kerastase', cat: 42, vol: '100ml', price: 1200000, cost: 750000, type: 'N/A', base: 'haircare' },
  { name: 'Treatment Orig.', brand: 'Moroccanoil', cat: 42, vol: '100ml', price: 1100000, cost: 680000, type: 'N/A', base: 'haircare' },
  { name: 'Premium Shampoo', brand: 'Tsubaki', cat: 40, vol: '490ml', price: 250000, cost: 150000, type: 'N/A', base: 'haircare' },
  { name: 'Botanicals', brand: 'Pantene', cat: 40, vol: '385ml', price: 180000, cost: 100000, type: 'N/A', base: 'haircare' },
  { name: 'Keratin Smooth', brand: 'Tresemme', cat: 40, vol: '650ml', price: 290000, cost: 160000, type: 'N/A', base: 'haircare' },
  { name: 'Absolut Repair', brand: 'L\'Oréal Pro', cat: 42, vol: '250ml', price: 450000, cost: 270000, type: 'N/A', base: 'haircare' },
  { name: 'Clinical Strength', brand: 'Head & Shoulders', cat: 40, vol: '400ml', price: 320000, cost: 190000, type: 'N/A', base: 'haircare' },
  { name: 'Rosemary Mint', brand: 'Aveda', cat: 40, vol: '250ml', price: 650000, cost: 390000, type: 'N/A', base: 'haircare' },
  { name: 'Detox Shampoo', brand: 'Ouai', cat: 40, vol: '300ml', price: 890000, cost: 550000, type: 'N/A', base: 'haircare' },

  // --- BODY CARE ---
  { name: 'Cherry Blossom', brand: 'Bath & Body Works', cat: 51, vol: '236ml', price: 350000, cost: 180000, type: 'Mọi loại da', base: 'bodycare' },
  { name: 'Shea Butter', brand: 'The Body Shop', cat: 51, vol: '200ml', price: 590000, cost: 350000, type: 'Da khô', base: 'bodycare' },
  { name: 'Daily Lotion', brand: 'Aveeno', cat: 51, vol: '354ml', price: 380000, cost: 200000, type: 'Mọi loại da', base: 'bodycare' },
  { name: 'Advanced Repair', brand: 'Eucerin', cat: 51, vol: '400ml', price: 450000, cost: 250000, type: 'Da siêu khô', base: 'bodycare' },
  { name: 'Moisturizing', brand: 'Cetaphil', cat: 51, vol: '453g', price: 520000, cost: 290000, type: 'Da nhạy cảm', base: 'bodycare' },
  { name: 'Gluta-Hya Serum', brand: 'Vaseline', cat: 51, vol: '330ml', price: 180000, cost: 950000, type: 'Mọi loại da', base: 'bodycare' },
  { name: 'Cocoa Formula', brand: 'Palmer\'s', cat: 51, vol: '400ml', price: 320000, cost: 180000, type: 'Mọi loại da', base: 'bodycare' },
  { name: 'Almond Oil', brand: 'L\'Occitane', cat: 50, vol: '250ml', price: 790000, cost: 450000, type: 'Mọi loại da', base: 'bodycare' },
  { name: 'Bum Bum Cream', brand: 'Sol de Janeiro', cat: 51, vol: '240ml', price: 1250000, cost: 700000, type: 'Mọi loại da', base: 'bodycare' },
  { name: 'Firming Lotion', brand: 'Nivea', cat: 51, vol: '400ml', price: 210000, cost: 110000, type: 'Mọi loại da', base: 'bodycare' },
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function createOverlayImage(pBaseType, pBrand, pName, outPath) {
  const basePath = BASE_IMAGES[pBaseType];
  if (!fs.existsSync(basePath)) throw new Error(`Base image missing: ${basePath}`);

  const image = await Jimp.read(basePath);
  let fontBrand, fontName;

  // Use black text on the white/bright bases, or white if needed
  if (pBaseType === 'makeup') {
    // Makeup is black tube
    fontBrand = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
    fontName = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  } else {
    fontBrand = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    fontName = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  }

  // Calculate generic position based on image size (approx 1024x1024 usually from AI)
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  // Center horizontally, lower half typically
  const yOffsetBrand = Math.floor(h * 0.6);
  const yOffsetName = Math.floor(h * 0.65);

  image.print(fontBrand, 0, yOffsetBrand, { text: pBrand.toUpperCase(), alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, w, h);
  image.print(fontName, 0, yOffsetName, { text: pName, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, w, h);

  await image.writeAsync(outPath);
}

async function seed() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'julie_cosmetics',
  });

  const conn = await pool.getConnection();

  console.log('--- STARTING GENERATION AND SEEDING (50 PRODUCTS) ---');
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
    let newBrandsCount = 0;
    
    // Default supplier if needed
    const [sups] = await conn.query('SELECT supplier_id FROM suppliers LIMIT 1');
    let supplierId = sups.length > 0 ? sups[0].supplier_id : 1;

    for (let i = 0; i < dummyCatalog.length; i++) {
        const item = dummyCatalog[i];
        const outFileName = slugify(`${item.brand}-${item.name}`) + '.jpg';
        const outPath = path.join(UPLOADS_DIR, outFileName);
        const imageUrlDB = `/uploads/products/${outFileName}`;

        console.log(`[${i+1}/50] Processing: ${item.brand} - ${item.name}`);

        // 1. Generate Image
        if (!fs.existsSync(outPath)) {
            await createOverlayImage(item.base, item.brand, item.name, outPath);
        }

        // 2. Resolve Brand
        let [brands] = await conn.query('SELECT brand_id FROM brands WHERE brand_name = ?', [item.brand]);
        let brandId;
        if (brands.length === 0) {
            newBrandsCount++;
            const [res] = await conn.query('INSERT INTO brands (brand_name) VALUES (?)', [item.brand]);
            brandId = res.insertId;
        } else {
            brandId = brands[0].brand_id;
        }

        // 3. Insert Product
        await conn.query(`
            INSERT INTO products 
            (product_name, brand_id, category_id, description, skin_type, volume, import_price, sell_price, stock_quantity, image_url, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            `${item.brand} ${item.name}`, brandId, item.cat, 
            `Sản phẩm nhập khẩu chính hãng từ thương hiệu ${item.brand}. Dòng mockup cao cấp.`, 
            item.type, item.vol, item.cost, item.price, 30 + Math.floor(Math.random()*50), imageUrlDB
        ]);
    }

    console.log('\\n--- SUMMARY ---');
    console.log(`Total Products Inserted: ${dummyCatalog.length}`);
    console.log(`New Brands Created: ${newBrandsCount}`);
    console.log(`All images successfully generated in: server/uploads/products/`);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

  } catch (err) {
      console.error(err);
  } finally {
      conn.release();
      await pool.end();
  }
}

seed().catch(console.error);
