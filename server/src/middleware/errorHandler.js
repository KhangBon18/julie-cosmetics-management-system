const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

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
  res.status(err.status || 500).json({
    message: err.message || 'Lỗi máy chủ nội bộ'
  });
};

module.exports = errorHandler;
