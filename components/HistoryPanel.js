/**
 * HistoryPanel.js
 *
 * A slide-in drawer from the right showing the user's saved checks.
 * Opens on top of the current screen — no navigation required.
 *
 * Props:
 *   visible  {boolean}  — whether the panel is open
 *   onClose  {function} — called when the user dismisses the panel
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import SavedCard from './SavedCard';
import { getCalculations, deleteCalculation } from '../utils/storage';
import { colors, fonts, spacing, radii } from '../theme';

const { width } = Dimensions.get('window');
const PANEL_WIDTH = width * 0.88;

export default function HistoryPanel({ visible, onClose }) {
  const [items, setItems] = useState([]);
  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadItems();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          stiffness: 260,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: PANEL_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const loadItems = async () => {
    const data = await getCalculations();
    setItems(data);
  };

  const handleDelete = async (id) => {
    await deleteCalculation(id);
    loadItems();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Dimmed overlay — tap to close */}
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Sliding panel */}
        <Animated.View
          style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Past Checks</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            {/* List or empty state */}
            {items.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>Nothing saved yet</Text>
                <Text style={styles.emptySub}>
                  After running a check, tap "Save this check" to keep it here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <SavedCard item={item} onDelete={handleDelete} />
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  <Text style={styles.hint}>Swipe left on a card to delete</Text>
                }
              />
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  panel: {
    width: PANEL_WIDTH,
    height: '100%',
    backgroundColor: colors.bg,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  hint: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.md,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
