import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
  const lower = cat.toLowerCase();
  if (lower.includes('blood')) return '🩸';
  if (lower.includes('urine')) return '🧫';
  if (lower.includes('radio') || lower.includes('x-ray') || lower.includes('scan')) return '🩻';
  if (lower.includes('body')) return '🏃‍♂️';
  if (lower.includes('heart') || lower.includes('cardio')) return '❤️';
  if (lower.includes('micro')) return '🦠';
  if (lower.includes('path')) return '🔬';
  return '🧪';
}

function TestCard({ test }: { test: MedicalTest }) {
  const { colors } = useTheme();
  const emoji = getCategoryEmoji(test.category);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        Shadow.md,
      ]}
      onPress={() => router.push({ pathname: '/test/[id]', params: { id: test._id } })}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${test.name}`}
    >
      <View style={styles.cardTop}>
        <View style={[styles.cardEmoji, { backgroundColor: colors.primaryLight }]}>
          <Text style={{ fontSize: 26 }}>{emoji}</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={[styles.catBadge, { backgroundColor: colors.inputBg }]}>
            <Text style={[styles.catBadgeText, { color: colors.textSecondary }]}>
              {test.category}
            </Text>
          </View>
          <View
            style={[
              styles.availBadge,
              { backgroundColor: test.isAvailable !== false ? colors.successLight : colors.errorLight },
            ]}
          >
            <Text
              style={[
                styles.availBadgeText,
                { color: test.isAvailable !== false ? colors.success : colors.error },
              ]}
            >
              {test.isAvailable !== false ? '● Available' : '● Unavailable'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={2}>
        {test.name}
      </Text>

      {test.description ? (
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {test.description}
        </Text>
      ) : null}

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.pricePrefix, { color: colors.textSecondary }]}>Starting at</Text>
          <Text style={[styles.cardPrice, { color: colors.primary }]}>₹{test.price}</Text>
        </View>

        <View style={[styles.bookBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.bookBtnText}>Book Now →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TestsScreen() {
  const { colors } = useTheme();
  const [tests, setTests] = useState<MedicalTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await testsService.getAll();
      setTests(data);
    } catch {
      setError('Failed to load lab tests. Please check connection and retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    testsService
      .getAll()
      .then((data) => {
        if (isMounted) {
          setTests(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Failed to load lab tests. Please check connection and retry.');
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute categories dynamically from tests list
  const categories = useMemo(() => {
    const dynamicCats = Array.from(
      new Set(tests.map((t) => t.category).filter(Boolean)),
    );
    if (dynamicCats.length === 0) {
      return ['All', 'Blood', 'Urine', 'Radiology', 'Full Body', 'Cardiology', 'Pathology'];
    }
    return ['All', ...dynamicCats];
  }, [tests]);

  const filtered = useMemo(() => {
    let list = tests;
    if (activeCategory !== 'All') {
      list = list.filter((t) => {
        const tCat = (t.category || '').toLowerCase().trim();
        const aCat = activeCategory.toLowerCase().trim();
        return tCat === aCat || tCat.includes(aCat) || aCat.includes(tCat);
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tests, activeCategory, search]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Lab Tests</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>
              {filtered.length} {filtered.length === 1 ? 'Test' : 'Tests'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.inputBg, borderColor: colors.border },
          ]}
        >
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search test name, category..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search tests"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.chipContainer}>
        <FlatList
          data={categories}
          keyExtractor={(c) => c}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipScroll}
          renderItem={({ item: cat }) => {
            const isSelected = activeCategory === cat;
            const emoji = cat === 'All' ? '✨' : getCategoryEmoji(cat);
            return (
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveCategory(cat)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={{ fontSize: 14 }}>{emoji}</Text>
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#fff' : colors.text },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Test List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading medical tests...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to load tests</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => loadData()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t._id}
          renderItem={({ item }) => <TestCard test={item} />}
          style={styles.flexList}
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
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 52 }}>🔬</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {search ? 'No matching tests found' : 'No tests available'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {search
                  ? `No results for "${search}". Try searching with different keywords.`
                  : 'Check back later for available lab packages.'}
              </Text>
              {(search.length > 0 || activeCategory !== 'All') && (
                <TouchableOpacity
                  style={[styles.resetFilterBtn, { backgroundColor: colors.primaryLight }]}
                  onPress={() => {
                    setSearch('');
                    setActiveCategory('All');
                  }}
                >
                  <Text style={[styles.resetFilterText, { color: colors.primary }]}>
                    Reset all filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flexList: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  chipContainer: {
    paddingVertical: Spacing.one,
  },
  chipScroll: {
    flexGrow: 0,
    maxHeight: 48,
  },
  chips: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: 40,
    gap: Spacing.three,
    flexGrow: 1,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardEmoji: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  availBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    marginTop: 2,
  },
  priceContainer: {
    gap: 1,
  },
  pricePrefix: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  bookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginTop: Spacing.two,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  resetFilterBtn: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  resetFilterText: {
    fontWeight: '700',
    fontSize: 13,
  },
});
