const CRM_POINTS_BASE_AMOUNT = 10000;
const DEFAULT_POINTS_PER_BASE_AMOUNT = 1;

function getPointsPerBaseAmount(settings = {}) {
  const rawValue = settings['crm.points_per_10000']
    ?? settings['crm.points_per_1000']
    ?? DEFAULT_POINTS_PER_BASE_AMOUNT;
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_POINTS_PER_BASE_AMOUNT;
}

function calculateLoyaltyPoints(finalTotal, settings = {}) {
  const total = Math.max(0, Number(finalTotal) || 0);
  return Math.floor(total / CRM_POINTS_BASE_AMOUNT) * getPointsPerBaseAmount(settings);
}

function determineMembershipTier(points, settings = {}) {
  const silverThreshold = Number(settings['crm.silver_threshold'] || 100);
  const goldThreshold = Number(settings['crm.gold_threshold'] || 500);

  if ((Number(points) || 0) >= goldThreshold) return 'gold';
  if ((Number(points) || 0) >= silverThreshold) return 'silver';
  return 'standard';
}

module.exports = {
  CRM_POINTS_BASE_AMOUNT,
  DEFAULT_POINTS_PER_BASE_AMOUNT,
  getPointsPerBaseAmount,
  calculateLoyaltyPoints,
  determineMembershipTier
};
