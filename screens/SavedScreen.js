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
        <Text style={styles.title}>Past Calculations</Text>
        <View style={styles.backPlaceholder} />
      </View>

      {calculations.length === 0 ? (
        // Empty state shown when no calculations have been saved yet
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No saved calculations yet</Text>
          <Text style={styles.emptySubtext}>
            After running a check, tap "Save this calculation" to keep it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={calculations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SavedCard item={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
          // Hint text at the bottom
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  back: {
    paddingVertical: 4,
    paddingRight: 16,
    width: 80,
  },
  backText: {
    color: '#555',
    fontSize: 15,
  },
  backPlaceholder: {
    width: 80,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  swipeHint: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 12,
    marginTop: 16,
  },
  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 21,
  },
});
