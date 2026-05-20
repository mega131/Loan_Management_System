exports.generateCreditScore = (user) => {
  // Simulate a score between 300 and 850
  const base = 450;
  const kycBonus = user.kycStatus === 'VERIFIED' ? 150 : 0;
  const randomVariance = Math.floor(Math.random() * 200); // 0-200
  return Math.min(850, base + kycBonus + randomVariance);
};
