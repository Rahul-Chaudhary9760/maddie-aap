import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Radius, Shadow, Spacing } from '@/constants/theme';

type QuickActionProps = {
  emoji: string;
  label: string;
  description: string;
  onPress: () => void;
  bg: string;
};

function QuickAction({ emoji, label, description, onPress, bg }: QuickActionProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.quickCard, { backgroundColor: colors.card }, Shadow.md]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.quickIcon, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 26 }}>{emoji}</Text>
      </View>
      <Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.quickDesc, { color: colors.textSecondary }]}>{description}</Text>
    </TouchableOpacity>
  );
}

const POPULAR_TESTS = [
  { emoji: '🩸', name: 'Complete Blood Count', category: 'Blood Test', price: '₹250' },
  { emoji: '🦠', name: 'COVID-19 PCR', category: 'Pathology', price: '₹499' },
  { emoji: '💊', name: 'Lipid Profile', category: 'Blood Test', price: '₹350' },
  { emoji: '🫁', name: 'Thyroid Panel', category: 'Blood Test', price: '₹450' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroGreeting}>Hello, {firstName} 👋</Text>
          <Text style={styles.heroTitle}>Book your medical{'\n'}tests with ease</Text>
          <TouchableOpacity
            style={[styles.heroBtn, { backgroundColor: '#fff' }]}
            onPress={() => router.push('/(tabs)/tests')}
            accessibilityRole="button"
          >
            <Text style={[styles.heroBtnText, { color: colors.primary }]}>Browse Tests →</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            emoji="🧪"
            label="Browse Tests"
            description="View all available tests"
            bg={colors.primaryLight}
            onPress={() => router.push('/(tabs)/tests')}
          />
          <QuickAction
            emoji="📋"
            label="My Bookings"
            description="View & manage bookings"
            bg={colors.successLight}
            onPress={() => router.push('/(tabs)/bookings')}
          />
        </View>

        {/* Stats strip */}
        <View style={[styles.statsRow, { backgroundColor: colors.card }, Shadow.sm]}>
          {[
            { label: 'Tests Available', value: '50+' },
            { label: 'Happy Patients', value: '10K+' },
            { label: 'Labs Partner', value: '25+' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Popular Tests */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Tests</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tests')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {POPULAR_TESTS.map((t) => (
          <TouchableOpacity
            key={t.name}
            style={[styles.testRow, { backgroundColor: colors.card }, Shadow.sm]}
            onPress={() => router.push('/(tabs)/tests')}
            accessibilityRole="button"
          >
            <View style={[styles.testEmoji, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
            </View>
            <View style={styles.testInfo}>
              <Text style={[styles.testName, { color: colors.text }]}>{t.name}</Text>
              <Text style={[styles.testCategory, { color: colors.textSecondary }]}>{t.category}</Text>
            </View>
            <Text style={[styles.testPrice, { color: colors.primary }]}>{t.price}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingBottom: 24 },
  hero: {
    padding: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  heroGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '700', lineHeight: 34 },
  heroBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    marginTop: Spacing.two,
  },
  heroBtnText: { fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: Spacing.four, marginBottom: Spacing.two },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  seeAll: { fontSize: 14, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', paddingHorizontal: Spacing.four, gap: Spacing.three, marginBottom: Spacing.four },
  quickCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  quickIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  quickLabel: { fontSize: 15, fontWeight: '700' },
  quickDesc: { fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    gap: Spacing.three,
  },
  testEmoji: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  testInfo: { flex: 1 },
  testName: { fontSize: 15, fontWeight: '600' },
  testCategory: { fontSize: 12, marginTop: 2 },
  testPrice: { fontSize: 16, fontWeight: '700' },
});
