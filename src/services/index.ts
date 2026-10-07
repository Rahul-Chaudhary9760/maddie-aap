import { api } from '@/lib/api';
import type {
  Booking,
  CreateBookingPayload,
  MedicalTest,
  TimeSlot,
} from '@/types';

// ─── Test Service ─────────────────────────────────────────────────────────────
export const testsService = {
  /**
   * GET /api/v1/tests — fetch all available tests
   */
  async getAll(): Promise<MedicalTest[]> {
    const res = await api.get<any>('/tests');
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.tests)) return res.data.tests;
    if (Array.isArray(res?.tests)) return res.tests;
    return [];
  },

  /**
   * GET /api/v1/tests/:id — fetch single test
   */
  async getById(id: string): Promise<MedicalTest> {
    const res = await api.get<any>(`/tests/${id}`);
    const test =
      res?.data?.test ??
      (res?.data && typeof res.data === 'object' && '_id' in res.data ? res.data : undefined) ??
      (res && typeof res === 'object' && '_id' in res ? res : undefined);
    if (!test) throw new Error('Test not found');
    return test as MedicalTest;
  },
};

// ─── Booking Service ──────────────────────────────────────────────────────────
export const bookingsService = {
  /**
   * POST /api/v1/bookings — create a new booking
   */
  async create(payload: CreateBookingPayload): Promise<Booking> {
    const res = await api.post<any>('/bookings', payload);
    const booking =
      res?.data?.booking ??
      (res?.data && typeof res.data === 'object' && '_id' in res.data ? res.data : undefined) ??
      (res && typeof res === 'object' && '_id' in res ? res : undefined);
    if (!booking) throw new Error('Failed to create booking');
    return booking as Booking;
  },

  /**
   * GET /api/v1/bookings/my — get logged-in user's bookings
   */
  async getMy(): Promise<Booking[]> {
    const res = await api.get<any>('/bookings/my');
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.bookings)) return res.data.bookings;
    if (Array.isArray(res?.bookings)) return res.bookings;
    return [];
  },

  /**
   * GET /api/v1/bookings/:id — get single booking
   */
  async getById(id: string): Promise<Booking> {
    const res = await api.get<any>(`/bookings/${id}`);
    const booking =
      res?.data?.booking ??
      (res?.data && typeof res.data === 'object' && '_id' in res.data ? res.data : undefined) ??
      (res && typeof res === 'object' && '_id' in res ? res : undefined);
    if (!booking) throw new Error('Booking not found');
    return booking as Booking;
  },

  /**
   * PATCH /api/v1/bookings/:id/cancel — cancel a pending booking
   */
  async cancel(id: string): Promise<Booking> {
    const res = await api.patch<any>(`/bookings/${id}/cancel`, {});
    const booking =
      res?.data?.booking ??
      (res?.data && typeof res.data === 'object' && '_id' in res.data ? res.data : undefined) ??
      (res && typeof res === 'object' && '_id' in res ? res : undefined);
    if (!booking) throw new Error('Failed to cancel booking');
    return booking as Booking;
  },
};

// ─── Time Slots ───────────────────────────────────────────────────────────────
// Format matches backend schema: 'HH:MM-HH:MM' (24-hour)
export const TIME_SLOTS: TimeSlot[] = [
  '06:00-07:00',
  '07:00-08:00',
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
];

/**
 * Formats a 24-hour time slot like '08:00-09:00' into a user-friendly display string like '08:00 AM - 09:00 AM'
 */
export function formatTimeSlot(slot?: string | null): string {
  if (!slot) return '—';
  const parts = slot.split('-');
  if (parts.length !== 2) return slot;

  const formatSingle = (timeStr: string) => {
    const [hStr, mStr] = timeStr.trim().split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  return `${formatSingle(parts[0])} - ${formatSingle(parts[1])}`;
}
