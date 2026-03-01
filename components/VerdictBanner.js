/**
 * VerdictBanner.js
 *
 * The large colored banner shown at the top of ResultScreen.
 * It receives the emoji, text, and background color as props
 * so the same component works for all three verdict states.
 *
 * Props:
 *   emoji   {string}  - e.g. "✅", "⚠️", "🚫"
 *   verdict {string}  - e.g. "You can handle this"
 *   color   {string}  - hex color for the background, e.g. "#22C55E"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VerdictBanner({ emoji, verdict, color }) {
  return (
    <View style={[styles.banner, { backgroundColor: color }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.verdictText}>{verdict}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  verdictText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
});
