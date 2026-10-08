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
import { MediqLogo } from '@/components/mediq-logo';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  const styles = makeStyles(colors, isDark);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Logo */}
          <View style={styles.logoRow}>
            <MediqLogo size="md" />
          </View>

          {/* Heading */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text }]}>Sign in with your account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Access your health anytime, anywhere.
            </Text>
          </View>

          {/* Error Banner if any */}
          {errors.general && (
            <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.errorBannerText, { color: colors.error }]}>
                {errors.general}
              </Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Email Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: errors.email ? colors.error : 'transparent',
                  },
                ]}
                placeholder="example@gmail.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setErrors((e) => ({ ...e, email: undefined }));
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                returnKeyType="next"
                accessibilityLabel="Email input"
              />
              {errors.email && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.email}</Text>}
            </View>

            {/* Password Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <View
                style={[
                  styles.passwordContainer,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: errors.password ? colors.error : 'transparent',
                  },
                ]}
              >
                <TextInput
                  style={[styles.passwordInput, { color: colors.text }]}
                  placeholder="**************"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrors((e) => ({ ...e, password: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  accessibilityLabel="Password input"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.password}</Text>}
            </View>

            {/* Remember me & forgot password row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.rememberText, { color: colors.textSecondary }]}>Remember me?</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.forgotText, { color: colors.textMuted }]}>forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                isLoading && styles.btnDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityLabel="Sign in to Mediq"
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign in to Mediq</Text>
              )}
            </TouchableOpacity>

            {/* Create Account Link */}
            <View style={styles.registerRow}>
              <Text style={[styles.registerText, { color: colors.text }]}>
                {"Don't have an account? "}
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={[styles.registerLink, { color: colors.primary }]}>Create Account</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Divider "or with" */}
            <View style={styles.dividerRow}>
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>or with</Text>
            </View>

            {/* Social Buttons */}
            <TouchableOpacity
              style={[
                styles.socialBtn,
                styles.googleBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.googleBtnText, { color: colors.text }]}>Sign up with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialBtn,
                styles.appleBtn,
                { backgroundColor: isDark ? '#000000' : '#2C2C2E' },
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.appleBtnText}>Sign up with IOS</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    container: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'ios' ? 12 : 24,
      paddingBottom: 36,
      justifyContent: 'center',
    },
    logoRow: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    titleSection: {
      marginBottom: 28,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.4,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14.5,
      fontWeight: '400',
      lineHeight: 20,
    },
    errorBanner: {
      padding: 12,
      borderRadius: 10,
      marginBottom: 16,
    },
    errorBannerText: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    formSection: {
      gap: 16,
    },
    field: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
    },
    input: {
      height: 52,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 14.5,
      fontStyle: 'italic',
      borderWidth: 1.5,
    },
    passwordContainer: {
      height: 52,
      borderRadius: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
    },
    passwordInput: {
      flex: 1,
      height: '100%',
      fontSize: 14.5,
    },
    eyeBtn: {
      padding: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    eyeIcon: {
      fontSize: 16,
      opacity: 0.6,
    },
    fieldError: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },
    optionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
      marginBottom: 8,
    },
    rememberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: '#D1D5DB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmark: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
      lineHeight: 14,
    },
    rememberText: {
      fontSize: 13,
      fontWeight: '400',
    },
    forgotText: {
      fontSize: 13,
      fontStyle: 'italic',
    },
    primaryBtn: {
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    btnDisabled: {
      opacity: 0.7,
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    registerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 6,
      marginBottom: 4,
    },
    registerText: {
      fontSize: 13.5,
      fontWeight: '400',
    },
    registerLink: {
      fontSize: 13.5,
      fontWeight: '600',
    },
    dividerRow: {
      alignItems: 'center',
      marginVertical: 4,
    },
    dividerText: {
      fontSize: 13,
      fontWeight: '400',
    },
    socialBtn: {
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleBtn: {
      borderWidth: 1,
    },
    googleBtnText: {
      fontSize: 15,
      fontWeight: '500',
    },
    appleBtn: {},
    appleBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '500',
    },
  });
