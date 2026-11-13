/**
 * Step 2: Shoe Type Selection Screen
 * Customer chooses their shoe category to customize the cleaning cycle.
 * Clean, uncluttered layout with 2-to-3 column grid of elevated white cards.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  SHOE_CATEGORIES,
} from '../constants';
import { useOrder } from '../store/orderStore';
import { ShoeCategoryCard } from '../components/shoes';
import { PrimaryButton, ErrorBanner, ScreenHeader } from '../components/common';
import { ShoeCategory } from '../types';
import { useResponsive } from '../hooks';

export default function ShoeTypeScreen() {
  const router = useRouter();
  const {
    contentMaxWidth,
    horizontalPadding,
    shoeTypeColumns,
  } = useResponsive();

  const { state, dispatch } = useOrder();
  const [selectedCategory, setSelectedCategory] = useState<ShoeCategory | null>(
    state.selectedShoeCategory
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelect = (category: ShoeCategory) => {
    setSelectedCategory(category);
    setErrorMessage(null);
    dispatch({ type: 'SELECT_SHOE_CATEGORY', category });
  };

  const handleContinue = () => {
    if (!selectedCategory) {
      setErrorMessage('Please select a shoe category to continue.');
      return;
    }
    router.push('/services');
  };

  const handleBack = () => {
    router.back();
  };

  const isTwoCols = shoeTypeColumns >= 2;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Navigation */}
      <View style={styles.topBar}>
        <View style={[styles.topBarInner, { maxWidth: contentMaxWidth }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Select Shoe Type</Text>
            <Text style={styles.stepIndicator}>Step 2 of 10</Text>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.replace('/')}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        bounces={false}
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          <ScreenHeader
            title="WHAT TYPE OF SHOES DO YOU WANT TO CLEAN?"
            subtitle="Our automated chambers adjust water pressure, foam concentration, and brush stiffness based on your footwear material"
          />

          {errorMessage && (
            <ErrorBanner
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Shoe Categories Grid (2 Main Categories) */}
          <View
            style={[
              styles.grid,
              isTwoCols && styles.gridTwoCols,
            ]}
          >
            {SHOE_CATEGORIES.map((category) => (
              <View
                key={category.id}
                style={[
                  styles.cardWrapper,
                  isTwoCols && styles.cardWrapperTwo,
                ]}
              >
                <ShoeCategoryCard
                  category={category}
                  isSelected={selectedCategory?.id === category.id}
                  onSelect={handleSelect}
                  basePrice={30}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={[styles.bottomBarInner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>Selected Category</Text>
            <Text style={styles.selectedName} numberOfLines={1}>
              {selectedCategory ? selectedCategory.name : 'Choose a shoe type above'}
            </Text>
          </View>

          <PrimaryButton
            title="Continue to Services"
            onPress={handleContinue}
            disabled={!selectedCategory}
            size="large"
            style={styles.continueButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background, // #F4F6F9
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    ...Shadows.small,
  },
  topBarInner: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: Typography.semiBold,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  stepIndicator: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  scrollContent: {
    paddingVertical: Spacing.md,
    paddingBottom: 120, // clearance for bottom action bar
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
  },
  grid: {
    flexDirection: 'column',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  gridTwoCols: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: Spacing.md,
  },
  cardWrapper: {
    width: '100%',
  },
  cardWrapperTwo: {
    flex: 1,
    maxWidth: '49%',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    ...Shadows.large,
  },
  bottomBarInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: Typography.medium,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  continueButton: {
    minWidth: 220,
    borderRadius: BorderRadius.lg,
  },
});
