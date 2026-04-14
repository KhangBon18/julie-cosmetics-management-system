const router = require('express').Router();
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const Invoice = require('../models/invoiceModel');
const { body, validationResult } = require('express-validator');
const {
  SALES_ANALYTICS_INVOICE_STATUSES,
  COMPLETED_RETURN_INVOICE_AGGREGATE_SQL,
  COMPLETED_RETURN_ITEM_AGGREGATE_SQL,
  buildPlaceholders,
  buildReturnedQuantitySql
} = require('../utils/salesAnalyticsRules');

const normalizeCartItems = (items = []) => {
  const merged = new Map();
  for (const item of items) {
    const productId = Number(item?.product_id);
    const quantity = Number(item?.quantity);
    if (!productId || quantity <= 0) continue;
    const existing = merged.get(productId);
    merged.set(productId, {
      product_id: productId,
      quantity: (existing?.quantity || 0) + quantity
    });
  }
  return Array.from(merged.values());
};

const resolveCartSnapshot = async (items = []) => {
  const normalizedItems = normalizeCartItems(items);
  if (!normalizedItems.length) {
    return {
      items: [],
      issues: [{ type: 'empty_cart', message: 'Giỏ hàng không có sản phẩm hợp lệ' }],
      summary: { item_count: 0, cart_total: 0, changed: true }
    };
  }

  const products = await Product.findByIds(normalizedItems.map(item => item.product_id));
  const productMap = new Map(products.map(product => [Number(product.product_id), product]));
  const resolvedItems = [];
  const issues = [];

  for (const item of normalizedItems) {
    const product = productMap.get(item.product_id);

    if (!product || product.deleted_at) {
      issues.push({
        type: 'removed',
        product_id: item.product_id,
        requested_quantity: item.quantity,
        message: `Sản phẩm ID ${item.product_id} không còn tồn tại trong hệ thống`
      });
      continue;
    }

    if (!product.is_active) {
      issues.push({
        type: 'inactive',
        product_id: product.product_id,
        product_name: product.product_name,
        requested_quantity: item.quantity,
        message: `Sản phẩm "${product.product_name}" đã ngừng kinh doanh và được loại khỏi giỏ`
      });
      continue;
    }

    if (Number(product.stock_quantity) <= 0) {
      issues.push({
        type: 'out_of_stock',
        product_id: product.product_id,
        product_name: product.product_name,
        requested_quantity: item.quantity,
        available_quantity: 0,
        message: `Sản phẩm "${product.product_name}" đã hết hàng và được loại khỏi giỏ`
      });
      continue;
    }

    const adjustedQuantity = Math.min(item.quantity, Number(product.stock_quantity));
    if (adjustedQuantity !== item.quantity) {
      issues.push({
        type: 'quantity_adjusted',
        product_id: product.product_id,
        product_name: product.product_name,
        requested_quantity: item.quantity,
        available_quantity: adjustedQuantity,
        message: `Sản phẩm "${product.product_name}" chỉ còn ${adjustedQuantity} trong kho. Giỏ hàng đã được cập nhật.`
      });
    }

    resolvedItems.push({
      product_id: product.product_id,
      product_name: product.product_name,
      brand_name: product.brand_name,
      image_url: product.image_url,
      sell_price: Number(product.sell_price),
      stock_quantity: Number(product.stock_quantity),
      is_active: Number(product.is_active),
      quantity: adjustedQuantity
    });
  }

  return {
    items: resolvedItems,
    issues,
    summary: {
      item_count: resolvedItems.reduce((sum, item) => sum + item.quantity, 0),
      cart_total: resolvedItems.reduce((sum, item) => sum + item.sell_price * item.quantity, 0),
      changed: issues.length > 0
    }
  };
};

// Public product listings (no auth needed)
router.get('/products', async (req, res, next) => {
  try {
    const { page, limit, category_id, brand_id, search, sort, min_price, max_price } = req.query;
    const result = await Product.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      category_id, brand_id, search, sort,
      min_price: min_price ? parseFloat(min_price) : undefined,
      max_price: max_price ? parseFloat(max_price) : undefined,
      is_public: true
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (error) { next(error); }
});

router.get('/categories', async (req, res, next) => {
  try { res.json(await Category.findAll()); } catch (error) { next(error); }
});

router.get('/brands', async (req, res, next) => {
  try { res.json(await Brand.findAll()); } catch (error) { next(error); }
});

// Categories tree with subcategories and counts
router.get('/categories-tree', async (req, res, next) => {
  try { res.json(await Category.findTree()); } catch (error) { next(error); }
});

// Featured / Best sellers — top products by invoice sales
router.get('/featured', async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    const limit = parseInt(req.query.limit) || 8;
    const invoiceStatusPlaceholders = buildPlaceholders(SALES_ANALYTICS_INVOICE_STATUSES);
    const returnedQuantitySql = buildReturnedQuantitySql({
      invoiceAlias: 'i',
      itemAlias: 'ii',
      invoiceReturnsAlias: 'invoice_returns',
      itemReturnsAlias: 'item_returns'
    });
    const [rows] = await pool.query(
      `SELECT p.product_id, p.product_name, p.sell_price, p.import_price, p.stock_quantity,
              p.image_url, p.volume, p.skin_type, p.is_active, p.created_at,
              b.brand_name, c.category_name,
              COALESCE(s.total_sold, 0) as total_sold,
              COALESCE(rv.avg_rating, 0) as avg_rating,
              COALESCE(rv.review_count, 0) as review_count
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.brand_id
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN (
         SELECT
           ii.product_id,
           SUM(GREATEST(0, ii.quantity - ${returnedQuantitySql})) as total_sold
         FROM invoice_items ii
         JOIN invoices i ON ii.invoice_id = i.invoice_id
         LEFT JOIN (${COMPLETED_RETURN_INVOICE_AGGREGATE_SQL}) invoice_returns
           ON invoice_returns.invoice_id = i.invoice_id
         LEFT JOIN (${COMPLETED_RETURN_ITEM_AGGREGATE_SQL}) item_returns
           ON item_returns.invoice_id = i.invoice_id
          AND item_returns.product_id = ii.product_id
         WHERE i.status IN (${invoiceStatusPlaceholders})
         GROUP BY ii.product_id
       ) s ON p.product_id = s.product_id
       LEFT JOIN (
         SELECT product_id, AVG(rating) as avg_rating, COUNT(*) as review_count
         FROM reviews
         WHERE is_visible = 1
         GROUP BY product_id
       ) rv ON p.product_id = rv.product_id
       WHERE p.is_active = 1
       ORDER BY total_sold DESC, avg_rating DESC
       LIMIT ?`,
      [...SALES_ANALYTICS_INVOICE_STATUSES, limit]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

// New arrivals — products created in last 30 days
router.get('/new-arrivals', async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    const limit = parseInt(req.query.limit) || 8;
    const [rows] = await pool.query(
      `SELECT p.product_id, p.product_name, p.sell_price, p.import_price, p.stock_quantity,
              p.image_url, p.volume, p.skin_type, p.is_active, p.created_at,
              b.brand_name, c.category_name,
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(DISTINCT r.review_id) as review_count
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.brand_id
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN reviews r ON p.product_id = r.product_id AND r.is_visible = 1
       WHERE p.is_active = 1 AND p.created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
       GROUP BY p.product_id
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

// Related products — same category, excluding current product
router.get('/products/:id/related', async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    const limit = parseInt(req.query.limit) || 4;
    const productId = req.params.id;
    // Get the product's category
    const [current] = await pool.query('SELECT category_id FROM products WHERE product_id = ?', [productId]);
    if (!current.length) return res.json([]);
    const [rows] = await pool.query(
      `SELECT p.product_id, p.product_name, p.sell_price, p.import_price, p.stock_quantity,
              p.image_url, p.volume, p.skin_type, p.is_active, p.created_at,
              b.brand_name, c.category_name,
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(DISTINCT r.review_id) as review_count
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.brand_id
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN reviews r ON p.product_id = r.product_id AND r.is_visible = 1
       WHERE p.is_active = 1 AND p.category_id = ? AND p.product_id != ?
       GROUP BY p.product_id
       ORDER BY RAND()
       LIMIT ?`,
      [current[0].category_id, productId, limit]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/cart/validate', async (req, res, next) => {
  try {
    const snapshot = await resolveCartSnapshot(req.body?.items || []);
    res.json(snapshot);
  } catch (error) { next(error); }
});

// Public checkout — guest order (no auth needed)
const validateCheckout = [
  body('items').isArray({ min: 1 }).withMessage('Đơn hàng phải có ít nhất 1 sản phẩm'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('product_id không hợp lệ'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải >= 1'),
  body('customer_name').trim().notEmpty().withMessage('Họ tên là bắt buộc'),
  body('customer_phone').trim().notEmpty().withMessage('Số điện thoại là bắt buộc'),
  body('payment_method').isIn(['cash', 'transfer', 'cod']).withMessage('Phương thức thanh toán không hợp lệ')
];

router.post('/checkout', validateCheckout, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: errors.array() });
    }

    const { items, customer_name, customer_phone, customer_email, shipping_address, payment_method, note, promotion_code } = req.body;
    const cartSnapshot = await resolveCartSnapshot(items);

    if (!cartSnapshot.items.length) {
      return res.status(400).json({
        message: cartSnapshot.issues[0]?.message || 'Giỏ hàng không còn sản phẩm hợp lệ',
        cart_snapshot: cartSnapshot
      });
    }

    if (cartSnapshot.summary.changed) {
      return res.status(409).json({
        message: 'Giỏ hàng đã thay đổi do tồn kho hoặc trạng thái sản phẩm. Vui lòng kiểm tra lại trước khi đặt hàng.',
        cart_snapshot: cartSnapshot
      });
    }

    // Validate promotion code if provided
    let promotionId = null;
    if (promotion_code) {
      const Promotion = require('../models/promotionModel');
      const promo = await Promotion.findByCode(promotion_code);
      if (promo) {
        promotionId = promo.promotion_id;
      }
    }

    // Build invoice items with server-side price lookup
    const invoiceItems = cartSnapshot.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.sell_price
    }));

    // Create invoice via existing model (handles transactions, stock, CRM, payment)
    const invoiceId = await Invoice.create({
      customer_id: null,
      created_by: null,
      payment_method: payment_method === 'cod' ? 'cash' : payment_method,
      promotion_id: promotionId,
      note: `[Online] ${customer_name} - ${customer_phone}${customer_email ? ' - ' + customer_email : ''}${note ? '\nGhi chú: ' + note : ''}`,
      items: invoiceItems
    });

    // Auto-create shipping order for online purchases
    if (shipping_address) {
      const Shipping = require('../models/shippingModel');
      await Shipping.create({
        invoice_id: invoiceId,
        recipient_name: customer_name,
        recipient_phone: customer_phone,
        shipping_address,
        shipping_fee: 0,
        note: customer_email ? `Email: ${customer_email}` : null
      });
    }

    const invoice = await Invoice.findById(invoiceId);

    res.status(201).json({
      message: 'Đặt hàng thành công!',
      order: {
        order_id: invoiceId,
        total: invoice.final_total,
        discount: invoice.discount_amount,
        items_count: invoiceItems.length,
        payment_method,
        promotion_applied: !!promotionId,
        has_shipping: !!shipping_address,
        created_at: invoice.created_at
      }
    });
  } catch (error) { next(error); }
});
// Public reviews for a product (visible only)
router.get('/products/:id/reviews', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const productId = req.params.id;
    const { pool } = require('../config/db');

    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 10;
    const offset = (p - 1) * l;

    const [reviews] = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at, c.full_name as customer_name
       FROM reviews r
       LEFT JOIN customers c ON r.customer_id = c.customer_id
       WHERE r.product_id = ? AND r.is_visible = 1
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [productId, l, offset]
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND is_visible = 1',
      [productId]
    );

    res.json({
      reviews,
      total: countResult[0].total,
      avg_rating: Math.round((countResult[0].avg_rating || 0) * 10) / 10,
      page: p,
      totalPages: Math.ceil(countResult[0].total / l)
    });
  } catch (error) { next(error); }
});

// Public settings (store info, etc.)
router.get('/settings', async (req, res, next) => {
  try {
    const Setting = require('../models/settingModel');
    const settings = await Setting.findPublic();
    res.json(settings);
  } catch (error) { next(error); }
});

// Validate promotion code (for checkout)
router.post('/promotions/validate', async (req, res, next) => {
  try {
    const promotionController = require('../controllers/promotionController');
    return promotionController.validateCode(req, res);
  } catch (error) { next(error); }
});

// Product images gallery
router.get('/products/:id/images', async (req, res, next) => {
  try {
    const ProductImage = require('../models/productImageModel');
    const images = await ProductImage.findByProduct(req.params.id);
    res.json(images);
  } catch (error) { next(error); }
});

module.exports = router;
