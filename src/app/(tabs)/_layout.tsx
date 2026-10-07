import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type TabIconProps = { focused: boolean; label: string; emoji: string; colors: ReturnType<typeof useTheme>['colors'] };

function TabIcon({ focused, label, emoji, colors }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.emoji, { opacity: focused ? 1 : 0.55 }]}>{emoji}</Text>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.primary : colors.textSecondary },
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
          height: 60,
          paddingBottom: 4,
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
            <TabIcon focused={focused} label="Tests" emoji="🧪" colors={colors} />
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
  tabIcon: { alignItems: 'center', gap: 2 },
  emoji: { fontSize: 22 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
});
