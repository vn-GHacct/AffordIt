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
import { colors, fonts, spacing, radii } from '../theme';
import { formatPercent } from '../utils/calculations';

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
        {/* Left: colored verdict dot + emoji */}
        <View style={styles.leftSection}>
          <View style={[styles.verdictDot, { backgroundColor: item.color }]} />
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>

        {/* Center: label + date */}
        <View style={styles.info}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={styles.date}>{formatDate(item.savedAt)}</Text>
        </View>

        {/* Right: monthly cost + impact ratio */}
        <View style={styles.rightSection}>
          <Text style={styles.cost}>
            {item.currency?.symbol ?? '$'}
            {item.monthlyCost.toFixed(item.currency?.decimals ?? 2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/mo
          </Text>
          <Text style={styles.impact}>
            {item.impactRatio != null ? formatPercent(item.impactRatio) : ''}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: 4,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leftSection: {
    alignItems: 'center',
    marginRight: 12,
  },
  verdictDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  cost: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  impact: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  deleteButton: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 76,
    marginVertical: 4,
    marginRight: spacing.md,
    borderRadius: radii.lg,
  },
  deleteText: {
    fontFamily: fonts.semibold,
    color: colors.white,
    fontSize: 13,
  },
});
