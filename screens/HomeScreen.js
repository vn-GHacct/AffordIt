/**
 * HomeScreen.js
 *
 * The first screen users see. Collects income and one or more purchase amounts,
 * then navigates to ResultScreen with an array of verdict results.
 * Up to 5 products can be compared in one check.
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
import { fetchPriceFromUrl } from '../utils/urlLookup';
import { CURRENCIES, DEFAULT_CURRENCY } from '../utils/currencies';
import PressableScale from '../components/PressableScale';
import { colors, spacing, radii, typography } from '../theme';

const MAX_PRODUCTS = 5;

/**
 * Formats a raw numeric string with thousand-separator commas.
 * e.g. "4500" → "4,500"   "1234.5" → "1,234.5"
 */
function formatInputValue(text) {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  const safe =
    dotIndex === -1
      ? cleaned
      : cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
  const [intPart, ...rest] = safe.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return rest.length ? `${withCommas}.${rest.join('')}` : withCommas;
}

function makeProduct() {
  return { id: String(Date.now()) + String(Math.random()), amount: '', isMonthlyPayment: false, focused: false };
}

export default function HomeScreen({ navigation }) {
  // --- State ---
  const [income, setIncome] = useState('');
  const [isAnnualIncome, setIsAnnualIncome] = useState(false);
  const [products, setProducts] = useState([makeProduct()]);
  const [error, setError] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [priceConfirmation, setPriceConfirmation] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [incomeFocused, setIncomeFocused] = useState(false);
  const [urlFocused, setUrlFocused] = useState(false);

  // --- Product list handlers ---
  const addProduct = () => {
    if (products.length >= MAX_PRODUCTS) return;
    setProducts(prev => [...prev, makeProduct()]);
  };

  const removeProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProduct = (id, key, value) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));
  };

  // --- URL fetcher ---
  const handleFetchPrice = async () => {
    setError('');
    setPriceConfirmation('');
    setIsFetching(true);
    try {
      const { price, productName, site } = await fetchPriceFromUrl(productUrl.trim());
      // Fill into the first product's amount
      updateProduct(products[0].id, 'amount', formatInputValue(price.toFixed(currency.decimals)));
      const label = productName
        ? `Found on ${site}: ${currency.symbol}${price.toFixed(currency.decimals)} — ${productName}`
        : `Found on ${site}: ${currency.symbol}${price.toFixed(currency.decimals)}`;
      setPriceConfirmation(label);
      setProductUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  // --- Check handler ---
  const handleCheck = async () => {
    setError('');

    const rawIncome = parseFloat(income.replace(/,/g, ''));
    const monthlyIncome = isAnnualIncome ? rawIncome / 12 : rawIncome;

    if (!rawIncome || rawIncome <= 0) {
      setError(`Please enter your ${isAnnualIncome ? 'annual' : 'monthly'} take-home income.`);
      return;
    }

    const results = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const purchaseAmount = parseFloat(p.amount.replace(/,/g, ''));
      if (!purchaseAmount || purchaseAmount <= 0) {
        setError(
          products.length > 1
            ? `Enter an amount for product ${i + 1}.`
            : 'Please enter the purchase amount.'
        );
        return;
      }
      const result = getVerdict(monthlyIncome, purchaseAmount, p.isMonthlyPayment);
      results.push({ ...result, purchaseAmount, isMonthlyPayment: p.isMonthlyPayment });
    }

    const usageCount = await incrementUsageCount();

    navigation.navigate('Result', { results, monthlyIncome, usageCount, currency });
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
          {/* Pill label */}
          <View style={styles.pillWrap}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>AFFORD IT</Text>
            </View>
          </View>

          <Text style={styles.hero}>Can you{'\n'}afford it?</Text>
          <Text style={styles.subtext}>
            30-second gut check before any big purchase
          </Text>

          {/* Currency picker */}
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
                style={[styles.currencyPill, currency.code === c.code && styles.currencyPillActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[styles.currencyPillText, currency.code === c.code && styles.currencyPillTextActive]}>
                  {c.symbol} {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Income input */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Take-home income</Text>
            <View style={styles.incomePeriodToggle}>
              <TouchableOpacity
                style={[styles.periodOption, !isAnnualIncome && styles.periodOptionActive]}
                onPress={() => setIsAnnualIncome(false)}
              >
                <Text style={[styles.periodText, !isAnnualIncome && styles.periodTextActive]}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodOption, isAnnualIncome && styles.periodOptionActive]}
                onPress={() => setIsAnnualIncome(true)}
              >
                <Text style={[styles.periodText, isAnnualIncome && styles.periodTextActive]}>Annual</Text>
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

          {/* Products */}
          <Text style={styles.label}>What are you pricing out?</Text>

          {products.map((product, index) => (
            <View key={product.id} style={styles.productEntry}>
              {products.length > 1 && (
                <View style={styles.productHeader}>
                  <Text style={styles.productNumber}>Product {index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => removeProduct(product.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.removeText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={[styles.inputCard, product.focused && styles.inputCardFocused]}>
                <Text style={styles.prefix}>{currency.symbol}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={product.isMonthlyPayment ? 'Monthly payment (e.g. 350)' : 'Purchase price (e.g. 1,200)'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={product.amount}
                  onChangeText={(text) => updateProduct(product.id, 'amount', formatInputValue(text))}
                  returnKeyType="done"
                  onSubmitEditing={handleCheck}
                  onFocus={() => updateProduct(product.id, 'focused', true)}
                  onBlur={() => updateProduct(product.id, 'focused', false)}
                />
              </View>

              <View style={styles.toggle}>
                <TouchableOpacity
                  style={[styles.toggleOption, !product.isMonthlyPayment && styles.toggleActive]}
                  onPress={() => updateProduct(product.id, 'isMonthlyPayment', false)}
                >
                  <Text style={[styles.toggleText, !product.isMonthlyPayment && styles.toggleTextActive]}>
                    Lump sum
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, product.isMonthlyPayment && styles.toggleActive]}
                  onPress={() => updateProduct(product.id, 'isMonthlyPayment', true)}
                >
                  <Text style={[styles.toggleText, product.isMonthlyPayment && styles.toggleTextActive]}>
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {products.length < MAX_PRODUCTS && (
            <TouchableOpacity style={styles.addProductButton} onPress={addProduct}>
              <Text style={styles.addProductText}>+ Compare another product</Text>
            </TouchableOpacity>
          )}

          {/* URL fetcher */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or paste a product URL</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={[styles.inputCard, urlFocused && styles.inputCardFocused]}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Apple, Target, Carvana, Newegg, Etsy, eBay..."
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

          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        {/* Sticky footer — always visible, clearly separate from the URL section */}
        <View style={styles.footer}>
          <PressableScale onPress={handleCheck} style={styles.button}>
            <Text style={styles.buttonText}>Check It</Text>
          </PressableScale>
          <TouchableOpacity onPress={() => navigation.navigate('Saved')}>
            <Text style={styles.savedLink}>View saved checks</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: colors.bg,
  },
  pillWrap: { alignItems: 'center', marginBottom: spacing.lg },
  pill: {
    backgroundColor: colors.tealDim,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.teal + '55',
  },
  pillText: { color: colors.teal, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  hero: { ...typography.hero, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
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
  currencyRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  currencyPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  currencyPillActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  currencyPillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  currencyPillTextActive: { color: '#0F0F0F' },
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
  periodOption: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radii.pill },
  periodOptionActive: { backgroundColor: colors.teal },
  periodText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  periodTextActive: { color: '#0F0F0F' },
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
  inputCardFocused: { borderColor: colors.teal },
  prefix: { fontSize: 22, color: colors.textMuted, marginRight: 8, fontWeight: '500' },
  input: { flex: 1, fontSize: 22, color: colors.textPrimary, paddingVertical: 16, fontWeight: '500' },
  // Product entries
  productEntry: { marginBottom: spacing.sm },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  productNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  removeText: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: radii.sm + 2,
  },
  toggleActive: { backgroundColor: colors.teal },
  toggleText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  toggleTextActive: { color: '#0F0F0F', fontWeight: '700' },
  // Add product
  addProductButton: {
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.teal + '66',
    alignItems: 'center',
  },
  addProductText: { color: colors.teal, fontSize: 14, fontWeight: '600' },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  // Fetch
  fetchButton: {
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  fetchButtonDisabled: { borderColor: colors.border },
  fetchButtonText: { color: colors.teal, fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  priceConfirmation: { color: colors.success, fontSize: 13, marginTop: 8, marginLeft: 4, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, marginTop: 10, marginLeft: 4 },
  // Sticky footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // CTA
  button: {
    backgroundColor: colors.teal,
    borderRadius: radii.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: spacing.sm,
    height: 56,
    justifyContent: 'center',
  },
  buttonText: { color: '#0F0F0F', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  savedLink: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
