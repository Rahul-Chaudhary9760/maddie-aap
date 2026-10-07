import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Radius, Shadow, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: 'Something went wrong. Try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primaryLight }, Shadow.primaryGlow]}>
              <Text style={styles.logoEmoji}>🧪</Text>
            </View>
            <Text style={[styles.appName, { color: colors.primary }]}>MADDIE HEALTH</Text>
            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to manage test bookings & health reports
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.md]}>
            {errors.general && (
              <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.errorBannerText, { color: colors.error }]}>
                  {errors.general}
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, color: colors.text, borderColor: errors.email ? colors.error : colors.border },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                returnKeyType="next"
                accessibilityLabel="Email input"
              />
              {errors.email && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.email}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, color: colors.text, borderColor: errors.password ? colors.error : colors.border },
                ]}
                placeholder="Enter your secure password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                accessibilityLabel="Password input"
              />
              {errors.password && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.password}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }, isLoading && styles.btnDisabled, Shadow.primaryGlow]}
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityLabel="Login button"
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sign In to Account →</Text>
              )}
            </TouchableOpacity>

            <View style={styles.trustBadgeRow}>
              <Text style={[styles.trustBadgeText, { color: colors.textSecondary }]}>
                🔒 256-bit Encrypted • 100% NABL Accredited Labs
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {"Don't have an account? "}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) =>
  StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.four,
      gap: Spacing.three,
    },
    header: {
      alignItems: 'center',
      gap: 6,
      marginBottom: Spacing.two,
    },
    logoIcon: {
      width: 68,
      height: 68,
      borderRadius: Radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    logoEmoji: { fontSize: 34 },
    appName: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13.5,
      textAlign: 'center',
      maxWidth: 280,
    },
    formCard: {
      borderRadius: Radius.xl,
      padding: Spacing.four,
      borderWidth: 1,
      gap: Spacing.three,
    },
    field: { gap: 6 },
    label: { fontSize: 13.5, fontWeight: '700' },
    input: {
      borderWidth: 1.5,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.three,
      paddingVertical: 12,
      fontSize: 15,
    },
    fieldError: { fontSize: 12, marginTop: 2, fontWeight: '600' },
    errorBanner: {
      padding: Spacing.three,
      borderRadius: Radius.md,
    },
    errorBannerText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
    btn: {
      paddingVertical: 14,
      borderRadius: Radius.lg,
      alignItems: 'center',
      marginTop: 4,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    trustBadgeRow: { alignItems: 'center', marginTop: 4 },
    trustBadgeText: { fontSize: 11, fontWeight: '500' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: 14 },
    footerLink: { fontSize: 14, fontWeight: '700' },
  });

