/**
 * App-wide domain types. These represent our own business concepts —
 * distinct from database.types.ts (which will later be auto-generated
 * directly from the Supabase schema). Keeping them separate means our
 * UI/service code depends on stable, hand-picked shapes rather than
 * whatever the raw DB schema happens to look like.
 */

export type UserRole = "customer" | "admin";

export interface Profile {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    role: UserRole;
    createdAt: string;
}

/** The shape of data we expect back from a sign-up/sign-in service call. */
export interface AuthResult {
    success: boolean;
    error?: string;
}

export interface Court {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
}

/** Generic result shape reused by court/booking/etc. mutations. */
export interface ServiceResult {
    success: boolean;
    error?: string;
}

export interface OperatingHours {
    dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
    openTime: string | null; // "HH:MM", null when isClosed
    closeTime: string | null; // "HH:MM", null when isClosed
    isClosed: boolean;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
    id: string;
    courtId: string;
    courtName: string; // pulled in via a join, for display without a second query
    customerId: string;
    customerName: string | null;
    customerEmail: string | null;
    bookingDate: string; // "YYYY-MM-DD"
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
    status: BookingStatus;
    totalPrice: number;
    cancelledReason: string | null;
    createdAt: string;
}

export interface BookingFilters {
    dateFrom?: string;
    dateTo?: string;
    courtId?: string;
    status?: BookingStatus;
    customerSearch?: string; // matches name or email
}

export interface AvailableSlot {
    startTime: string;
    endTime: string;
    availableCourts: { id: string; name: string }[];
}

/** Same shape as ServiceResult, but also hands back the new row's id
 *  on success — the confirmation page needs it to look the booking up. */
export interface CreateBookingResult extends ServiceResult {
    bookingId?: string;
}

/** Result of starting a Stripe Checkout session — the url is where we redirect the customer. */
export interface CheckoutResult extends ServiceResult {
    url?: string;
}

export interface DashboardStats {
    todaysBookingsCount: number;
    todaysRevenue: number;
    upcomingBookingsCount: number;
    activeCourtsCount: number;
}

export interface CustomerSummary {
    id: string;
    fullName: string | null;
    email: string | null;
    bookingCount: number;
}

export interface Payment {
    id: string;
    bookingId: string;
    courtName: string;
    customerName: string | null;
    customerEmail: string | null;
    bookingDate: string;
    amount: number;
    currency: string;
    status: "pending" | "succeeded" | "failed" | "refunded";
    createdAt: string;
}