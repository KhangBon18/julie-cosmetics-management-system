const errorHandler = (err, req, res, next) => {
  const statusCode = err.status
    || (err.code === 'ER_DUP_ENTRY' ? 400 : null)
    || (err.code === 'ER_NO_REFERENCED_ROW_2' ? 400 : null)
    || (err.name === 'JsonWebTokenError' ? 401 : null)
    || (err.name === 'TokenExpiredError' ? 401 : null)
    || (err.code === 'LIMIT_FILE_SIZE' ? 400 : null)
    || (err.code === 'LIMIT_UNEXPECTED_FILE' ? 400 : null)
    || 500;

  if (statusCode >= 500) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } else {
    console.warn(`⚠️ ${statusCode}: ${err.message}`);
  }

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      message: 'Dữ liệu đã tồn tại trong hệ thống'
    });
  }

  // MySQL foreign key error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      message: 'Dữ liệu tham chiếu không tồn tại'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token đã hết hạn' });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File quá lớn, tối đa 5MB' });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Loại file không được hỗ trợ' });
  }

  // Default error
  res.status(statusCode).json({
    message: err.message || 'Lỗi máy chủ nội bộ'
  });
};

module.exports = errorHandler;
