exports.predictLoanApproval = (data) => {
  const { loanAmount, monthlyIncome, creditScore, existingEMIs = 0 } = data;
  
  // Basic risk analysis
  let score = 0;
  const suggestions = [];

  // 1. Credit Score Analysis (Max 40 points)
  if (creditScore >= 750) {
    score += 40;
  } else if (creditScore >= 650) {
    score += 25;
    suggestions.push("A higher credit score would improve your chances. Consider paying off existing debts.");
  } else if (creditScore >= 550) {
    score += 10;
    suggestions.push("Your credit score is below average. Approval might be subject to higher interest rates.");
  } else if (creditScore) {
    suggestions.push("Poor credit score strongly affects approval chances.");
  } else {
    // No credit score - new user
    score += 15;
    suggestions.push("Complete KYC to generate a credit score and improve your approval odds.");
  }

  // 2. Debt-to-Income (DTI) Ratio (Max 40 points)
  // Assuming loan tenure of 12 months for DTI check if tenure not provided
  const estimatedEMI = loanAmount * 0.1; // Rough 10% estimation for monthly burden
  const totalMonthlyDebt = estimatedEMI + existingEMIs;
  let dti = 0;

  if (monthlyIncome === 0) {
    suggestions.push("You reported zero monthly income. You may require a co-signer or collateral to get approved.");
  } else {
    dti = (totalMonthlyDebt / monthlyIncome) * 100;
    if (dti <= 30) {
      score += 40;
    } else if (dti <= 45) {
      score += 20;
      suggestions.push("Your Debt-to-Income ratio is acceptable but high. Consider applying for a slightly smaller amount.");
    } else {
      suggestions.push(`Your Debt-to-Income ratio (${dti.toFixed(1)}%) exceeds the safe threshold (45%). Decrease the loan amount.`);
    }
  }

  // 3. Loan Amount to Income Ratio (Max 20 points)
  let incomeMultiplier = 0;
  
  if (monthlyIncome === 0) {
    suggestions.push("Without steady income, repayment is considered highly risky by the system.");
  } else {
    incomeMultiplier = loanAmount / monthlyIncome;
    if (incomeMultiplier <= 3) {
      score += 20;
    } else if (incomeMultiplier <= 6) {
      score += 10;
      suggestions.push("The requested loan amount is large relative to your monthly income. Extending the tenure may help.");
    } else {
      suggestions.push("Loan amount exceeds 6x your monthly income, which makes this highly risky.");
    }
  }

  // Final prediction
  let probability = score; // Out of 100
  let riskLevel = 'LOW';
  if (probability < 40) riskLevel = 'HIGH';
  else if (probability < 70) riskLevel = 'MEDIUM';

  return {
    probability,
    riskLevel,
    suggestions,
    metrics: { dti: Math.round(dti), incomeMultiplier: monthlyIncome === 0 ? 'N/A' : incomeMultiplier.toFixed(1) }
  };
};
