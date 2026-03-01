/**
 * siteScraper.js
 *
 * Per-site HTML parser functions. Each one receives raw HTML (and the
 * original URL for Zillow) and returns { price, productName, site } or null.
 *
 * No DOM — all parsing is done with regex on the raw HTML string,
 * which works in both React Native and the browser.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function isValidPrice(price) {
  return typeof price === 'number' && !isNaN(price) && price >= 1 && price <= 10_000_000;
}

/**
 * Extracts og:price:amount or product:price:amount from a meta tag.
 * Handles both attribute orderings (property before content and vice-versa).
 */
function extractMetaPrice(html) {
  const regexes = [
    /<meta\s[^>]*property=["'](og:price:amount|product:price:amount)["'][^>]*content=["']([^"']+)["'][^>]*\/?>/gi,
    /<meta\s[^>]*content=["']([^"']+)["'][^>]*property=["'](og:price:amount|product:price:amount)["'][^>]*\/?>/gi,
  ];
  for (let i = 0; i < regexes.length; i++) {
    let m;
    while ((m = regexes[i].exec(html)) !== null) {
      const raw = i === 0 ? m[2] : m[1];
      const price = parseFloat(raw.replace(/[^0-9.]/g, ''));
      if (isValidPrice(price)) return price;
    }
  }
  return null;
}

/** Extracts the og:title meta tag value, falling back to <title>. */
function extractMetaTitle(html) {
  const patterns = [
    /<meta\s[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i,
    /<meta\s[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*\/?>/i,
  ];
  for (const p of patterns) {
    const m = p.exec(html);
    if (m) return decodeEntities(m[1].trim());
  }
  const t = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return t ? decodeEntities(t[1].trim()) : '';
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'");
}

/**
 * Strips common site-name suffixes from a page title.
 * e.g. "AirPods Pro - Apple" → "AirPods Pro"
 */
function cleanTitle(title, ...suffixes) {
  let t = title;
  for (const s of suffixes) {
    t = t.replace(new RegExp(`\\s*[|\\-–]\\s*${s}\\s*$`, 'i'), '');
  }
  return t.trim();
}

/**
 * Tries to parse the __NEXT_DATA__ JSON blob embedded by Next.js apps
 * (Zillow, Airbnb both use it). Returns parsed object or null.
 */
function parseNextData(html) {
  const m = /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * Walks a nested object looking for a key that matches one of the given names
 * and returns the first numeric value found. Bails after maxDepth levels.
 */
function deepFind(obj, keys, maxDepth = 10, _depth = 0) {
  if (_depth > maxDepth || obj == null || typeof obj !== 'object') return null;
  for (const key of keys) {
    if (obj[key] != null && typeof obj[key] !== 'object') {
      const n = parseFloat(String(obj[key]).replace(/[^0-9.]/g, ''));
      if (!isNaN(n) && n > 0) return n;
    }
  }
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object') {
      const found = deepFind(val, keys, maxDepth, _depth + 1);
      if (found != null) return found;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tier 1 parsers
// ---------------------------------------------------------------------------

export function parseApple(html) {
  let price = extractMetaPrice(html);

  // Fallback: Apple embeds prices in JSON-LD and data attributes
  if (!price) {
    const m = /"price"\s*:\s*"?([0-9]+(?:\.[0-9]{2})?)"?/.exec(html);
    if (m) {
      const p = parseFloat(m[1]);
      if (isValidPrice(p)) price = p;
    }
  }

  if (!price) return null;
  return {
    price,
    productName: cleanTitle(extractMetaTitle(html), 'Apple'),
    site: 'Apple',
  };
}

export function parseBestBuy(html) {
  let price = extractMetaPrice(html);

  // Fallback: Best Buy embeds currentPrice in page JSON
  if (!price) {
    const m = /"currentPrice"\s*:\s*([0-9]+(?:\.[0-9]{2})?)/.exec(html);
    if (m) {
      const p = parseFloat(m[1]);
      if (isValidPrice(p)) price = p;
    }
  }

  if (!price) return null;
  return {
    price,
    productName: cleanTitle(extractMetaTitle(html), 'Best Buy'),
    site: 'Best Buy',
  };
}

export function parseIkea(html) {
  let price = extractMetaPrice(html);

  // Fallback: IKEA embeds price in page data JSON
  if (!price) {
    const m = /"price"\s*:\s*"?([0-9]+(?:\.[0-9]{2})?)"?/.exec(html);
    if (m) {
      const p = parseFloat(m[1]);
      if (isValidPrice(p)) price = p;
    }
  }

  if (!price) return null;
  return {
    price,
    productName: cleanTitle(extractMetaTitle(html), 'IKEA'),
    site: 'IKEA',
  };
}

export function parseWayfair(html) {
  const price = extractMetaPrice(html);
  if (!price) return null;
  return {
    price,
    productName: cleanTitle(extractMetaTitle(html), 'Wayfair'),
    site: 'Wayfair',
  };
}

export function parseZillow(html) {
  // Strategy 1: __NEXT_DATA__ — Zillow is a Next.js app
  const nextData = parseNextData(html);
  if (nextData) {
    // gdpClientCache is a double-encoded JSON string containing listing data
    try {
      const cache = nextData?.props?.pageProps?.gdpClientCache;
      if (cache) {
        const inner = JSON.parse(cache);
        const price = deepFind(inner, ['price', 'listPrice', 'unformattedValue'], 8);
        if (price && isValidPrice(price)) {
          return { price, productName: 'Zillow Listing', site: 'Zillow' };
        }
      }
    } catch {}

    // Also try a direct deep search on the full Next.js tree
    const price = deepFind(nextData, ['price', 'listPrice'], 12);
    if (price && price >= 1000 && price <= 10_000_000) {
      return { price, productName: 'Zillow Listing', site: 'Zillow' };
    }
  }

  // Strategy 2: Regex on raw HTML for common Zillow price patterns
  const patterns = [
    /"listPrice"\s*:\s*([0-9]+)/,
    /"price"\s*:\s*([0-9]{4,})/,   // 4+ digits to avoid false positives
    /\$\s*([0-9]{1,3}(?:,[0-9]{3})+)\s*\/mo/i, // rent listings: "$1,500/mo"
  ];
  for (const p of patterns) {
    const m = p.exec(html);
    if (m) {
      const price = parseFloat(m[1].replace(/,/g, ''));
      if (isValidPrice(price)) {
        return { price, productName: 'Zillow Listing', site: 'Zillow' };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Tier 2 parsers ("may vary" reliability)
// ---------------------------------------------------------------------------

export function parseCarMax(html) {
  let price = extractMetaPrice(html);

  if (!price) {
    const m = /"price"\s*:\s*([0-9]+(?:\.[0-9]{2})?)/.exec(html);
    if (m) {
      const p = parseFloat(m[1]);
      if (isValidPrice(p)) price = p;
    }
  }

  if (!price) return null;
  return {
    price,
    productName: cleanTitle(extractMetaTitle(html), 'CarMax'),
    site: 'CarMax',
  };
}

export function parseAutoTrader(html) {
  const price = extractMetaPrice(html);
  if (!price) return null;
  return {
    price,
    productName: cleanTitle(extractMetaTitle(html), 'AutoTrader', 'Autotrader'),
    site: 'AutoTrader',
  };
}

export function parsePotteryBarn(html) {
  const price = extractMetaPrice(html);
  if (!price) return null;
  return {
    price,
    productName: cleanTitle(extractMetaTitle(html), 'Pottery Barn'),
    site: 'Pottery Barn',
  };
}

export function parseAirbnb(html) {
  // Strategy 1: __NEXT_DATA__ — Airbnb is a Next.js app
  const nextData = parseNextData(html);
  if (nextData) {
    // Try known Airbnb price paths
    const price =
      deepFind(nextData, ['basePrice', 'originalPrice', 'discountedPrice'], 12) ??
      deepFind(nextData, ['price'], 12);

    if (price && isValidPrice(price)) {
      return { price, productName: cleanTitle(extractMetaTitle(html), 'Airbnb'), site: 'Airbnb' };
    }
  }

  // Strategy 2: og:description often says "From $X per night"
  const descPatterns = [
    /<meta\s[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i,
    /<meta\s[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["'][^>]*\/?>/i,
  ];
  for (const p of descPatterns) {
    const m = p.exec(html);
    if (m) {
      const priceM = /\$\s*([0-9,]+)/.exec(m[1]);
      if (priceM) {
        const price = parseFloat(priceM[1].replace(/,/g, ''));
        if (isValidPrice(price)) {
          return {
            price,
            productName: cleanTitle(extractMetaTitle(html), 'Airbnb'),
            site: 'Airbnb',
          };
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Additional Tier 1 parsers
// ---------------------------------------------------------------------------

export function parseTarget(html) {
  // Target uses JSON-LD Product schema reliably
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
      for (const node of nodes) {
        if (node['@type'] !== 'Product') continue;
        const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
        for (const offer of offers) {
          const raw = offer?.price ?? offer?.lowPrice;
          if (raw == null) continue;
          const price = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
          if (isValidPrice(price)) {
            return { price, productName: cleanTitle(extractMetaTitle(html), 'Target'), site: 'Target' };
          }
        }
      }
    } catch {}
  }

  // Fallback: og:price:amount meta tag
  const price = extractMetaPrice(html);
  if (!price) return null;
  return { price, productName: cleanTitle(extractMetaTitle(html), 'Target'), site: 'Target' };
}

export function parseWalmart(html) {
  // Walmart is a Next.js app — price lives in __NEXT_DATA__
  const nextData = parseNextData(html);
  if (nextData) {
    const price = deepFind(nextData, ['price', 'currentPrice', 'priceInfo'], 12);
    if (price && isValidPrice(price)) {
      return { price, productName: cleanTitle(extractMetaTitle(html), 'Walmart'), site: 'Walmart' };
    }
  }

  // Fallback: og:price:amount or embedded JSON
  let price = extractMetaPrice(html);
  if (!price) {
    const priceM = /"price"\s*:\s*([0-9]+(?:\.[0-9]{2})?)/.exec(html);
    if (priceM) {
      const p = parseFloat(priceM[1]);
      if (isValidPrice(p)) price = p;
    }
  }

  if (!price) return null;
  return { price, productName: cleanTitle(extractMetaTitle(html), 'Walmart'), site: 'Walmart' };
}

export function parseHomeDepot(html) {
  // Home Depot uses JSON-LD Product schema
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
      for (const node of nodes) {
        if (node['@type'] !== 'Product') continue;
        const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
        for (const offer of offers) {
          const raw = offer?.price ?? offer?.lowPrice;
          if (raw == null) continue;
          const price = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
          if (isValidPrice(price)) {
            return { price, productName: cleanTitle(extractMetaTitle(html), 'The Home Depot', 'Home Depot'), site: 'Home Depot' };
          }
        }
      }
    } catch {}
  }

  // Fallback: meta price or page JSON
  let price = extractMetaPrice(html);
  if (!price) {
    const priceM = /"(?:specialPrice|currentPrice|originalPrice)"\s*:\s*([0-9]+(?:\.[0-9]{2})?)/.exec(html);
    if (priceM) {
      const p = parseFloat(priceM[1]);
      if (isValidPrice(p)) price = p;
    }
  }

  if (!price) return null;
  return { price, productName: cleanTitle(extractMetaTitle(html), 'The Home Depot', 'Home Depot'), site: 'Home Depot' };
}

export function parseCostco(html) {
  // Costco uses og:price:amount reliably
  let price = extractMetaPrice(html);

  // Fallback: JSON-LD
  if (!price) {
    const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = scriptRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(m[1]);
        const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
        for (const node of nodes) {
          if (node['@type'] !== 'Product') continue;
          const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
          for (const offer of offers) {
            const raw = offer?.price ?? offer?.lowPrice;
            if (raw == null) continue;
            const p = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
            if (isValidPrice(p)) { price = p; break; }
          }
          if (price) break;
        }
      } catch {}
      if (price) break;
    }
  }

  if (!price) return null;
  return { price, productName: cleanTitle(extractMetaTitle(html), 'Costco'), site: 'Costco' };
}

export function parseEtsy(html) {
  // Etsy uses og:price:amount and JSON-LD Product schema
  let price = extractMetaPrice(html);

  if (!price) {
    const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = scriptRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(m[1]);
        const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
        for (const node of nodes) {
          if (node['@type'] !== 'Product') continue;
          const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
          for (const offer of offers) {
            const raw = offer?.price ?? offer?.lowPrice;
            if (raw == null) continue;
            const p = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
            if (isValidPrice(p)) { price = p; break; }
          }
          if (price) break;
        }
      } catch {}
      if (price) break;
    }
  }

  if (!price) return null;
  return { price, productName: cleanTitle(extractMetaTitle(html), 'Etsy'), site: 'Etsy' };
}

export function parseEbay(html) {
  // eBay uses og:price:amount and JSON-LD
  let price = extractMetaPrice(html);

  if (!price) {
    const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = scriptRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(m[1]);
        const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
        for (const node of nodes) {
          if (node['@type'] !== 'Product') continue;
          const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
          for (const offer of offers) {
            const raw = offer?.price ?? offer?.lowPrice;
            if (raw == null) continue;
            const p = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
            if (isValidPrice(p)) { price = p; break; }
          }
          if (price) break;
        }
      } catch {}
      if (price) break;
    }
  }

  // Fallback: eBay embeds price in page JSON
  if (!price) {
    const m = /"price"\s*:\s*"?([0-9]+(?:\.[0-9]{2})?)"?/.exec(html);
    if (m) {
      const p = parseFloat(m[1]);
      if (isValidPrice(p)) price = p;
    }
  }

  if (!price) return null;
  return { price, productName: cleanTitle(extractMetaTitle(html), 'eBay'), site: 'eBay' };
}

export function parseCraigslist(html) {
  // Craigslist is simple HTML — price lives in <span class="price">
  const spanMatch = /<span[^>]*class=["'][^"']*price[^"']*["'][^>]*>\s*\$\s*([0-9,]+)\s*<\/span>/i.exec(html);
  if (spanMatch) {
    const price = parseFloat(spanMatch[1].replace(/,/g, ''));
    if (isValidPrice(price)) {
      return { price, productName: cleanTitle(extractMetaTitle(html), 'Craigslist'), site: 'Craigslist' };
    }
  }

  // Fallback: og:description often starts with price
  const descPatterns = [
    /<meta\s[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i,
    /<meta\s[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["'][^>]*\/?>/i,
  ];
  for (const p of descPatterns) {
    const m = p.exec(html);
    if (m) {
      const priceM = /\$\s*([0-9,]+)/.exec(m[1]);
      if (priceM) {
        const price = parseFloat(priceM[1].replace(/,/g, ''));
        if (isValidPrice(price)) {
          return { price, productName: cleanTitle(extractMetaTitle(html), 'Craigslist'), site: 'Craigslist' };
        }
      }
    }
  }

  // Last resort: first $X,XXX pattern in the page body
  const bodyMatch = /\$\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{2,6})(?:\.[0-9]{2})?/.exec(html);
  if (bodyMatch) {
    const price = parseFloat(bodyMatch[1].replace(/,/g, ''));
    if (isValidPrice(price)) {
      return { price, productName: cleanTitle(extractMetaTitle(html), 'Craigslist'), site: 'Craigslist' };
    }
  }

  return null;
}

export function parseCarvana(html) {
  // Carvana is a Next.js app — price lives in __NEXT_DATA__
  const nextData = parseNextData(html);
  if (nextData) {
    const price = deepFind(nextData, ['listPrice', 'price', 'salePrice'], 12);
    if (price && price >= 1000 && price <= 200000) {
      return { price, productName: cleanTitle(extractMetaTitle(html), 'Carvana'), site: 'Carvana' };
    }
  }

  // Fallback: og:price:amount or page JSON
  let price = extractMetaPrice(html);
  if (!price) {
    const m = /"(?:listPrice|price|salePrice)"\s*:\s*([0-9]+(?:\.[0-9]{2})?)/.exec(html);
    if (m) {
      const p = parseFloat(m[1]);
      if (p >= 1000 && p <= 200000) price = p;
    }
  }

  if (!price) return null;
  return { price, productName: cleanTitle(extractMetaTitle(html), 'Carvana'), site: 'Carvana' };
}

export function parseRedfin(html) {
  // Redfin is a Next.js app — try __NEXT_DATA__ first
  const nextData = parseNextData(html);
  if (nextData) {
    const price = deepFind(nextData, ['price', 'listPrice', 'lastSalePrice'], 12);
    if (price && price >= 10000 && price <= 10000000) {
      return { price, productName: 'Redfin Listing', site: 'Redfin' };
    }
  }

  // Fallback: Redfin embeds price in page JSON blobs
  const patterns = [
    /"price"\s*:\s*([0-9]{5,})/,
    /"listPrice"\s*:\s*([0-9]{5,})/,
    /\$\s*([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:\/mo)?/,
  ];
  for (const p of patterns) {
    const m = p.exec(html);
    if (m) {
      const price = parseFloat(m[1].replace(/,/g, ''));
      if (price >= 10000 && price <= 10000000) {
        return { price, productName: 'Redfin Listing', site: 'Redfin' };
      }
    }
  }

  return null;
}

export function parseWestElm(html) {
  // West Elm is on the same Williams-Sonoma platform as Pottery Barn
  const price = extractMetaPrice(html);
  if (!price) return null;
  return { price, productName: cleanTitle(extractMetaTitle(html), 'West Elm'), site: 'West Elm' };
}

export function parseNewegg(html) {
  // Newegg uses og:price:amount and JSON-LD
  let price = extractMetaPrice(html);

  if (!price) {
    const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = scriptRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(m[1]);
        const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
        for (const node of nodes) {
          if (node['@type'] !== 'Product') continue;
          const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
          for (const offer of offers) {
            const raw = offer?.price ?? offer?.lowPrice;
            if (raw == null) continue;
            const p = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
            if (isValidPrice(p)) { price = p; break; }
          }
          if (price) break;
        }
      } catch {}
      if (price) break;
    }
  }

  if (!price) return null;
  return { price, productName: cleanTitle(extractMetaTitle(html), 'Newegg'), site: 'Newegg' };
}

export function parseBHPhoto(html) {
  // B&H Photo uses og:price:amount and JSON-LD Product schema
  let price = extractMetaPrice(html);

  if (!price) {
    const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = scriptRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(m[1]);
        const nodes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
        for (const node of nodes) {
          if (node['@type'] !== 'Product') continue;
          const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
          for (const offer of offers) {
            const raw = offer?.price ?? offer?.lowPrice;
            if (raw == null) continue;
            const p = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
            if (isValidPrice(p)) { price = p; break; }
          }
          if (price) break;
        }
      } catch {}
      if (price) break;
    }
  }

  if (!price) return null;
  return { price, productName: cleanTitle(extractMetaTitle(html), 'B&H Photo Video'), site: 'B&H Photo' };
}
