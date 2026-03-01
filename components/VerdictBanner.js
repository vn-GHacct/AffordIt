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
    borderRadius: 24,
    paddingVertical: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 14,
  },
  verdictText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
});
