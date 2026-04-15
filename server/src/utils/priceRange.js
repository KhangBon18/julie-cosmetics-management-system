const normalizeCurrencyLikeValue = (value) => {
  if (value === undefined || value === null || value === '') return undefined;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 0 ? Math.round(value) : undefined;
  }

  const digits = String(value).replace(/[^\d]/g, '');
  if (!digits) return undefined;

  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizePriceRange = (minPrice, maxPrice) => {
  let min = normalizeCurrencyLikeValue(minPrice);
  let max = normalizeCurrencyLikeValue(maxPrice);

  if (min !== undefined && max !== undefined && min > max) {
    [min, max] = [max, min];
  }

  return { min, max };
};

module.exports = {
  normalizeCurrencyLikeValue,
  normalizePriceRange
};
