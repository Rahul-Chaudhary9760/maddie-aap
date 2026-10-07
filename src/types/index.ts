// ─── Medical Test Types ───────────────────────────────────────────────────────
export type TestCategory =
  | 'Blood'
  | 'Blood Test'
  | 'Urine'
  | 'Urine Test'
  | 'Radiology'
  | 'Cardiology'
  | 'Pathology'
  | 'Microbiology'
  | 'Full Body'
  | 'Other'
  | string;

export interface MedicalTest {
  _id: string;
  name: string;
  category: TestCategory;
  description: string;
  price: number;
  preparationInstructions?: string;
  reportDeliveryTime?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Booking Types ────────────────────────────────────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PatientGender = 'male' | 'female' | 'other';

export type TimeSlot =
  | '06:00-07:00'
  | '07:00-08:00'
  | '08:00-09:00'
  | '09:00-10:00'
  | '10:00-11:00'
  | '11:00-12:00'
  | '12:00-13:00'
  | '13:00-14:00'
  | '14:00-15:00'
  | string;

export interface BookingAddress {
  street: string;
  city: string;
  state?: string;
  pincode: string;
  landmark?: string;
}

export interface Booking {
  _id: string;
  user: { _id: string; name: string; email: string };
  test: Pick<MedicalTest, '_id' | 'name' | 'category' | 'price' | 'description'>;
  patientName: string;
  patientAge: number;
  patientGender: PatientGender;
  patientPhone?: string;
  address: BookingAddress | string;
  appointmentDate: string;
  timeSlot: TimeSlot;
  totalAmount: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  testId: string;
  patientName: string;
  patientAge: number;
  patientGender: PatientGender;
  address: BookingAddress;
  appointmentDate: string; // ISO string
  timeSlot: TimeSlot;
  notes?: string;
}


// ─── Auth Types ───────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'admin' | 'lab_staff';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface ApiListResponse<T> {
  status: string;
  results: number;
  data: {
    tests?: T[];
    bookings?: T[];
    [key: string]: T[] | undefined;
  };
}

export interface ApiSingleResponse<T> {
  status: string;
  data: {
    test?: T;
    booking?: T;
    user?: T;
    [key: string]: T | undefined;
  };
}
