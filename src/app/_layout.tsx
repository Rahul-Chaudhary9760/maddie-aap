import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';

SplashScreen.preventAutoHideAsync();

/** Redirects unauthenticated users to /auth/login and authenticated users away from /auth */
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  return <>{children}</>;
}

export default function RootLayout() {
  const { colors, isDark } = useTheme();

  const customNavigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={customNavigationTheme}>
      <AuthProvider>
        <NavigationGuard>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.card,
              },
              headerTintColor: colors.text,
              headerTitleStyle: {
                color: colors.text,
                fontWeight: '700',
                fontSize: 17,
              },
              headerTitleAlign: 'center',
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="test/[id]"
              options={{
                headerShown: true,
                title: 'Test Details',
                headerBackTitle: 'Back',
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="book/[id]"
              options={{
                headerShown: true,
                title: 'Book Appointment',
                headerBackTitle: 'Back',
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
          </Stack>
        </NavigationGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}
