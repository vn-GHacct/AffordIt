/**
 * VerdictBanner.js
 *
 * The large colored banner shown at the top of ResultScreen.
 * It receives the emoji, text, and background color as props
 * so the same component works for all three verdict states.
 *
 * Full-width — no horizontal margin, no border radius.
 * Handles its own fade + translateY entrance animation.
 *
 * Props:
 *   emoji   {string}  - e.g. "✅", "⚠️", "🚫"
 *   verdict {string}  - e.g. "You can handle this"
 *   color   {string}  - hex color for the background, e.g. "#00C48C"
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function VerdictBanner({ emoji, verdict, color }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: color, opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.verdictText}>{verdict}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    // Full-width: no borderRadius, no horizontal margin
    paddingVertical: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginBottom: 24,
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
