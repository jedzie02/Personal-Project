# Design Document: DinkSync Modern SaaS Marketing Video (90s)

- **Date:** 2026-11-04
- **Project:** DinkSync Court Booking & Facility Management Platform
- **Format:** 90-second Remotion Video Composition (`my-video`)
- **Style:** Modern SaaS / Professional Tech Product Demo (Dark Mode Aesthetic)
- **Target Audience:** Pickleball Players, Club Customers, Court Owners, and Facility Administrators

---

## 1. Intent & Context

DinkSync is a complete, production-ready pickleball court booking and club administration platform built specifically for the Philippine market. Currently, court reservations across local clubs rely heavily on unstructured Facebook Messenger chats, manual SMS confirmations, and unpaid reservations that result in high no-show rates.

The goal of this marketing video is to bridge the gap between **players** looking for effortless, transparent court bookings and **court owners/operators** needing an airtight management platform with guaranteed revenue and zero no-shows.

### Hard Constraint
**Strictly adhere to what is already developed in the repository.** No UI modifications or speculative features. Every visual action, screen, price point, and workflow in the video must match the live codebase.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- Produce a full word-for-word 90-second voiceover script and scene-by-scene storyboard.
- Structure a two-part narrative (1 + A):
  - **Part 1 (0:00 – 0:45):** Player & Customer Experience (Search, Booking Grid, GCash Pre-Payment, Open Play).
  - **Part 2 (0:45 – 1:30):** Club Owner & Admin Operations (Real-time Schedule Matrix, Payments Ledger, Customer Directory, Facility Hours & Court Maintenance Controls).
- Specify the Remotion composition architecture (`my-video/src`) using real recorded screen assets framed in sleek device mockups with smooth zoom-ins, typography overlays, synchronized captions, and audio cues.

### Non-Goals
- Modifying the Next.js application codebase or altering existing UI components.
- Producing marketing materials outside of this video asset (e.g. email newsletters or print brochures).

### Anti-Goals
- Featuring imaginary features (e.g. mobile apps, automated hardware gates, or unsupported payment gateways like Maya).
- Showing the deprecated "Cash / Pay at Desk" for public bookings (eliminated in `ef9b000` to prevent no-shows).

---

## 3. Approaches Considered

| Approach | Description | Trade-offs | Decision |
| :--- | :--- | :--- | :--- |
| **Approach 1 (Chosen): Real Screen Recordings in Remotion (1 + A)** | Record crisp screen captures of the live app routes (`/`, `/confirm-booking`, `/admin/schedule`, `/admin/payments`, `/admin/open-play`). Embed in Remotion with pan/zoom transforms, dark-slate UI framing, dynamic typography callouts, and background music. | Requires realistic seed data; 100% faithful to the real product; single 90s unified video. | **Selected (User choice 1 + A).** |
| **Approach 2: Animated Static Screenshots** | Static PNG/WebP exports with Ken Burns panning effects in Remotion. | Faster to assemble, but lacks interactive tactile feel (clicking slots, typing reference codes). | Rejected. |
| **Approach 3: Full UI Rebuild in Remotion** | Re-coding the UI using pure React/Remotion primitives. | High maintenance, prone to drift, violates the "don't make UI changes / adhere to developed" rule. | Rejected. |

---

## 4. Scene-by-Scene Storyboard & Script Breakdown (90s Total)

### Part 1: Player & Customer Experience (0:00 – 0:45)

#### Scene 1: The Hook & The Problem (0:00 – 0:08)
- **Visual:** Fast-paced montage showing a phone screen scrolling through disorganized Facebook Messenger chats / group chats asking *"May slot ba tonight?"* with long delays. Quick cut to the DinkSync hero page with the Live Court Rally Simulator animating smoothly.
- **On-Screen Text (Remotion Callout):** *"Still booking courts over chat?"* → *"Meet DinkSync."*
- **Voiceover (VO):**
  > *"Still booking your pickleball matches through back-and-forth chat inquiries and waiting hours for confirmation? Say goodbye to messy group chats. Meet DinkSync."*

#### Scene 2: The Live Booking Grid & Transparent Pricing (0:08 – 0:22)
- **Visual:** Camera zooms into the 4 Master Courts grid on `/#book-a-court`. Cursor selects Friday evening (6:00 PM – 7:00 PM) on Court 1. The card highlights instantly in bright blue. The 1-tap quick slot pill and the price tag (`₱300.00/hr · ₱75/player`) pop with subtle scale animations.
- **On-Screen Text:** *"Real-Time Court Availability"* · *"₱300/hr · Only ₱75 per player"*
- **Voiceover (VO):**
  > *"With DinkSync, court availability across all four master courts is live in real time. Choose your date, pick your hour, and see transparent rates upfront—just ₱300 an hour, or only ₱75 per player for a full doubles match."*

#### Scene 3: Instant Pre-Payment & Guaranteed Reservations (0:22 – 0:34)
- **Visual:** Seamless transition to `/confirm-booking`. Player details auto-populate. Cursor taps **GCash QR**. Screen cuts to the QR scan prompt, entering a sample GCash reference number (`902348192`), and clicking **Submit Payment**. Instant green checkmark banner and automated receipt view (`/book/confirmation`).
- **On-Screen Text:** *"Instant GCash Checkout"* · *"Zero No-Shows · Guaranteed Slot"*
- **Voiceover (VO):**
  > *"Checkout takes under twenty seconds. Scan the venue GCash QR, enter your reference number, and your court is immediately locked. Official email receipts are sent automatically, so your game time is one hundred percent guaranteed."*

#### Scene 4: Open Play Skill-Matching (0:34 – 0:45)
- **Visual:** Scroll to the `/open-play` community section. Displays sessions tagged by level: *Beginner*, *Intermediate*, *Advanced*. Live spots countdown badge: *"4 spots left"*. Cursor clicks **Join Open Play**, locks slot with GCash QR.
- **On-Screen Text:** *"No Partner? No Problem."* · *"Open Play by Skill Level"*
- **Voiceover (VO):**
  > *"Flying solo or looking for new competition? Join structured Open Play sessions matched by skill level. Track spots in real time, secure your paddle, and show up ready to rally."*

---

### Part 2: Court Owner & Facility Management (0:45 – 1:30)

#### Scene 5: Transition & Live Schedule Dispatch (0:45 – 0:58)
- **Visual:** Cinematic dark mode camera sweep into the Admin Portal (`/admin/schedule`). The multi-court timeline displays all 4 courts side-by-side with color-coded booking blocks, player names, and real-time status.
- **On-Screen Text:** *"For Court Owners & Managers"* · *"Live Dispatch Matrix"*
- **Voiceover (VO):**
  > *"Behind the scenes, DinkSync gives facility owners complete operational control. Our Live Schedule Matrix displays every court, booking, and player on a single screen—updated in real time with zero double-bookings."*

#### Scene 6: Revenue Protection & Instant Payments Ledger (0:58 – 1:12)
- **Visual:** Zoom into `/admin/payments` and `/admin/bookings/new`. Shows real-time financial tracking: daily revenue totals, verified GCash transactions, and Stripe card settlements. Quick showcase of staff recording an in-person walk-in booking with cash at the front desk.
- **On-Screen Text:** *"100% Pre-Paid Bookings"* · *"Eliminate No-Show Revenue Loss"*
- **Voiceover (VO):**
  > *"Tired of players reserving prime-time slots and ghosting? DinkSync enforces upfront online payments, eliminating no-show losses completely. For in-person walk-ins, your front desk can record cash check-ins in seconds."*

#### Scene 7: Court Maintenance & Dynamic Facility Controls (1:12 – 1:22)
- **Visual:** Navigating to court status controls on `/admin/schedule`. Toggle Court 3 to *"Maintenance"*, and demonstrate how the public booking grid instantly marks Court 3 in amber as *"Maintenance - Unavailable"*, preventing unauthorized bookings.
- **On-Screen Text:** *"Dynamic Facility Hours & Maintenance Locks"*
- **Voiceover (VO):**
  > *"Need to close for maintenance or adjust facility holiday hours? Toggle court statuses or operating schedules with one tap, instantly syncing across the entire customer platform."*

#### Scene 8: The Closing Pitch & Call to Action (1:22 – 1:30)
- **Visual:** Clean full-screen brand card: DinkSync animated logo showcase with electric pickleball green accent, sleek tagline, and website URL `dinksync.com` (or local domain).
- **On-Screen Text:** *"DinkSync"* · *"The Modern Standard for Pickleball Clubs"* · *"Book a Court · Run Your Facility"*
- **Voiceover (VO):**
  > *"DinkSync. Effortless bookings for players. Maximum revenue for court owners. Experience the modern standard for Philippine pickleball today at DinkSync."*

---

## 5. Remotion Technical Composition Architecture (`my-video`)

The video will be structured inside the existing Remotion repository (`my-video/`):

### Composition Specifications
- **Resolution:** 1920x1080 (16:9 Landscape - YouTube / Website Hero / Pitch Deck), with an alternate 1080x1920 (9:16 Vertical Reel cut) derived from the same sequence.
- **Frame Rate:** 30 fps
- **Total Duration:** 2700 frames (90 seconds @ 30 fps)

### Sequence Layout (`Root.tsx` / `Composition.tsx`)
```
Frame 0000 - 0240 (0:00–0:08): <HookIntroSequence />
Frame 0240 - 0660 (0:08–0:22): <BookingGridSequence />
Frame 0660 - 1020 (0:22–0:34): <CheckoutGCashSequence />
Frame 1020 - 1350 (0:34–0:45): <OpenPlaySequence />
Frame 1350 - 1740 (0:45–0:58): <AdminScheduleSequence />
Frame 1740 - 2160 (0:58–1:12): <AdminPaymentsLedgerSequence />
Frame 2160 - 2460 (1:12–1:22): <FacilityMaintenanceSequence />
Frame 2460 - 2700 (1:22–1:30): <OutroCTASequence />
```

### Motion Design System
- **Background Theme:** Deep Slate `#020617` and `#0f172a` matching `pickle-wb` dark mode.
- **Accent Accents:** Royal Blue `#2563eb` and Electric Court Emerald `#10b981`.
- **Screen Mockups:** 12px rounded borders with `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7)` and subtle 1.05x zoom interpolations (`interpolate(frame, [0, 90], [1, 1.05], { extrapolateRight: "clamp" })`).
- **Typography:** Inter / San Francisco typography overlay with synchronized kinetic subtitles.

---

## 6. What's Left to the Builder (Implementation Deliverables)

1. **Screen Capture Assets:** Record 8 clean 1080p screen recordings (approx. 5–15 seconds each) covering each live route with sample seed data.
2. **Audio Track Integration:** Combine background royalty-free modern SaaS lofi/synth beat (at -18dB) with voiceover audio track.
3. **Remotion Component Code:** Implement the 8 sequenced video components under `my-video/src/scenes/` and connect them into `Composition.tsx`.

