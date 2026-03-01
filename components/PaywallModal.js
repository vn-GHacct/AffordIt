/**
 * PaywallModal.js
 *
 * A bottom-sheet style modal that appears after the user's 3rd free calculation.
 * The "Unlock Now" button is a placeholder — it logs to the console but doesn't
 * process any real payment. You'd wire up Apple/Google In-App Purchase here later.
 *
 * Props:
 *   visible   {boolean}  - Whether the modal is showing
 *   onDismiss {function} - Called when the user taps "Maybe Later"
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import PressableScale from './PressableScale';
import { colors, fonts, spacing, radii } from '../theme';

const FEATURES = [
  'Unlimited affordability checks',
  'Save and compare past results',
  'URL price fetcher — no manual entry',
];

export default function PaywallModal({ visible, onDismiss }) {
  const handleUnlock = () => {
    // TODO: Integrate with expo-in-app-purchases or RevenueCat
    console.log('Unlock Now pressed — wire up payment here');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      {/* Dark semi-transparent backdrop */}
      <View style={styles.overlay}>
        {/* The dark card that slides up from the bottom */}
        <View style={styles.sheet}>
          {/* Teal top accent border */}
          <View style={styles.topAccent} />

          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Lock emoji */}
          <Text style={styles.lockEmoji}>🔓</Text>

          <Text style={styles.headline}>Unlock unlimited checks</Text>

          <Text style={styles.subtext}>
            You've used your 3 free calculations. Unlock the full app to keep
            making smart money decisions — just once, no subscription.
          </Text>

          {/* Feature list with teal checkmarks */}
          <View style={styles.featureList}>
            {FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Hero price */}
          <Text style={styles.price}>$6.99</Text>
          <Text style={styles.priceCaption}>one-time payment</Text>

          <PressableScale style={styles.unlockButton} onPress={handleUnlock}>
            <Text style={styles.unlockText}>Unlock Now</Text>
          </PressableScale>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  // Teal accent line at very top of sheet
  topAccent: {
    width: '100%',
    height: 3,
    backgroundColor: colors.teal,
    marginBottom: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  lockEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtext: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: spacing.lg,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkmark: {
    fontFamily: fonts.bold,
    color: colors.teal,
    fontSize: 14,
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  featureText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 4,
  },
  priceCaption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  unlockButton: {
    backgroundColor: colors.teal,
    borderRadius: radii.md,
    height: 54,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  unlockText: {
    fontFamily: fonts.bold,
    color: '#0F0F0F',
    fontSize: 16,
  },
  dismissButton: {
    paddingVertical: 12,
  },
  dismissText: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    fontSize: 14,
  },
});
