import fs from "node:fs";
import path from "node:path";
import tls from "node:tls";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { formatTime } from "../utils/date";

export interface ReceiptSegmentItem {
  courtName: string;
  startTime: string;
  endTime: string;
  price: number;
}

export interface ReceiptTemplateInput {
  bookingId: string;
  customerName: string;
  bookingDate: string;
  paymentMethod: string;
  paymentReference?: string | null;
  totalPrice: number;
  segments: ReceiptSegmentItem[];
}

/**
 * Only online payment methods (Card / Stripe and GCash QR) receive email receipts.
 * Cash walk-ins settled at the counter are excluded.
 */
export function isOnlineReceiptEligible(paymentMethod?: string | null): boolean {
  if (!paymentMethod) return false;
  const lower = paymentMethod.toLowerCase();
  return (
    lower.includes("card") ||
    lower.includes("stripe") ||
    lower.includes("gcash") ||
    lower.includes("qr")
  );
}

export function extractMethodAndReference(
  rawMethod?: string | null,
  rawRef?: string | null
): { method: string; reference: string | null } {
  let method = rawMethod || "Online Payment";
  let reference = rawRef || null;
  if (!reference && method.includes("Ref:")) {
    const parts = method.split("Ref:");
    reference = parts[1]?.replace(/[()]/g, "").trim() || null;
    method = parts[0]?.replace(/[()]/g, "").trim() || "GCash QR";
  }
  return { method, reference };
}

/**
 * Encodes UTF-8 text as Base64 wrapped at 76 characters per line (RFC 2045 / RFC 5321).
 */
export function wrapBase64Mime(content: string): string {
  const b64 = Buffer.from(content, "utf8").toString("base64");
  return b64.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

/**
 * Resolves the target recipient email, falling back to the venue's Gmail
 * when a booking has no profile email or uses a dummy seed address (@example.com / @pickle.com).
 */
export function resolveRecipientEmail(
  candidateEmail: string | null | undefined,
  senderGmail: string
): string {
  const trimmed = candidateEmail?.trim();
  if (
    !trimmed ||
    trimmed.endsWith("@example.com") ||
    trimmed.endsWith("@pickle.com")
  ) {
    return senderGmail.trim();
  }
  return trimmed;
}

function isPlaceholderCredential(user?: string, pass?: string): boolean {
  if (!user || !pass) return true;
  const cleanPass = pass.replace(/\s+/g, "");
  return (
    user === "your-venue-email@gmail.com" ||
    user === "yourrealemail@gmail.com" ||
    /^x+$/i.test(cleanPass) ||
    cleanPass === "abcdefghijklmnop"
  );
}

function readSmtpCredentials(): { gmailUser: string; gmailPass: string } | null {
  let gmailUser = process.env.GMAIL_USER?.trim();
  let gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

  // If process.env was not explicitly set to empty/placeholder in a test, check .env.local on disk
  // in case the developer updated .env.local without restarting `npm run dev`.
  if (
    isPlaceholderCredential(gmailUser, gmailPass) &&
    process.env.VITEST === undefined
  ) {
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      const raw = fs.readFileSync(envPath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith("GMAIL_USER=")) {
          gmailUser = trimmed.slice("GMAIL_USER=".length).trim().replace(/^["']|["']$/g, "");
        } else if (trimmed.startsWith("GMAIL_APP_PASSWORD=")) {
          gmailPass = trimmed.slice("GMAIL_APP_PASSWORD=".length).trim().replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      // Ignore if .env.local cannot be read
    }
  }

  if (!gmailUser || !gmailPass || isPlaceholderCredential(gmailUser, gmailPass)) {
    return null;
  }

  return { gmailUser, gmailPass };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReceiptEmailContent(input: ReceiptTemplateInput): {
  subject: string;
  text: string;
  html: string;
} {
  const shortRef = `#${input.bookingId.slice(0, 8).toUpperCase()}`;
  const formattedTotal = `₱${Number(input.totalPrice).toFixed(2)}`;
  const subject = `Paddlix Payment Receipt (${shortRef}) — ${input.bookingDate}`;

  const segmentLinesText = input.segments
    .map(
      (s) =>
        `- ${s.courtName}: ${formatTime(s.startTime)} – ${formatTime(s.endTime)} (₱${Number(s.price).toFixed(2)})`
    )
    .join("\n");

  const text = [
    `Hi ${input.customerName},`,
    ``,
    `Thank you for your payment! Your Paddlix court reservation is confirmed and paid.`,
    ``,
    `Booking Reference: ${shortRef}`,
    `Date: ${input.bookingDate}`,
    `Payment Method: ${input.paymentMethod}`,
    input.paymentReference ? `Reference #: ${input.paymentReference}` : null,
    ``,
    `Court Itinerary:`,
    segmentLinesText,
    ``,
    `Total Paid: ${formattedTotal}`,
    ``,
    `Please arrive 10 minutes before your slot and present this receipt (${shortRef}) at the front desk.`,
    `— Paddlix Pickleball Club`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const segmentRowsHtml = input.segments
    .map(
      (s) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:600;">
            ${escapeHtml(s.courtName)}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">
            ${escapeHtml(formatTime(s.startTime))} – ${escapeHtml(formatTime(s.endTime))}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;text-align:right;font-variant-numeric:tabular-nums;">
            ₱${Number(s.price).toFixed(2)}
          </td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#ecfdf5;padding:24px;text-align:center;border-bottom:1px solid #d1fae5;">
        <div style="display:inline-block;padding:4px 12px;border-radius:9999px;background:#059669;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
          Payment Confirmed
        </div>
        <h1 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">Paddlix Official Receipt</h1>
        <p style="margin:0;font-size:13px;color:#475569;font-family:monospace;">Booking Ref: ${escapeHtml(shortRef)}</p>
      </div>

      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;color:#334155;">
          Hi <strong>${escapeHtml(input.customerName)}</strong>, your payment has been verified and your court slot is locked in.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;">Play Date</td>
            <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;text-align:right;">${escapeHtml(input.bookingDate)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;">Payment Method</td>
            <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;text-align:right;">${escapeHtml(input.paymentMethod)}</td>
          </tr>
          ${
            input.paymentReference
              ? `<tr>
                  <td style="padding:6px 0;font-size:13px;color:#64748b;">Reference #</td>
                  <td style="padding:6px 0;font-size:13px;color:#0f172a;font-family:monospace;font-weight:600;text-align:right;">${escapeHtml(input.paymentReference)}</td>
                </tr>`
              : ""
          }
        </table>

        <div style="border-top:1px solid #e2e8f0;padding-top:12px;margin-top:8px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:6px;">
            Reserved Court Itinerary
          </div>
          <table style="width:100%;border-collapse:collapse;">
            ${segmentRowsHtml}
          </table>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:16px;margin-top:8px;">
          <span style="font-size:14px;font-weight:700;color:#0f172a;">Total Paid</span>
          <span style="font-size:18px;font-weight:800;color:#059669;float:right;">${formattedTotal}</span>
        </div>

        <div style="margin-top:24px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:12px;color:#475569;">
          Please arrive 10 minutes before your scheduled time and present reference <strong>${escapeHtml(shortRef)}</strong> at the reception counter.
        </div>
      </div>
    </div>
  </body>
</html>`.trim();

  return { subject, text, html };
}

/**
 * Minimal RFC-5321 / RFC-2045 multipart/alternative Gmail SMTP sender over TLS (port 465).
 * shortcut: uses direct implicit TLS to smtp.gmail.com:465 for single-recipient transactional receipts, upgrade to pooled SMTP if batch sending is added.
 */
async function sendGmailSmtpMessage(params: {
  fromUser: string;
  appPassword: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const cleanPass = params.appPassword.replace(/\s+/g, "");
  const authBase64 = Buffer.from(`\0${params.fromUser}\0${cleanPass}`, "utf8").toString("base64");
  const boundary = `paddlix_${Date.now().toString(16)}`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(params.subject, "utf8").toString("base64")}?=`;
  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2, 10)}@gmail.com>`;

  const mimeBody = [
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    `From: "Paddlix Pickleball" <${params.fromUser}>`,
    `To: <${params.to}>`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    wrapBase64Mime(params.text),
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    wrapBase64Mime(params.html),
    `--${boundary}--`,
    `.`,
    ``,
  ].join("\r\n");

  const recipients =
    params.to.toLowerCase() !== params.fromUser.toLowerCase()
      ? [params.to, params.fromUser]
      : [params.to];

  await new Promise<void>((resolve, reject) => {
    const socket = tls.connect(
      { host: "smtp.gmail.com", port: 465, servername: "smtp.gmail.com", timeout: 12000 },
      () => {}
    );

    const commands = [
      `EHLO paddlix.local`,
      `AUTH PLAIN ${authBase64}`,
      `MAIL FROM:<${params.fromUser}>`,
      ...recipients.map((rcpt) => `RCPT TO:<${rcpt}>`),
      `DATA`,
      mimeBody,
      `QUIT`,
    ];
    let step = -1;
    let buffer = "";

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\r\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line) continue;
        // Multi-line SMTP reply continues if 4th char is '-'
        if (line.length >= 4 && line[3] === "-") continue;

        const code = parseInt(line.slice(0, 3), 10);
        if (code >= 400) {
          socket.destroy();
          reject(new Error(`SMTP error (${code}): ${line}`));
          return;
        }

        step++;
        if (step < commands.length) {
          const cmd = commands[step];
          socket.write(cmd.endsWith("\r\n") ? cmd : `${cmd}\r\n`);
        } else {
          socket.end();
          resolve();
        }
      }
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("SMTP connection timed out"));
    });

    socket.on("error", (err) => {
      reject(err);
    });
  });
}

async function getDbClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return createAdminClient();
    } catch {
      // fallback
    }
  }
  return await createClient();
}

export async function sendPaymentReceiptEmail(
  bookingId: string
): Promise<{ sent: boolean; skippedReason?: string }> {
  try {
    const creds = readSmtpCredentials();

    if (!creds) {
      console.warn(
        "[email.service] Skipping receipt email: GMAIL_USER or GMAIL_APP_PASSWORD in .env.local is missing or still set to placeholder values."
      );
      return { sent: false, skippedReason: "missing-smtp-config" };
    }

    const { gmailUser, gmailPass } = creds;
    const supabase = await getDbClient();
    const { data: booking } = await supabase
      .from("bookings")
      .select(
        "id, customer_id, court_id, booking_date, start_time, end_time, total_price, payment_method, courts ( name )"
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking) {
      return { sent: false, skippedReason: "booking-not-found" };
    }

    if (!isOnlineReceiptEligible(booking.payment_method)) {
      return { sent: false, skippedReason: "ineligible-payment-method" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", booking.customer_id)
      .maybeSingle();

    let candidateEmail = profile?.email?.trim() || null;
    if (!candidateEmail) {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (authUser?.id === booking.customer_id && authUser?.email) {
        candidateEmail = authUser.email.trim();
      }
    }

    const recipientEmail = resolveRecipientEmail(candidateEmail, gmailUser);
    const customerName = profile?.full_name?.trim() || recipientEmail.split("@")[0] || "Player";
    const { method: parsedMethod, reference: parsedReference } = extractMethodAndReference(
      booking.payment_method
    );

    // Check for multi-court / court-jump segments linked via shared REF- reference inside payment_method
    let segmentRows = [booking];
    if (parsedReference && parsedReference.startsWith("REF-")) {
      const { data: siblings } = await supabase
        .from("bookings")
        .select("id, customer_id, court_id, booking_date, start_time, end_time, total_price, payment_method, courts ( name )")
        .ilike("payment_method", `%Ref: ${parsedReference}%`)
        .order("start_time", { ascending: true });
      if (siblings && siblings.length > 0) {
        segmentRows = siblings;
      }
    }

    const segments: ReceiptSegmentItem[] = segmentRows.map((row: any) => {
      const courtObj = Array.isArray(row.courts) ? row.courts[0] : row.courts;
      return {
        courtName: courtObj?.name ?? "Pickleball Court",
        startTime: String(row.start_time).slice(0, 5),
        endTime: String(row.end_time).slice(0, 5),
        price: Number(row.total_price) || 0,
      };
    });

    const totalPrice = segments.reduce((sum, s) => sum + s.price, 0);

    const { subject, text, html } = buildReceiptEmailContent({
      bookingId: booking.id,
      customerName,
      bookingDate: booking.booking_date,
      paymentMethod: parsedMethod,
      paymentReference: parsedReference,
      totalPrice,
      segments,
    });

    await sendGmailSmtpMessage({
      fromUser: gmailUser,
      appPassword: gmailPass,
      to: recipientEmail,
      subject,
      text,
      html,
    });

    return { sent: true };
  } catch (err) {
    console.warn("[email.service] Failed to send receipt email:", err);
    return { sent: false, skippedReason: "smtp-error" };
  }
}
