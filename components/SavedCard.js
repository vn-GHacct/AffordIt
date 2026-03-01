/**
 * SavedCard.js
 *
 * A single row card in the SavedScreen list.
 * Displays the verdict emoji, purchase label, monthly cost, and date saved.
 *
 * Supports swipe-to-delete: swipe the card left to reveal a red Delete button.
 * This uses Swipeable from react-native-gesture-handler (included with Expo).
 *
 * Props:
 *   item     {object}   - A saved calculation object from AsyncStorage
 *   onDelete {function} - Called with the item's ID when the user taps Delete
 */

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

/**
 * Formats an ISO date string into a readable format like "Jan 5, 2025"
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SavedCard({ item, onDelete }) {
  const swipeableRef = useRef(null);

  // This renders the red Delete button revealed on left-swipe
  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => {
        // Close the swipe before deleting so the animation looks clean
        swipeableRef.current?.close();
        onDelete(item.id);
      }}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions}>
      <View style={styles.card}>
        {/* Left: big emoji */}
        <Text style={styles.emoji}>{item.emoji}</Text>

        {/* Middle: label and date */}
        <View style={styles.info}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={styles.date}>{formatDate(item.savedAt)}</Text>
        </View>

        {/* Right: monthly cost */}
        <Text style={styles.cost}>${item.monthlyCost.toFixed(2)}/mo</Text>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    // Subtle card shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emoji: {
    fontSize: 28,
    marginRight: 14,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  date: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 3,
  },
  cost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  // The red area revealed on swipe
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 5,
    marginRight: 16,
    borderRadius: 14,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
