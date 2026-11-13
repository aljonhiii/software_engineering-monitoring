/**
 * Step 1: Welcome Screen - Customer entrance for KixCleen.
 * Features an automated, animated slideshow that explains the vending system
 * (Deep Foam Scrub, Dual Rotating Brushes, Hot Air Drying & UV Sanitization, Touchless Pickup),
 * matching the petrol-blue (#10394F) aesthetic with interactive pagination and GET STARTED CTA.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, AppConfig, setStoredKioskId } from '../constants';
import { registerShoecleanOrigin } from '../services/kioskMonitoringService';
import { useOrder } from '../store/orderStore';
import { useResponsive } from '../hooks';
import { WelcomeSlideshow, KixCleenLogo } from '../components/common';

export default function WelcomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kioskId?: string; kiosk_id?: string }>();
  const deepLinkKioskId = params.kioskId || params.kiosk_id;
  const { isTablet, isLandscape, contentMaxWidth, horizontalPadding } = useResponsive();
  const { dispatch } = useOrder();
  const [currentKioskId, setCurrentKioskId] = useState<string>(AppConfig.kioskId);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [modalKioskInput, setModalKioskInput] = useState<string>(AppConfig.kioskId);

  // If a deep link is received (e.g. from Expo Go exp://... or URL query), apply it immediately
  useEffect(() => {
    if (deepLinkKioskId && typeof deepLinkKioskId === 'string' && deepLinkKioskId.trim()) {
      const clean = deepLinkKioskId.trim().toUpperCase();
      setStoredKioskId(clean);
      setCurrentKioskId(clean);
      setModalKioskInput(clean);
    }
  }, [deepLinkKioskId]);

  // Ensure state is completely fresh for a new transaction whenever landing on Welcome
  useEffect(() => {
    dispatch({ type: 'RESET_SESSION' });
    setCurrentKioskId(AppConfig.kioskId);
    setModalKioskInput(AppConfig.kioskId);
    registerShoecleanOrigin();
  }, [dispatch]);

  const handleOpenConfig = () => {
    setModalKioskInput(currentKioskId);
    setIsConfigModalOpen(true);
  };

  const handleSaveKioskConfig = () => {
    if (modalKioskInput && modalKioskInput.trim()) {
      const clean = modalKioskInput.trim().toUpperCase();
      setStoredKioskId(clean);
      setCurrentKioskId(clean);
      registerShoecleanOrigin();
    }
    setIsConfigModalOpen(false);
  };

  const handleGetStarted = () => {
    dispatch({ type: 'RESET_SESSION' });
    router.push('/shoe-type');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingHorizontal: horizontalPadding },
          isLandscape && styles.containerLandscape,
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentWrapper, { maxWidth: contentMaxWidth }]}>
          {/* Brand Logo directly above machine illustration */}
          <View style={[styles.logoWrapper, isTablet && styles.logoWrapperTablet]}>
            <KixCleenLogo isTablet={isTablet} />
          </View>

          {/* Animated 3-Step Slideshow with Realistic Kiosk Machine Illustration */}
          <WelcomeSlideshow
            isTablet={isTablet}
            onPressGetStarted={handleGetStarted}
          />
        </View>
      </ScrollView>

      {/* Discrete Kiosk Terminal Hardware Label (Lower Left Bottom) */}
      <TouchableOpacity
        style={styles.terminalLabel}
        onPress={handleOpenConfig}
        activeOpacity={0.6}
        accessibilityLabel={`Kiosk Identifier ${currentKioskId}`}
      >
        <Text style={styles.terminalLabelText}>{currentKioskId}</Text>
      </TouchableOpacity>

      {/* Terminal Machine ID Configuration Modal (Touch-friendly for Tablets & Mobile) */}
      <Modal
        visible={isConfigModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsConfigModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="hardware-chip" size={20} color="#10394F" />
              <Text style={styles.modalTitle}>Configure Machine ID</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Assign this tablet to a specific owner's kiosk. Telemetry and orders will bind to this machine.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={modalKioskInput}
              onChangeText={setModalKioskInput}
              placeholder="e.g. KIOSK-SAMPLE-01"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsConfigModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveKioskConfig}
              >
                <Text style={styles.modalSaveText}>Save Machine ID</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flexGrow: 1,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerLandscape: {
    paddingVertical: Spacing.xs,
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  terminalLabel: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 14 : 10,
    left: 16,
    zIndex: 20,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  terminalLabelText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textTransform: 'uppercase',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -4,
  },
  logoWrapperTablet: {
    marginBottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    maxWidth: 420,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalSaveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: '#10394F',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
