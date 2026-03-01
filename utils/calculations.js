/**
 * calculations.js
 *
 * All verdict logic lives here. Screens just call these functions
 * and display the results — no math scattered across the codebase.
 */

/**
 * Core function: takes the user's income and purchase info,
 * returns a full verdict object that screens can render.
 *
 * @param {number} monthlyIncome  - User's monthly take-home pay
 * @param {number} purchaseAmount - Either a lump-sum price or a monthly payment
 * @param {boolean} isMonthlyPayment - If true, use amount as-is; if false, divide by 12
 * @returns {object} verdict, color, emoji, monthlyCost, impactRatio, displacementText
 */
export function getVerdict(monthlyIncome, purchaseAmount, isMonthlyPayment) {
  // If it's a lump sum, spread the cost over 12 months to compare apples-to-apples
  const monthlyCost = isMonthlyPayment ? purchaseAmount : purchaseAmount / 12;

  // What fraction of monthly income does this consume?
  const impactRatio = monthlyCost / monthlyIncome;

  // Determine the verdict tier based on the impact ratio
  let verdict, color, emoji;

  if (impactRatio < 0.1) {
    verdict = 'You can handle this';
    color = '#22C55E'; // green
    emoji = '✅';
  } else if (impactRatio <= 0.2) {
    verdict = 'This is a stretch';
    color = '#EAB308'; // yellow
    emoji = '⚠️';
  } else {
    verdict = 'This will hurt';
    color = '#EF4444'; // red
    emoji = '🚫';
  }

  return {
    verdict,
    color,
    emoji,
    monthlyCost,
    impactRatio,
    displacementText: getDisplacementText(monthlyCost),
  };
}

/**
 * Returns a plain-English sentence describing what this monthly cost
 * is comparable to in everyday life.
 */
function getDisplacementText(monthlyCost) {
  if (monthlyCost < 100) {
    return "That's about what most people spend on streaming services.";
  } else if (monthlyCost < 300) {
    return "That's roughly a weekly grocery run every month.";
  } else if (monthlyCost < 500) {
    return "That's in the range of a monthly utilities bill.";
  } else if (monthlyCost < 1000) {
    return "That's close to what most people pay for a car payment.";
  } else {
    return "That's a significant chunk of most people's rent.";
  }
}

/**
 * Formats a number as a dollar string, e.g. 1234.5 → "$1,234.50"
 */
export function formatCurrency(amount) {
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Formats a ratio as a percentage string, e.g. 0.153 → "15.3%"
 */
export function formatPercent(ratio) {
  return `${(ratio * 100).toFixed(1)}%`;
}
