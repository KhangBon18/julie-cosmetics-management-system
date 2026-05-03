const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDirectory = (directory) => {
  fs.mkdirSync(directory, { recursive: true });
};

const createStorage = (subdirectory = '') => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads', subdirectory);
    ensureDirectory(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// Filter chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)');
    error.status = 400;
    cb(error, false);
  }
};

const createUpload = (subdirectory = '') => multer({
  storage: createStorage(subdirectory),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const upload = createUpload();
upload.createUpload = createUpload;
upload.productImage = createUpload('products');

module.exports = upload;
