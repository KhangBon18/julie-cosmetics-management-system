/**
 * Format số tiền sang VND
 * @param {number} amount - Số tiền
 * @returns {string} - Chuỗi đã format (vd: "450.000₫")
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0₫';
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
};

/**
 * Tính phần trăm giảm giá
 */
export const calcDiscount = (price, salePrice) => {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
};
