import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { Radius, Shadow } from '@/constants/theme';

type TabIconProps = {
  focused: boolean;
  label: string;
  emoji: string;
  colors: ReturnType<typeof useTheme>['colors'];
};

function TabIcon({ focused, label, emoji, colors }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <View
        style={[
          styles.iconPill,
          focused && {
            backgroundColor: colors.primaryLight,
            transform: [{ scale: 1.05 }],
          },
        ]}
      >
        <Text style={[styles.emoji, { opacity: focused ? 1 : 0.65 }]}>{emoji}</Text>
      </View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: focused ? colors.primary : colors.textSecondary,
            fontWeight: focused ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          ...Shadow.sm,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Home" emoji="🏠" colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Lab Tests" emoji="🧪" colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Bookings" emoji="📋" colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Profile" emoji="👤" colors={colors} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 64,
  },
  iconPill: {
    width: 44,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
});

