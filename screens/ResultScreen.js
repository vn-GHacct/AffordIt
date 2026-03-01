/**
 * ResultScreen.js
 *
 * Displays the verdict after the user taps "Check It" on HomeScreen.
 * All data arrives via route.params — this screen only renders, it
 * doesn't recalculate anything.
 *
 * Also manages:
 *  - Saving a calculation to AsyncStorage
 *  - Showing the PaywallModal if the user has exceeded 3 free calculations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
} from 'react-native';
import VerdictBanner from '../components/VerdictBanner';
import PaywallModal from '../components/PaywallModal';
import PressableScale from '../components/PressableScale';
import { saveCalculation } from '../utils/storage';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { DEFAULT_CURRENCY } from '../utils/currencies';
import { colors, spacing, radii, typography } from '../theme';

export default function ResultScreen({ route, navigation }) {
  // Everything we need was passed in from HomeScreen
  const {
    verdict,
    color,
    emoji,
    monthlyCost,
    impactRatio,
    displacementText,
    monthlyIncome,
    purchaseAmount,
    isMonthlyPayment,
    usageCount,
    currency = DEFAULT_CURRENCY,
  } = route.params;

  const [saved, setSaved] = useState(false);

  // Show the paywall if this was their 4th+ calculation (usageCount > 3)
  const [showPaywall, setShowPaywall] = useState(usageCount > 3);

  // Stagger animation values for stat1 → stat2 → displacement → buttons
  const stat1Opacity = useRef(new Animated.Value(0)).current;
  const stat2Opacity = useRef(new Animated.Value(0)).current;
  const displacementOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(stat1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(stat2Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(displacementOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(buttonsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSave = async () => {
    // Build a human-readable label for the saved card
    const label = `${isMonthlyPayment ? 'Payment of' : 'Purchase of'} $${Number(
      purchaseAmount
    ).toLocaleString()}`;

    await saveCalculation({
      verdict,
      color,
      emoji,
      monthlyCost,
      impactRatio,
      label,
      currency,
    });

    setSaved(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ScrollView has no horizontal padding — VerdictBanner spans full width */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* Full-width verdict band */}
        <VerdictBanner emoji={emoji} verdict={verdict} color={color} />

        {/* Two stat cards side by side */}
        <View style={styles.statsRow}>
          <Animated.View style={[styles.statCard, { opacity: stat1Opacity }]}>
            <Text style={styles.statLabel}>Monthly cost</Text>
            <Text style={styles.statValue}>{formatCurrency(monthlyCost, currency)}</Text>
          </Animated.View>

          <Animated.View style={[styles.statCard, { opacity: stat2Opacity }]}>
            <Text style={styles.statLabel}>% of income</Text>
            <Text style={[styles.statValue, { color }]}>{formatPercent(impactRatio)}</Text>
          </Animated.View>
        </View>

        {/* Quote-style displacement block */}
        <Animated.View style={[styles.quoteBlock, { opacity: displacementOpacity }]}>
          <View style={[styles.quoteBorder, { backgroundColor: colors.teal }]} />
          <Text style={styles.quoteText}>{displacementText}</Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttonGroup, { opacity: buttonsOpacity }]}>
          {/* Save button — outlined teal, turns solid green when saved */}
          <PressableScale
            style={[styles.saveButton, saved && styles.saveButtonSaved]}
            onPress={handleSave}
            disabled={saved}
          >
            <Text style={[styles.saveButtonText, saved && styles.saveButtonTextSaved]}>
              {saved ? 'Saved ✓' : 'Save this'}
            </Text>
          </PressableScale>

          {/* Check another — filled teal */}
          <PressableScale
            style={styles.checkButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.checkButtonText}>Check another</Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>

      {/* Paywall modal — slides up over the result after 3 free uses */}
      <PaywallModal
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // No horizontal padding here — banner spans full width
  container: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.bg,
  },
  // Two stat cards side by side
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  statValue: {
    ...typography.subheading,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  // Quote-style displacement block
  quoteBlock: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quoteBorder: {
    width: 3,
  },
  quoteText: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    fontStyle: 'italic',
    padding: spacing.md,
  },
  // Button group
  buttonGroup: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  // Outlined teal save button
  saveButton: {
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.teal,
  },
  saveButtonSaved: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  saveButtonText: {
    color: colors.teal,
    fontSize: 16,
    fontWeight: '700',
  },
  saveButtonTextSaved: {
    color: '#0F0F0F',
  },
  // Filled teal check-another button
  checkButton: {
    backgroundColor: colors.teal,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#0F0F0F',
    fontSize: 16,
    fontWeight: '700',
  },
});
