"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelBooking,
  createBooking,
  findCustomerIdByEmail,
} from "@/lib/services/booking.service";

export async function createBookingAction(formData: FormData) {
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
  const reason = formData.get("reason") as string;

  await cancelBooking(bookingId, reason);

  revalidatePath("/admin/bookings");
}