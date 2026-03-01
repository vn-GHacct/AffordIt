/**
 * currencies.js
 *
 * Supported currencies for the AffordIt app.
 * Each entry has:
 *   code     - ISO 4217 currency code
 *   symbol   - Display symbol shown in the UI
 *   name     - Full name shown in the picker
 *   decimals - Number of decimal places (JPY = 0, most others = 2)
 */

export const CURRENCIES = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',        decimals: 2 },
  { code: 'EUR', symbol: '€',   name: 'Euro',             decimals: 2 },
  { code: 'GBP', symbol: '£',   name: 'British Pound',    decimals: 2 },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',  decimals: 2 },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar',decimals: 2 },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',     decimals: 0 },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',     decimals: 2 },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso',     decimals: 2 },
  { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real',   decimals: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc',      decimals: 2 },
];

export const DEFAULT_CURRENCY = CURRENCIES[0]; // USD
