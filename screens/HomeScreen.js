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

export default function HomeScreen({ navigation }) {
  // --- State ---
  const [income, setIncome] = useState('');
  const [amount, setAmount] = useState('');
  // Toggle between "lump sum price" and "monthly payment"
  const [isMonthlyPayment, setIsMonthlyPayment] = useState(false);
  const [error, setError] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [priceConfirmation, setPriceConfirmation] = useState('');

  // --- Handlers ---
  const handleFetchPrice = async () => {
    setError('');
    setPriceConfirmation('');
    setIsFetching(true);
    try {
      const { price } = await fetchPriceFromUrl(productUrl.trim());
      setAmount(price.toFixed(2));
      setPriceConfirmation(`Found: $${price.toFixed(2)}`);
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
    const monthlyIncome = parseFloat(income.replace(/,/g, ''));
    const purchaseAmount = parseFloat(amount.replace(/,/g, ''));

    // Validate inputs before running the calculation
    if (!monthlyIncome || monthlyIncome <= 0) {
      setError('Please enter your monthly take-home income.');
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
    });
  };

  // --- Render ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* App header */}
          <Text style={styles.appName}>Afford It</Text>
          <Text style={styles.tagline}>
            30-second gut check before any big purchase
          </Text>

          {/* --- Income input --- */}
          <Text style={styles.label}>Monthly take-home income</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 4500"
            placeholderTextColor="#C0C0C0"
            keyboardType="numeric"
            value={income}
            onChangeText={setIncome}
            returnKeyType="next"
          />

          {/* --- Toggle: Lump sum vs. Monthly payment --- */}
          <Text style={styles.label}>What are you pricing out?</Text>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                !isMonthlyPayment && styles.toggleActive,
              ]}
              onPress={() => setIsMonthlyPayment(false)}
            >
              <Text
                style={[
                  styles.toggleText,
                  !isMonthlyPayment && styles.toggleTextActive,
                ]}
              >
                Lump sum price
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleOption,
                isMonthlyPayment && styles.toggleActive,
              ]}
              onPress={() => setIsMonthlyPayment(true)}
            >
              <Text
                style={[
                  styles.toggleText,
                  isMonthlyPayment && styles.toggleTextActive,
                ]}
              >
                Monthly payment
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- Amount input (label changes with toggle) --- */}
          <TextInput
            style={styles.input}
            placeholder={
              isMonthlyPayment
                ? 'Monthly payment (e.g. 350)'
                : 'Purchase price (e.g. 1200)'
            }
            placeholderTextColor="#C0C0C0"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            returnKeyType="done"
            onSubmitEditing={handleCheck}
          />

          {/* --- "or" divider --- */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* --- URL price fetcher --- */}
          <Text style={styles.label}>Paste a product URL</Text>
          <TextInput
            style={styles.input}
            placeholder="Works on smaller shops, not Amazon/Etsy"
            placeholderTextColor="#C0C0C0"
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
          />

          {!!priceConfirmation && (
            <Text style={styles.priceConfirmation}>{priceConfirmation}</Text>
          )}

          <TouchableOpacity
            style={[styles.fetchButton, isFetching && styles.fetchButtonDisabled]}
            onPress={handleFetchPrice}
            disabled={isFetching}
          >
            {isFetching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.fetchButtonText}>Fetch Price</Text>
            )}
          </TouchableOpacity>

          {/* Inline error message */}
          {!!error && <Text style={styles.error}>{error}</Text>}

          {/* --- Primary CTA --- */}
          <TouchableOpacity style={styles.button} onPress={handleCheck}>
            <Text style={styles.buttonText}>Check It</Text>
          </TouchableOpacity>

          {/* --- Link to saved calculations --- */}
          <TouchableOpacity onPress={() => navigation.navigate('Saved')}>
            <Text style={styles.savedLink}>View past calculations</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#999',
    marginBottom: 48,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 17,
    color: '#111',
  },
  // The pill-style toggle switcher
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 11,
  },
  toggleActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#111',
    fontWeight: '700',
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 10,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  savedLink: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },
  fetchButton: {
    backgroundColor: '#555',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  fetchButtonDisabled: {
    backgroundColor: '#999',
  },
  fetchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  priceConfirmation: {
    color: '#16A34A',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
});
