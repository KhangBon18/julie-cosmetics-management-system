export const buildCartSignature = (items = []) => JSON.stringify(
  items
    .map(item => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      sell_price: Number(item.sell_price || 0),
      is_active: Number(item.is_active ?? 1)
    }))
    .sort((a, b) => a.product_id - b.product_id)
);

export const summarizeCartIssues = (issues = []) => {
  if (!issues.length) return '';
  if (issues.length === 1) return issues[0].message;

  const removed = issues.filter(issue => ['removed', 'inactive', 'out_of_stock'].includes(issue.type)).length;
  const adjusted = issues.filter(issue => issue.type === 'quantity_adjusted').length;

  if (removed && adjusted) {
    return `Giỏ hàng đã được cập nhật: ${removed} sản phẩm bị loại và ${adjusted} sản phẩm được điều chỉnh số lượng theo tồn kho.`;
  }
  if (removed) {
    return `Giỏ hàng đã được cập nhật: ${removed} sản phẩm không còn bán hoặc đã hết hàng.`;
  }
  if (adjusted) {
    return `Giỏ hàng đã được cập nhật: ${adjusted} sản phẩm được điều chỉnh theo số lượng tồn kho hiện tại.`;
  }
  return 'Giỏ hàng đã được cập nhật theo dữ liệu mới nhất.';
};
