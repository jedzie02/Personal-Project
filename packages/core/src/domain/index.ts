export type UserRole = "customer" | "admin" | "staff";

export interface Profile {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export type CourtStatus = "Available" | "Not Available" | "Maintenance";

export interface Court {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  status: CourtStatus;
  hourlyRate?: number;
  createdAt: string;
}

export interface ServiceResult {
  success: boolean;
  error?: string;
}

export interface OperatingHours {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  paymentMethod: string | null;
  paymentReference?: string | null;
  createdAt: string;
  durationHours?: number;
  courtRate?: number;
  totalPrice?: number;
}

export interface BookingFilters {
  courtId?: string;
  startDate?: string;
  endDate?: string;
  status?: BookingStatus;
  limit?: number;
  offset?: number;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  stripePaymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
  customerName?: string | null;
  customerEmail?: string | null;
  courtName?: string | null;
}
