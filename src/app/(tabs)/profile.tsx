import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';

import { useTheme } from '@/hooks/useTheme';
import { Radius, Shadow, Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const executeLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      router.replace('/(auth)/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to sign out of your Maddie account?') : true;
      if (confirmed) {
        executeLogout();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out of your Maddie account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: executeLogout,
          },
        ],
      );
    }
  };


  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '👤';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '2025';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.md]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }, Shadow.primaryGlow]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'User'}</Text>
              <Text style={{ fontSize: 16 }}>🛡️</Text>
            </View>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
            <View style={[styles.memberBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.memberBadgeText, { color: colors.primary }]}>
                ✨ Verified Patient • Since {memberSince}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: colors.primary }]}>100%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>NABL Labs</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: colors.success }]}>Free</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Home Pickup</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: colors.accentSky }]}>24h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reports</Text>
          </View>
        </View>

        {/* Section 1: Health & Bookings */}
        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>HEALTH & BOOKINGS</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/(tabs)/bookings')}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ fontSize: 18 }}>📋</Text>
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>My Test Bookings</Text>
              <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Track sample pickup & reports</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/(tabs)/tests')}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.accentTealLight }]}>
              <Text style={{ fontSize: 18 }}>🧪</Text>
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Browse Medical Tests</Text>
              <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Explore 50+ packages & full body scans</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Section 2: Support & Information */}
        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SUPPORT & CARE</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              Alert.alert('Customer Care', 'Need help with sample collection or reports?\n\nEmail: support@maddiehealth.com\nHelpline: 1800-123-MADDIE (24x7)');
            }}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.accentAmberLight }]}>
              <Text style={{ fontSize: 18 }}>📞</Text>
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>24x7 Patient Support</Text>
              <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Chat or talk with health advisors</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              Alert.alert(
                'Maddie Healthcare Safety',
                'All tests are conducted by certified phlebotomists using sterilized single-use sealed vacutainers and processed in NABL accredited partner labs.',
              );
            }}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.successLight }]}>
              <Text style={{ fontSize: 18 }}>🛡️</Text>
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>NABL Quality Guarantee</Text>
              <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Accredited diagnostic standard</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: App Info & Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.error, backgroundColor: colors.errorLight }]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out of account"
        >
          {isLoggingOut ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={[styles.logoutText, { color: colors.error }]}>🚪  Sign Out</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.appVersion, { color: colors.textMuted }]}>
          Maddie Healthcare App • v1.0.0 (Production Build)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 40, gap: Spacing.three, paddingTop: Spacing.two },
  profileCard: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  nameSection: { alignItems: 'center', gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  email: { fontSize: 13.5 },
  memberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  memberBadgeText: { fontSize: 11.5, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCol: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 28 },
  menuSection: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1, gap: 2 },
  menuLabel: { fontSize: 14.5, fontWeight: '700' },
  menuSub: { fontSize: 11.5 },
  chevron: { fontSize: 20, fontWeight: '300' },
  divider: { height: 1, marginHorizontal: 4 },
  logoutBtn: {
    marginHorizontal: Spacing.four,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutText: { fontSize: 15, fontWeight: '800' },
  appVersion: {
    textAlign: 'center',
    fontSize: 11.5,
    marginTop: 4,
  },
});

