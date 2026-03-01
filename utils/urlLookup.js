/**
 * urlLookup.js
 *
 * Orchestrator for site-specific price lookups.
 *
 * Flow:
 *   1. Validate the URL
 *   2. detectSite() — identify which supported site it is
 *   3. Block unsupported sites with a clear message
 *   4. Fetch HTML with mobile Safari headers to reduce bot-detection
 *   5. Route to the correct parser from siteScraper.js
 *   6. Return { price, productName, site } or throw a user-readable Error
 *
 * The old generic urlScraper.js is intentionally kept separate; this file
 * only handles the explicitly supported site list.
 */

import {
  parseApple,
  parseBestBuy,
  parseIkea,
  parseWayfair,
  parseZillow,
  parseCarMax,
  parseAutoTrader,
  parsePotteryBarn,
  parseAirbnb,
  parseTarget,
  parseWalmart,
  parseHomeDepot,
  parseCostco,
} from './siteScraper';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 12000;

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Sites we explicitly refuse — prices are session-based or too inconsistent
const BLOCKED_HOSTNAMES = [
  'amazon', 'booking.com', 'expedia', 'hotels.com', 'kayak',
  'tripadvisor', 'united.com', 'delta.com', 'aa.com', 'southwest.com',
  'spirit.com', 'jetblue.com', 'priceline', 'tiffany', 'cartier', 'rolex',
  'sothebys', 'etsy.com',
];

// Map of site key → { parser, tier, label }
const SITES = {
  apple:       { parser: (html)       => parseApple(html),       tier: 1, label: 'Apple' },
  bestbuy:     { parser: (html)       => parseBestBuy(html),     tier: 1, label: 'Best Buy' },
  ikea:        { parser: (html)       => parseIkea(html),        tier: 1, label: 'IKEA' },
  wayfair:     { parser: (html)       => parseWayfair(html),     tier: 1, label: 'Wayfair' },
  zillow:      { parser: (html)       => parseZillow(html),      tier: 1, label: 'Zillow' },
  carmax:      { parser: (html)       => parseCarMax(html),      tier: 2, label: 'CarMax' },
  autotrader:  { parser: (html)       => parseAutoTrader(html),  tier: 2, label: 'AutoTrader' },
  potterybarn: { parser: (html)       => parsePotteryBarn(html), tier: 2, label: 'Pottery Barn' },
  airbnb:      { parser: (html)       => parseAirbnb(html),      tier: 2, label: 'Airbnb' },
  target:      { parser: (html)       => parseTarget(html),      tier: 1, label: 'Target' },
  walmart:     { parser: (html)       => parseWalmart(html),     tier: 1, label: 'Walmart' },
  homedepot:   { parser: (html)       => parseHomeDepot(html),   tier: 1, label: 'Home Depot' },
  costco:      { parser: (html)       => parseCostco(html),      tier: 1, label: 'Costco' },
};

// Exported so the UI can show users what's supported
export const SUPPORTED_SITES = Object.values(SITES).map((s) => s.label);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the site key string, '__blocked__', or null (unknown).
 */
function detectSite(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }

  for (const blocked of BLOCKED_HOSTNAMES) {
    if (hostname.includes(blocked)) return '__blocked__';
  }

  if (hostname.includes('apple.com'))       return 'apple';
  if (hostname.includes('bestbuy.com'))     return 'bestbuy';
  if (hostname.includes('ikea.com'))        return 'ikea';
  if (hostname.includes('wayfair.com'))     return 'wayfair';
  if (hostname.includes('zillow.com'))      return 'zillow';
  if (hostname.includes('carmax.com'))      return 'carmax';
  if (hostname.includes('autotrader.com'))  return 'autotrader';
  if (hostname.includes('potterybarn.com')) return 'potterybarn';
  if (hostname.includes('airbnb.com'))      return 'airbnb';
  if (hostname.includes('target.com'))      return 'target';
  if (hostname.includes('walmart.com'))     return 'walmart';
  if (hostname.includes('homedepot.com'))   return 'homedepot';
  if (hostname.includes('costco.com'))      return 'costco';

  return null;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: FETCH_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw new Error("Couldn't load that page. Check the URL and try again.");
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetches and parses the price from a supported product URL.
 * Returns { price: number, productName: string, site: string }
 * Throws a user-readable Error on any failure.
 */
export async function fetchPriceFromUrl(url) {
  // 1. Validate URL shape
  try {
    new URL(url);
  } catch {
    throw new Error("That doesn't look like a valid URL. Check the link and try again.");
  }

  // 2. Detect site
  const siteKey = detectSite(url);

  if (siteKey === '__blocked__') {
    throw new Error(
      "This site isn't supported — prices are dynamic or session-based. Enter it manually."
    );
  }

  if (!siteKey) {
    throw new Error(
      `This site isn't supported yet. Try: ${SUPPORTED_SITES.join(', ')}.`
    );
  }

  // 3. Fetch HTML
  const html = await fetchHtml(url);

  // 4. Parse
  const { parser, tier } = SITES[siteKey];
  const result = parser(html);

  if (!result) {
    if (tier === 2) {
      throw new Error(
        "Couldn't extract the price — this site may have updated its layout. Enter it manually."
      );
    }
    throw new Error(
      "Couldn't find a price on that page. It may require a login, or enter it manually."
    );
  }

  return result; // { price, productName, site }
}
