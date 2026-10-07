import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { testsService } from '@/services';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import type { MedicalTest } from '@/types';

const CATEGORY_EMOJI: Record<string, string> = {
  Blood: '🩸',
  'Blood Test': '🩸',
  Urine: '🧫',
  'Urine Test': '🧫',
  Radiology: '🩻',
  'Full Body': '🏃‍♂️',
  Cardiology: '❤️',
  Pathology: '🔬',
  Microbiology: '🦠',
  Thyroid: '🦋',
  Diabetes: '🩺',
  Other: '🧪',
};

function getCategoryEmoji(cat: string): string {
  if (CATEGORY_EMOJI[cat]) return CATEGORY_EMOJI[cat];
  const lower = (cat || '').toLowerCase();
  if (lower.includes('blood')) return '🩸';
  if (lower.includes('urine')) return '🧫';
  if (lower.includes('radio') || lower.includes('x-ray') || lower.includes('scan')) return '🩻';
  if (lower.includes('body')) return '🏃‍♂️';
  if (lower.includes('heart') || lower.includes('cardio')) return '❤️';
  if (lower.includes('micro')) return '🦠';
  if (lower.includes('path')) return '🔬';
  return '🧪';
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
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
      </View>
    );
  }

  if (error || !test) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 40 }}>⚠️</Text>
        <Text style={[styles.errorText, { color: colors.error }]}>{error ?? 'Test not found'}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.heroEmoji}>{getCategoryEmoji(test.category)}</Text>
          <View style={[styles.availBadge, { backgroundColor: test.isAvailable ? colors.successLight : colors.errorLight }]}>
            <Text style={[styles.availText, { color: test.isAvailable ? colors.success : colors.error }]}>
              {test.isAvailable ? '✅ Available for Booking' : '❌ Currently Unavailable'}
            </Text>
          </View>
        </View>

        {/* Main Info */}
        <View style={[styles.card, { backgroundColor: colors.card }, Shadow.md]}>
          <Text style={[styles.testName, { color: colors.text }]}>{test.name}</Text>
          <Text style={[styles.category, { color: colors.textSecondary }]}>{test.category}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{test.description}</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <InfoRow label="Price" value={`₹${test.price}`} colors={colors} />
          {test.reportDeliveryTime && (
            <InfoRow label="Report Ready In" value={test.reportDeliveryTime} colors={colors} />
          )}
        </View>

        {/* Preparation Instructions */}
        {test.preparationInstructions && (
          <View style={[styles.card, { backgroundColor: colors.card }, Shadow.sm]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📝 Preparation Instructions</Text>
            <Text style={[styles.instructions, { color: colors.textSecondary }]}>
              {test.preparationInstructions}
            </Text>
          </View>
        )}

        {/* Booking Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.warningLight }]}>
          <Text style={[styles.noteText, { color: colors.warning }]}>
            ⚠️ Please arrive 15 minutes before your scheduled slot. Bring a valid government-issued ID.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Total Price</Text>
          <Text style={[styles.priceValue, { color: colors.primary }]}>₹{test.price}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, { backgroundColor: test.isAvailable ? colors.primary : colors.border }]}
          disabled={!test.isAvailable}
          onPress={() => router.push({ pathname: '/book/[id]', params: { id: test._id } })}
          accessibilityRole="button"
          accessibilityLabel="Book this test"
        >
          <Text style={[styles.bookBtnText, { color: test.isAvailable ? '#fff' : colors.textSecondary }]}>
            {test.isAvailable ? 'Book Now' : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 24, gap: Spacing.three },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  heroEmoji: { fontSize: 56 },
  availBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full },
  availText: { fontSize: 13, fontWeight: '700' },
  card: { marginHorizontal: Spacing.four, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  testName: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  category: { fontSize: 13, fontWeight: '500' },
  description: { fontSize: 14, lineHeight: 22 },
  divider: { height: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  instructions: { fontSize: 14, lineHeight: 22 },
  noteCard: { marginHorizontal: Spacing.four, borderRadius: Radius.lg, padding: Spacing.three },
  noteText: { fontSize: 13, lineHeight: 20 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderTopWidth: 1,
  },
  priceLabel: { fontSize: 12 },
  priceValue: { fontSize: 24, fontWeight: '800' },
  bookBtn: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, borderRadius: Radius.md },
  bookBtnText: { fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  errorText: { fontSize: 14, textAlign: 'center', paddingHorizontal: Spacing.four },
  retryBtn: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Radius.md },
  retryText: { color: '#fff', fontWeight: '700' },
});
