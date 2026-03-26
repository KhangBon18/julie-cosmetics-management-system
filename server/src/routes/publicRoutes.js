const router = require('express').Router();
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');

// Public product listings (no auth needed)
router.get('/products', async (req, res, next) => {
  try {
    const { page, limit, category_id, brand_id, search, sort } = req.query;
    const result = await Product.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      category_id, brand_id, search, sort
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

module.exports = router;
