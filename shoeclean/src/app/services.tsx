/**
 * Step 3: Cleaning Service Selection Screen
 * Displays cleaning packages tailored to the customer's selected shoe category.
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
  Shadows,
  CLEANING_SERVICES,
  SERVICE_ADDONS,
} from '../constants';
import { useOrder } from '../store/orderStore';
import { ServiceCard, AddonCard } from '../components/services';
import { PrimaryButton, ErrorBanner, ScreenHeader } from '../components/common';
import { formatPrice } from '../utils';
import { CleaningService, ServiceAddon } from '../types';
import { useResponsive } from '../hooks';

export default function ServicesScreen() {
  const router = useRouter();
  const {
    isLandscape,
    isTablet,
    contentMaxWidth,
    horizontalPadding,
    serviceColumns,
  } = useResponsive();

  const { state, dispatch } = useOrder();
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSelectService = (service: CleaningService) => {
    setValidationError(null);
    dispatch({ type: 'SELECT_SERVICE', service });
  };

  const handleToggleAddon = (addon: ServiceAddon) => {
    dispatch({ type: 'TOGGLE_ADDON', addon });
  };

  const handleProceed = () => {
    if (!state.selectedService) {
      setValidationError('Please select a cleaning service tier before proceeding.');
      return;
    }
    router.push('/summary');
  };

  const handleBack = () => {
    router.back();
  };

  const isThreeColServices = serviceColumns === 3;
  const isTwoColAddons = isLandscape || isTablet;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <View style={[styles.topBarInner, { maxWidth: contentMaxWidth }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Step 3 of 10: Cleaning Service</Text>
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
            title="SELECT CLEANING SERVICE"
            subtitle="Choose one service for your shoes, plus any optional add-ons below"
          />

          {validationError && (
            <ErrorBanner
              message={validationError}
              onDismiss={() => setValidationError(null)}
            />
          )}

          {/* Cleaning Packages Section */}
          <Text style={styles.sectionTitle}>1. Choose a Service</Text>
          <View
            style={[
              styles.servicesGrid,
              isThreeColServices && styles.servicesGridRow,
            ]}
          >
            {CLEANING_SERVICES.map((service) => (
              <View
                key={service.id}
                style={[
                  styles.serviceCardWrapper,
                  isThreeColServices && styles.serviceCardWrapperRow,
                ]}
              >
                <ServiceCard
                  service={service}
                  isSelected={state.selectedService?.id === service.id}
                  onSelect={handleSelectService}
                />
              </View>
            ))}
          </View>

          {/* Optional Add-ons Section */}
          <Text style={styles.sectionTitle}>2. Optional Add-Ons</Text>
          <View
            style={[
              styles.addonsGrid,
              isTwoColAddons && styles.addonsGridRow,
            ]}
          >
            {SERVICE_ADDONS.map((addon) => {
              const isSelected = state.selectedAddons.some((a) => a.id === addon.id);
              return (
                <View
                  key={addon.id}
                  style={[
                    styles.addonWrapper,
                    isTwoColAddons && styles.addonWrapperRow,
                  ]}
                >
                  <AddonCard
                    addon={addon}
                    isSelected={isSelected}
                    onToggle={handleToggleAddon}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar with Live Total and CONTINUE button */}
      <View style={styles.bottomBar}>
        <View style={[styles.bottomBarInner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>
              {state.selectedService ? state.selectedService.name : 'No service selected'}
              {state.selectedAddons.length > 0 && ` + ${state.selectedAddons.length} extra`}
            </Text>
            <Text style={styles.totalAmount}>
              {formatPrice(state.totalPrice)}
            </Text>
          </View>

          <PrimaryButton
            title="Continue"
            onPress={handleProceed}
            disabled={!state.selectedService}
            size="large"
            style={styles.proceedButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  stepIndicator: {
    fontSize: Typography.caption,
    color: Colors.primary,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  cancelButtonText: {
    fontSize: Typography.body,
    color: Colors.textMuted,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
    paddingBottom: 130, // clearance for floating bottom bar
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginVertical: Spacing.md,
  },
  servicesGrid: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  servicesGridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  serviceCardWrapper: {
    width: '100%',
  },
  serviceCardWrapperRow: {
    flex: 1,
  },
  addonsGrid: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  addonsGridRow: {
    flexDirection: 'row',
  },
  addonWrapper: {
    width: '100%',
  },
  addonWrapperRow: {
    flex: 1,
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
  totalInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  totalLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  proceedButton: {
    minWidth: 220,
  },
});
