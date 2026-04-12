const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), override: true });

// Scraped product data from cosmetics.vn
const products = [
  // ─── NƯỚC HOA (Category: Nước hoa) ───
  { name: 'VALENTINO DONNA BORN IN ROMA Eau de Parfum (Nữ)', brand: 'Valentino', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/valentino-valentino-donna-born-in-roma.jpg', price: 2850000, description: 'Nước hoa nữ cao cấp Valentino Donna Born In Roma - hương hoa cỏ phương Đông quyến rũ' },
  { name: 'ACQUA DI GIÒ PROFUMO Eau de Parfum (Nam)', brand: 'Giorgio Armani', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/armani-acqua-di-gio-homme-profumo-eau-de-toilette-spray.jpg', price: 2650000, description: 'Nước hoa nam Giorgio Armani Acqua Di Gio Profumo - mùi hương biển cả tươi mát' },
  { name: 'COCO MADEMOISELLE Eau de Parfum (Nữ)', brand: 'Chanel', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/chanel-coco-mademoiselle-eau-de-perfume-spray.jpg', price: 3250000, description: 'Nước hoa nữ Chanel Coco Mademoiselle - hương thơm thanh lịch, hiện đại' },
  { name: 'CHLOÉ SIGNATURE Eau de Parfum (Nữ)', brand: 'Chloé', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/chloe-chloe-signature-eau-de-perfume-spray.jpg', price: 2150000, description: 'Nước hoa nữ Chloé Signature - hương hoa hồng tươi mát, nữ tính' },
  { name: 'LIBRE Eau de Parfum (Nữ)', brand: 'Yves Saint Laurent', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/yves-saint-laurent-libre-eau-de-parfum-spray.jpg', price: 2950000, description: 'Nước hoa nữ YSL Libre - sự tự do phóng khoáng, mạnh mẽ' },
  { name: 'CK IN2U HER Eau de Toilette (Nữ)', brand: 'Calvin Klein', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/calvin-klein-ck-in2u-her-eau-de-toilette-spray.jpg', price: 890000, description: 'Nước hoa nữ Calvin Klein CK IN2U - trẻ trung, năng động' },
  { name: 'LA NUIT DE L\'HOMME Eau de Toilette (Nam)', brand: 'Yves Saint Laurent', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/yves-saint-laurent-la-nuit-de-lhomme-eau-de-toilette-spray.jpg', price: 2450000, description: 'Nước hoa nam YSL La Nuit De L\'Homme - bí ẩn, quyến rũ ban đêm' },
  { name: 'ALIEN Refillable Eau de Parfum (Nữ)', brand: 'Thierry Mugler', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/thierry-mugler-alien-eau-de-perfume-spray-refillable.jpg', price: 2750000, description: 'Nước hoa nữ Thierry Mugler Alien - hương gỗ hoa cỏ bí ẩn' },
  { name: 'CABOTINE Eau de Toilette (Nữ)', brand: 'Gres', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/gres-cabotine-eau-de-toilette-spray.jpg', price: 650000, description: 'Nước hoa nữ Gres Cabotine - hương hoa tươi mát, nhẹ nhàng' },
  { name: '1881 POUR FEMME Eau de Toilette (Nữ)', brand: 'Cerruti', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/cerruti-1881-femme-eau-de-toilette-spray.jpg', price: 1250000, description: 'Nước hoa nữ Cerruti 1881 Pour Femme - cổ điển, tinh tế' },
  { name: 'EMPORIO EL Eau de Toilette (Nam)', brand: 'Giorgio Armani', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/armani-emporio-el-eau-de-toilette-spray.jpg', price: 1850000, description: 'Nước hoa nam Giorgio Armani Emporio - lịch lãm, nam tính' },
  { name: 'MY NAME Eau de Parfum (Nữ)', brand: 'Trussardi', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/trussardi-trussardi-my-name-eau-de-perfume-spray.jpg', price: 1450000, description: 'Nước hoa nữ Trussardi My Name - thanh nhã, tinh tế kiểu Ý' },
  { name: 'AIRE DE SEVILLA WHITE MUSK SET (Nữ)', brand: 'Aire Sevilla', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/aire-sevilla-aire-de-sevilla-white-musk-set.jpg', price: 750000, description: 'Set nước hoa nữ Aire De Sevilla White Musk - mùi xạ hương trắng dịu dàng' },
  { name: 'TO BE TATTOO ART Eau de Parfum (Nữ)', brand: 'Police', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/police-489-to-be-tattooart-for-woman-eau-de-parfum-spray.jpg', price: 680000, description: 'Nước hoa nữ Police To Be Tattoo Art - phá cách, cá tính' },
  { name: 'PHANTOM Eau de Toilette (Nam)', brand: 'Paco Rabanne', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/paco-rabanne-phantom-eau-de-toilette-spray.jpg', price: 2350000, description: 'Nước hoa nam Paco Rabanne Phantom - hiện đại, công nghệ' },
  { name: 'INVICTUS Eau de Toilette (Nam)', brand: 'Paco Rabanne', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/paco-rabanne-invictus-eau-de-toilette-spray.jpg', price: 1950000, description: 'Nước hoa nam Paco Rabanne Invictus - chiến thắng, thể thao' },
  { name: 'SAUVAGE Eau de Toilette (Nam)', brand: 'Dior', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/dior-sauvage-eau-de-toilette-spray.jpg', price: 2850000, description: 'Nước hoa nam Dior Sauvage - hoang dã, mạnh mẽ' },
  { name: 'BLEU DE CHANEL Eau de Parfum (Nam)', brand: 'Chanel', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/chanel-bleu-chanel-eau-de-toilette-spray.jpg', price: 3150000, description: 'Nước hoa nam Chanel Bleu - tự do, đẳng cấp' },
  { name: 'ONE MILLION Eau de Toilette (Nam)', brand: 'Paco Rabanne', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/paco-rabanne-one-million-eau-de-toilette-spray.jpg', price: 1850000, description: 'Nước hoa nam One Million - sang trọng, quyến rũ, thành công' },
  { name: 'J\'ADORE Eau de Parfum (Nữ)', brand: 'Dior', category: 'Nước hoa', image: 'https://cdn.cosmetics.vn/nuoc-hoa/dior-jadore-eau-de-perfume-spray.jpg', price: 2950000, description: 'Nước hoa nữ Dior J\'Adore - kinh điển, sang trọng tuyệt đối' },

  // ─── CHĂM SÓC DA (Category: Chăm sóc da) ───
  { name: 'Bộ Kem Guerlain Orchidée Impériale', brand: 'Guerlain', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/guerlain-orchidee-imperiale-set.jpg', price: 18500000, description: 'Bộ kem chăm sóc da cao cấp Guerlain Orchidée Impériale - chống lão hóa, tái tạo da' },
  { name: 'Cure Cellulaire Intensive Valmont TIME MASTER', brand: 'Valmont', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/valmont-time-master-intensive-program.jpg', price: 15200000, description: 'Liệu trình chống lão hóa chuyên sâu Valmont Time Master' },
  { name: 'Sisley LA CURE Chống Lão Hóa Toàn Diện', brand: 'Sisley', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/sisley-la-cure.jpg', price: 12800000, description: 'Liệu trình chống lão hóa toàn diện La Cure của Sisley' },
  { name: 'Tinh Chất Sensai Ultimate', brand: 'Sensai', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/kanebo-sensai-ultimate-the-concentrate.jpg', price: 9950000, description: 'Tinh chất cao cấp Sensai Ultimate The Concentrate' },
  { name: 'Kem dưỡng La Prairie Caviar Trắng', brand: 'La Prairie', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/la-prairie-white-caviar-creme-extraordinaire.jpg', price: 14500000, description: 'Kem dưỡng trắng da cao cấp La Prairie White Caviar Creme Extraordinaire' },
  { name: 'Nâng cơ tinh chất caviar La Prairie', brand: 'La Prairie', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/la-prairie-skin-caviar-liquid-lift.jpg', price: 11800000, description: 'Tinh chất nâng cơ La Prairie Skin Caviar Liquid Lift' },
  { name: 'Sisley Supremya La Nuit Chống Lão Hóa Ban Đêm', brand: 'Sisley', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/sisley-supremya-la-nuit-anti-age.jpg', price: 8900000, description: 'Kem dưỡng da ban đêm chống lão hóa Sisley Supremya' },
  { name: 'Kem mắt La Prairie PURE GOLD', brand: 'La Prairie', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/la-prairie-pure-gold-radiance-eye-cream.jpg', price: 7500000, description: 'Kem mắt vàng ròng La Prairie Pure Gold Radiance Eye Cream' },
  { name: 'Tinh Chất Trắng Ngọc Trai La Prairie WHITE CAVIAR', brand: 'La Prairie', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/la-prairie-white-caviar-illuminating-pearl-infusion.jpg', price: 13200000, description: 'Tinh chất trắng ngọc trai La Prairie White Caviar Illuminating' },
  { name: 'Stendhal PUR LUXE Liệu Trình Thần Thánh', brand: 'Stendhal', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/stendhal-pur-luxe-la-cure-divine.jpg', price: 6800000, description: 'Liệu trình chống lão hóa cao cấp Stendhal Pur Luxe La Cure Divine' },
  { name: 'Mặt nạ thải độc than hoạt tính 7th Heaven', brand: '7th Heaven', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/7th-heaven-peel-off-charcoal-black-sugar-mask.jpg', price: 65000, description: 'Mặt nạ lột thải độc than hoạt tính và đường đen 7th Heaven' },
  { name: 'Kem PURE RETINOL La Cabine', brand: 'La Cabine', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/la-cabine-pure-retinol-cream.jpg', price: 420000, description: 'Kem chống lão hóa & điều trị chống nhăn Pure Retinol La Cabine' },
  { name: 'Germinal Ampoules Chống Lão Hóa Da Khô', brand: 'Germinal', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/germinal-accion-profunda-antiaging-pieles-secas-ampollas.jpg', price: 380000, description: 'Ampoules chống lão hóa cho da khô Germinal Accion Profunda' },
  { name: 'Tẩy trang Sensibio H2O Bioderma', brand: 'Bioderma', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/bioderma-sensibio-h2o-solution-micellaire-demaquillante.jpg', price: 385000, description: 'Nước tẩy trang Bioderma Sensibio H2O cho da nhạy cảm' },
  { name: 'Serum Vitamin C La Roche-Posay', brand: 'La Roche-Posay', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/la-roche-posay-pure-vitamin-c-serum.jpg', price: 950000, description: 'Serum Vitamin C nguyên chất chống oxy hóa La Roche-Posay' },
  { name: 'Kem chống nắng Vichy Capital Soleil', brand: 'Vichy', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/vichy-capital-soleil-dry-touch-spf50.jpg', price: 520000, description: 'Kem chống nắng không nhờn rít Vichy Capital Soleil SPF50' },
  { name: 'Kem dưỡng ẩm Cetaphil', brand: 'Cetaphil', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/cetaphil-moisturizing-cream.jpg', price: 295000, description: 'Kem dưỡng ẩm toàn thân Cetaphil cho da nhạy cảm' },
  { name: 'Sữa rửa mặt CeraVe Foaming', brand: 'CeraVe', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/cerave-foaming-facial-cleanser.jpg', price: 350000, description: 'Sữa rửa mặt tạo bọt CeraVe cho da dầu, da thường' },
  { name: 'Kem dưỡng Eucerin AQUAporin', brand: 'Eucerin', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/eucerin-aquaporin-active-moisturizing-cream.jpg', price: 480000, description: 'Kem dưỡng ẩm chuyên sâu Eucerin AQUAporin Active cho da khô' },
  { name: 'Mặt nạ ngủ Laneige Water Sleeping Mask', brand: 'Laneige', category: 'Chăm sóc da', image: 'https://cdn.cosmetics.vn/cham-soc-da/laneige-water-sleeping-mask.jpg', price: 650000, description: 'Mặt nạ ngủ cấp ẩm Laneige Water Sleeping Mask' }
];

async function importProducts() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'julie_cosmetics',
    charset: 'utf8mb4'
  });

  try {
    // Clear existing product data
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DELETE FROM invoice_items');
    await pool.query('DELETE FROM import_receipt_items');
    await pool.query('DELETE FROM reviews');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM brands');
    await pool.query('DELETE FROM categories');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Cleared old product data');

    // Auto-reset IDs
    await pool.query('ALTER TABLE products AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE brands AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE categories AUTO_INCREMENT = 1');

    // Extract unique brands and categories
    const brandSet = [...new Set(products.map(p => p.brand))];
    const categorySet = [...new Set(products.map(p => p.category))];

    // Insert categories
    const categoryMap = {};
    for (const cat of categorySet) {
      const [result] = await pool.query('INSERT INTO categories (category_name, description) VALUES (?, ?)', [cat, `Sản phẩm ${cat} chính hãng`]);
      categoryMap[cat] = result.insertId;
      console.log(`📂 Category: ${cat} (ID: ${result.insertId})`);
    }

    // Insert brands
    const brandMap = {};
    for (const brand of brandSet) {
      const [result] = await pool.query('INSERT INTO brands (brand_name, origin_country, description) VALUES (?, ?, ?)', [brand, 'Quốc tế', `Thương hiệu ${brand} chính hãng`]);
      brandMap[brand] = result.insertId;
      console.log(`🏷️  Brand: ${brand} (ID: ${result.insertId})`);
    }

    // Insert products
    let count = 0;
    for (const p of products) {
      const importPrice = Math.round(p.price * 0.6); // 60% as import price
      const stock = Math.floor(Math.random() * 50) + 10; // 10-60 units

      await pool.query(
        `INSERT INTO products (product_name, brand_id, category_id, description, sell_price, import_price, stock_quantity, image_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [p.name, brandMap[p.brand], categoryMap[p.category], p.description, p.price, importPrice, stock, p.image]
      );
      count++;
    }

    console.log(`\n✅ Imported ${count} products from cosmetics.vn`);
    console.log(`   Categories: ${categorySet.length}`);
    console.log(`   Brands: ${brandSet.length}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

importProducts();
