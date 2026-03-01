/**
 * HomeScreen.js
 *
 * The first screen users see when they open the app.
 * They enter their monthly income and the purchase they're considering,
 * then tap "Check It" to get a verdict.
 *
 * This screen does NOT contain any verdict logic — it just collects
 * input, calls getVerdict() from utils/calculations.js, and passes
 * the result to ResultScreen via navigation params.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { getVerdict } from '../utils/calculations';
import { incrementUsageCount } from '../utils/storage';
import { fetchPriceFromUrl } from '../utils/urlScraper';
import { CURRENCIES, DEFAULT_CURRENCY } from '../utils/currencies';
import PressableScale from '../components/PressableScale';
import { colors, spacing, radii, typography } from '../theme';

/**
 * Formats a raw numeric string with thousand-separator commas.
 * Preserves a trailing decimal point and up to the digits already typed after it.
 * e.g. "4500" → "4,500"   "1234.5" → "1,234.5"
 */
function formatInputValue(text) {
  // Allow only digits and a single decimal point
  const cleaned = text.replace(/[^0-9.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  // If there are multiple dots, keep only everything up to the second one
  const safe =
    dotIndex === -1
      ? cleaned
      : cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
  const [intPart, ...rest] = safe.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return rest.length ? `${withCommas}.${rest.join('')}` : withCommas;
}

export default function HomeScreen({ navigation }) {
  // --- State ---
  const [income, setIncome] = useState('');
  const [amount, setAmount] = useState('');
  const [isMonthlyPayment, setIsMonthlyPayment] = useState(false);
  const [isAnnualIncome, setIsAnnualIncome] = useState(false);
  const [error, setError] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [priceConfirmation, setPriceConfirmation] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [incomeFocused, setIncomeFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [urlFocused, setUrlFocused] = useState(false);

  // --- Handlers ---
  const handleFetchPrice = async () => {
    setError('');
    setPriceConfirmation('');
    setIsFetching(true);
    try {
      const { price } = await fetchPriceFromUrl(productUrl.trim());
      setAmount(formatInputValue(price.toFixed(2)));
      setPriceConfirmation(`Found: ${currency.symbol}${price.toFixed(2)}`);
      setProductUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCheck = async () => {
    setError('');

    // Strip commas so "4,500" parses correctly
    const rawIncome = parseFloat(income.replace(/,/g, ''));
    const purchaseAmount = parseFloat(amount.replace(/,/g, ''));

    // Convert annual → monthly if needed
    const monthlyIncome = isAnnualIncome ? rawIncome / 12 : rawIncome;

    // Validate inputs before running the calculation
    if (!rawIncome || rawIncome <= 0) {
      setError(`Please enter your ${isAnnualIncome ? 'annual' : 'monthly'} take-home income.`);
      return;
    }
    if (!purchaseAmount || purchaseAmount <= 0) {
      setError('Please enter the purchase amount.');
      return;
    }

    // Run the verdict logic (all math stays in calculations.js)
    const result = getVerdict(monthlyIncome, purchaseAmount, isMonthlyPayment);

    // Track usage for the freemium gate
    const usageCount = await incrementUsageCount();

    // Navigate to ResultScreen, passing everything it needs to display
    navigation.navigate('Result', {
      ...result,
      monthlyIncome,
      purchaseAmount,
      isMonthlyPayment,
      usageCount,
      currency,
    });
  };

  // --- Render ---
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* App pill label */}
          <View style={styles.pillWrap}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>AFFORD IT</Text>
            </View>
          </View>

          {/* Hero heading */}
          <Text style={styles.hero}>Can you{'\n'}afford it?</Text>
          <Text style={styles.subtext}>
            30-second gut check before any big purchase
          </Text>

          {/* --- Currency picker --- */}
          <Text style={styles.label}>Currency</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.currencyRow}
            keyboardShouldPersistTaps="handled"
          >
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.currencyPill,
                  currency.code === c.code && styles.currencyPillActive,
                ]}
                onPress={() => setCurrency(c)}
              >
                <Text
                  style={[
                    styles.currencyPillText,
                    currency.code === c.code && styles.currencyPillTextActive,
                  ]}
                >
                  {c.symbol} {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* --- Income input card --- */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Take-home income</Text>
            <View style={styles.incomePeriodToggle}>
              <TouchableOpacity
                style={[styles.periodOption, !isAnnualIncome && styles.periodOptionActive]}
                onPress={() => setIsAnnualIncome(false)}
              >
                <Text style={[styles.periodText, !isAnnualIncome && styles.periodTextActive]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodOption, isAnnualIncome && styles.periodOptionActive]}
                onPress={() => setIsAnnualIncome(true)}
              >
                <Text style={[styles.periodText, isAnnualIncome && styles.periodTextActive]}>
                  Annual
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.inputCard, incomeFocused && styles.inputCardFocused]}>
            <Text style={styles.prefix}>{currency.symbol}</Text>
            <TextInput
              style={styles.input}
              placeholder={isAnnualIncome ? 'e.g. 54,000' : 'e.g. 4,500'}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={income}
              onChangeText={(text) => setIncome(formatInputValue(text))}
              returnKeyType="next"
              onFocus={() => setIncomeFocused(true)}
              onBlur={() => setIncomeFocused(false)}
            />
          </View>

          {/* --- Toggle: Lump sum vs. Monthly payment --- */}
          <Text style={styles.label}>What are you pricing out?</Text>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleOption, !isMonthlyPayment && styles.toggleActive]}
              onPress={() => setIsMonthlyPayment(false)}
            >
              <Text style={[styles.toggleText, !isMonthlyPayment && styles.toggleTextActive]}>
                Lump sum price
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleOption, isMonthlyPayment && styles.toggleActive]}
              onPress={() => setIsMonthlyPayment(true)}
            >
              <Text style={[styles.toggleText, isMonthlyPayment && styles.toggleTextActive]}>
                Monthly payment
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- Amount input card --- */}
          <View style={[styles.inputCard, amountFocused && styles.inputCardFocused]}>
            <Text style={styles.prefix}>{currency.symbol}</Text>
            <TextInput
              style={styles.input}
              placeholder={
                isMonthlyPayment ? 'Monthly payment (e.g. 350)' : 'Purchase price (e.g. 1,200)'
              }
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={(text) => setAmount(formatInputValue(text))}
              returnKeyType="done"
              onSubmitEditing={handleCheck}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
            />
          </View>

          {/* --- "or" divider --- */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or paste a product URL</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* --- URL price fetcher --- */}
          <View style={[styles.inputCard, urlFocused && styles.inputCardFocused]}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Works on smaller shops, not Amazon/Etsy"
              placeholderTextColor={colors.textMuted}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              value={productUrl}
              onChangeText={(text) => {
                setProductUrl(text);
                setPriceConfirmation('');
              }}
              returnKeyType="go"
              onSubmitEditing={handleFetchPrice}
              onFocus={() => setUrlFocused(true)}
              onBlur={() => setUrlFocused(false)}
            />
          </View>

          {!!priceConfirmation && (
            <Text style={styles.priceConfirmation}>{priceConfirmation}</Text>
          )}

          <PressableScale
            onPress={handleFetchPrice}
            disabled={isFetching}
            style={[styles.fetchButton, isFetching && styles.fetchButtonDisabled]}
          >
            {isFetching ? (
              <ActivityIndicator color={colors.teal} size="small" />
            ) : (
              <Text style={styles.fetchButtonText}>Fetch Price</Text>
            )}
          </PressableScale>

          {/* Inline error message */}
          {!!error && <Text style={styles.error}>{error}</Text>}

          {/* --- Primary CTA --- */}
          <PressableScale onPress={handleCheck} style={styles.button}>
            <Text style={styles.buttonText}>Check It</Text>
          </PressableScale>

          {/* --- Link to saved calculations --- */}
          <TouchableOpacity onPress={() => navigation.navigate('Saved')}>
            <Text style={styles.savedLink}>View saved checks</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    backgroundColor: colors.bg,
  },
  pillWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pill: {
    backgroundColor: colors.tealDim,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.teal + '55',
  },
  pillText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  hero: {
    ...typography.hero,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtext: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  // Row that holds the label + the monthly/annual mini-toggle
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  incomePeriodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodOption: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  periodOptionActive: {
    backgroundColor: colors.teal,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  periodTextActive: {
    color: '#0F0F0F',
  },
  // Currency picker row
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  currencyPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  currencyPillActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  currencyPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  currencyPillTextActive: {
    color: '#0F0F0F',
  },
  // Input cards
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  inputCardFocused: {
    borderColor: colors.teal,
  },
  prefix: {
    fontSize: 22,
    color: colors.textMuted,
    marginRight: 8,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 22,
    color: colors.textPrimary,
    paddingVertical: 16,
    fontWeight: '500',
  },
  // Pill toggle
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: radii.sm + 2,
  },
  toggleActive: {
    backgroundColor: colors.teal,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#0F0F0F',
    fontWeight: '700',
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  // Fetch button
  fetchButton: {
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  fetchButtonDisabled: {
    borderColor: colors.border,
  },
  fetchButtonText: {
    color: colors.teal,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  priceConfirmation: {
    color: colors.success,
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 10,
    marginLeft: 4,
  },
  // Primary CTA
  button: {
    backgroundColor: colors.teal,
    borderRadius: radii.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    height: 56,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#0F0F0F',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  savedLink: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
