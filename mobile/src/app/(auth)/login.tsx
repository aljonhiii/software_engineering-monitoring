import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Card } from '../../components/common/Card';
import { KixCleenLogo } from '../../components/common/KixCleenLogo';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter your email or username and password.');
      return;
    }

    setErrorMessage(null);
    try {
      await login(identifier.trim(), password.trim());
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please verify your account details.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Brand Header */}
          <View style={styles.brandHeader}>
            <KixCleenLogo width={210} height={100} />
            <Text style={styles.portalTitle}>Fleet Operations Portal</Text>
            <Text style={styles.brandSubtitle}>
              Real-time kiosk telemetry, payment reconciliation & sales audit
            </Text>
          </View>

          {/* Login Card */}
          <Card style={styles.loginCard}>
            <View style={styles.cardHeaderGroup}>
              <Text style={styles.cardHeader}>Sign in to your account</Text>
              <Text style={styles.cardSub}>
                Enter your authorized operator credentials to access the console
              </Text>
            </View>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.red} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Identifier Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL OR USERNAME</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor={Colors.textMuted}
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
              </View>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onSubmitEditing={handleLogin}
                  returnKeyType="go"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.signInBtn}
            />
          </Card>

          {/* Footer Note */}
          <View style={styles.footerWrap}>
            <Text style={styles.footerNote}>
              KixCleen Systems Inc. • Authorized Access Only
            </Text>
            <Text style={styles.versionNote}>v1.2.0 Enterprise Release</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  portalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  loginCard: {
    padding: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  cardHeaderGroup: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  signInBtn: {
    marginTop: Spacing.sm,
    height: 46,
    borderRadius: BorderRadius.md,
  },
  footerWrap: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    gap: 4,
  },
  footerNote: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  versionNote: {
    fontSize: 11,
    color: '#CBD5E1',
  },
});
