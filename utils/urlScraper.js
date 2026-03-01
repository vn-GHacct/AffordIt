/**
 * urlScraper.js
 *
 * Fetches a product page URL and attempts to extract the price using
 * three strategies in order: JSON-LD structured data, Open Graph meta tags,
 * and a context-anchored regex fallback.
 *
 * Returns { price: number, source: string } on success, throws on failure.
 * No external dependencies — uses native fetch + AbortController.
 */

const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const FETCH_TIMEOUT_MS = 10000;

/**
 * Strategy A: JSON-LD structured data.
 * Covers Best Buy, Target, Walmart, Home Depot, and most large retailers.
 */
function extractViaJsonLd(html) {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }

    // Normalise to an array so we can handle both single objects and @graph arrays
    const nodes = [];
    if (Array.isArray(parsed)) {
      nodes.push(...parsed);
    } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
      nodes.push(...parsed['@graph']);
    } else {
      nodes.push(parsed);
    }

    for (const node of nodes) {
      if (!node || node['@type'] !== 'Product') continue;

      const offers = node.offers;
      if (!offers) continue;

      // offers can be a single object or an array
      const offerList = Array.isArray(offers) ? offers : [offers];

      for (const offer of offerList) {
        const raw = offer.price ?? offer.lowPrice;
        if (raw == null) continue;
        const price = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
        if (isValidPrice(price)) {
          return { price, source: 'json-ld' };
        }
      }
    }
  }

  return null;
}

/**
 * Strategy B: Open Graph meta tags.
 * Covers Etsy, Shopify stores, and many independent retailers.
 */
function extractViaOpenGraph(html) {
  // Handle both attribute orderings: property="..." content="..." and content="..." property="..."
  const patterns = [
    /<meta[^>]+property=["'](og:price:amount|product:price:amount)["'][^>]+content=["']([^"']+)["'][^>]*\/?>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["'](og:price:amount|product:price:amount)["'][^>]*\/?>/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      // First pattern: group 2 is the value; second pattern: group 1 is the value
      const rawValue = pattern === patterns[0] ? match[2] : match[1];
      const price = parseFloat(String(rawValue).replace(/[^0-9.]/g, ''));
      if (isValidPrice(price)) {
        return { price, source: 'open-graph' };
      }
    }
  }

  return null;
}

/**
 * Strategy C: Context-anchored regex fallback.
 * For boutique sites with no structured data.
 * Looks for $X.XX patterns near pricing-related keywords.
 * Takes the most-frequently-occurring candidate (real price appears
 * multiple times; "was" price appears once).
 */
function extractViaRegex(html) {
  const keywords = ['price', 'cost', 'amount', 'itemprice', 'priceblock', 'a-price'];
  const keywordPattern = new RegExp(keywords.join('|'), 'gi');
  const pricePattern = /\$\s*([0-9]{1,6}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/g;

  const candidates = new Map(); // price string → count
  let kwMatch;
  let found = 0;

  while ((kwMatch = keywordPattern.exec(html)) !== null && found < 10) {
    const start = Math.max(0, kwMatch.index - 200);
    const end = Math.min(html.length, kwMatch.index + 200);
    const snippet = html.slice(start, end);

    let priceMatch;
    while ((priceMatch = pricePattern.exec(snippet)) !== null) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (!isValidPrice(price)) continue;
      const key = price.toFixed(2);
      candidates.set(key, (candidates.get(key) ?? 0) + 1);
      found++;
      if (found >= 10) break;
    }
  }

  if (candidates.size === 0) return null;

  // Pick the most frequently seen candidate
  let bestKey = null;
  let bestCount = 0;
  for (const [key, count] of candidates) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }

  return { price: parseFloat(bestKey), source: 'regex' };
}

function isValidPrice(price) {
  return typeof price === 'number' && !isNaN(price) && price >= 1 && price <= 100000;
}

/**
 * Main exported function.
 * Tries JSON-LD → Open Graph → regex, stops at first success.
 * Throws a user-readable Error if no price is found or the fetch fails.
 */
export async function fetchPriceFromUrl(url) {
  // Validate URL before hitting the network
  try {
    new URL(url);
  } catch {
    throw new Error('That doesn\'t look like a valid URL. Check the link and try again.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    html = await response.text();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw new Error('Couldn\'t load that page. Check the URL and try again.');
  } finally {
    clearTimeout(timeoutId);
  }

  const result =
    extractViaJsonLd(html) ??
    extractViaOpenGraph(html) ??
    extractViaRegex(html);

  if (!result) {
    throw new Error('Couldn\'t find a price on that page. Enter it manually above.');
  }

  return result;
}
