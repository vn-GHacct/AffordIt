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

export default function PaywallModal({ visible, onDismiss }) {
  const handleUnlock = () => {
    // TODO: Integrate with expo-in-app-purchases or RevenueCat
    console.log('Unlock Now pressed — wire up payment here');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      {/* Dark semi-transparent backdrop */}
      <View style={styles.overlay}>
        {/* The white card that slides up from the bottom */}
        <View style={styles.sheet}>
          {/* Small handle bar at top (common pattern for bottom sheets) */}
          <View style={styles.handle} />

          <Text style={styles.headline}>Unlock unlimited checks</Text>

          <Text style={styles.subtext}>
            You've used your 3 free calculations. Unlock the full app to keep
            making smart money decisions — just once, no subscription.
          </Text>

          <Text style={styles.price}>$6.99 one time</Text>

          <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
            <Text style={styles.unlockText}>Unlock Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // anchor sheet to the bottom
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingBottom: 48,
    paddingTop: 16,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 24,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 24,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 24,
  },
  unlockButton: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  unlockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 12,
  },
  dismissText: {
    color: '#aaa',
    fontSize: 14,
  },
});
