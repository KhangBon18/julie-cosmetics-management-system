const router = require('express').Router();
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const Invoice = require('../models/invoiceModel');
const { body, validationResult } = require('express-validator');

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
    const [rows] = await pool.query(
      `SELECT p.product_id, p.product_name, p.sell_price, p.import_price, p.stock_quantity,
              p.image_url, p.volume, p.skin_type, p.is_active, p.created_at,
              b.brand_name, c.category_name,
              COALESCE(SUM(ii.quantity), 0) as total_sold,
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(DISTINCT r.review_id) as review_count
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.brand_id
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN invoice_items ii ON p.product_id = ii.product_id
       LEFT JOIN reviews r ON p.product_id = r.product_id AND r.is_visible = 1
       WHERE p.is_active = 1
       GROUP BY p.product_id
       ORDER BY total_sold DESC, avg_rating DESC
       LIMIT ?`,
      [limit]
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
    const invoiceItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(400).json({ message: `Sản phẩm ID ${item.product_id} không tồn tại` });
      }
      if (!product.is_active) {
        return res.status(400).json({ message: `Sản phẩm "${product.product_name}" đã ngừng kinh doanh` });
      }
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm "${product.product_name}" chỉ còn ${product.stock_quantity} trong kho`
        });
      }
      invoiceItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.sell_price
      });
    }

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
