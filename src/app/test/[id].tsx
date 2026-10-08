import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { testsService } from '@/services';
import { getCategoryMeta, Radius, Shadow, Spacing } from '@/constants/theme';
import type { MedicalTest } from '@/types';

function HighlightItem({
  emoji,
  title,
  subtitle,
  colors,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.highlightItem, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={[styles.highlightTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.highlightSubtitle, { color: colors.text }]}>{subtitle}</Text>
    </View>
  );
}

export default function TestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [test, setTest] = useState<MedicalTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    testsService
      .getById(id)
      .then((data) => {
        if (isMounted) {
          setTest(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Failed to load test details.');
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading test details...</Text>
      </View>
    );
  }

  if (error || !test) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 44 }}>⚠️</Text>
        <Text style={[styles.errorText, { color: colors.error }]}>{error ?? 'Test not found'}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = getCategoryMeta(test.category);
  const isAvailable = test.isAvailable !== false;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: test.name,
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.headerBackBtn, { backgroundColor: colors.inputBg }]}
              accessibilityRole="button"
              accessibilityLabel="Back"
              activeOpacity={0.7}
            >
              <Text style={[styles.headerBackIcon, { color: colors.text }]}>←</Text>
            </TouchableOpacity>
          ),
          headerRight: () => <View style={styles.headerRightSpacer} />,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.md]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroEmojiWrap, { backgroundColor: meta.bg }]}>
              <Text style={{ fontSize: 36 }}>{meta.emoji}</Text>
            </View>
            <View style={styles.heroBadgeColumn}>
              <View style={[styles.availBadge, { backgroundColor: isAvailable ? colors.successLight : colors.errorLight }]}>
                <Text style={[styles.availText, { color: isAvailable ? colors.success : colors.error }]}>
                  {isAvailable ? '● Available for Booking' : '● Unavailable'}
                </Text>
              </View>
              <View style={[styles.catBadge, { backgroundColor: meta.bg }]}>
                <Text style={[styles.catBadgeText, { color: meta.text }]}>{test.category}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.testTitle, { color: colors.text }]}>{test.name}</Text>

          {test.description ? (
            <Text style={[styles.testDescription, { color: colors.textSecondary }]}>
              {test.description}
            </Text>
          ) : null}

          <View style={[styles.trustTagRow, { backgroundColor: colors.inputBg }]}>
            <Text style={[styles.trustTag, { color: colors.textSecondary }]}>🛡️ NABL Certified Lab</Text>
            <Text style={[styles.trustDot, { color: colors.border }]}>•</Text>
            <Text style={[styles.trustTag, { color: colors.textSecondary }]}>🏠 Free Home Collection</Text>
          </View>
        </View>

        {/* Key Parameter Highlights Grid */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Test Highlights</Text>
          <View style={styles.highlightsGrid}>
            <HighlightItem
              emoji="🩸"
              title="Sample Type"
              subtitle={test.category.includes('Urine') ? 'Urine' : 'Blood Sample'}
              colors={colors}
            />
            <HighlightItem
              emoji="⏱️"
              title="Turnaround"
              subtitle={test.reportDeliveryTime || '24 Hours'}
              colors={colors}
            />
            <HighlightItem
              emoji="🍽️"
              title="Fasting"
              subtitle={test.preparationInstructions?.toLowerCase().includes('fast') ? '8-10h Fasting' : 'Not Required'}
              colors={colors}
            />
            <HighlightItem
              emoji="👥"
              title="Age Group"
              subtitle="All age groups"
              colors={colors}
            />
          </View>
        </View>

        {/* Preparation Instructions */}
        {test.preparationInstructions ? (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 20 }}>📝</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Preparation Guidelines</Text>
            </View>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              {test.preparationInstructions}
            </Text>
          </View>
        ) : null}

        {/* Sample Pickup Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.warningLight }]}>
          <Text style={[styles.noteHeading, { color: colors.warning }]}>ℹ️ Important Information</Text>
          <Text style={[styles.noteText, { color: colors.text }]}>
            A certified phlebotomist will arrive at your selected time slot. Please keep your valid ID ready. Reports will be uploaded directly to your app account.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }, Shadow.lg]}>
        <View style={styles.footerPriceCol}>
          <Text style={[styles.footerPriceLabel, { color: colors.textMuted }]}>Total Amount</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.footerPriceValue, { color: colors.primary }]}>₹{test.price}</Text>
            <Text style={[styles.footerStrikePrice, { color: colors.textMuted }]}>₹{Math.round(test.price * 1.4)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.bookBtn,
            { backgroundColor: isAvailable ? colors.primary : colors.border },
            isAvailable && Shadow.primaryGlow,
          ]}
          disabled={!isAvailable}
          onPress={() => router.push({ pathname: '/book/[id]', params: { id: test._id } })}
          accessibilityRole="button"
          accessibilityLabel="Proceed to booking"
        >
          <Text style={[styles.bookBtnText, { color: isAvailable ? '#fff' : colors.textSecondary }]}>
            {isAvailable ? 'Book Appointment →' : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 24, gap: Spacing.three, paddingTop: Spacing.two },
  heroCard: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.two,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroEmojiWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  availBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  availText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  testTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  testDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  trustTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
    marginTop: 4,
    gap: 8,
  },
  trustTag: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  trustDot: {
    fontSize: 12,
  },
  sectionWrap: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  highlightItem: {
    width: '48.5%',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 2,
  },
  highlightTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  highlightSubtitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  noteCard: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    gap: 4,
  },
  noteHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  noteText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
  },
  footerPriceCol: {
    gap: 1,
  },
  footerPriceLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  footerPriceValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  footerStrikePrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  bookBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 6,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  retryBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Platform.OS === 'web' ? 12 : 4,
  },
  headerBackIcon: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  headerRightSpacer: {
    width: 38,
    marginRight: Platform.OS === 'web' ? 12 : 4,
  },
});

