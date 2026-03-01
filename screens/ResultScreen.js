/**
 * ResultScreen.js
 *
 * Displays verdict(s) after the user taps "Check It" on HomeScreen.
 * Receives a `results` array — one item for a single check, up to 5 for
 * a multi-product comparison.
 *
 * Single product  → Full-screen layout with VerdictBanner + stat cards + quote block
 * Multiple products → Stacked compact verdict cards, one per product
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
  const { results, monthlyIncome, usageCount, currency = DEFAULT_CURRENCY } = route.params;

  const [savedIds, setSavedIds] = useState(new Set());
  const [showPaywall, setShowPaywall] = useState(usageCount > 3);

  const isSingle = results.length === 1;

  // Single-product animations (5-step stagger)
  const stat1Anim = useRef(new Animated.Value(0)).current;
  const stat2Anim = useRef(new Animated.Value(0)).current;
  const displacementAnim = useRef(new Animated.Value(0)).current;
  const tippingAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  // Multi-product animations (one per card)
  const cardAnims = useRef(results.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isSingle) {
      Animated.stagger(120, [
        Animated.timing(stat1Anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(stat2Anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(displacementAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(tippingAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonsAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.stagger(100,
        cardAnims.map(anim =>
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true })
        )
      ).start();
    }
  }, []);

  const handleSave = async (result, index) => {
    const label = `${result.isMonthlyPayment ? 'Payment of' : 'Purchase of'} ${currency.symbol}${Number(result.purchaseAmount).toLocaleString()}`;
    await saveCalculation({
      verdict: result.verdict,
      color: result.color,
      emoji: result.emoji,
      monthlyCost: result.monthlyCost,
      impactRatio: result.impactRatio,
      label,
      currency,
    });
    setSavedIds(prev => new Set([...prev, index]));
  };

  // -------------------------------------------------------------------------
  // Single-product layout — identical to the original design
  // -------------------------------------------------------------------------
  if (isSingle) {
    const result = results[0];
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <VerdictBanner emoji={result.emoji} verdict={result.verdict} color={result.color} />

          <View style={styles.statsRow}>
            <Animated.View style={[styles.statCard, { opacity: stat1Anim }]}>
              <Text style={styles.statLabel}>Monthly cost</Text>
              <Text style={styles.statValue}>{formatCurrency(result.monthlyCost, currency)}</Text>
            </Animated.View>
            <Animated.View style={[styles.statCard, { opacity: stat2Anim }]}>
              <Text style={styles.statLabel}>% of income</Text>
              <Text style={[styles.statValue, { color: result.color }]}>
                {formatPercent(result.impactRatio)}
              </Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.quoteBlock, { opacity: displacementAnim }]}>
            <View style={[styles.quoteBorder, { backgroundColor: result.color }]} />
            <View style={styles.quoteContent}>
              <Text style={styles.quoteLabel}>Why this verdict</Text>
              <Text style={styles.quoteText}>{result.rationaleText}</Text>
              <Text style={styles.quoteContext}>{result.displacementText}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.tippingBlock, { opacity: tippingAnim }]}>
            <Text style={styles.tippingTitle}>Tipping point</Text>
            <View style={styles.tippingRow}>
              <View style={[styles.tippingDot, { backgroundColor: '#00C48C' }]} />
              <Text style={styles.tippingLabel}>Comfortable</Text>
              <Text style={styles.tippingValue}>
                {formatCurrency(result.tippingPoints.comfortable, currency)} or less
              </Text>
            </View>
            <View style={styles.tippingRow}>
              <View style={[styles.tippingDot, { backgroundColor: '#FFB547' }]} />
              <Text style={styles.tippingLabel}>Max stretch</Text>
              <Text style={styles.tippingValue}>
                {formatCurrency(result.tippingPoints.stretch, currency)} or less
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.buttonGroup, { opacity: buttonsAnim }]}>
            <PressableScale
              style={[styles.saveButton, savedIds.has(0) && styles.saveButtonSaved]}
              onPress={() => handleSave(result, 0)}
              disabled={savedIds.has(0)}
            >
              <Text style={[styles.saveButtonText, savedIds.has(0) && styles.saveButtonTextSaved]}>
                {savedIds.has(0) ? 'Saved ✓' : 'Save this'}
              </Text>
            </PressableScale>
            <PressableScale
              style={styles.checkButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.checkButtonText}>Check another</Text>
            </PressableScale>
          </Animated.View>
        </ScrollView>

        <PaywallModal visible={showPaywall} onDismiss={() => setShowPaywall(false)} />
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Multi-product layout — stacked verdict cards
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.multiContainer}>
        {/* Header */}
        <View style={styles.multiHeader}>
          <Text style={styles.multiTitle}>{results.length} products compared</Text>
          <Text style={styles.multiSubtitle}>
            Based on {formatCurrency(monthlyIncome, currency)}/mo income
          </Text>
        </View>

        {/* Verdict cards */}
        {results.map((result, index) => (
          <Animated.View
            key={index}
            style={[styles.multiCard, { opacity: cardAnims[index] }]}
          >
            {/* Colored left accent */}
            <View style={[styles.multiCardAccent, { backgroundColor: result.color }]} />

            <View style={styles.multiCardBody}>
              {/* Top row: emoji + label + verdict */}
              <View style={styles.multiCardTop}>
                <Text style={styles.multiCardEmoji}>{result.emoji}</Text>
                <View style={styles.multiCardMeta}>
                  <Text style={styles.multiCardLabel}>Product {index + 1}</Text>
                  <Text style={[styles.multiCardVerdict, { color: result.color }]}>
                    {result.verdict}
                  </Text>
                </View>
              </View>

              {/* Stat row */}
              <View style={styles.multiCardStats}>
                <View style={styles.multiCardStat}>
                  <Text style={styles.multiCardStatLabel}>Monthly cost</Text>
                  <Text style={styles.multiCardStatValue}>
                    {formatCurrency(result.monthlyCost, currency)}
                  </Text>
                </View>
                <View style={styles.multiCardDivider} />
                <View style={styles.multiCardStat}>
                  <Text style={styles.multiCardStatLabel}>% of income</Text>
                  <Text style={[styles.multiCardStatValue, { color: result.color }]}>
                    {formatPercent(result.impactRatio)}
                  </Text>
                </View>
              </View>

              {/* Rationale short */}
              <Text style={[styles.multiRationale, { color: result.color }]}>
                {result.rationaleShort}
              </Text>

              {/* Per-card save button */}
              <PressableScale
                style={[
                  styles.multiSaveButton,
                  savedIds.has(index) && styles.multiSaveButtonSaved,
                ]}
                onPress={() => handleSave(result, index)}
                disabled={savedIds.has(index)}
              >
                <Text style={[
                  styles.multiSaveButtonText,
                  savedIds.has(index) && styles.multiSaveButtonTextSaved,
                ]}>
                  {savedIds.has(index) ? 'Saved ✓' : 'Save this'}
                </Text>
              </PressableScale>
            </View>
          </Animated.View>
        ))}

        {/* Check another */}
        <PressableScale
          style={styles.checkButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.checkButtonText}>Check another</Text>
        </PressableScale>
      </ScrollView>

      <PaywallModal visible={showPaywall} onDismiss={() => setShowPaywall(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  // ---- Single-product styles ----
  container: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.bg,
  },
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
  statLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, textAlign: 'center' },
  statValue: { ...typography.subheading, color: colors.textPrimary, textAlign: 'center' },
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
  quoteBorder: { width: 3 },
  quoteContent: { flex: 1, padding: spacing.md },
  quoteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  quoteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  quoteContext: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  buttonGroup: { paddingHorizontal: spacing.lg, gap: 12 },
  saveButton: {
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.teal,
  },
  saveButtonSaved: { backgroundColor: colors.teal, borderColor: colors.teal },
  saveButtonText: { color: colors.teal, fontSize: 16, fontWeight: '700' },
  saveButtonTextSaved: { color: '#0F0F0F' },
  checkButton: {
    backgroundColor: colors.teal,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  checkButtonText: { color: '#0F0F0F', fontSize: 16, fontWeight: '700' },

  // ---- Multi-product styles ----
  multiContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.bg,
  },
  multiHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  multiTitle: { ...typography.title, color: colors.textPrimary, marginBottom: 4 },
  multiSubtitle: { fontSize: 14, color: colors.textSecondary },
  multiCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  multiCardAccent: { width: 4 },
  multiCardBody: { flex: 1, padding: spacing.md },
  multiCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  multiCardEmoji: { fontSize: 32, marginRight: 12 },
  multiCardMeta: { flex: 1 },
  multiCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  multiCardVerdict: { fontSize: 16, fontWeight: '700' },
  multiCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  multiCardStat: { flex: 1, alignItems: 'center' },
  multiCardDivider: { width: 1, height: 32, backgroundColor: colors.border },
  multiCardStatLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  multiCardStatValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  // ---- Tipping point styles ----
  tippingBlock: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  tippingTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  tippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tippingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tippingLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  tippingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  multiRationale: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  multiSaveButton: {
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.teal,
  },
  multiSaveButtonSaved: { backgroundColor: colors.teal, borderColor: colors.teal },
  multiSaveButtonText: { color: colors.teal, fontSize: 13, fontWeight: '700' },
  multiSaveButtonTextSaved: { color: '#0F0F0F' },
});
