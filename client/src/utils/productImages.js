/**
 * Julie Cosmetics — Product Image Resolution Utility
 * Maps products to AI-generated images by category when no image_url exists.
 */

// Category → image mapping
const CATEGORY_IMAGE_MAP = {
  // Parent categories
  1: '/products/serum-1.jpg',      // Skincare
  2: '/products/makeup-1.jpg',     // Makeup
  3: '/products/perfume-1.jpg',    // Perfume
  4: '/products/haircare-1.jpg',   // Haircare
  5: '/products/body-1.jpg',       // Body Care
  6: '/products/cleanser-1.jpg',   // Men's Care

  // Skincare subcategories
  10: '/products/cleanser-1.jpg',  // Sữa rửa mặt
  11: '/products/toner-1.jpg',     // Toner
  12: '/products/serum-1.jpg',     // Serum & Tinh chất
  13: '/products/cream-1.jpg',     // Kem dưỡng ẩm
  14: '/products/cream-1.jpg',     // Kem chống nắng
  15: '/products/cream-1.jpg',     // Mặt nạ
  16: '/products/cream-1.jpg',     // Kem mắt
  17: '/products/cleanser-1.jpg',  // Tẩy trang

  // Makeup subcategories
  20: '/products/makeup-1.jpg',   // Kem nền
  21: '/products/makeup-1.jpg',   // Phấn
  22: '/products/makeup-1.jpg',   // Son môi
  23: '/products/makeup-1.jpg',   // Mascara
  24: '/products/makeup-1.jpg',   // Kẻ mắt
  25: '/products/makeup-1.jpg',   // Phấn mắt

  // Perfume subcategories
  30: '/products/perfume-1.jpg',
  31: '/products/perfume-1.jpg',

  // Haircare subcategories
  40: '/products/haircare-1.jpg',
  41: '/products/haircare-1.jpg',
  42: '/products/haircare-1.jpg',

  // Body Care subcategories
  50: '/products/body-1.jpg',
  51: '/products/body-1.jpg',
  52: '/products/body-1.jpg',
};

// Alternating serums for variety
const SERUM_VARIANTS = ['/products/serum-1.jpg', '/products/serum-2.jpg'];

/**
 * Get the best image URL for a product.
 * Priority: product.image_url → category mapping → fallback
 */
export function getProductImage(product) {
  // Use the product's own image if it's a valid local path
  if (product.image_url && !product.image_url.includes('placeholder')) {
    return product.image_url;
  }

  const name = (product.product_name || '').toLowerCase();
  const catId = product.category_id;

  // Smart name-based detection (priority: works for both parent + subcategories)
  if (name.includes('serum') || name.includes('tinh chất') || name.includes('ampoule') || name.includes('essence')) {
    return SERUM_VARIANTS[(product.product_id || 0) % 2];
  }
  if (name.includes('cream') || name.includes('kem dưỡng') || name.includes('moisturizer')
      || name.includes('nourishing') || name.includes('lotion face') || name.includes('sleeping mask')
      || name.includes('eye cream') || name.includes('kem mắt') || name.includes('kem chống')) {
    return '/products/cream-1.jpg';
  }
  if (name.includes('toner') || name.includes('nước hoa hồng') || name.includes('water bank')
      || name.includes('hydrating toner') || name.includes('toning') || name.includes('tonic')) {
    return '/products/toner-1.jpg';
  }
  if (name.includes('cleanser') || name.includes('sữa rửa') || name.includes('rửa mặt')
      || name.includes('foaming') || name.includes('cleansing') || name.includes('micellar')
      || name.includes('tẩy trang') || name.includes('makeup remover')) {
    return '/products/cleanser-1.jpg';
  }
  if (name.includes('son') || name.includes('lip') || name.includes('foundation')
      || name.includes('cushion') || name.includes('mascara') || name.includes('phấn')
      || name.includes('eyeliner') || name.includes('eyeshadow') || name.includes('blush')
      || name.includes('highlight') || name.includes('concealer')) {
    return '/products/makeup-1.jpg';
  }
  if (name.includes('shampoo') || name.includes('dầu gội') || name.includes('conditioner')
      || name.includes('dầu xả') || name.includes('hair') || name.includes('tóc')) {
    return '/products/haircare-1.jpg';
  }
  if (name.includes('body') || name.includes('cơ thể') || name.includes('shower')
      || name.includes('sữa tắm') || name.includes('scrub') || name.includes('xà phòng')) {
    return '/products/body-1.jpg';
  }
  if (name.includes('perfume') || name.includes('nước hoa') || name.includes('eau de')
      || name.includes('parfum') || name.includes('cologne')) {
    return '/products/perfume-1.jpg';
  }
  if (name.includes('mask') || name.includes('mặt nạ') || name.includes('sheet mask')
      || name.includes('clay mask') || name.includes('peel')) {
    return '/products/cream-1.jpg';
  }

  // Category-based mapping as secondary fallback
  if (catId) {
    // For Skincare parent, cycle through skincare images based on product_id
    if (catId === 1) {
      const skincareImages = [
        '/products/serum-1.jpg',
        '/products/cream-1.jpg',
        '/products/toner-1.jpg',
        '/products/serum-2.jpg',
        '/products/cleanser-1.jpg',
      ];
      return skincareImages[(product.product_id || 0) % skincareImages.length];
    }
    if (CATEGORY_IMAGE_MAP[catId]) {
      return CATEGORY_IMAGE_MAP[catId];
    }
  }

  // Return serum as ultimate fallback
  return SERUM_VARIANTS[(product.product_id || 0) % 2];
}

/**
 * Category card gradient themes
 */
export const CATEGORY_GRADIENTS = {
  1: 'linear-gradient(135deg, #fdf2f4 0%, #e8c4cc 60%, #c9908a 100%)',  // Skincare - rose
  2: 'linear-gradient(135deg, #fff0f5 0%, #f0c4d4 60%, #c96b8a 100%)',  // Makeup - pink
  3: 'linear-gradient(135deg, #fdf8ee 0%, #e8d5a0 60%, #c9a050 100%)',  // Perfume - gold
  4: 'linear-gradient(135deg, #f0f4f8 0%, #c4d8e8 60%, #6a8fa8 100%)',  // Haircare - blue
  5: 'linear-gradient(135deg, #f4f8f0 0%, #c8dcc0 60%, #6a9870 100%)',  // Body - green
  6: 'linear-gradient(135deg, #f0f2f4 0%, #c4c8d0 60%, #6a7080 100%)',  // Men's - slate
};

export const CATEGORY_EMOJIS = {
  1: '✨', 2: '💄', 3: '🌸', 4: '💆', 5: '🧴', 6: '🧔',
  10: '🫧', 11: '💧', 12: '🧬', 13: '🥛', 14: '☀️',
  15: '🌿', 16: '👁️', 17: '🌊', 20: '✨', 21: '✨',
  22: '💋', 23: '👁️', 24: '👄', 25: '🎨',
};

export function getCategoryGradient(categoryId, categoryName = '') {
  if (CATEGORY_GRADIENTS[categoryId]) return CATEGORY_GRADIENTS[categoryId];
  const name = categoryName.toLowerCase();
  if (name.includes('skin') || name.includes('serum') || name.includes('toner')) {
    return CATEGORY_GRADIENTS[1];
  }
  if (name.includes('makeup') || name.includes('son') || name.includes('phấn')) {
    return CATEGORY_GRADIENTS[2];
  }
  if (name.includes('perfume') || name.includes('hoa')) return CATEGORY_GRADIENTS[3];
  if (name.includes('hair') || name.includes('tóc')) return CATEGORY_GRADIENTS[4];
  if (name.includes('body') || name.includes('cơ thể')) return CATEGORY_GRADIENTS[5];
  return CATEGORY_GRADIENTS[1];
}

export function getCategoryEmoji(categoryId, categoryName = '') {
  if (CATEGORY_EMOJIS[categoryId]) return CATEGORY_EMOJIS[categoryId];
  const name = categoryName.toLowerCase();
  if (name.includes('serum')) return '🧬';
  if (name.includes('kem') || name.includes('cream')) return '🥛';
  if (name.includes('toner')) return '💧';
  if (name.includes('rửa mặt') || name.includes('cleanser')) return '🫧';
  if (name.includes('son') || name.includes('lip')) return '💋';
  if (name.includes('mặt nạ') || name.includes('mask')) return '🌿';
  if (name.includes('nắng') || name.includes('spf')) return '☀️';
  if (name.includes('mắt') || name.includes('eye')) return '👁️';
  if (name.includes('tẩy trang')) return '🌊';
  return '✨';
}
