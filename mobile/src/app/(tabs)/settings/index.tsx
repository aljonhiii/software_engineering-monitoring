import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import { AppConfig } from '../../../constants/config';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { Card } from '../../../components/common/Card';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { PrimaryButton } from '../../../components/common/PrimaryButton';

export default function SettingsScreen() {
  const { user, logout, changePassword } = useAuth();

  // Password change form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Notification preferences state
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyMachineAlerts, setNotifyMachineAlerts] = useState(true);
  const [notifyRefills, setNotifyRefills] = useState(true);

  const handlePasswordSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Incomplete Form', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Too Short', 'New password must be at least 6 characters.');
      return;
    }

    setIsChangingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Your password has been successfully changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your monitoring session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Settings"
        subtitle="Account preferences & system config"
        showLiveIndicator={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Ionicons
                name="person-outline"
                size={22}
                color="#0F172A"
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.fullName || 'Operator'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.roleContainer}>
                <StatusBadge status={user?.role || 'admin'} type="role" size="sm" />
                <Text style={styles.usernameTag}>@{user?.username}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Security & Password Section */}
        <Text style={styles.sectionHeader}>SECURITY & ACCESS</Text>
        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowPasswordForm(!showPasswordForm)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
              <View>
                <Text style={styles.menuTitle}>Change Password</Text>
                <Text style={styles.menuSub}>Update operator login credentials</Text>
              </View>
            </View>
            <Ionicons
              name={showPasswordForm ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#94A3B8"
            />
          </TouchableOpacity>

          {showPasswordForm && (
            <View style={styles.passwordForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#94A3B8"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#94A3B8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repeat new password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <PrimaryButton
                title="Update Password"
                onPress={handlePasswordSubmit}
                loading={isChangingPass}
                style={{ marginTop: Spacing.sm }}
              />
            </View>
          )}
        </Card>

        {/* Notification Preferences */}
        <Text style={styles.sectionHeader}>NOTIFICATION PREFERENCES</Text>
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>New Order Paid</Text>
              <Text style={styles.switchSub}>Alert when a customer completes payment</Text>
            </View>
            <Switch
              value={notifyOrders}
              onValueChange={setNotifyOrders}
              thumbColor={notifyOrders ? '#0284C7' : '#94A3B8'}
              trackColor={{ false: '#E2E8F0', true: 'rgba(2, 132, 199, 0.2)' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>Machine Errors & Disconnects</Text>
              <Text style={styles.switchSub}>Notify immediately on hardware faults</Text>
            </View>
            <Switch
              value={notifyMachineAlerts}
              onValueChange={setNotifyMachineAlerts}
              thumbColor={notifyMachineAlerts ? '#0284C7' : '#94A3B8'}
              trackColor={{ false: '#E2E8F0', true: 'rgba(2, 132, 199, 0.2)' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>Low Consumables Warning</Text>
              <Text style={styles.switchSub}>Water tank & detergent refill triggers</Text>
            </View>
            <Switch
              value={notifyRefills}
              onValueChange={setNotifyRefills}
              thumbColor={notifyRefills ? '#0284C7' : '#94A3B8'}
              trackColor={{ false: '#E2E8F0', true: 'rgba(2, 132, 199, 0.2)' }}
            />
          </View>
        </Card>

        {/* Connection & App Info */}
        <Text style={styles.sectionHeader}>NETWORK & API CONFIGURATION</Text>
        <Card style={styles.card}>
          <View style={styles.specLine}>
            <Text style={styles.specLabel}>API Server</Text>
            <Text style={[styles.specVal, styles.monoVal]}>
              {AppConfig.apiUrl}
            </Text>
          </View>
          <View style={styles.specLine}>
            <Text style={styles.specLabel}>WebSocket Stream</Text>
            <Text style={[styles.specVal, styles.monoVal]}>
              {AppConfig.socketUrl}
            </Text>
          </View>
          <View style={styles.specLine}>
            <Text style={styles.specLabel}>Database Driver</Text>
            <Text style={styles.specVal}>MariaDB / MySQL</Text>
          </View>
          <View style={[styles.specLine, { borderBottomWidth: 0 }]}>
            <Text style={styles.specLabel}>App Version</Text>
            <Text style={styles.specVal}>v1.2.0 (Enterprise Release)</Text>
          </View>
        </Card>

        {/* Sign Out Button */}
        <PrimaryButton
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 110,
  },
  profileCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.cardLarge,
    ...Shadows.small,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4F63D',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  usernameTag: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.cardLarge,
    ...Shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  passwordForm: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.sm,
    height: 40,
    paddingHorizontal: Spacing.md,
    color: '#0F172A',
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  switchTitle: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: Spacing.sm,
  },
  specLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  monoVal: {
    fontFamily: 'monospace',
    color: '#0284C7',
  },
  logoutBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
});
