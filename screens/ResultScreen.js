/**
 * ResultScreen.js
 *
 * Single product  → Impact-% hero + stat row + rationale + tipping point + actions
 * Multiple products → Stacked verdict cards, one per product
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import PaywallModal from '../components/PaywallModal';
import PressableScale from '../components/PressableScale';
import { saveCalculation } from '../utils/storage';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { DEFAULT_CURRENCY } from '../utils/currencies';
import { colors, fonts, spacing, radii } from '../theme';

export default function ResultScreen({ route, navigation }) {
  const { results, monthlyIncome, usageCount, currency = DEFAULT_CURRENCY } = route.params;

  const [savedIds, setSavedIds] = useState(new Set());
  const [showPaywall, setShowPaywall] = useState(usageCount > 3);

  const isSingle = results.length === 1;

  // Single: stagger 5 sections
  const heroAnim       = useRef(new Animated.Value(0)).current;
  const statsAnim      = useRef(new Animated.Value(0)).current;
  const rationaleAnim  = useRef(new Animated.Value(0)).current;
  const tippingAnim    = useRef(new Animated.Value(0)).current;
  const buttonsAnim    = useRef(new Animated.Value(0)).current;

  // Multi: one per card
  const cardAnims = useRef(results.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isSingle) {
      Animated.stagger(100, [
        Animated.timing(heroAnim,      { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(statsAnim,     { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(rationaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(tippingAnim,   { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonsAnim,   { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.stagger(80,
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
  // Single-product layout
  // -------------------------------------------------------------------------
  if (isSingle) {
    const result = results[0];
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Verdict hero */}
          <Animated.View style={[styles.hero, { opacity: heroAnim }]}>
            <Text style={[styles.heroPercent, { color: result.color }]}>
              {formatPercent(result.impactRatio)}
            </Text>
            <Text style={styles.heroLabel}>of your monthly income</Text>
            <Text style={styles.heroVerdict}>{result.verdict}</Text>
          </Animated.View>

          <View style={styles.divider} />

          {/* Stat row */}
          <Animated.View style={[styles.statsRow, { opacity: statsAnim }]}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Monthly cost</Text>
              <Text style={styles.statValue}>{formatCurrency(result.monthlyCost, currency)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Income impact</Text>
              <Text style={[styles.statValue, { color: result.color }]}>
                {formatPercent(result.impactRatio)}
              </Text>
            </View>
          </Animated.View>

          <View style={styles.divider} />

          {/* Rationale */}
          <Animated.View style={[styles.section, { opacity: rationaleAnim }]}>
            <Text style={styles.sectionLabel}>Why this verdict</Text>
            <Text style={styles.rationaleText}>{result.rationaleText}</Text>
            <Text style={styles.rationaleContext}>{result.displacementText}</Text>
          </Animated.View>

          <View style={styles.divider} />

          {/* Tipping point */}
          <Animated.View style={[styles.section, { opacity: tippingAnim }]}>
            <Text style={styles.sectionLabel}>Tipping point</Text>
            <View style={styles.tippingRow}>
              <View style={styles.tippingLeft}>
                <View style={[styles.tippingDot, { backgroundColor: colors.success }]} />
                <Text style={styles.tippingRowLabel}>Comfortable</Text>
              </View>
              <Text style={styles.tippingRowValue}>
                {formatCurrency(result.tippingPoints.comfortable, currency)} or less
              </Text>
            </View>
            <View style={styles.tippingRow}>
              <View style={styles.tippingLeft}>
                <View style={[styles.tippingDot, { backgroundColor: '#E09000' }]} />
                <Text style={styles.tippingRowLabel}>Max stretch</Text>
              </View>
              <Text style={styles.tippingRowValue}>
                {formatCurrency(result.tippingPoints.stretch, currency)} or less
              </Text>
            </View>
          </Animated.View>

          <View style={styles.divider} />

          {/* Actions */}
          <Animated.View style={[styles.actions, { opacity: buttonsAnim }]}>
            <PressableScale
              style={[styles.btnPrimary, savedIds.has(0) && styles.btnPrimaryDone]}
              onPress={() => handleSave(result, 0)}
              disabled={savedIds.has(0)}
            >
              <Text style={[styles.btnPrimaryText, savedIds.has(0) && styles.btnPrimaryTextDone]}>
                {savedIds.has(0) ? 'Saved ✓' : 'Save this check'}
              </Text>
            </PressableScale>
            <PressableScale style={styles.btnSecondary} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.btnSecondaryText}>Check another</Text>
            </PressableScale>
          </Animated.View>

        </ScrollView>
        <PaywallModal visible={showPaywall} onDismiss={() => setShowPaywall(false)} />
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Multi-product layout
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.multiContainer} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.multiHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.multiTitle}>{results.length} products compared</Text>
          <Text style={styles.multiSubtitle}>
            {formatCurrency(monthlyIncome, currency)}/mo income
          </Text>
        </View>

        {/* Cards */}
        {results.map((result, index) => (
          <Animated.View key={index} style={[styles.multiCard, { opacity: cardAnims[index] }]}>
            <View style={[styles.multiCardBar, { backgroundColor: result.color }]} />
            <View style={styles.multiCardContent}>

              {/* Top */}
              <View style={styles.multiCardTop}>
                <View style={styles.multiCardTopLeft}>
                  <Text style={styles.multiCardIndex}>Product {index + 1}</Text>
                  <Text style={[styles.multiCardVerdict, { color: result.color }]}>{result.verdict}</Text>
                </View>
                <Text style={[styles.multiCardPercent, { color: result.color }]}>
                  {formatPercent(result.impactRatio)}
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.multiCardStats}>
                <View style={styles.multiStat}>
                  <Text style={styles.multiStatLabel}>Monthly cost</Text>
                  <Text style={styles.multiStatValue}>{formatCurrency(result.monthlyCost, currency)}</Text>
                </View>
                <View style={styles.multiStat}>
                  <Text style={styles.multiStatLabel}>Comfortable at</Text>
                  <Text style={styles.multiStatValue}>
                    {formatCurrency(result.tippingPoints.comfortable, currency)}
                  </Text>
                </View>
              </View>

              {/* Short rationale */}
              <Text style={styles.multiRationale}>{result.rationaleShort}</Text>

              {/* Save */}
              <PressableScale
                style={[styles.multiSaveBtn, savedIds.has(index) && styles.multiSaveBtnDone]}
                onPress={() => handleSave(result, index)}
                disabled={savedIds.has(index)}
              >
                <Text style={[styles.multiSaveBtnText, savedIds.has(index) && styles.multiSaveBtnTextDone]}>
                  {savedIds.has(index) ? 'Saved ✓' : 'Save'}
                </Text>
              </PressableScale>

            </View>
          </Animated.View>
        ))}

        <PressableScale style={styles.btnPrimary} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.btnPrimaryText}>Check another</Text>
        </PressableScale>

      </ScrollView>
      <PaywallModal visible={showPaywall} onDismiss={() => setShowPaywall(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  // ── Single ──────────────────────────────────────────────────────────────
  container: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.bg,
  },

  back: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  backText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },

  // Hero
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroPercent: {
    fontFamily: fonts.bold,
    fontSize: 72,
    letterSpacing: -3,
    lineHeight: 76,
  },
  heroLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  heroVerdict: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  stat: { flex: 1 },
  statDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  statLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  // Section (rationale + tipping)
  section: { paddingHorizontal: spacing.lg },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  rationaleText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  rationaleContext: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Tipping
  tippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tippingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tippingDot: { width: 8, height: 8, borderRadius: 4 },
  tippingRowLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary },
  tippingRowValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.textPrimary },

  // Actions
  actions: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: radii.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryDone: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.teal },
  btnPrimaryText: { fontFamily: fonts.bold, fontSize: 15, color: '#0F0F0F' },
  btnPrimaryTextDone: { color: colors.teal },
  btnSecondary: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textSecondary },

  // ── Multi ────────────────────────────────────────────────────────────────
  multiContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.bg,
  },
  multiHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  multiTitle: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  multiSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },

  // Multi card
  multiCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  multiCardBar: { height: 3 },
  multiCardContent: { padding: spacing.md },
  multiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  multiCardTopLeft: {},
  multiCardIndex: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  multiCardVerdict: {
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  multiCardPercent: {
    fontFamily: fonts.bold,
    fontSize: 28,
    letterSpacing: -1,
  },

  // Multi stats
  multiCardStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  multiStat: {},
  multiStatLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  multiStatValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },

  multiRationale: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },

  multiSaveBtn: {
    height: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiSaveBtnDone: { backgroundColor: colors.surface, borderColor: colors.teal },
  multiSaveBtnText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textSecondary },
  multiSaveBtnTextDone: { color: colors.teal },
});
