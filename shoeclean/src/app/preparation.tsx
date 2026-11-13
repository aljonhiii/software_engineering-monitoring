/**
 * Step 8: Cleaning Preparation Screen
 * Customer prepares and loads their shoes into the chamber before the machine activates.
 */

import React, { useState, useEffect } from 'react';
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
} from '../constants';
import { useOrder } from '../store/orderStore';
import { PrimaryButton, Card, ScreenHeader } from '../components/common';
import { useResponsive } from '../hooks';
import { sendKioskHeartbeat } from '../services';

export default function PreparationScreen() {
  const router = useRouter();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const { state } = useOrder();

  const [doorChecked, setDoorChecked] = useState(false);
  const [lacesChecked, setLacesChecked] = useState(false);

  useEffect(() => {
    sendKioskHeartbeat({
      doorLocked: false,
      currentOrderId: state.orderId,
      currentActivity: `Customer loading footwear for Order #${state.orderId}`,
    });
  }, [state.orderId]);

  const handleReadyToStart = () => {
    sendKioskHeartbeat({
      doorLocked: true,
      currentOrderId: state.orderId,
      currentActivity: `Chamber sealed & locked for Order #${state.orderId}`,
      status: 'busy',
    });
    router.replace('/progress');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        bounces={false}
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          <ScreenHeader
            title="PREPARE YOUR SHOES"
            subtitle="Follow these simple steps to load your footwear safely into the cleaning chamber"
          />

          {/* Illustrated Steps Card */}
          <Card style={styles.stepsCard}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Open the Chamber Door</Text>
                <Text style={styles.stepDesc}>
                  Pull the illuminated chamber handle open. The interior LED light will turn on.
                </Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Position Both Shoes</Text>
                <Text style={styles.stepDesc}>
                  Place shoes soles-down firmly onto the rotating brush support base.
                </Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Tuck In Loose Laces</Text>
                <Text style={styles.stepDesc}>
                  Tie or tuck shoe laces inside the shoe opening to prevent entanglement.
                </Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Firmly Close Chamber Door</Text>
                <Text style={styles.stepDesc}>
                  Push the door until you hear a click. The magnetic safety lock will activate.
                </Text>
              </View>
            </View>
          </Card>

          {/* Safety Confirmations Checklist */}
          <View style={styles.checklistRow}>
            <TouchableOpacity
              style={[styles.checkCard, lacesChecked && styles.checkCardActive]}
              onPress={() => setLacesChecked(!lacesChecked)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={lacesChecked ? 'checkbox' : 'square-outline'}
                size={22}
                color={lacesChecked ? Colors.primary : Colors.textSecondary}
              />
              <Text style={styles.checkCardText}>Laces tucked inside shoes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.checkCard, doorChecked && styles.checkCardActive]}
              onPress={() => setDoorChecked(!doorChecked)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={doorChecked ? 'checkbox' : 'square-outline'}
                size={22}
                color={doorChecked ? Colors.primary : Colors.textSecondary}
              />
              <Text style={styles.checkCardText}>Chamber door closed firmly</Text>
            </TouchableOpacity>
          </View>

          {/* Action CTA: READY TO START */}
          <View style={styles.ctaArea}>
            <PrimaryButton
              title="READY TO START"
              onPress={handleReadyToStart}
              size="large"
              style={styles.readyButton}
            />
            <Text style={styles.readyHint}>
              Pressing will lock the chamber door and initiate the {state.selectedService?.name || 'Cleaning'} cycle
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepsCard: {
    width: '100%',
    maxWidth: 680,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  stepDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: Spacing.md,
    marginLeft: 52,
  },
  checklistRow: {
    width: '100%',
    maxWidth: 680,
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  checkCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Shadows.small,
  },
  checkCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
  },
  checkCardText: {
    flex: 1,
    fontSize: Typography.caption,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  ctaArea: {
    width: '100%',
    maxWidth: 680,
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  readyButton: {
    width: '100%',
  },
  readyHint: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
