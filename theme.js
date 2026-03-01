/**
 * theme.js
 *
 * Design system constants for AffordIt.
 * All screens and components import from here so colors, type, and
 * spacing stay consistent across the entire app.
 */

export const colors = {
  // Backgrounds
  bg: '#0F0F0F',          // Page background
  surface: '#1A1A1A',     // Card / input background
  surfaceHigh: '#242424', // Elevated surface (e.g. modal sheet)

  // Brand
  teal: '#00C48C',        // Primary accent — CTA buttons, active states, borders
  tealDim: '#00C48C22',   // Teal at ~13% opacity — subtle highlights

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#666666',

  // Borders
  border: '#2A2A2A',      // Subtle separator / card border
  borderMid: '#333333',

  // Verdict
  success: '#00C48C',
  warning: '#FFB547',
  danger: '#FF6B6B',

  // Utility
  overlay: 'rgba(0,0,0,0.75)',
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const typography = {
  hero: { fontSize: 48, fontWeight: '800', letterSpacing: -1.5 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 22, fontWeight: '700' },
  subheading: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '400' },
  price: { fontSize: 36, fontWeight: '800' },
};

// 8-px grid
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 100,
};
