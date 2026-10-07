import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { bookingsService, formatTimeSlot } from '@/services';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import type { Booking, BookingStatus } from '@/types';

const STATUS_CONFIG: Record<BookingStatus, { label: string; emoji: string; color: (c: ReturnType<typeof useTheme>['colors']) => string; bg: (c: ReturnType<typeof useTheme>['colors']) => string }> = {
  pending: { label: 'Pending', emoji: '⏳', color: (c) => c.warning, bg: (c) => c.warningLight },
  confirmed: { label: 'Confirmed', emoji: '✅', color: (c) => c.success, bg: (c) => c.successLight },
  completed: { label: 'Completed', emoji: '🎉', color: (c) => c.success, bg: (c) => c.successLight },
  cancelled: { label: 'Cancelled', emoji: '❌', color: (c) => c.error, bg: (c) => c.errorLight },
};

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: string) => void }) {
  const { colors } = useTheme();
  const cfg = STATUS_CONFIG[booking.status];
  const date = new Date(booking.appointmentDate);
  const canCancel = booking.status === 'pending';

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, Shadow.md]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={[styles.testName, { color: colors.text }]}>{booking.test.name}</Text>
          <Text style={[styles.testCategory, { color: colors.textSecondary }]}>{booking.test.category}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg(colors) }]}>
          <Text style={{ fontSize: 13 }}>{cfg.emoji}</Text>
          <Text style={[styles.badgeText, { color: cfg.color(colors) }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.details}>
        <Row label="Patient" value={booking.patientName} colors={colors} />
        <Row label="Date" value={date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} colors={colors} />
        <Row label="Slot" value={formatTimeSlot(booking.timeSlot)} colors={colors} />
        <Row label="Amount" value={`₹${booking.totalAmount}`} colors={colors} highlight />
      </View>

      {booking.notes ? (
        <Text style={[styles.notes, { color: colors.textSecondary, borderColor: colors.border }]}>
          📝 {booking.notes}
        </Text>
      ) : null}

      <Text style={[styles.bookingId, { color: colors.textSecondary }]}>
        Booking #{booking._id.slice(-8).toUpperCase()}
      </Text>

      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.error }]}
          onPress={() => onCancel(booking._id)}
          accessibilityRole="button"
          accessibilityLabel="Cancel booking"
        >
          <Text style={[styles.cancelText, { color: colors.error }]}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Row({ label, value, colors, highlight }: { label: string; value: string; colors: ReturnType<typeof useTheme>['colors']; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: highlight ? colors.primary : colors.text }]}>{value}</Text>
    </View>
  );
}

export default function BookingsScreen() {
  const { colors } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await bookingsService.getMy();
      setBookings(data);
    } catch {
      setError('Failed to load bookings. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    bookingsService.getMy()
      .then((data) => {
        if (isMounted) {
          setBookings(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Failed to load bookings. Pull to refresh.');
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No, Keep it', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsService.cancel(bookingId);
              setBookings((prev) =>
                prev.map((b) => b._id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b),
              );
            } catch {
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading bookings...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => loadData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          renderItem={({ item }) => <BookingCard booking={item} onCancel={handleCancel} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 48 }}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No bookings yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Book a lab test to see it here
              </Text>
              <TouchableOpacity
                style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/tests')}
                accessibilityRole="button"
              >
                <Text style={styles.browseBtnText}>Browse Tests</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: 4, paddingBottom: Spacing.two },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 13 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: 24, gap: Spacing.three },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1, marginRight: Spacing.two },
  testName: { fontSize: 16, fontWeight: '700' },
  testCategory: { fontSize: 12, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1 },
  details: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13, fontWeight: '600' },
  notes: {
    fontSize: 13,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    lineHeight: 18,
  },
  bookingId: { fontSize: 11, textAlign: 'right' },
  cancelBtn: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: 2,
  },
  cancelText: { fontWeight: '700', fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingTop: 60 },
  loadingText: { fontSize: 14 },
  errorText: { fontSize: 14, textAlign: 'center', paddingHorizontal: Spacing.four },
  retryBtn: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Radius.md },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  browseBtn: { marginTop: Spacing.two, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Radius.md },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
