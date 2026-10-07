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
import { Radius, Spacing } from '@/constants/theme';

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
            <View style={[styles.logoIcon, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.logoEmoji}>🧪</Text>
            </View>
            <Text style={[styles.appName, { color: colors.primary }]}>Maddie</Text>
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to book your medical tests
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errors.general && (
              <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.errorBannerText, { color: colors.error }]}>
                  {errors.general}
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, color: colors.text, borderColor: errors.email ? colors.error : colors.border },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
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
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
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
              style={[styles.btn, { backgroundColor: colors.primary }, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityLabel="Login button"
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </TouchableOpacity>
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
      paddingVertical: Spacing.five,
      gap: Spacing.four,
    },
    header: {
      alignItems: 'center',
      gap: Spacing.two,
      marginBottom: Spacing.two,
    },
    logoIcon: {
      width: 72,
      height: 72,
      borderRadius: Radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.two,
    },
    logoEmoji: { fontSize: 36 },
    appName: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      textAlign: 'center',
    },
    form: { gap: Spacing.three },
    field: { gap: Spacing.one },
    label: { fontSize: 14, fontWeight: '600' },
    input: {
      borderWidth: 1.5,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
      fontSize: 15,
    },
    fieldError: { fontSize: 12, marginTop: 2 },
    errorBanner: {
      padding: Spacing.three,
      borderRadius: Radius.md,
    },
    errorBannerText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
    btn: {
      paddingVertical: Spacing.three,
      borderRadius: Radius.md,
      alignItems: 'center',
      marginTop: Spacing.two,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: 14 },
    footerLink: { fontSize: 14, fontWeight: '700' },
  });
