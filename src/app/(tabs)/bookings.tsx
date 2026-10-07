import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { bookingsService, formatTimeSlot } from '@/services';
import { getCategoryMeta, Radius, Shadow, Spacing } from '@/constants/theme';
import type { Booking, BookingStatus } from '@/types';

const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string;
    emoji: string;
    color: (c: ReturnType<typeof useTheme>['colors']) => string;
    bg: (c: ReturnType<typeof useTheme>['colors']) => string;
    border: string;
  }
> = {
  pending: {
    label: 'Appointment Pending',
    emoji: '⏳',
    color: (c) => c.warning,
    bg: (c) => c.warningLight,
    border: '#FDE68A',
  },
  confirmed: {
    label: 'Confirmed & Scheduled',
    emoji: '✅',
    color: (c) => c.success,
    bg: (c) => c.successLight,
    border: '#BBF7D0',
  },
  completed: {
    label: 'Report Ready / Completed',
    emoji: '🎉',
    color: (c) => c.primary,
    bg: (c) => c.primaryLight,
    border: '#BFDBFE',
  },
  cancelled: {
    label: 'Booking Cancelled',
    emoji: '❌',
    color: (c) => c.error,
    bg: (c) => c.errorLight,
    border: '#FECACA',
  },
};

type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled';

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: string) => void }) {
  const { colors } = useTheme();
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const meta = getCategoryMeta(booking.test.category);
  const date = new Date(booking.appointmentDate);
  const canCancel = booking.status === 'pending';

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.md]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.cardEmojiWrap, { backgroundColor: meta.bg }]}>
            <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
          </View>
          <View style={styles.cardLeftInfo}>
            <Text style={[styles.testName, { color: colors.text }]} numberOfLines={1}>
              {booking.test.name}
            </Text>
            <Text style={[styles.testCategory, { color: colors.textSecondary }]}>
              {booking.test.category} • Home Collection
            </Text>
          </View>
        </View>
      </View>

      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: cfg.bg(colors), borderColor: cfg.border }]}>
        <Text style={{ fontSize: 13 }}>{cfg.emoji}</Text>
        <Text style={[styles.statusText, { color: cfg.color(colors) }]}>{cfg.label}</Text>
      </View>

      {/* Perforated Divider */}
      <View style={[styles.dividerDashed, { borderColor: colors.border }]} />

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailRow}>
          <View style={styles.detailCol}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>PATIENT</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{booking.patientName}</Text>
          </View>
          <View style={[styles.detailCol, { alignItems: 'flex-end' }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>AMOUNT</Text>
            <Text style={[styles.detailPrice, { color: colors.primary }]}>₹{booking.totalAmount}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailCol}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>DATE</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              📅 {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </View>
          <View style={[styles.detailCol, { alignItems: 'flex-end' }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>SLOT</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              ⏰ {formatTimeSlot(booking.timeSlot)}
            </Text>
          </View>
        </View>
      </View>

      {/* Address & Collection info */}
      {(() => {
        let displayAddress: string | null = null;
        if (typeof booking.address === 'object' && booking.address !== null) {
          const { street, city, pincode, landmark } = booking.address;
          const parts = [
            street,
            landmark ? `Near ${landmark}` : '',
            city,
            pincode ? `PIN: ${pincode}` : '',
          ].filter(Boolean);
          displayAddress = parts.join(', ');
        } else if (typeof booking.address === 'string' && booking.address.trim()) {
          displayAddress = booking.address.trim();
        }

        const notesStr = booking.notes || '';
        if (!displayAddress) {
          const addressMatch = notesStr.match(/📍 Address:\s*([^|]+)/);
          if (addressMatch) displayAddress = addressMatch[1].trim();
        }
        
        let displayInstructions = notesStr;
        if (notesStr.includes('📍 Address:') || notesStr.includes('Phone:')) {
          const instMatch = notesStr.match(/Instructions:\s*(.+)$/);
          displayInstructions = instMatch ? instMatch[1].trim() : '';
        }

        return (
          <>
            {displayAddress ? (
              <View style={[styles.addressBox, { backgroundColor: colors.inputBg, borderColor: colors.borderLight }]}>
                <Text style={{ fontSize: 13 }}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>SAMPLE COLLECTION AT</Text>
                  <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                    {displayAddress}
                  </Text>
                </View>
              </View>
            ) : null}

            {displayInstructions ? (
              <View style={[styles.notesWrap, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.notes, { color: colors.textSecondary }]}>
                  📝 {displayInstructions}
                </Text>
              </View>
            ) : null}
          </>
        );
      })()}

      {/* Card Actions */}
      <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
        <Text style={[styles.bookingId, { color: colors.textMuted }]}>
          Ref #{booking._id.slice(-8).toUpperCase()}
        </Text>

        <View style={styles.actionBtnsRow}>
          {canCancel && (
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.errorLight, backgroundColor: colors.errorLight }]}
              onPress={() => onCancel(booking._id)}
              accessibilityRole="button"
              accessibilityLabel="Cancel booking"
            >
              <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.bookAgainBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push({ pathname: '/test/[id]', params: { id: booking.test._id } })}
            accessibilityRole="button"
            accessibilityLabel="View test details"
          >
            <Text style={[styles.bookAgainText, { color: colors.primary }]}>View Details →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function BookingsScreen() {
  const { colors } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

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
    bookingsService
      .getMy()
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

  const executeCancel = async (bookingId: string) => {
    try {
      await bookingsService.cancel(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b)),
      );
    } catch {
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    }
  };

  const handleCancel = (bookingId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.') : true;
      if (confirmed) {
        executeCancel(bookingId);
      }
    } else {
      Alert.alert(
        'Cancel Appointment',
        'Are you sure you want to cancel this booking? This action cannot be undone.',
        [
          { text: 'No, Keep it', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: () => executeCancel(bookingId),
          },
        ],
      );
    }
  };


  const filteredBookings = useMemo(() => {
    if (activeTab === 'upcoming') {
      return bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed');
    }
    if (activeTab === 'completed') {
      return bookings.filter((b) => b.status === 'completed');
    }
    if (activeTab === 'cancelled') {
      return bookings.filter((b) => b.status === 'cancelled');
    }
    return bookings;
  }, [bookings, activeTab]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>
              {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
            </Text>
          </View>
        </View>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          Track appointments and sample collections
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {[
          { id: 'all', label: 'All' },
          { id: 'upcoming', label: 'Active / Scheduled' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((t) => {
          const isSelected = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                isSelected && Shadow.primaryGlow,
              ]}
              onPress={() => setActiveTab(t.id as FilterTab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: isSelected ? '#fff' : colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your bookings...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 44 }}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => loadData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
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
              <Text style={{ fontSize: 52 }}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === 'all' ? 'No bookings yet' : `No ${activeTab} bookings`}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Book a lab test with free home pickup to track it here
              </Text>
              <TouchableOpacity
                style={[styles.browseBtn, { backgroundColor: colors.primary }, Shadow.primaryGlow]}
                onPress={() => router.push('/(tabs)/tests')}
                accessibilityRole="button"
              >
                <Text style={styles.browseBtnText}>Browse Available Tests →</Text>
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
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 12.5, fontWeight: '500' },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  countText: { fontSize: 12, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: 8,
    flexWrap: 'wrap',
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  tabBtnText: { fontSize: 12 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: 32, gap: Spacing.three, paddingTop: Spacing.one },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    flex: 1,
  },
  cardEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLeftInfo: { flex: 1 },
  testName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  testCategory: { fontSize: 11.5, marginTop: 2 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  dividerDashed: { height: 1, borderStyle: 'dashed', borderWidth: 0.8 },
  detailsGrid: { gap: 8 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailCol: { gap: 2 },
  detailLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  detailPrice: { fontSize: 18, fontWeight: '800' },
  notesWrap: {
    padding: 8,
    borderRadius: Radius.md,
  },
  notes: {
    fontSize: 12,
    lineHeight: 16,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  addressLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  bookingId: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  actionBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  cancelText: { fontSize: 12, fontWeight: '700' },
  bookAgainBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  bookAgainText: { fontSize: 12, fontWeight: '700' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 60,
    paddingHorizontal: Spacing.four,
  },
  loadingText: { fontSize: 14 },
  errorText: { fontSize: 14, textAlign: 'center' },
  retryBtn: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Radius.md },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', maxWidth: 280 },
  browseBtn: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  browseBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

