import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { testsService } from '@/services';
import { getCategoryMeta, Radius, Shadow, Spacing } from '@/constants/theme';
import type { MedicalTest } from '@/types';

const POPULAR_CATEGORIES = [
  { id: 'Blood', label: 'Blood Tests', emoji: '🩸', bg: '#FEE2E2', color: '#DC2626' },
  { id: 'Full Body', label: 'Full Body', emoji: '🏃‍♂️', bg: '#DCFCE7', color: '#15803D' },
  { id: 'Radiology', label: 'X-Ray & Scans', emoji: '🩻', bg: '#E0E7FF', color: '#4338CA' },
  { id: 'Cardiology', label: 'Heart / ECG', emoji: '❤️', bg: '#FFE4E6', color: '#BE123C' },
  { id: 'Diabetes', label: 'Diabetes Care', emoji: '🩺', bg: '#FEF9C3', color: '#A16207' },
  { id: 'Thyroid', label: 'Thyroid', emoji: '🦋', bg: '#E0F2FE', color: '#0369A1' },
  { id: 'Urine', label: 'Urine Analysis', emoji: '🧫', bg: '#FEF3C7', color: '#B45309' },
  { id: 'Pathology', label: 'Pathology', emoji: '🔬', bg: '#EDE9FE', color: '#6D28D9' },
];

const TRUST_PILLARS = [
  { emoji: '🏠', title: 'Home Pickup', desc: 'Certified phlebotomists' },
  { emoji: '⚡', title: '24h Reports', desc: 'Fast & digital on app' },
  { emoji: '🛡️', title: 'NABL Certified', desc: '100% accurate labs' },
  { emoji: '👨‍⚕️', title: 'Doctor Verified', desc: 'Expert pathologist review' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [popularTests, setPopularTests] = useState<MedicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const loadPopularTests = async (isPullRefresh = false) => {
    if (isPullRefresh) setRefreshing(true);
    try {
      const data = await testsService.getAll();
      setPopularTests(data.slice(0, 4));
    } catch {
      setPopularTests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    testsService
      .getAll()
      .then((data) => {
        if (isMounted) {
          setPopularTests(data.slice(0, 4));
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPopularTests([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = () => {
    loadPopularTests(true);
  };


  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Top Bar / Greeting */}
        <View style={styles.topBar}>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
              {getGreeting()}, 👋
            </Text>
            <Text style={[styles.greetingName, { color: colors.text }]}>{firstName}</Text>
          </View>
          <TouchableOpacity
            style={[styles.profileAvatar, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel="View profile"
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.name ? user.name[0].toUpperCase() : '👤'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location / Home Collection Strip */}
        <View style={[styles.locationChip, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
          <Text style={{ fontSize: 14 }}>📍</Text>
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            Home Sample Collection Available • <Text style={{ color: colors.success, fontWeight: '700' }}>Free Pickup</Text>
          </Text>
        </View>

        {/* Search Bar Trigger */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.searchTrigger, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/tests')}
          accessibilityRole="button"
          accessibilityLabel="Search medical tests"
        >
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>
            Search blood tests, scans, thyroid, lipid...
          </Text>
        </TouchableOpacity>

        {/* Hero Banner */}
        <View style={[styles.heroCard, { backgroundColor: colors.primary }, Shadow.primaryGlow]}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>⚡ UP TO 40% OFF</Text>
          </View>
          <Text style={styles.heroTitle}>Comprehensive Full Body Checkup</Text>
          <Text style={styles.heroSub}>
            Includes 60+ vital tests • Free home sample collection • 24hr online report
          </Text>
          <View style={styles.heroFooter}>
            <View>
              <Text style={styles.heroStrikePrice}>₹1,499</Text>
              <Text style={styles.heroPrice}>₹899</Text>
            </View>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.push('/(tabs)/tests')}
              accessibilityRole="button"
            >
              <Text style={[styles.heroBtnText, { color: colors.primary }]}>Book Now →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Category Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Find by Specialty</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tests')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {POPULAR_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}
              onPress={() => router.push('/(tabs)/tests')}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${cat.label}`}
            >
              <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
                <Text style={{ fontSize: 24 }}>{cat.emoji}</Text>
              </View>
              <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trust & Quality Strip */}
        <View style={[styles.trustSection, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
          <Text style={[styles.trustHeading, { color: colors.text }]}>Why Maddie Healthcare?</Text>
          <View style={styles.trustGrid}>
            {TRUST_PILLARS.map((pillar) => (
              <View key={pillar.title} style={styles.trustItem}>
                <View style={[styles.trustIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Text style={{ fontSize: 20 }}>{pillar.emoji}</Text>
                </View>
                <Text style={[styles.trustTitle, { color: colors.text }]}>{pillar.title}</Text>
                <Text style={[styles.trustDesc, { color: colors.textSecondary }]}>{pillar.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Popular Tests Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Lab Packages</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tests')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Explore All ({popularTests.length}+) →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading health packages...</Text>
          </View>
        ) : popularTests.length > 0 ? (
          <View style={styles.testsList}>
            {popularTests.map((t) => {
              const meta = getCategoryMeta(t.category);
              return (
                <TouchableOpacity
                  key={t._id}
                  style={[styles.testCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.md]}
                  onPress={() => router.push({ pathname: '/test/[id]', params: { id: t._id } })}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <View style={styles.testCardHeader}>
                    <View style={[styles.testEmojiWrap, { backgroundColor: meta.bg }]}>
                      <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
                    </View>
                    <View style={styles.testHeaderInfo}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.miniCatBadge, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.miniCatText, { color: meta.text }]}>{t.category}</Text>
                        </View>
                        <View style={[styles.reportBadge, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.reportBadgeText, { color: colors.primary }]}>⏱️ 12-24 hrs</Text>
                        </View>
                      </View>
                      <Text style={[styles.testName, { color: colors.text }]} numberOfLines={1}>
                        {t.name}
                      </Text>
                    </View>
                  </View>

                  {t.description ? (
                    <Text style={[styles.testDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {t.description}
                    </Text>
                  ) : null}

                  <View style={[styles.testCardFooter, { borderTopColor: colors.borderLight }]}>
                    <View>
                      <Text style={[styles.testPriceLabel, { color: colors.textSecondary }]}>Price</Text>
                      <Text style={[styles.testPriceValue, { color: colors.primary }]}>₹{t.price}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.quickBookBtn, { backgroundColor: colors.primary }]}
                      onPress={() => router.push({ pathname: '/book/[id]', params: { id: t._id } })}
                      accessibilityRole="button"
                      accessibilityLabel={`Book ${t.name}`}
                    >
                      <Text style={styles.quickBookText}>Book Now →</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* How Maddie Works Banner */}
        <View style={[styles.howCard, { backgroundColor: colors.accentSkyLight, borderColor: colors.border }]}>
          <Text style={[styles.howTitle, { color: colors.text }]}>🩺 How Home Testing Works</Text>
          <View style={styles.howSteps}>
            <View style={styles.howStep}>
              <View style={[styles.howNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.howNumText}>1</Text>
              </View>
              <Text style={[styles.howStepText, { color: colors.text }]}>Choose test & convenient time slot</Text>
            </View>
            <View style={styles.howStep}>
              <View style={[styles.howNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.howNumText}>2</Text>
              </View>
              <Text style={[styles.howStepText, { color: colors.text }]}>Vaccinated agent collects sample at home</Text>
            </View>
            <View style={styles.howStep}>
              <View style={[styles.howNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.howNumText}>3</Text>
              </View>
              <Text style={[styles.howStepText, { color: colors.text }]}>Get verified report online within 24h</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingBottom: 32 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  greetingContainer: { gap: 2 },
  greetingSub: { fontSize: 13, fontWeight: '500' },
  greetingName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.four,
    marginTop: 4,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  locationText: { fontSize: 12, fontWeight: '500', flex: 1 },
  searchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  searchPlaceholder: { fontSize: 14, flex: 1 },
  heroCard: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 28 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18 },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.one,
  },
  heroStrikePrice: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecorationLine: 'line-through' },
  heroPrice: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroBtn: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  heroBtnText: { fontWeight: '700', fontSize: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  seeAll: { fontSize: 13, fontWeight: '700' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    gap: 10,
    marginBottom: Spacing.four,
  },
  categoryCard: {
    width: '22.8%',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  categoryName: { fontSize: 11, fontWeight: '600', textAlign: 'center', paddingHorizontal: 2 },
  trustSection: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  trustHeading: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  trustIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  trustTitle: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  trustDesc: { fontSize: 9.5, textAlign: 'center', lineHeight: 12 },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  loadingText: { fontSize: 13 },
  testsList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  testCard: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  testCardHeader: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  testEmojiWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testHeaderInfo: {
    flex: 1,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  miniCatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  miniCatText: { fontSize: 10, fontWeight: '700' },
  reportBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  reportBadgeText: { fontSize: 10, fontWeight: '600' },
  testName: { fontSize: 16, fontWeight: '700' },
  testDesc: { fontSize: 12.5, lineHeight: 17 },
  testCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    marginTop: 2,
  },
  testPriceLabel: { fontSize: 10.5, fontWeight: '500' },
  testPriceValue: { fontSize: 18, fontWeight: '800' },
  quickBookBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  quickBookText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  howCard: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  howTitle: { fontSize: 15, fontWeight: '700' },
  howSteps: { gap: Spacing.two },
  howStep: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  howNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  howNumText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  howStepText: { fontSize: 13, fontWeight: '500', flex: 1 },
});

