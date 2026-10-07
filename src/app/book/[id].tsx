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
import { Radius, Shadow, Spacing } from '@/constants/theme';
import type { CreateBookingPayload, MedicalTest, PatientGender, TimeSlot } from '@/types';

// ─── Date Helpers ──────────────────────────────────────────────────────────────
function buildDateOptions(count = 14) {
  const dates: { label: string; value: string }[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    dates.push({ label, value });
  }
  return dates;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────
function StepIndicator({ step, total, colors }: { step: number; total: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={step_styles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <View style={[step_styles.dot, { backgroundColor: i < step ? colors.primary : i === step ? colors.primary : colors.border, opacity: i <= step ? 1 : 0.3 }]}>
            {i < step ? (
              <Text style={step_styles.check}>✓</Text>
            ) : (
              <Text style={[step_styles.dotNum, { color: i === step ? '#fff' : colors.textSecondary }]}>{i + 1}</Text>
            )}
          </View>
          {i < total - 1 && <View style={[step_styles.line, { backgroundColor: i < step ? colors.primary : colors.border }]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const step_styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.four },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dotNum: { fontSize: 12, fontWeight: '700' },
  check: { color: '#fff', fontSize: 12, fontWeight: '700' },
  line: { flex: 1, height: 2 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
type FormErrors = {
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  appointmentDate?: string;
  timeSlot?: string;
};

const GENDERS: { label: string; value: PatientGender }[] = [
  { label: '👨 Male', value: 'male' },
  { label: '👩 Female', value: 'female' },
  { label: '🧑 Other', value: 'other' },
];

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [test, setTest] = useState<MedicalTest | null>(null);
  const [testLoading, setTestLoading] = useState(true);

  // Form state
  const [patientName, setPatientName] = useState(user?.name ?? '');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<PatientGender | ''>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot | ''>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [step, setStep] = useState(0); // 0=patient, 1=schedule, 2=confirm
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const dateOptions = useMemo(() => buildDateOptions(14), []);

  useEffect(() => {
    if (!id) return;
    testsService.getById(id)
      .then(setTest)
      .catch(() => Alert.alert('Error', 'Test not found.', [{ text: 'OK', onPress: () => router.back() }]))
      .finally(() => setTestLoading(false));
  }, [id]);

  // ─── Exit Confirmation ───────────────────────────────────────────────────────
  const handleExit = () => {
    Alert.alert(
      'Exit Booking?',
      'Are you sure you want to exit? Any entered information will be discarded.',
      [
        { text: 'Continue Booking', style: 'cancel' },
        {
          text: 'Exit to Home',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)'),
        },
      ],
    );
  };

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validateStep0 = (): boolean => {
    const e: FormErrors = {};
    if (!patientName.trim()) e.patientName = 'Patient name is required';
    else if (patientName.trim().length < 2) e.patientName = 'Name too short';
    const age = parseInt(patientAge, 10);
    if (!patientAge) e.patientAge = 'Age is required';
    else if (isNaN(age) || age < 1 || age > 120) e.patientAge = 'Enter a valid age (1–120)';
    if (!patientGender) e.patientGender = 'Please select gender';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!appointmentDate) e.appointmentDate = 'Please select a date';
    if (!timeSlot) e.timeSlot = 'Please select a time slot';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && validateStep0()) setStep(1);
    else if (step === 1 && validateStep1()) setStep(2);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

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

      const payload: CreateBookingPayload = {
        testId: id,
        patientName: patientName.trim(),
        patientAge: parseInt(patientAge, 10),
        patientGender: patientGender as PatientGender,
        appointmentDate: apptDate.toISOString(),
        timeSlot: timeSlot as TimeSlot,
        notes: notes.trim() || undefined,
      };
      await bookingsService.create(payload);
      setBookingSuccess(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Booking failed. Please try again.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = makeStyles(colors);

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

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (testLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ─── Success State ──────────────────────────────────────────────────────────
  if (bookingSuccess) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <Text style={{ fontSize: 64 }}>🎉</Text>
          <Text style={[styles.successTitle, { color: colors.text }]}>Booking Confirmed!</Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            Your appointment for {test?.name} has been booked.{'\n'}{"We'll confirm it shortly."}
          </Text>
          <View style={[styles.successCard, { backgroundColor: colors.card }, Shadow.md]}>
            {[
              { label: 'Test', value: test?.name ?? '' },
              { label: 'Patient', value: patientName },
              { label: 'Date', value: formatDateDisplay(appointmentDate) },
              { label: 'Slot', value: formatTimeSlot(timeSlot) },
              { label: 'Amount', value: `₹${test?.price ?? 0}` },
            ].map(({ label, value }) => (
              <View key={label} style={styles.successRow}>
                <Text style={[styles.successLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.successValue, { color: colors.text }]}>{value}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => { router.replace('/(tabs)/bookings'); }}
            accessibilityRole="button"
          >
            <Text style={styles.doneBtnText}>View My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
            <Text style={[styles.homeLink, { color: colors.textSecondary }]}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Book Test',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleExit}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.headerCancelBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel booking and return to home"
            >
              <Text style={[styles.headerCancelText, { color: colors.textSecondary }]}>✕ Cancel</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Test Summary */}
          {test && (
            <View style={[styles.testSummary, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.testSummaryName, { color: colors.primary }]}>{test.name}</Text>
              <Text style={[styles.testSummaryPrice, { color: colors.primary }]}>₹{test.price}</Text>
            </View>
          )}

          {/* Step Indicator */}
          <View style={styles.stepSection}>
            <StepIndicator step={step} total={3} colors={colors} />
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {step === 0 ? '👤 Patient Information' : step === 1 ? '📅 Schedule Appointment' : '✅ Confirm Booking'}
            </Text>
          </View>

          {/* ─── Step 0: Patient Info ─── */}
          {step === 0 && (
            <View style={styles.stepContent}>
              {/* Patient Name */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Patient Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: errors.patientName ? colors.error : colors.border }]}
                  value={patientName}
                  onChangeText={(t) => { setPatientName(t); setErrors((e) => ({ ...e, patientName: undefined })); }}
                  placeholder="Full name of patient"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Patient name input"
                />
                {errors.patientName && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.patientName}</Text>}
              </View>

              {/* Age */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Patient Age</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: errors.patientAge ? colors.error : colors.border }]}
                  value={patientAge}
                  onChangeText={(t) => { setPatientAge(t); setErrors((e) => ({ ...e, patientAge: undefined })); }}
                  placeholder="Enter age (in years)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={3}
                  accessibilityLabel="Patient age input"
                />
                {errors.patientAge && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.patientAge}</Text>}
              </View>

              {/* Gender */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
                <View style={styles.genderRow}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g.value}
                      style={[
                        styles.genderChip,
                        {
                          backgroundColor: patientGender === g.value ? colors.primary : colors.inputBg,
                          borderColor: patientGender === g.value ? colors.primary : (errors.patientGender ? colors.error : colors.border),
                        },
                      ]}
                      onPress={() => { setPatientGender(g.value); setErrors((e) => ({ ...e, patientGender: undefined })); }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: patientGender === g.value }}
                    >
                      <Text style={[styles.genderChipText, { color: patientGender === g.value ? '#fff' : colors.text }]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.patientGender && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.patientGender}</Text>}
              </View>

              {/* Notes */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Additional Notes{' '}
                  <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>(optional)</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any medical conditions, allergies, or special requirements..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  accessibilityLabel="Additional notes input"
                />
              </View>
            </View>
          )}

          {/* ─── Step 1: Schedule ─── */}
          {step === 1 && (
            <View style={styles.stepContent}>
              {/* Date Picker */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Select Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                  {dateOptions.map((d) => (
                    <TouchableOpacity
                      key={d.value}
                      style={[
                        styles.dateChip,
                        {
                          backgroundColor: appointmentDate === d.value ? colors.primary : colors.inputBg,
                          borderColor: appointmentDate === d.value ? colors.primary : (errors.appointmentDate ? colors.error : colors.border),
                        },
                      ]}
                      onPress={() => { setAppointmentDate(d.value); setErrors((e) => ({ ...e, appointmentDate: undefined })); }}
                      accessibilityRole="radio"
                    >
                      <Text style={[styles.dateChipText, { color: appointmentDate === d.value ? '#fff' : colors.text }]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {errors.appointmentDate && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.appointmentDate}</Text>}
              </View>

              {/* Time Slots */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Select Time Slot</Text>
                <View style={styles.slotGrid}>
                  {TIME_SLOTS.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.slotChip,
                        {
                          backgroundColor: timeSlot === slot ? colors.primary : colors.inputBg,
                          borderColor: timeSlot === slot ? colors.primary : (errors.timeSlot ? colors.error : colors.border),
                        },
                      ]}
                      onPress={() => { setTimeSlot(slot); setErrors((e) => ({ ...e, timeSlot: undefined })); }}
                      accessibilityRole="radio"
                    >
                      <Text style={[styles.slotText, { color: timeSlot === slot ? '#fff' : colors.text }]}>
                        {formatTimeSlot(slot)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.timeSlot && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.timeSlot}</Text>}
              </View>
            </View>
          )}

          {/* ─── Step 2: Confirm ─── */}
          {step === 2 && test && (
            <View style={styles.stepContent}>
              <View style={[styles.confirmCard, { backgroundColor: colors.card }, Shadow.md]}>
                <Text style={[styles.confirmSection, { color: colors.textSecondary }]}>TEST</Text>
                <Text style={[styles.confirmTestName, { color: colors.text }]}>{test.name}</Text>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.confirmSection, { color: colors.textSecondary }]}>PATIENT DETAILS</Text>
                {[
                  { label: 'Name', value: patientName || '—' },
                  { label: 'Age', value: `${patientAge || '—'} years` },
                  { label: 'Gender', value: patientGender ? patientGender.charAt(0).toUpperCase() + patientGender.slice(1) : '—' },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.confirmRow}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>{label}</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>{value}</Text>
                  </View>
                ))}

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.confirmSection, { color: colors.textSecondary }]}>APPOINTMENT</Text>
                {[
                  { label: 'Date', value: formatDateDisplay(appointmentDate) },
                  { label: 'Slot', value: formatTimeSlot(timeSlot) },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.confirmRow}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>{label}</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>{value}</Text>
                  </View>
                ))}

                {notes.trim() ? (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.confirmSection, { color: colors.textSecondary }]}>NOTES</Text>
                    <Text style={[styles.confirmValue, { color: colors.text, textAlign: 'left', maxWidth: '100%' }]}>{notes}</Text>
                  </>
                ) : null}

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>₹{test.price}</Text>
                </View>
              </View>

              <View style={[styles.noteCard, { backgroundColor: colors.warningLight }]}>
                <Text style={[styles.noteText, { color: colors.warning }]}>
                  ℹ️ By confirming, you agree to arrive 15 minutes before your slot. Payment is collected at the lab.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Navigation Footer with Equal Width Buttons */}
        <View style={[styles.navFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {step > 0 && (
            <TouchableOpacity
              style={[styles.navBtn, styles.backBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back to previous step"
            >
              <Text style={[styles.backBtnText, { color: colors.text }]}>← Back</Text>
            </TouchableOpacity>
          )}

          {step < 2 ? (
            <TouchableOpacity
              style={[styles.navBtn, styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel="Proceed to next step"
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navBtn,
                styles.nextBtn,
                { backgroundColor: isSubmitting ? colors.border : colors.primary },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Confirm booking"
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
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    testSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two,
    },
    testSummaryName: { fontSize: 14, fontWeight: '600', flex: 1 },
    testSummaryPrice: { fontSize: 16, fontWeight: '800' },
    stepSection: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.two },
    stepTitle: { fontSize: 20, fontWeight: '700' },
    stepContent: { paddingHorizontal: Spacing.four, gap: Spacing.three },
    field: { gap: Spacing.one },
    label: { fontSize: 14, fontWeight: '600' },
    input: {
      borderWidth: 1.5,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
      fontSize: 15,
    },
    textArea: { minHeight: 80, paddingTop: Spacing.two },
    fieldError: { fontSize: 12, marginTop: 2 },
    genderRow: { flexDirection: 'row', gap: Spacing.two },
    genderChip: { flex: 1, borderWidth: 1.5, borderRadius: Radius.md, paddingVertical: Spacing.two, alignItems: 'center' },
    genderChipText: { fontSize: 14, fontWeight: '600' },
    dateScroll: { flexGrow: 0 },
    dateChip: {
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      marginRight: Spacing.two,
    },
    dateChipText: { fontSize: 13, fontWeight: '600', whiteSpace: 'nowrap' } as any,
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
    slotChip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: Radius.md, borderWidth: 1.5, minWidth: '45%' },
    slotText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
    confirmCard: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
    confirmSection: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 },
    confirmTestName: { fontSize: 18, fontWeight: '700' },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    confirmLabel: { fontSize: 13 },
    confirmValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
    totalLabel: { fontSize: 16, fontWeight: '700' },
    totalValue: { fontSize: 24, fontWeight: '800' },
    divider: { height: 1 },
    noteCard: { borderRadius: Radius.lg, padding: Spacing.three, marginTop: Spacing.two },
    noteText: { fontSize: 13, lineHeight: 20 },
    navFooter: {
      flexDirection: 'row',
      padding: Spacing.three,
      gap: Spacing.three,
      borderTopWidth: 1,
      alignItems: 'center',
    },
    navBtn: {
      flex: 1,
      height: 50,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtn: {
      borderWidth: 1.5,
    },
    backBtnText: {
      fontSize: 15,
      fontWeight: '700',
    },
    nextBtn: {},
    nextBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four, gap: Spacing.three },
    successTitle: { fontSize: 26, fontWeight: '800' },
    successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
    successCard: { width: '100%', borderRadius: Radius.lg, padding: Spacing.three, gap: 8 },
    successRow: { flexDirection: 'row', justifyContent: 'space-between' },
    successLabel: { fontSize: 13 },
    successValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
    doneBtn: { width: '100%', paddingVertical: Spacing.three, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.two },
    doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    homeLink: { fontSize: 14 },
    headerCancelBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radius.sm,
    },
    headerCancelText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });
