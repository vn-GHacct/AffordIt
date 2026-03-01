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

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import VerdictBanner from '../components/VerdictBanner';
import PaywallModal from '../components/PaywallModal';
import { saveCalculation } from '../utils/storage';
import { formatCurrency, formatPercent } from '../utils/calculations';

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
  } = route.params;

  const [saved, setSaved] = useState(false);

  // Show the paywall if this was their 4th+ calculation (usageCount > 3)
  const [showPaywall, setShowPaywall] = useState(usageCount > 3);

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
    });

    setSaved(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* The big colored verdict banner */}
        <VerdictBanner emoji={emoji} verdict={verdict} color={color} />

        {/* Stats breakdown card */}
        <View style={styles.statsCard}>
          <StatRow label="Monthly cost" value={formatCurrency(monthlyCost)} />
          <StatRow
            label="% of your income"
            value={formatPercent(impactRatio)}
            isLast
          />
        </View>

        {/* Plain-English displacement sentence */}
        <Text style={styles.displacement}>{displacementText}</Text>

        {/* Save button — disabled after saving to prevent duplicates */}
        <TouchableOpacity
          style={[styles.button, saved && styles.buttonSaved]}
          onPress={handleSave}
          disabled={saved}
        >
          <Text style={styles.buttonText}>
            {saved ? 'Saved ✓' : 'Save this calculation'}
          </Text>
        </TouchableOpacity>

        {/* Go back to HomeScreen */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.secondaryText}>Check another</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Paywall modal — slides up over the result after 3 free uses */}
      <PaywallModal
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}

/**
 * Small helper component for each row in the stats card.
 * Defined here (not in a separate file) because it's only used in this screen.
 */
function StatRow({ label, value, isLast }) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 48,
    backgroundColor: '#fff',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 15,
    color: '#888',
  },
  rowValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  displacement: {
    fontSize: 17,
    color: '#444',
    lineHeight: 27,
    textAlign: 'center',
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonSaved: {
    backgroundColor: '#22C55E', // turns green when saved
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#aaa',
    fontSize: 15,
  },
});
