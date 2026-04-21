-- ============================================================
-- Julie Cosmetics — Update Product Images by Category
-- Run this after seed_catalog.sql to assign beautiful images
-- ============================================================

-- Serum & Tinh chất (category_id = 12)
UPDATE products SET image_url = '/products/serum-1.jpg'
WHERE category_id = 12 AND (image_url IS NULL OR image_url LIKE '%placeholder%' OR image_url LIKE '%via.placeholder%');

-- Override some to serum-2 for variety
UPDATE products SET image_url = '/products/serum-2.jpg'
WHERE category_id = 12 AND product_id IN (
  SELECT product_id FROM (
    SELECT product_id FROM products WHERE category_id = 12 ORDER BY product_id DESC LIMIT 5
  ) AS sub
);

-- Kem dưỡng ẩm (category_id = 13)
UPDATE products SET image_url = '/products/cream-1.jpg'
WHERE category_id = 13 AND (image_url IS NULL OR image_url LIKE '%placeholder%' OR image_url LIKE '%via.placeholder%');

-- Toner (category_id = 11)
UPDATE products SET image_url = '/products/toner-1.jpg'
WHERE category_id = 11 AND (image_url IS NULL OR image_url LIKE '%placeholder%' OR image_url LIKE '%via.placeholder%');

-- Sữa rửa mặt / Tẩy trang (category_id = 10, 17)
UPDATE products SET image_url = '/products/cleanser-1.jpg'
WHERE category_id IN (10, 17) AND (image_url IS NULL OR image_url LIKE '%placeholder%' OR image_url LIKE '%via.placeholder%');

-- Makeup (category_id = 2, 20, 21, 22, 23, 24, 25)
UPDATE products SET image_url = '/products/makeup-1.jpg'
WHERE category_id IN (2, 20, 21, 22, 23, 24, 25) AND (image_url IS NULL OR image_url LIKE '%placeholder%' OR image_url LIKE '%via.placeholder%');

-- Haircare (category_id = 4, 40, 41, 42)
UPDATE products SET image_url = '/products/haircare-1.jpg'
WHERE category_id IN (4, 40, 41, 42) AND (image_url IS NULL OR image_url LIKE '%placeholder%' OR image_url LIKE '%via.placeholder%');

-- Body Care (category_id = 5, 50, 51, 52)
UPDATE products SET image_url = '/products/body-1.jpg'
WHERE category_id IN (5, 50, 51, 52) AND (image_url IS NULL OR image_url LIKE '%placeholder%' OR image_url LIKE '%via.placeholder%');

-- Perfume (category_id = 3, 30, 31)
UPDATE products SET image_url = '/products/perfume-1.jpg'
WHERE category_id IN (3, 30, 31) AND (image_url IS NULL OR image_url LIKE '%placeholder%' OR image_url LIKE '%via.placeholder%');

-- Kem chống nắng / Mặt nạ / Kem mắt — use cream fallback
UPDATE products SET image_url = '/products/cream-1.jpg'
WHERE category_id IN (14, 15, 16) AND (image_url IS NULL OR image_url LIKE '%placeholder%' OR image_url LIKE '%via.placeholder%');

-- Men's Care (category_id = 6)
UPDATE products SET image_url = '/products/cleanser-1.jpg'
WHERE category_id = 6 AND (image_url IS NULL OR image_url LIKE '%placeholder%' OR image_url LIKE '%via.placeholder%');

-- Catch-all: any remaining NULL images → serum-1
UPDATE products SET image_url = '/products/serum-1.jpg'
WHERE image_url IS NULL;

SELECT COUNT(*) as total_products,
       SUM(CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END) as with_image
FROM products;
