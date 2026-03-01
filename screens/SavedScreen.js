/**
 * SavedScreen.js
 *
 * Shows a scrollable list of all calculations the user has saved.
 * Each card supports swipe-to-delete.
 *
 * Uses useFocusEffect so the list refreshes automatically every time
 * the user navigates to this screen — no manual pull-to-refresh needed.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SavedCard from '../components/SavedCard';
import { getCalculations, deleteCalculation } from '../utils/storage';
import { colors, spacing, radii, typography } from '../theme';

export default function SavedScreen({ navigation }) {
  const [calculations, setCalculations] = useState([]);

  // Reload the list every time this screen is focused
  // (e.g. after user saves something from ResultScreen)
  useFocusEffect(
    useCallback(() => {
      loadCalculations();
    }, [])
  );

  const loadCalculations = async () => {
    const data = await getCalculations();
    setCalculations(data);
  };

  const handleDelete = async (id) => {
    await deleteCalculation(id);
    // Refresh the list after deletion
    loadCalculations();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header row with title and back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Past Checks</Text>
        <View style={styles.backPlaceholder} />
      </View>

      {/* Bottom border separator under header */}
      <View style={styles.headerDivider} />

      {calculations.length === 0 ? (
        // Empty state shown when no calculations have been saved yet
        <View style={styles.empty}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No checks saved yet</Text>
            <Text style={styles.emptySubtext}>
              After running a check, tap "Save this" to keep it here.
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={calculations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SavedCard item={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <Text style={styles.swipeHint}>Swipe left on a card to delete</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 0,
  },
  back: {
    paddingVertical: 4,
    paddingRight: 16,
    width: 80,
  },
  backText: {
    color: colors.teal,
    fontSize: 15,
    fontWeight: '600',
  },
  backPlaceholder: {
    width: 80,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  list: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  swipeHint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.md,
  },
  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});
