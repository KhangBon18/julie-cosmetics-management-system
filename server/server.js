const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });

const { testConnection, pool } = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const positionRoutes = require('./src/routes/positionRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const leaveRoutes = require('./src/routes/leaveRoutes');
const salaryRoutes = require('./src/routes/salaryRoutes');
const brandRoutes = require('./src/routes/brandRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const importRoutes = require('./src/routes/importRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const staffRoutes = require('./src/routes/staffRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const roleRoutes = require('./src/routes/roleRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const promotionRoutes = require('./src/routes/promotionRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const shippingRoutes = require('./src/routes/shippingRoutes');
const returnRoutes = require('./src/routes/returnRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — hỗ trợ nhiều origins từ env (comma-separated)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174').split(',').map(s => s.trim());
const isPrivateDevOrigin = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin);
    if (!['http:', 'https:'].includes(protocol)) return false;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
    const match = hostname.match(/^172\.(\d+)\.\d+\.\d+$/);
    if (match) {
      const second = parseInt(match[1], 10);
      return second >= 16 && second <= 31;
    }
    return false;
  } catch {
    return false;
  }
};
app.use(cors({
  origin: (origin, cb) => {
    const allowDevOrigin = process.env.NODE_ENV !== 'production' && isPrivateDevOrigin(origin);
    if (!origin || allowedOrigins.includes(origin) || allowDevOrigin) cb(null, true);
    else cb(new Error('CORS not allowed'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import limiters
const { globalLimiter } = require('./src/middleware/rateLimiter');

// Rate limiting toàn cục
app.use('/api', globalLimiter);

// Static files - uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public API (no auth required)
app.use('/api/public', publicRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer-auth', require('./src/routes/customerAuthRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/returns', returnRoutes);

// Health check (kiểm tra cả DB connection)
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ status: 'OK', database: 'connected', message: 'Julie Cosmetics API is running' });
  } catch {
    res.status(503).json({ status: 'ERROR', database: 'disconnected', message: 'Database connection failed' });
  }
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Julie Cosmetics Server running on port ${PORT}`);
      console.log(`📦 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('⚠️  Make sure MySQL is running and .env is configured');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (without DB connection)`);
    });
  }
};

startServer();
