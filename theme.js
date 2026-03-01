/**
 * theme.js
 *
 * Design system constants for AffordIt.
 * All screens and components import from here so colors, type, and
 * spacing stay consistent across the entire app.
 */

export const colors = {
  // Backgrounds
  bg: '#FFFFFF',          // Page background
  surface: '#F5F5F5',     // Card / input background
  surfaceHigh: '#EEEEEE', // Elevated surface (e.g. modal sheet)

  // Brand
  teal: '#00C48C',        // Primary accent — CTA buttons, active states, borders
  tealDim: '#00C48C18',   // Teal at ~10% opacity — subtle highlights

  // Text
  textPrimary: '#0D0D0D',
  textSecondary: '#555555',
  textMuted: '#999999',

  // Borders
  border: '#E8E8E8',      // Subtle separator / card border
  borderMid: '#DDDDDD',

  // Verdict
  success: '#00C48C',
  warning: '#E09000',     // Slightly deeper amber — better contrast on white
  danger: '#E0393E',      // Slightly deeper red — better contrast on white

  // Utility
  overlay: 'rgba(0,0,0,0.5)',
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const fonts = {
  regular:  'Inter_400Regular',
  medium:   'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold:     'Inter_700Bold',
};

export const typography = {
  hero:       { fontFamily: 'Inter_700Bold',     fontSize: 42, letterSpacing: -1.5 },
  title:      { fontFamily: 'Inter_700Bold',     fontSize: 28, letterSpacing: -0.5 },
  heading:    { fontFamily: 'Inter_700Bold',     fontSize: 22 },
  subheading: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  body:       { fontFamily: 'Inter_400Regular',  fontSize: 16, lineHeight: 24 },
  label:      { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  caption:    { fontFamily: 'Inter_400Regular',  fontSize: 12 },
  price:      { fontFamily: 'Inter_700Bold',     fontSize: 36 },
  numeric:    { fontFamily: 'Inter_700Bold',     fontSize: 56, letterSpacing: -2 },
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
