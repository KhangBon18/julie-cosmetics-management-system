const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./src/config/db');
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

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public API (no auth required)
app.use('/api/public', publicRoutes);

// API Routes
app.use('/api/auth', authRoutes);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Julie Cosmetics API is running' });
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
