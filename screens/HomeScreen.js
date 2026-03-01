/**
 * HomeScreen.js
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
  Modal,
} from 'react-native';
import { getVerdict } from '../utils/calculations';
import { incrementUsageCount } from '../utils/storage';
import { fetchPriceFromUrl } from '../utils/urlLookup';
import { CURRENCIES, DEFAULT_CURRENCY } from '../utils/currencies';
import PressableScale from '../components/PressableScale';
import { colors, fonts, spacing, radii, typography } from '../theme';

const MAX_PRODUCTS = 5;

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
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

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

  const handleFetchPrice = async () => {
    setError('');
    setPriceConfirmation('');
    setIsFetching(true);
    try {
      const { price, productName, site } = await fetchPriceFromUrl(productUrl.trim());
      updateProduct(products[0].id, 'amount', formatInputValue(price.toFixed(currency.decimals)));
      const label = productName
        ? `${site}: ${currency.symbol}${price.toFixed(currency.decimals)} — ${productName}`
        : `${site}: ${currency.symbol}${price.toFixed(currency.decimals)}`;
      setPriceConfirmation(label);
      setProductUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCheck = async () => {
    setError('');
    const rawIncome = parseFloat(income.replace(/,/g, ''));
    const monthlyIncome = isAnnualIncome ? rawIncome / 12 : rawIncome;

    if (!rawIncome || rawIncome <= 0) {
      setError(`Enter your ${isAnnualIncome ? 'annual' : 'monthly'} take-home income.`);
      return;
    }

    const results = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const purchaseAmount = parseFloat(p.amount.replace(/,/g, ''));
      if (!purchaseAmount || purchaseAmount <= 0) {
        setError(products.length > 1 ? `Enter an amount for product ${i + 1}.` : 'Enter the purchase amount.');
        return;
      }
      const result = getVerdict(monthlyIncome, purchaseAmount, p.isMonthlyPayment);
      results.push({ ...result, purchaseAmount, isMonthlyPayment: p.isMonthlyPayment });
    }

    const usageCount = await incrementUsageCount();
    navigation.navigate('Result', { results, monthlyIncome, usageCount, currency });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header row: wordmark + settings */}
          <View style={styles.header}>
            <Text style={styles.wordmark}>AffordIt</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowCurrencyModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.settingsLabel}>{currency.symbol} {currency.code}</Text>
              <Text style={styles.settingsChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <Text style={styles.hero}>Can you{'\n'}afford it?</Text>
          <Text style={styles.subtext}>30-second gut check before any purchase.</Text>

          {/* Income */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Take-home income</Text>
              <View style={styles.segmentToggle}>
                <TouchableOpacity
                  style={[styles.segment, !isAnnualIncome && styles.segmentActive]}
                  onPress={() => setIsAnnualIncome(false)}
                >
                  <Text style={[styles.segmentText, !isAnnualIncome && styles.segmentTextActive]}>Monthly</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, isAnnualIncome && styles.segmentActive]}
                  onPress={() => setIsAnnualIncome(true)}
                >
                  <Text style={[styles.segmentText, isAnnualIncome && styles.segmentTextActive]}>Annual</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.inputRow, incomeFocused && styles.inputRowFocused]}>
              <Text style={styles.prefix}>{currency.symbol}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder={isAnnualIncome ? '54,000' : '4,500'}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={income}
                onChangeText={t => setIncome(formatInputValue(t))}
                returnKeyType="next"
                onFocus={() => setIncomeFocused(true)}
                onBlur={() => setIncomeFocused(false)}
              />
            </View>
          </View>

          {/* Products */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {products.length > 1 ? 'Products to compare' : 'What are you buying?'}
            </Text>

            {products.map((product, index) => (
              <View key={product.id} style={styles.productEntry}>
                {products.length > 1 && (
                  <View style={styles.productMeta}>
                    <Text style={styles.productIndex}>Product {index + 1}</Text>
                    <TouchableOpacity onPress={() => removeProduct(product.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={[styles.inputRow, product.focused && styles.inputRowFocused]}>
                  <Text style={styles.prefix}>{currency.symbol}</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder={product.isMonthlyPayment ? '350 / mo' : '1,200'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={product.amount}
                    onChangeText={t => updateProduct(product.id, 'amount', formatInputValue(t))}
                    returnKeyType="done"
                    onSubmitEditing={handleCheck}
                    onFocus={() => updateProduct(product.id, 'focused', true)}
                    onBlur={() => updateProduct(product.id, 'focused', false)}
                  />
                  {/* Inline lump/monthly toggle */}
                  <View style={styles.inlineToggle}>
                    <TouchableOpacity
                      style={[styles.inlineSeg, !product.isMonthlyPayment && styles.inlineSegActive]}
                      onPress={() => updateProduct(product.id, 'isMonthlyPayment', false)}
                    >
                      <Text style={[styles.inlineSegText, !product.isMonthlyPayment && styles.inlineSegTextActive]}>Lump</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inlineSeg, product.isMonthlyPayment && styles.inlineSegActive]}
                      onPress={() => updateProduct(product.id, 'isMonthlyPayment', true)}
                    >
                      <Text style={[styles.inlineSegText, product.isMonthlyPayment && styles.inlineSegTextActive]}>/ mo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {products.length < MAX_PRODUCTS && (
              <TouchableOpacity style={styles.addProductRow} onPress={addProduct}>
                <Text style={styles.addProductText}>+ Compare another product</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* URL fetcher */}
          <View style={styles.urlSection}>
            <Text style={styles.urlDivider}>or paste a product URL</Text>
            <View style={[styles.urlRow, urlFocused && styles.urlRowFocused]}>
              <TextInput
                style={styles.urlInput}
                placeholder="apple.com, carvana.com, etsy.com..."
                placeholderTextColor={colors.textMuted}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                value={productUrl}
                onChangeText={t => { setProductUrl(t); setPriceConfirmation(''); }}
                returnKeyType="go"
                onSubmitEditing={handleFetchPrice}
                onFocus={() => setUrlFocused(true)}
                onBlur={() => setUrlFocused(false)}
              />
              <TouchableOpacity
                style={[styles.fetchInline, isFetching && styles.fetchInlineDisabled]}
                onPress={handleFetchPrice}
                disabled={isFetching}
              >
                {isFetching
                  ? <ActivityIndicator color={colors.teal} size="small" />
                  : <Text style={styles.fetchInlineText}>Fetch</Text>}
              </TouchableOpacity>
            </View>
            {!!priceConfirmation && <Text style={styles.confirmation}>{priceConfirmation}</Text>}
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        {/* Sticky footer */}
        <View style={styles.footer}>
          <PressableScale onPress={handleCheck} style={styles.cta}>
            <Text style={styles.ctaText}>Check It</Text>
          </PressableScale>
          <TouchableOpacity onPress={() => navigation.navigate('Saved')}>
            <Text style={styles.savedLink}>View saved checks</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Currency bottom sheet */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCurrencyModal(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Currency</Text>
          {CURRENCIES.map(c => (
            <TouchableOpacity
              key={c.code}
              style={styles.currencyRow}
              onPress={() => { setCurrency(c); setShowCurrencyModal(false); }}
            >
              <View style={styles.currencyLeft}>
                <Text style={styles.currencySymbol}>{c.symbol}</Text>
                <View>
                  <Text style={styles.currencyCode}>{c.code}</Text>
                  <Text style={styles.currencyName}>{c.name}</Text>
                </View>
              </View>
              {currency.code === c.code && <Text style={styles.currencyCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  wordmark: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  settingsChevron: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textMuted,
    marginLeft: 2,
  },

  // Hero
  hero: {
    fontFamily: fonts.bold,
    fontSize: 40,
    color: colors.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 46,
    marginBottom: spacing.sm,
  },
  subtext: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  // Field groups
  fieldGroup: { marginBottom: spacing.lg },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Segment toggle (Monthly / Annual)
  segmentToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radii.pill },
  segmentActive: { backgroundColor: colors.teal },
  segmentText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  segmentTextActive: { color: '#0F0F0F' },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputRowFocused: { borderColor: colors.teal },
  prefix: {
    fontFamily: fonts.medium,
    fontSize: 20,
    color: colors.textMuted,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textPrimary,
    paddingVertical: 14,
  },

  // Inline lump/monthly toggle inside input row
  inlineToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radii.sm,
    padding: 2,
    marginLeft: 8,
  },
  inlineSeg: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm - 2,
  },
  inlineSegActive: { backgroundColor: colors.teal },
  inlineSegText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted },
  inlineSegTextActive: { color: '#0F0F0F' },

  // Product entries
  productEntry: { marginBottom: 10 },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  productIndex: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  removeText: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
  addProductRow: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  addProductText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },

  // URL section
  urlSection: { marginBottom: spacing.md },
  urlDivider: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  urlRowFocused: { borderColor: colors.teal },
  urlInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 14,
  },
  fetchInline: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.bg,
    marginLeft: 8,
  },
  fetchInlineDisabled: { opacity: 0.4 },
  fetchInlineText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.teal },
  confirmation: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.success,
    marginTop: 8,
    marginLeft: 2,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.danger,
    marginTop: 10,
    marginLeft: 2,
  },

  // Sticky footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    backgroundColor: colors.teal,
    borderRadius: radii.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: '#0F0F0F', letterSpacing: 0.2 },
  savedLink: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: 6,
  },

  // Currency modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: 34,
    paddingHorizontal: spacing.lg,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  currencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  currencySymbol: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textSecondary,
    width: 28,
    textAlign: 'center',
  },
  currencyCode: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textPrimary },
  currencyName: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  currencyCheck: { fontFamily: fonts.bold, fontSize: 16, color: colors.teal },
});
