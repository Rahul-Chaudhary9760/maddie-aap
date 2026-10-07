import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const menuItems = [
    { emoji: '📋', label: 'My Bookings', onPress: () => router.push('/(tabs)/bookings') },
    { emoji: '🧪', label: 'Browse Tests', onPress: () => router.push('/(tabs)/tests') },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          {user?.role && user.role !== 'user' && (
            <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                {user.role.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }, Shadow.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account Info</Text>
          {[
            { label: 'Full Name', value: user?.name ?? '—' },
            { label: 'Email', value: user?.email ?? '—' },
            { label: 'Phone', value: user?.phone ?? 'Not provided' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—' },
          ].map(({ label, value }, i) => (
            <View key={label}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={[styles.menuCard, { backgroundColor: colors.card }, Shadow.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Links</Text>
          {menuItems.map(({ emoji, label, onPress }, i) => (
            <View key={label}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity style={styles.menuItem} onPress={onPress} accessibilityRole="button">
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>›</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.error }, isLoggingOut && styles.disabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          accessibilityRole="button"
          accessibilityLabel="Logout button"
        >
          {isLoggingOut ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={[styles.logoutText, { color: colors.error }]}>🚪  Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 40, gap: Spacing.three },
  avatarSection: { alignItems: 'center', paddingTop: Spacing.four, gap: Spacing.one },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700' },
  email: { fontSize: 14 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, marginTop: 6 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  infoCard: { marginHorizontal: Spacing.four, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  menuCard: { marginHorizontal: Spacing.four, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  divider: { height: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  logoutBtn: {
    marginHorizontal: Spacing.four,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
