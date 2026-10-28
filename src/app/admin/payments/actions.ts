"use server";

import { revalidatePath } from "next/cache";
import { refundPayment, markPaymentPaidInCash } from "@/lib/services/payment.service";

export async function refundPaymentAction(paymentId: string, bookingId?: string) {
    const res = await refundPayment(paymentId, bookingId);
    revalidatePath("/admin/payments");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/bookings");
    return res;
}

export async function markPaymentPaidInCashAction(paymentId: string, bookingId?: string) {
    const res = await markPaymentPaidInCash(paymentId, bookingId);
    revalidatePath("/admin/payments");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/bookings");
    return res;
}

