import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { bookingsService, formatTimeSlot, testsService, TIME_SLOTS } from '@/services';
import { ApiError } from '@/lib/api';
import { getCategoryMeta, Radius, Shadow, Spacing } from '@/constants/theme';
import type { BookingAddress, CreateBookingPayload, MedicalTest, PatientGender, TimeSlot } from '@/types';

// ─── Date Options ─────────────────────────────────────────────────────────────
type DateOption = {
  dayOfWeek: string;
  dayNum: string;
  month: string;
  value: string;
};

function buildDateOptions(count = 14): DateOption[] {
  const dates: DateOption[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const dayOfWeek = d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();
    const dayNum = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
    dates.push({ dayOfWeek, dayNum, month, value });
  }
  return dates;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, title: 'Patient' },
  { num: 2, title: 'Address' },
  { num: 3, title: 'Schedule' },
  { num: 4, title: 'Confirm' },
];

function StepProgressBar({ step, colors }: { step: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={stepStyles.wrapper}>
      <View style={stepStyles.container}>
        {STEPS.map((s, i) => {
          const isDone = i < step;
          const isCurrent = i === step;
          return (
            <React.Fragment key={s.num}>
              <View style={stepStyles.node}>
                <View
                  style={[
                    stepStyles.circle,
                    {
                      backgroundColor: isDone || isCurrent ? colors.primary : colors.inputBg,
                      borderColor: isDone || isCurrent ? colors.primary : colors.border,
                    },
                    isCurrent && Shadow.primaryGlow,
                  ]}
                >
                  {isDone ? (
                    <Text style={stepStyles.checkIcon}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        stepStyles.stepNum,
                        { color: isCurrent ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {s.num}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    stepStyles.stepLabel,
                    {
                      color: isCurrent ? colors.primary : isDone ? colors.text : colors.textSecondary,
                      fontWeight: isCurrent ? '700' : '500',
                    },
                  ]}
                >
                  {s.title}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    stepStyles.line,
                    { backgroundColor: i < step ? colors.primary : colors.border },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  node: {
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  checkIcon: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 10.5,
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: -14,
    marginHorizontal: 3,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
type FormErrors = {
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  patientPhone?: string;
  houseNumber?: string;
  streetAddress?: string;
  city?: string;
  pincode?: string;
  appointmentDate?: string;
  timeSlot?: string;
};

const GENDERS: { label: string; value: PatientGender; emoji: string }[] = [
  { label: 'Male', value: 'male', emoji: '👨' },
  { label: 'Female', value: 'female', emoji: '👩' },
  { label: 'Other', value: 'other', emoji: '🧑' },
];

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [test, setTest] = useState<MedicalTest | null>(null);
  const [testLoading, setTestLoading] = useState(true);

  // Form State - Step 0 (Patient Info)
  const [bookingFor, setBookingFor] = useState<'myself' | 'other'>('myself');
  const [patientName, setPatientName] = useState(user?.name ?? '');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<PatientGender | ''>('');
  const [patientPhone, setPatientPhone] = useState(user?.phone ?? '');

  // Form State - Step 1 (Address)
  const [houseNumber, setHouseNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // Form State - Step 2 (Schedule)
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot | ''>('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState(0); // 0=patient, 1=address, 2=schedule, 3=confirm
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const dateOptions = useMemo(() => buildDateOptions(14), []);

  useEffect(() => {
    if (!id) return;
    testsService
      .getById(id)
      .then(setTest)
      .catch(() => Alert.alert('Error', 'Test not found.', [{ text: 'OK', onPress: () => router.back() }]))
      .finally(() => setTestLoading(false));
  }, [id]);

  const handleBookingForToggle = (type: 'myself' | 'other') => {
    setBookingFor(type);
    if (type === 'myself') {
      setPatientName(user?.name ?? '');
      setPatientPhone(user?.phone ?? '');
    } else {
      setPatientName('');
      setPatientPhone('');
    }
  };
  // Validations
  const validateStep0 = (): boolean => {
    const e: FormErrors = {};
    if (!patientName.trim()) e.patientName = 'Patient full name is required';
    else if (patientName.trim().length < 2) e.patientName = 'Name must be at least 2 characters';
    
    const age = parseInt(patientAge, 10);
    if (!patientAge) e.patientAge = 'Age is required';
    else if (isNaN(age) || age < 1 || age > 120) e.patientAge = 'Enter a valid age (1–120)';
    
    if (!patientGender) e.patientGender = 'Please select gender';
    
    const cleanPhone = patientPhone.replace(/\D/g, '');
    if (!patientPhone.trim()) e.patientPhone = 'Phone number is required for pickup coordination';
    else if (cleanPhone.length < 10) e.patientPhone = 'Enter a valid 10-digit mobile number';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!houseNumber.trim()) e.houseNumber = 'House / Flat / Building number is required';
    if (!streetAddress.trim()) e.streetAddress = 'Street / Area / Colony is required';
    if (!city.trim()) e.city = 'City name is required';
    const cleanPin = pincode.replace(/\D/g, '');
    if (!pincode.trim()) e.pincode = 'Pincode is required';
    else if (cleanPin.length !== 6) e.pincode = 'Enter a valid 6-digit postal code';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FormErrors = {};
    if (!appointmentDate) e.appointmentDate = 'Please select an appointment date';
    if (!timeSlot) e.timeSlot = 'Please select a preferred time slot';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && validateStep0()) setStep(1);
    else if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      router.back();
    }
  };

  const fullAddressString = useMemo(() => {
    const parts = [
      houseNumber.trim(),
      streetAddress.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : '',
      city.trim(),
      pincode.trim() ? `PIN: ${pincode.trim()}` : '',
    ].filter(Boolean);
    return parts.join(', ');
  }, [houseNumber, streetAddress, landmark, city, pincode]);

  const handleSubmit = async () => {
    if (!test || !id || !patientGender || !appointmentDate || !timeSlot) return;
    setIsSubmitting(true);
    try {
      const parts = appointmentDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const startH = parseInt(timeSlot.split('-')[0].split(':')[0], 10) || 9;
      const apptDate = new Date(y, m - 1, d, startH, 0, 0);

      const combinedStreet = houseNumber.trim()
        ? `${houseNumber.trim()}, ${streetAddress.trim()}`
        : streetAddress.trim();

      const addressPayload: BookingAddress = {
        street: combinedStreet,
        city: city.trim(),
        state: '',
        pincode: pincode.trim(),
        landmark: landmark.trim() || '',
      };

      const notesParts = [
        patientPhone.trim() ? `Phone: ${patientPhone.trim()}` : '',
        notes.trim() ? `Instructions: ${notes.trim()}` : '',
      ].filter(Boolean);

      const payload: CreateBookingPayload = {
        testId: id,
        patientName: patientName.trim(),
        patientAge: parseInt(patientAge, 10),
        patientGender: patientGender as PatientGender,
        address: addressPayload,
        appointmentDate: apptDate.toISOString(),
        timeSlot: timeSlot as TimeSlot,
        notes: notesParts.join(' | ') || '',
      };
      await bookingsService.create(payload);
      setBookingSuccess(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Booking failed. Please check details and retry.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = makeStyles(colors);
  const meta = test ? getCategoryMeta(test.category) : null;

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m - 1, d);
        return dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }
      return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Loading State
  if (testLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading booking form...</Text>
      </View>
    );
  }

  // Success State
  if (bookingSuccess) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIconWrap, { backgroundColor: colors.successLight }]}>
            <Text style={{ fontSize: 52 }}>🎉</Text>
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Booking Confirmed!</Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            Your appointment for <Text style={{ fontWeight: '700', color: colors.text }}>{test?.name}</Text> has been successfully scheduled.
          </Text>

          <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.md]}>
            <View style={styles.successTicketHeader}>
              <Text style={[styles.ticketLabel, { color: colors.primary }]}>🏥 APPOINTMENT PASS</Text>
              <Text style={[styles.ticketStatus, { color: colors.success }]}>● Confirmed</Text>
            </View>

            <View style={[styles.dividerDashed, { borderColor: colors.border }]} />

            {[
              { label: 'Patient Name', value: patientName },
              { label: 'Contact Phone', value: patientPhone },
              { label: 'Pickup Address', value: fullAddressString },
              { label: 'Appointment Date', value: formatDateDisplay(appointmentDate) },
              { label: 'Selected Slot', value: formatTimeSlot(timeSlot) },
              { label: 'Collection Fee', value: 'FREE (Home Pickup)', highlightColor: colors.success },
              { label: 'Total Amount', value: `₹${test?.price ?? 0}`, highlightColor: colors.primary, isLarge: true },
            ].map(({ label, value, highlightColor, isLarge }) => (
              <View key={label} style={styles.successRow}>
                <Text style={[styles.successLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text
                  style={[
                    styles.successValue,
                    {
                      color: highlightColor || colors.text,
                      fontWeight: highlightColor ? '800' : '600',
                      fontSize: isLarge ? 16 : 13,
                    },
                  ]}
                >
                  {value}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }, Shadow.primaryGlow]}
            onPress={() => router.replace('/(tabs)/bookings')}
            accessibilityRole="button"
          >
            <Text style={styles.doneBtnText}>View in My Bookings →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.homeBtn}>
            <Text style={[styles.homeLink, { color: colors.textSecondary }]}>Back to Home Screen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Book Appointment',
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={styles.headerBackBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Text style={[styles.headerBackIcon, { color: colors.primary }]}>‹</Text>
              <Text style={[styles.headerBackText, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Test Mini Summary Bar */}
          {test && meta && (
            <View style={[styles.testMiniBar, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
              <View style={[styles.miniEmoji, { backgroundColor: meta.bg }]}>
                <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
              </View>
              <View style={styles.miniInfo}>
                <Text style={[styles.miniName, { color: colors.text }]} numberOfLines={1}>
                  {test.name}
                </Text>
                <Text style={[styles.miniSub, { color: colors.textSecondary }]}>
                  {test.category} • Free Home Sample Pickup
                </Text>
              </View>
              <Text style={[styles.miniPrice, { color: colors.primary }]}>₹{test.price}</Text>
            </View>
          )}

          {/* 4-Step Progress Bar */}
          <StepProgressBar step={step} colors={colors} />

          {/* ─── Step 0: Patient Details & Contact ─── */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepHeading, { color: colors.text }]}>👤 Patient Information</Text>

              {/* Myself vs Other Toggle */}
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: bookingFor === 'myself' ? colors.primary : colors.card,
                      borderColor: bookingFor === 'myself' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleBookingForToggle('myself')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: bookingFor === 'myself' ? '#fff' : colors.text },
                    ]}
                  >
                    👤 Book for Myself
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: bookingFor === 'other' ? colors.primary : colors.card,
                      borderColor: bookingFor === 'other' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleBookingForToggle('other')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: bookingFor === 'other' ? '#fff' : colors.text },
                    ]}
                  >
                    👥 Family / Other
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Patient Name */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Patient Full Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: errors.patientName ? colors.error : colors.border,
                    },
                  ]}
                  value={patientName}
                  onChangeText={(t) => {
                    setPatientName(t);
                    setErrors((e) => ({ ...e, patientName: undefined }));
                  }}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Patient name input"
                />
                {errors.patientName && (
                  <Text style={[styles.fieldError, { color: colors.error }]}>{errors.patientName}</Text>
                )}
              </View>

              {/* Age & Gender in Row */}
              <View style={styles.rowField}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Age (Years)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: errors.patientAge ? colors.error : colors.border,
                      },
                    ]}
                    value={patientAge}
                    onChangeText={(t) => {
                      setPatientAge(t);
                      setErrors((e) => ({ ...e, patientAge: undefined }));
                    }}
                    placeholder="e.g. 28"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={3}
                    accessibilityLabel="Patient age"
                  />
                  {errors.patientAge && (
                    <Text style={[styles.fieldError, { color: colors.error }]}>{errors.patientAge}</Text>
                  )}
                </View>

                <View style={[styles.field, { flex: 1.5 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Mobile Phone</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: errors.patientPhone ? colors.error : colors.border,
                      },
                    ]}
                    value={patientPhone}
                    onChangeText={(t) => {
                      setPatientPhone(t);
                      setErrors((e) => ({ ...e, patientPhone: undefined }));
                    }}
                    placeholder="9876543210"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    accessibilityLabel="Patient phone"
                  />
                  {errors.patientPhone && (
                    <Text style={[styles.fieldError, { color: colors.error }]}>{errors.patientPhone}</Text>
                  )}
                </View>
              </View>

              {/* Gender Selector */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
                <View style={styles.genderRow}>
                  {GENDERS.map((g) => {
                    const isSelected = patientGender === g.value;
                    return (
                      <TouchableOpacity
                        key={g.value}
                        style={[
                          styles.genderChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.card,
                            borderColor: isSelected
                              ? colors.primary
                              : errors.patientGender
                              ? colors.error
                              : colors.border,
                          },
                          isSelected && Shadow.primaryGlow,
                        ]}
                        onPress={() => {
                          setPatientGender(g.value);
                          setErrors((e) => ({ ...e, patientGender: undefined }));
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text style={{ fontSize: 18 }}>{g.emoji}</Text>
                        <Text
                          style={[
                            styles.genderChipText,
                            { color: isSelected ? '#fff' : colors.text, fontWeight: isSelected ? '700' : '600' },
                          ]}
                        >
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.patientGender && (
                  <Text style={[styles.fieldError, { color: colors.error }]}>{errors.patientGender}</Text>
                )}
              </View>
            </View>
          )}

          {/* ─── Step 1: Sample Collection Address ─── */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepHeading, { color: colors.text }]}>🏠 Sample Collection Address</Text>
              <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                Our certified phlebotomist will arrive at this location to collect the test sample.
              </Text>

              {/* Flat / House No */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Flat / House / Building No.</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: errors.houseNumber ? colors.error : colors.border,
                    },
                  ]}
                  value={houseNumber}
                  onChangeText={(t) => {
                    setHouseNumber(t);
                    setErrors((e) => ({ ...e, houseNumber: undefined }));
                  }}
                  placeholder="e.g. Flat 402, Block B, Green Heights"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="House number"
                />
                {errors.houseNumber && (
                  <Text style={[styles.fieldError, { color: colors.error }]}>{errors.houseNumber}</Text>
                )}
              </View>

              {/* Street / Colony */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Street / Area / Colony</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: errors.streetAddress ? colors.error : colors.border,
                    },
                  ]}
                  value={streetAddress}
                  onChangeText={(t) => {
                    setStreetAddress(t);
                    setErrors((e) => ({ ...e, streetAddress: undefined }));
                  }}
                  placeholder="e.g. Sector 62, Near Industrial Park"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Street address"
                />
                {errors.streetAddress && (
                  <Text style={[styles.fieldError, { color: colors.error }]}>{errors.streetAddress}</Text>
                )}
              </View>

              {/* Landmark */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Landmark{' '}
                  <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>(optional)</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="e.g. Opposite Metro Pillar 142 / Behind Fortis"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Landmark"
                />
              </View>

              {/* City & Pincode in Row */}
              <View style={styles.rowField}>
                <View style={[styles.field, { flex: 1.2 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>City</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: errors.city ? colors.error : colors.border,
                      },
                    ]}
                    value={city}
                    onChangeText={(t) => {
                      setCity(t);
                      setErrors((e) => ({ ...e, city: undefined }));
                    }}
                    placeholder="e.g. New Delhi"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="City"
                  />
                  {errors.city && (
                    <Text style={[styles.fieldError, { color: colors.error }]}>{errors.city}</Text>
                  )}
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Pincode</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: errors.pincode ? colors.error : colors.border,
                      },
                    ]}
                    value={pincode}
                    onChangeText={(t) => {
                      setPincode(t);
                      setErrors((e) => ({ ...e, pincode: undefined }));
                    }}
                    placeholder="e.g. 110001"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={6}
                    accessibilityLabel="Pincode"
                  />
                  {errors.pincode && (
                    <Text style={[styles.fieldError, { color: colors.error }]}>{errors.pincode}</Text>
                  )}
                </View>
              </View>

              {/* Safety Badge */}
              <View style={[styles.infoBanner, { backgroundColor: colors.accentSkyLight, borderColor: colors.border }]}>
                <Text style={{ fontSize: 20 }}>🛡️</Text>
                <Text style={[styles.infoBannerText, { color: colors.text }]}>
                  Sealed single-use vacutainers used for all home collections with complete temperature-controlled transport.
                </Text>
              </View>
            </View>
          )}

          {/* ─── Step 2: Schedule Date & Time Slot ─── */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepHeading, { color: colors.text }]}>📅 Choose Date & Time Slot</Text>

              {/* Date Selection */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Select Appointment Date</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateScrollContainer}
                  style={styles.dateScroll}
                >
                  {dateOptions.map((d) => {
                    const isSelected = appointmentDate === d.value;
                    return (
                      <TouchableOpacity
                        key={d.value}
                        style={[
                          styles.dateChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.card,
                            borderColor: isSelected
                              ? colors.primary
                              : errors.appointmentDate
                              ? colors.error
                              : colors.border,
                          },
                          isSelected && Shadow.primaryGlow,
                        ]}
                        onPress={() => {
                          setAppointmentDate(d.value);
                          setErrors((e) => ({ ...e, appointmentDate: undefined }));
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text
                          style={[
                            styles.dateDayText,
                            { color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textSecondary },
                          ]}
                        >
                          {d.dayOfWeek}
                        </Text>
                        <Text
                          style={[
                            styles.dateNumText,
                            { color: isSelected ? '#fff' : colors.text },
                          ]}
                        >
                          {d.dayNum}
                        </Text>
                        <Text
                          style={[
                            styles.dateMonthText,
                            { color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textSecondary },
                          ]}
                        >
                          {d.month}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {errors.appointmentDate && (
                  <Text style={[styles.fieldError, { color: colors.error }]}>{errors.appointmentDate}</Text>
                )}
              </View>

              {/* Time Slots */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Select Preferred Time Slot</Text>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                  Agent will arrive within your chosen 1-hour window.
                </Text>
                <View style={styles.slotGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = timeSlot === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.slotChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.card,
                            borderColor: isSelected
                              ? colors.primary
                              : errors.timeSlot
                              ? colors.error
                              : colors.border,
                          },
                          isSelected && Shadow.primaryGlow,
                        ]}
                        onPress={() => {
                          setTimeSlot(slot);
                          setErrors((e) => ({ ...e, timeSlot: undefined }));
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            {
                              color: isSelected ? '#fff' : colors.text,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}
                        >
                          {formatTimeSlot(slot)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.timeSlot && (
                  <Text style={[styles.fieldError, { color: colors.error }]}>{errors.timeSlot}</Text>
                )}
              </View>

              {/* Special Instructions Notes */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Special Instructions{' '}
                  <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>(optional)</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Gate passcode, call before arriving, fasting status..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  accessibilityLabel="Special instructions"
                />
              </View>
            </View>
          )}

          {/* ─── Step 3: Confirmation & Receipt ─── */}
          {step === 3 && test && (
            <View style={styles.stepContent}>
              <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.md]}>
                <View style={styles.confirmHeader}>
                  <Text style={[styles.confirmBadge, { color: colors.primary }]}>BOOKING SUMMARY</Text>
                  <Text style={[styles.confirmDate, { color: colors.textSecondary }]}>
                    {formatDateDisplay(appointmentDate)}
                  </Text>
                </View>

                <Text style={[styles.confirmTestTitle, { color: colors.text }]}>{test.name}</Text>
                <Text style={[styles.confirmCategory, { color: colors.textSecondary }]}>
                  {test.category} • Free Home Collection
                </Text>

                <View style={[styles.dividerDashed, { borderColor: colors.border }]} />

                {/* Patient Details */}
                <Text style={[styles.sectionMetaHeading, { color: colors.textSecondary }]}>PATIENT DETAILS</Text>
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: colors.textSecondary }]}>Patient Name</Text>
                  <Text style={[styles.confirmRowValue, { color: colors.text }]}>{patientName}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: colors.textSecondary }]}>Age & Gender</Text>
                  <Text style={[styles.confirmRowValue, { color: colors.text }]}>{patientAge} Yrs • {patientGender.toUpperCase()}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: colors.textSecondary }]}>Contact Phone</Text>
                  <Text style={[styles.confirmRowValue, { color: colors.text }]}>{patientPhone}</Text>
                </View>

                <View style={[styles.dividerDashed, { borderColor: colors.border }]} />

                {/* Pickup Address */}
                <Text style={[styles.sectionMetaHeading, { color: colors.textSecondary }]}>COLLECTION ADDRESS</Text>
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: colors.textSecondary }]}>Address</Text>
                  <Text style={[styles.confirmRowValue, { color: colors.text }]} numberOfLines={3}>
                    {fullAddressString}
                  </Text>
                </View>

                <View style={[styles.dividerDashed, { borderColor: colors.border }]} />

                {/* Appointment Schedule */}
                <Text style={[styles.sectionMetaHeading, { color: colors.textSecondary }]}>SCHEDULE</Text>
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: colors.textSecondary }]}>Appointment Date</Text>
                  <Text style={[styles.confirmRowValue, { color: colors.text }]}>{formatDateDisplay(appointmentDate)}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: colors.textSecondary }]}>Arrival Window</Text>
                  <Text style={[styles.confirmRowValue, { color: colors.text }]}>{formatTimeSlot(timeSlot)}</Text>
                </View>

                {notes.trim() ? (
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmRowLabel, { color: colors.textSecondary }]}>Notes</Text>
                    <Text style={[styles.confirmRowValue, { color: colors.text }]}>{notes}</Text>
                  </View>
                ) : null}

                <View style={[styles.dividerDashed, { borderColor: colors.border }]} />

                {/* Bill Breakdown */}
                <Text style={[styles.sectionMetaHeading, { color: colors.textSecondary }]}>BILL BREAKDOWN</Text>
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: colors.textSecondary }]}>Test Charges</Text>
                  <Text style={[styles.confirmRowValue, { color: colors.text }]}>₹{test.price}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: colors.textSecondary }]}>Home Sample Pickup</Text>
                  <Text style={[styles.confirmRowValue, { color: colors.success, fontWeight: '700' }]}>FREE</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: colors.textSecondary }]}>Digital Verified Report</Text>
                  <Text style={[styles.confirmRowValue, { color: colors.success, fontWeight: '700' }]}>INCLUDED</Text>
                </View>

                <View style={[styles.dividerSolid, { backgroundColor: colors.border }]} />

                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount Payable</Text>
                  <Text style={[styles.totalPrice, { color: colors.primary }]}>₹{test.price}</Text>
                </View>
              </View>

              <View style={[styles.paymentNote, { backgroundColor: colors.warningLight }]}>
                <Text style={[styles.paymentNoteText, { color: colors.warning }]}>
                  💳 Pay at home after sample pickup via UPI, Card, or Cash. No advance payment required.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Navigation Footer (Equal Width 50/50 Buttons) */}
        <View style={[styles.navFooter, { backgroundColor: colors.card, borderTopColor: colors.border }, Shadow.lg]}>
          <TouchableOpacity
            style={[styles.navBtn, styles.backBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={[styles.backBtnText, { color: colors.text }]}>← Back</Text>
          </TouchableOpacity>

          {step < 3 ? (
            <TouchableOpacity
              style={[styles.navBtn, styles.nextBtn, { backgroundColor: colors.primary }, Shadow.primaryGlow]}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel="Proceed to next step"
            >
              <Text style={styles.nextBtnText}>Next Step →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navBtn,
                styles.nextBtn,
                { backgroundColor: isSubmitting ? colors.border : colors.primary },
                !isSubmitting && Shadow.primaryGlow,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Confirm and schedule booking"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.nextBtnText}>Confirm Booking 🎉</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    content: { paddingBottom: 24 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
    loadingText: { fontSize: 14, fontWeight: '500' },
    testMiniBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.four,
      marginTop: Spacing.two,
      padding: Spacing.two,
      borderRadius: Radius.lg,
      borderWidth: 1,
      gap: Spacing.two,
    },
    miniEmoji: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniInfo: { flex: 1 },
    miniName: { fontSize: 13.5, fontWeight: '700' },
    miniSub: { fontSize: 11, marginTop: 1 },
    miniPrice: { fontSize: 15, fontWeight: '800' },
    stepContent: { paddingHorizontal: Spacing.four, gap: Spacing.three, paddingTop: Spacing.one },
    stepHeading: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    stepSub: { fontSize: 12.5, lineHeight: 18, marginTop: -4 },
    toggleRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      marginBottom: 2,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      alignItems: 'center',
    },
    toggleText: { fontSize: 12.5, fontWeight: '700' },
    field: { gap: 5 },
    rowField: { flexDirection: 'row', gap: Spacing.two },
    label: { fontSize: 13.5, fontWeight: '700' },
    subLabel: { fontSize: 11.5, marginTop: -2, marginBottom: 4 },
    input: {
      borderWidth: 1.5,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.three,
      paddingVertical: 11,
      fontSize: 14.5,
    },
    textArea: { minHeight: 70, paddingTop: 10 },
    fieldError: { fontSize: 11.5, marginTop: 2, fontWeight: '600' },
    genderRow: { flexDirection: 'row', gap: Spacing.two },
    genderChip: {
      flex: 1,
      borderWidth: 1.5,
      borderRadius: Radius.lg,
      paddingVertical: 10,
      alignItems: 'center',
      gap: 3,
    },
    genderChipText: { fontSize: 12.5 },
    dateScroll: { flexGrow: 0 },
    dateScrollContainer: { gap: 10, paddingVertical: 4 },
    dateChip: {
      width: 64,
      paddingVertical: 10,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      alignItems: 'center',
      gap: 2,
    },
    dateDayText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5 },
    dateNumText: { fontSize: 19, fontWeight: '800' },
    dateMonthText: { fontSize: 10.5, fontWeight: '700' },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotChip: {
      width: '48%',
      paddingVertical: 11,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    slotText: { fontSize: 12.5 },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      padding: Spacing.three,
      borderRadius: Radius.lg,
      borderWidth: 1,
      marginTop: 2,
    },
    infoBannerText: { fontSize: 12, flex: 1, lineHeight: 17 },
    confirmCard: {
      borderRadius: Radius.xl,
      padding: Spacing.four,
      borderWidth: 1,
      gap: 6,
    },
    confirmHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    confirmBadge: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
    confirmDate: { fontSize: 12, fontWeight: '600' },
    confirmTestTitle: { fontSize: 17, fontWeight: '800', marginTop: 2 },
    confirmCategory: { fontSize: 12 },
    dividerDashed: { height: 1, borderStyle: 'dashed', borderWidth: 0.8, marginVertical: 5 },
    dividerSolid: { height: 1, marginVertical: 5 },
    sectionMetaHeading: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
    confirmRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 2.5,
    },
    confirmRowLabel: { fontSize: 12.5, minWidth: 100 },
    confirmRowValue: { fontSize: 12.5, fontWeight: '600', maxWidth: '65%', textAlign: 'right' },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 3,
    },
    totalLabel: { fontSize: 14.5, fontWeight: '800' },
    totalPrice: { fontSize: 22, fontWeight: '800' },
    paymentNote: {
      borderRadius: Radius.lg,
      padding: Spacing.three,
      marginTop: 2,
    },
    paymentNoteText: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
    navFooter: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.three,
      gap: Spacing.three,
      borderTopWidth: 1,
      alignItems: 'center',
    },
    navBtn: {
      flex: 1,
      height: 48,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtn: {
      borderWidth: 1.5,
    },
    backBtnText: {
      fontSize: 14.5,
      fontWeight: '700',
    },
    nextBtn: {},
    nextBtnText: {
      color: '#fff',
      fontSize: 14.5,
      fontWeight: '700',
    },
    successContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.four,
      gap: Spacing.three,
    },
    successIconWrap: {
      width: 84,
      height: 84,
      borderRadius: 42,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    successTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    successSub: { fontSize: 13.5, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.two },
    successCard: {
      width: '100%',
      borderRadius: Radius.xl,
      padding: Spacing.four,
      borderWidth: 1,
      gap: 5,
    },
    successTicketHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ticketLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8 },
    ticketStatus: { fontSize: 11.5, fontWeight: '700' },
    successRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    successLabel: { fontSize: 12.5 },
    successValue: { fontSize: 12.5, maxWidth: '65%', textAlign: 'right' },
    doneBtn: {
      width: '100%',
      paddingVertical: 13,
      borderRadius: Radius.lg,
      alignItems: 'center',
      marginTop: Spacing.two,
    },
    doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    homeBtn: { paddingVertical: 6 },
    homeLink: { fontSize: 13.5, fontWeight: '600' },
    headerBackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 10,
      paddingVertical: 4,
    },
    headerBackIcon: {
      fontSize: 26,
      fontWeight: '400',
      lineHeight: 26,
      marginRight: 2,
      marginTop: -2,
    },
    headerBackText: {
      fontSize: 15.5,
      fontWeight: '600',
    },
  });
