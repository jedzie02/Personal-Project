# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Players / Customers**: Pickleball players reserving courts, selecting hourly slots, viewing live availability, tracking active bookings, and managing playtime seamlessly on desktop and mobile.
- **Venue Admins**: Facility operators managing court statuses (Available, Maintenance, Not Available), live editable hourly rates in Philippine Peso (₱), manual reservations, customer profiles, and schedule timelines.

## Product Purpose
Paddlix eliminates chaotic chat coordination, double-bookings, and manual reservation ledgers by providing an instant, real-time court booking and venue management web application.

## Positioning
Real-time, transparent court availability and hourly rate booking in Philippine Pesos (₱) with instant venue management controls and an overlap-free booking engine.

## Operating Context
- Responsive web app optimized for fast mobile bookings at the court and desk operations at the venue.
- Operating hours standard: 9:00 AM – 12:00 AM daily across 4 master courts.
- Currency standard: Philippine Peso (₱).
- Authentication: Supabase Auth with customer and admin roles.

## Capabilities and Constraints
- Live court status management: Available, Maintenance, and Not Available.
- Live editable hourly rates per court in Philippine Peso (₱).
- Interactive booking grid with server-side overlap validation preventing double-booking.
- Customer profiles with real Supabase Auth integration, initials avatar, and reservation history.
- Administrative suite: Dashboard analytics, Gantt Schedule Timeline, Court Rate Management, Manual Booking, Customer Directory, and Payments.

## Brand Commitments
- Name: Paddlix
- Voice: Dependable, active, clear, modern.
- Visual Identity: Crisp typography, clean borders, high scanability, with monochrome/grayscale precision for operational/admin tools and purposeful blue accents for primary customer actions.

## Evidence on Hand
- Full Next.js 15 App Router architecture with Supabase database schema (`courts`, `bookings`, `profiles`, `payments`).
- Working Booking Grid, Date Selector, Admin Courts management with live hourly rates, and Schedule Timeline.
- Paddlix brand header with `CircleDotDashed` icon.

## Product Principles
1. **Frictionless Booking**: A customer can select a date, see live court rates, and lock in a reservation in under a minute.
2. **Operational Integrity**: Court statuses, maintenance blocks, and reservations are always synchronized with database state; double bookings are strictly rejected.
3. **Clarity Over Decoration**: Admin and operational matrix views prioritize typography, scanability, and high-contrast status feedback over decorative noise.
4. **Transparent Pricing**: Court rates are clearly displayed in Philippine Pesos (₱/hr) throughout browsing, slot selection, and checkout.

## Accessibility & Inclusion
- High contrast badges and indicators accessible across indoor/outdoor lighting.
- Touch-friendly tap targets and keyboard-navigable time slots.
