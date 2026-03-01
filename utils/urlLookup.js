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
  parseEtsy,
  parseEbay,
  parseCraigslist,
  parseCarvana,
  parseRedfin,
  parseWestElm,
  parseNewegg,
  parseBHPhoto,
  parseSamsung,
  parseEdmunds,
  parseCarsDotCom,
  parseRealtor,
  parseApartmentsDotCom,
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
  'sothebys',
];

// Sites that need a specific, more helpful blocked message
const SPECIFIC_BLOCKED = {
  'facebook.com': "Facebook Marketplace requires a login and loads prices dynamically — enter it manually.",
};

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
  etsy:        { parser: (html)       => parseEtsy(html),        tier: 1, label: 'Etsy' },
  ebay:        { parser: (html)       => parseEbay(html),        tier: 1, label: 'eBay' },
  craigslist:  { parser: (html)       => parseCraigslist(html),  tier: 2, label: 'Craigslist' },
  carvana:     { parser: (html)       => parseCarvana(html),     tier: 1, label: 'Carvana' },
  redfin:      { parser: (html)       => parseRedfin(html),      tier: 1, label: 'Redfin' },
  westelm:     { parser: (html)       => parseWestElm(html),     tier: 1, label: 'West Elm' },
  newegg:      { parser: (html)       => parseNewegg(html),      tier: 1, label: 'Newegg' },
  bhphoto:     { parser: (html)       => parseBHPhoto(html),     tier: 1, label: 'B&H Photo' },
  samsung:     { parser: (html)       => parseSamsung(html),     tier: 1, label: 'Samsung' },
  edmunds:     { parser: (html)       => parseEdmunds(html),     tier: 1, label: 'Edmunds' },
  carsdotcom:  { parser: (html)       => parseCarsDotCom(html),  tier: 1, label: 'Cars.com' },
  realtor:     { parser: (html)       => parseRealtor(html),     tier: 1, label: 'Realtor.com' },
  apartments:  { parser: (html)       => parseApartmentsDotCom(html), tier: 2, label: 'Apartments.com' },
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

  for (const pattern of Object.keys(SPECIFIC_BLOCKED)) {
    if (hostname.includes(pattern)) return `__specific__${pattern}`;
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
  if (hostname.includes('etsy.com'))        return 'etsy';
  if (hostname.includes('ebay.com'))        return 'ebay';
  if (hostname.includes('craigslist.org'))  return 'craigslist';
  if (hostname.includes('carvana.com'))     return 'carvana';
  if (hostname.includes('redfin.com'))      return 'redfin';
  if (hostname.includes('westelm.com'))     return 'westelm';
  if (hostname.includes('newegg.com'))      return 'newegg';
  if (hostname.includes('bhphotovideo.com')) return 'bhphoto';
  if (hostname.includes('samsung.com'))     return 'samsung';
  if (hostname.includes('edmunds.com'))     return 'edmunds';
  if (hostname.includes('cars.com'))        return 'carsdotcom';
  if (hostname.includes('realtor.com'))     return 'realtor';
  if (hostname.includes('apartments.com'))  return 'apartments';

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

  if (siteKey?.startsWith('__specific__')) {
    const pattern = siteKey.replace('__specific__', '');
    throw new Error(SPECIFIC_BLOCKED[pattern]);
  }

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
  let result = parser(html);

  // 4a. Apple overview pages (e.g. /iphone-17-pro/) carry no price themselves —
  //     they embed a potentialAction.url pointing to the shop page that does.
  //     Auto-follow it so users don't need to find the right shop URL manually.
  if (!result && siteKey === 'apple') {
    const buyMatch = /"potentialAction"[\s\S]{0,400}"url"\s*:\s*\[\s*"(https:\/\/www\.apple\.com\/[^"]+)"/.exec(html);
    if (buyMatch) {
      try {
        const shopHtml = await fetchHtml(buyMatch[1]);
        result = parser(shopHtml);
      } catch {}
    }
  }

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
