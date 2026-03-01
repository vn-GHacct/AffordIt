/**
 * storage.js
 *
 * All AsyncStorage reads and writes live here.
 * Keeping storage logic in one place means screens never touch
 * AsyncStorage directly — if you ever swap to a database, you only
 * change this file.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys used to store data — using constants avoids typos
const CALCULATIONS_KEY = 'afford_it_calculations';
const USAGE_COUNT_KEY = 'afford_it_usage_count';

/**
 * Save a new calculation to the saved list.
 * Prepends to the array so newest items appear at the top.
 */
export async function saveCalculation(data) {
  try {
    const existing = await getCalculations();
    const newEntry = {
      ...data,
      id: Date.now().toString(), // unique ID based on timestamp
      savedAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...existing];
    await AsyncStorage.setItem(CALCULATIONS_KEY, JSON.stringify(updated));
    return newEntry;
  } catch (error) {
    console.error('Error saving calculation:', error);
  }
}

/**
 * Retrieve all saved calculations.
 * Returns an empty array if nothing has been saved yet.
 */
export async function getCalculations() {
  try {
    const data = await AsyncStorage.getItem(CALCULATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting calculations:', error);
    return [];
  }
}

/**
 * Delete a single calculation by its ID.
 */
export async function deleteCalculation(id) {
  try {
    const existing = await getCalculations();
    const updated = existing.filter((item) => item.id !== id);
    await AsyncStorage.setItem(CALCULATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting calculation:', error);
  }
}

/**
 * Get the total number of calculations the user has run.
 * Used for the freemium gate — after 3, show the paywall.
 */
export async function getUsageCount() {
  try {
    const count = await AsyncStorage.getItem(USAGE_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting usage count:', error);
    return 0;
  }
}

/**
 * Increment the usage count by 1 after each calculation.
 * Returns the new count.
 */
export async function incrementUsageCount() {
  try {
    const current = await getUsageCount();
    const next = current + 1;
    await AsyncStorage.setItem(USAGE_COUNT_KEY, next.toString());
    return next;
  } catch (error) {
    console.error('Error incrementing usage count:', error);
    return 0;
  }
}
