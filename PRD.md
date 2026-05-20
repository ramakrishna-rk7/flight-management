# Flight Management Web App (PWA) — Product Requirements Document

## Overview
Build a production-like Flight Management web application where passengers can search and book flights, select seats, reschedule, and cancel bookings. The primary deliverable is a fully responsive web app. As a bonus, configure it as an installable Progressive Web App (PWA).

## Tech Stack
- **Framework**: Next.js 14+ (App Router) + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State Management**: Zustand with persist middleware
- **Styling**: Tailwind CSS
- **PWA**: next-pwa (bonus)

---

## Project Structure

```
flight-management/
├── supabase/migrations/
│   ├── 001_enums.sql
│   ├── 002_create_tables.sql
│   ├── 003_rls_policies.sql
│   ├── 004_rpc_functions.sql
│   ├── 005_booking_constraints.sql
│   ├── 006_indexes.sql
│   └── 007_seed_data.sql
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (flight search)
│   │   ├── globals.css
│   │   ├── search/page.tsx (search results)
│   │   ├── booking/
│   │   │   └── [flightId]/
│   │   │       ├── page.tsx (seat selection + passenger form)
│   │   │       └── confirm/page.tsx (confirmation)
│   │   ├── my-bookings/page.tsx (booking management)
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── offline/page.tsx (offline fallback)
│   ├── components/
│   │   ├── FlightCard.tsx
│   │   ├── SeatMap.tsx
│   │   ├── PassengerForm.tsx
│   │   ├── SearchForm.tsx
│   │   ├── BookingCard.tsx
│   │   ├── RescheduleModal.tsx
│   │   ├── CancelDialog.tsx
│   │   ├── Navbar.tsx
│   │   └── InstallPrompt.tsx
│   ├── store/
│   │   ├── useFlightStore.ts (search, booking flow — persist with partialize)
│   │   └── useUserStore.ts (auth session — persist only session token)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts (browser client)
│   │   │   ├── server.ts (server client)
│   │   │   └── middleware.ts
│   │   └── utils.ts (helpers, PNR generator)
│   └── types/
│       └── index.ts (all TypeScript interfaces)
├── middleware.ts (Next.js auth middleware)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

---

## Database Schema (Supabase)

### Enums

```sql
CREATE TYPE seat_class AS ENUM ('economy', 'business', 'first');
CREATE TYPE booking_status AS ENUM ('confirmed', 'rescheduled', 'cancelled');
CREATE TYPE flight_status AS ENUM ('scheduled', 'boarding', 'departed', 'cancelled');
```

### Tables

#### flights
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| flight_no | text | NOT NULL, UNIQUE |
| origin | text | NOT NULL |
| destination | text | NOT NULL |
| departs_at | timestamptz | NOT NULL |
| arrives_at | timestamptz | NOT NULL |
| aircraft_type | text | NOT NULL |
| status | flight_status | DEFAULT 'scheduled' |
| base_price | numeric | NOT NULL |

#### seats
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| flight_id | uuid | FK → flights(id) |
| seat_number | text | NOT NULL |
| class | seat_class | NOT NULL |
| is_available | boolean | DEFAULT true |
| extra_fee | numeric | DEFAULT 0 |
| locked_by | uuid | FK → auth.users(id), nullable |
| locked_until | timestamptz | nullable |

#### bookings
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → auth.users(id) |
| flight_id | uuid | FK → flights(id) |
| seat_id | uuid | FK → seats(id) |
| status | booking_status | DEFAULT 'confirmed' |
| booked_at | timestamptz | DEFAULT now() |
| total_price | numeric | NOT NULL |
| pnr_code | text | UNIQUE, NOT NULL |

#### passengers
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| booking_id | uuid | FK → bookings(id) |
| full_name | text | NOT NULL |
| passport_no | text | NOT NULL |
| nationality | text | NOT NULL |
| dob | date | NOT NULL |

#### reschedules
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| booking_id | uuid | FK → bookings(id) |
| old_flight_id | uuid | FK → flights(id) |
| new_flight_id | uuid | FK → flights(id) |
| requested_at | timestamptz | DEFAULT now() |
| fee_charged | numeric | NOT NULL |

---

## RLS Policies

```sql
-- Bookings: users can only access their own
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own bookings" ON bookings FOR ALL USING (auth.uid() = user_id);

-- Seats: public read, no direct write (via RPC only)
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seat view public" ON seats FOR SELECT USING (true);

-- Flights: public read
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flights public" ON flights FOR SELECT USING (true);
```

---

## RPC Functions

### reserve_seat(p_seat_id, p_user_id)
Temporary 5-minute lock on a seat during booking flow.
```sql
CREATE OR REPLACE FUNCTION reserve_seat(p_seat_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_seat RECORD;
BEGIN
  SELECT * INTO v_seat FROM seats WHERE id = p_seat_id FOR UPDATE;

  IF NOT v_seat.is_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat already taken');
  END IF;

  IF v_seat.locked_by IS NOT NULL AND v_seat.locked_until > now() AND v_seat.locked_by != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat is temporarily locked by another user');
  END IF;

  UPDATE seats SET locked_by = p_user_id, locked_until = now() + interval '5 minutes' WHERE id = p_seat_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

### confirm_booking(p_seat_id, p_user_id, p_passenger_data)
Permanently allocates seat and creates booking.
```sql
CREATE OR REPLACE FUNCTION confirm_booking(
  p_seat_id UUID,
  p_user_id UUID,
  p_full_name TEXT,
  p_passport_no TEXT,
  p_nationality TEXT,
  p_dob DATE
)
RETURNS JSONB AS $$
DECLARE
  v_seat RECORD;
  v_booking_id UUID;
  v_pnr TEXT;
BEGIN
  SELECT * INTO v_seat FROM seats WHERE id = p_seat_id FOR UPDATE;

  IF NOT v_seat.is_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat no longer available');
  END IF;

  IF v_seat.locked_by != p_user_id OR v_seat.locked_until < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat lock expired or not yours');
  END IF;

  v_pnr := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));

  UPDATE seats SET is_available = false, locked_by = NULL, locked_until = NULL WHERE id = p_seat_id;

  INSERT INTO bookings (user_id, flight_id, seat_id, status, total_price, pnr_code)
  VALUES (p_user_id, v_seat.flight_id, p_seat_id, 'confirmed',
    (SELECT base_price FROM flights WHERE id = v_seat.flight_id) + v_seat.extra_fee,
    v_pnr)
  RETURNING id INTO v_booking_id;

  INSERT INTO passengers (booking_id, full_name, passport_no, nationality, dob)
  VALUES (v_booking_id, p_full_name, p_passport_no, p_nationality, p_dob);

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id, 'pnr', v_pnr);
END;
$$ LANGUAGE plpgsql;
```

### release_seat_lock(p_seat_id)
Manual release if user abandons booking flow.
```sql
CREATE OR REPLACE FUNCTION release_seat_lock(p_seat_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE seats SET locked_by = NULL, locked_until = NULL WHERE id = p_seat_id;
END;
$$ LANGUAGE plpgsql;
```

### cancel_booking(p_booking_id)
Atomic cancellation with 2-hour rule enforced by DB trigger.
```sql
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already cancelled');
  END IF;

  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE seats SET is_available = true, locked_by = NULL, locked_until = NULL WHERE id = v_booking.seat_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

### release_expired_seats()
Scheduled cleanup of expired locks.
```sql
CREATE OR REPLACE FUNCTION release_expired_seats()
RETURNS void AS $$
BEGIN
  UPDATE seats SET locked_by = NULL, locked_until = NULL WHERE locked_until < now();
END;
$$ LANGUAGE plpgsql;
```

---

## DB Trigger — Cancellation Rule (2-hour enforcement)

```sql
CREATE OR REPLACE FUNCTION validate_cancellation()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'cancelled' AND EXISTS (
    SELECT 1 FROM flights WHERE id = OLD.flight_id AND departs_at - now() < interval '2 hours'
  ) THEN
    RAISE EXCEPTION 'Cannot cancel within 2 hours of departure';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cancellation_guard
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_cancellation();
```

---

## Database Indexes

```sql
CREATE INDEX idx_flights_route ON flights(origin, destination);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_seats_flight ON seats(flight_id);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_reschedule_booking ON reschedules(booking_id);
CREATE INDEX idx_departure ON flights(departs_at);
```

---

## Seed Data

- 8 flights across 4 routes: JFK→LAX, LAX→ORD, ORD→MIA, MIA→JFK
- Full seat maps per flight: economy (20 seats), business (8 seats), first (4 seats) = 32 seats per flight
- 2 test user accounts (credentials in README)

---

## Tasks

### Task 01 — Flight Search & Booking Flow
- Search page: origin, destination, date, passenger count, class filter
- Results page: FlightCard components with price, duration, class options
- Booking form: passenger details (name, passport, nationality, DOB) — supports multiple passengers
- Confirmation page: PNR code, flight details, seat assignment
- Use Supabase server-side client in Server Components
- Two-phase booking: reserve_seat() → confirm_booking()

### Task 02 — Interactive Seat Selection
- Cabin grid (rows × columns) for selected flight
- Color-coded: available / selected / occupied / locked / your seat
- Economy, business, first class zones with visual separation
- Supabase Realtime subscription on seats table (filtered by flight_id)
- Proper cleanup: removeChannel on unmount
- Scrollable and touch-friendly on mobile
- Tooltip on occupied seats: class + extra fee

### Task 03 — Rescheduling & Cancellation
- My Bookings page with status badges (confirmed / rescheduled / cancelled)
- Reschedule: pick alternative flight on same route, insert into reschedules, charge fee if price difference
- Cancel: confirmation dialog, atomic RPC, 2-hour rule enforced by DB trigger
- Destructive action confirmation dialogs

### Task 04 — Zustand Store with persist

**useFlightStore** (persist with partialize):
```ts
{
  searchQuery: { origin, destination, date, passengers, class },
  selectedFlight: Flight | null,
  selectedSeat: Seat | null,
  bookingStep: number,
  passengers: Passenger[],  // array for multi-passenger
  // Actions: setSearchQuery, setSelectedFlight, selectSeat (optimistic),
  //          setBookingStep, setPassenger, addPassenger, removePassenger,
  //          resetBooking (called on logout/cancel/success)
}
```
- **partialize**: exclude `passengers[].passport` from localStorage
- **Optimistic seat selection**: mark selected in store before Supabase confirms, rollback on failure with toast

**useUserStore** (persist only session token):
```ts
{
  session: Session | null,
  cachedBookings: Booking[],
  // Actions: setSession, setBookings, clearSession
}
```

### Task 05 — PWA (Bonus)
- next-pwa config with manifest.json (name, icons 192/512, theme color, display: standalone)
- Cache: StaleWhileRevalidate for flight search, CacheFirst for static assets
- Offline fallback page
- My Bookings readable offline (last-cached data)
- Install prompt banner for first-time mobile visitors
- Lighthouse PWA score ≥ 90

---

## Responsive Design Strategy

| Breakpoint | Layout |
|------------|--------|
| Mobile (<640px) | Single column, stacked cards, hamburger nav, horizontal-scroll seat map |
| Tablet (640-1024px) | 2-column grid, side nav collapses |
| Desktop (>1024px) | 3-column grid, full nav, comfortable seat map |

---

## Architecture Decisions

1. **Two-phase seat locking**: Prevents seat being held by users who abandon checkout. 5-min TTL auto-expires.
2. **PostgreSQL enums**: Type safety at DB level, prevents invalid status values.
3. **DB trigger for cancellation**: Enforces 2-hour rule at DB level, not just application level.
4. **Supabase Realtime**: Live seat updates without polling. Proper channel cleanup prevents memory leaks.
5. **Zustand with partialize**: Persists booking flow state across tab closes, but excludes sensitive passport data.
6. **Optimistic UI**: Instant seat selection feedback, rollback on failure.
7. **Server Components**: Supabase server client uses cookies, never exposes service role key.

---

## Trade-offs & Limitations

- **In-memory seat locks**: Locks are in PostgreSQL, not Redis. Fine for demo scale, would need Redis for production.
- **No payment integration**: Booking completes without real payment. Documented as future enhancement.
- **Single passenger per booking**: Architecture supports multiple passengers via array, but UI defaults to 1 for simplicity.
- **No email notifications**: Booking confirmations are in-app only.
- **Scheduled lock cleanup**: Uses Supabase pg_cron or manual invocation, not a background worker.

---

## Submission Checklist

- [ ] Public GitHub repository with descriptive commit history
- [ ] .env.example with all Supabase environment variables listed
- [ ] Supabase migration SQL files in /supabase/migrations
- [ ] Seed script with flights, seats, and test user accounts
- [ ] README with local setup steps, Supabase config, Zustand store explanation
- [ ] Deployed preview link (Vercel)
- [ ] Lighthouse PWA screenshot in README (bonus)
