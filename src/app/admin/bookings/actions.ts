"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelBooking,
  createBooking,
  findCustomerIdByEmail,
  checkOverlap,
} from "@/lib/services/booking.service";
import { requireAdmin } from "@/lib/services/auth.server";

export async function createBookingAction(formData: FormData) {
  await requireAdmin();
  const customerEmail = formData.get("customerEmail") as string;
  const courtId = formData.get("courtId") as string;
  const bookingDate = formData.get("bookingDate") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const totalPrice = Number(formData.get("totalPrice"));
  const markAsConfirmed = formData.get("markAsConfirmed") === "on";

  const customer = await findCustomerIdByEmail(customerEmail);

  if (!customer) {
    redirect(
      `/admin/bookings/new?error=${encodeURIComponent(
        "No customer account found with that email. They need to sign up first."
      )}`
    );
  }

  const result = await createBooking({
    courtId,
    customerId: customer.id,
    bookingDate,
    startTime,
    endTime,
    totalPrice,
    markAsConfirmed,
  });

  if (!result.success) {
    redirect(`/admin/bookings/new?error=${encodeURIComponent(result.error ?? "Could not create booking")}`);
  }

  revalidatePath("/admin/bookings");
  redirect("/admin/bookings");
}

export async function cancelBookingAction(bookingId: string, formData: FormData) {
  await requireAdmin();
  const reason = formData.get("reason") as string;

  await cancelBooking(bookingId, reason);

  revalidatePath("/admin/bookings");
}

export async function markBookingPaidAction(bookingId: string) {
  await requireAdmin();
  return markBookingPaidInCashAction(bookingId);
}

export async function markBookingPaidInCashAction(bookingId: string) {
  await requireAdmin();
  const { markPaymentPaidInCash } = await import("@/lib/services/payment.service");
  await markPaymentPaidInCash(bookingId, bookingId);

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/payments");
}

export async function getActiveCourtsAction() {
  const { getActiveCourts } = await import("@/lib/services/court.service");
  return await getActiveCourts();
}

export interface CreateAdminBookingInput {
  courtId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  customerMode: "walk_in" | "registered";
  customerId?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentOption: "cash_paid" | "gcash_paid" | "pay_at_desk";
  gcashReference?: string;
}

export async function createAdminBookingAction(
  input: CreateAdminBookingInput
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    await requireAdmin();
    const { createClient } = await import("@/lib/supabase/server");
    const { createAdminClient } = await import("@/lib/supabase/admin");

    const getDbClient = () => {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          return createAdminClient();
        } catch {
          // fallback
        }
      }
      return createClient();
    };

    const supabase = await getDbClient();

    if (!input.courtId || !input.bookingDate || !input.startTime || !input.endTime) {
      return { success: false, error: "Court, date, start time, and end time are required." };
    }

    // Check overlap
    const hasConflict = await checkOverlap(
      input.courtId,
      input.bookingDate,
      input.startTime,
      input.endTime
    );
    if (hasConflict) {
      return { success: false, error: "This court is already booked for that time range." };
    }

    let targetCustomerId: string | null = input.customerId || null;

    if (input.customerMode === "walk_in") {
      const email = input.customerEmail?.trim();
      const name = input.customerName?.trim() || "Walk-in Guest";
      const phone = input.customerPhone?.trim() || null;

      if (email) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          targetCustomerId = existing.id;
        } else {
          const { data: created } = await supabase
            .from("profiles")
            .insert({
              email,
              full_name: name,
              phone,
              role: "customer",
            })
            .select("id")
            .single();

          if (created) targetCustomerId = created.id;
        }
      } else if (name && name !== "Walk-in Guest") {
        const { data: created } = await supabase
          .from("profiles")
          .insert({
            full_name: name,
            phone,
            role: "customer",
          })
          .select("id")
          .single();

        if (created) targetCustomerId = created.id;
      }
    }

    const isPaid = input.paymentOption === "cash_paid" || input.paymentOption === "gcash_paid";
    const paymentStatus = isPaid ? "succeeded" : "pending";
    const paymentMethod =
      input.paymentOption === "cash_paid"
        ? "Cash walk in"
        : input.paymentOption === "gcash_paid"
        ? "GCash QR"
        : "Pay at Desk";

    const result = await createBooking({
      courtId: input.courtId,
      customerId: targetCustomerId,
      customerName: input.customerName?.trim() || "Walk-in Guest",
      customerEmail: input.customerEmail?.trim(),
      customerPhone: input.customerPhone?.trim(),
      bookingDate: input.bookingDate,
      startTime: input.startTime,
      endTime: input.endTime,
      totalPrice: input.totalPrice,
      markAsConfirmed: true,
      paymentStatus,
      paymentMethod,
      paymentReference: input.gcashReference?.trim() || null,
    });

    if (!result.success || !result.bookingId) {
      return { success: false, error: result.error || "Failed to create reservation." };
    }

    if (isPaid) {
      try {
        const { markPaymentPaidInCash } = await import("@/lib/services/payment.service");
        await markPaymentPaidInCash(result.bookingId, result.bookingId);
      } catch (e) {
        console.warn("Payment marking warning:", e);
      }
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/schedule");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/payments");

    return { success: true, bookingId: result.bookingId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { success: false, error: message };
  }
}

export async function getRegisteredProfilesAction() {
  await requireAdmin();
  const { createClient } = await import("@/lib/supabase/server");
  const { createAdminClient } = await import("@/lib/supabase/admin");

  const getDbClient = () => {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        return createAdminClient();
      } catch {
        // fallback
      }
    }
    return createClient();
  };

  const supabase = await getDbClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .order("full_name", { ascending: true });

  return data || [];
}

export async function getExistingBookingsForCourtDateAction(courtId: string, bookingDate: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const { createAdminClient } = await import("@/lib/supabase/admin");

  const getDbClient = () => {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        return createAdminClient();
      } catch {
        // fallback
      }
    }
    return createClient();
  };

  const supabase = await getDbClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, start_time, end_time, status")
    .eq("court_id", courtId)
    .eq("booking_date", bookingDate)
    .neq("status", "cancelled");

  return data || [];
}