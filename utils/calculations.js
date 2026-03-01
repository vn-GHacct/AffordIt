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
    color = '#00C48C'; // green
    emoji = '✅';
  } else if (impactRatio <= 0.2) {
    verdict = 'This is a stretch';
    color = '#E09000'; // amber — readable on white
    emoji = '⚠️';
  } else {
    verdict = 'This will hurt';
    color = '#E0393E'; // red — readable on white
    emoji = '🚫';
  }

  // Tipping point prices: what the purchase would need to cost to hit each threshold.
  // For a lump sum, multiply the monthly threshold by 12.
  // For a monthly payment, the threshold is already monthly.
  const comfortableLimit = isMonthlyPayment
    ? monthlyIncome * 0.10
    : monthlyIncome * 0.10 * 12;

  const stretchLimit = isMonthlyPayment
    ? monthlyIncome * 0.20
    : monthlyIncome * 0.20 * 12;

  const { rationaleText, rationaleShort } = getRationale(impactRatio, isMonthlyPayment);

  return {
    verdict,
    color,
    emoji,
    monthlyCost,
    impactRatio,
    rationaleText,
    rationaleShort,
    displacementText: getDisplacementText(monthlyCost),
    tippingPoints: { comfortable: comfortableLimit, stretch: stretchLimit },
  };
}

/**
 * Returns a full paragraph and a short one-liner explaining *why* the
 * verdict was assigned — the financial rule behind it, what it means
 * in practice, and what the user should consider.
 *
 * @param {number}  impactRatio       - monthlyCost / monthlyIncome
 * @param {boolean} isMonthlyPayment  - affects how to frame the advice
 * @returns {{ rationaleText: string, rationaleShort: string }}
 */
function getRationale(impactRatio, isMonthlyPayment) {
  const pct = (impactRatio * 100).toFixed(1);
  const paymentType = isMonthlyPayment ? 'monthly payment' : 'purchase';

  if (impactRatio < 0.1) {
    return {
      rationaleText:
        `This ${paymentType} comes to ${pct}% of your monthly income — well under the 10% ` +
        `threshold that financial planners use for discretionary spending. Keeping individual ` +
        `expenses below 10% preserves flexibility: you can absorb this without cutting other ` +
        `budget categories, and it leaves room for savings and unexpected costs. At this level, ` +
        `the purchase is unlikely to create financial stress.`,
      rationaleShort: `${pct}% of income — comfortably within the 10% guideline.`,
    };
  }

  if (impactRatio <= 0.2) {
    return {
      rationaleText:
        `This ${paymentType} comes to ${pct}% of your monthly income — above the comfortable ` +
        `10% mark but still under the 20% ceiling most financial planners treat as the upper ` +
        `limit for discretionary spending. It's workable, but not without trade-offs: you'll ` +
        `likely need to trim spending elsewhere to keep your overall budget balanced. Ask yourself ` +
        `what you'd cut, and whether you have at least 3 months of expenses in savings before ` +
        `committing.`,
      rationaleShort: `${pct}% of income — in the caution zone (10%–20%).`,
    };
  }

  return {
    rationaleText:
      `This ${paymentType} comes to ${pct}% of your monthly income — beyond the 20% guideline ` +
      `that financial planners use as the ceiling for major discretionary spending. At this level, ` +
      `the cost starts crowding out essentials: it becomes harder to contribute to savings, build ` +
      `an emergency fund, or handle unexpected expenses without going into debt. This doesn't mean ` +
      `it's impossible, but it warrants a close look at your full budget picture before committing. ` +
      `Check the tipping point below to see what price would put this in a safer range.`,
    rationaleShort: `${pct}% of income — exceeds the 20% ceiling for discretionary spending.`,
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
 * Formats a number as a currency string using the provided currency object.
 * e.g. 1234.5 with USD → "$1,234.50", with JPY → "¥1,235"
 *
 * @param {number} amount
 * @param {{ symbol: string, decimals: number }} currency - defaults to USD
 */
export function formatCurrency(amount, currency = { symbol: '$', decimals: 2 }) {
  const fixed = amount.toFixed(currency.decimals);
  const [intPart, decPart] = fixed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined
    ? `${currency.symbol}${withCommas}.${decPart}`
    : `${currency.symbol}${withCommas}`;
}

/**
 * Formats a ratio as a percentage string, e.g. 0.153 → "15.3%"
 */
export function formatPercent(ratio) {
  return `${(ratio * 100).toFixed(1)}%`;
}
