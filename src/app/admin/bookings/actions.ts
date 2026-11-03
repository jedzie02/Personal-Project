"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelBooking,
  createBooking,
  findCustomerIdByEmail,
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