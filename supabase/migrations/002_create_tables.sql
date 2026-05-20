-- Flights table
CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_no TEXT NOT NULL UNIQUE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departs_at TIMESTAMPTZ NOT NULL,
  arrives_at TIMESTAMPTZ NOT NULL,
  aircraft_type TEXT NOT NULL,
  status flight_status DEFAULT 'scheduled',
  base_price NUMERIC NOT NULL
);

-- Seats table with locking support
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  class seat_class NOT NULL,
  is_available BOOLEAN DEFAULT true,
  extra_fee NUMERIC DEFAULT 0,
  locked_by UUID REFERENCES auth.users(id),
  locked_until TIMESTAMPTZ,
  UNIQUE(flight_id, seat_number)
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  flight_id UUID NOT NULL REFERENCES flights(id),
  seat_id UUID NOT NULL REFERENCES seats(id),
  status booking_status DEFAULT 'confirmed',
  booked_at TIMESTAMPTZ DEFAULT now(),
  total_price NUMERIC NOT NULL,
  pnr_code TEXT UNIQUE NOT NULL
);

-- Passengers table
CREATE TABLE passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  passport_no TEXT NOT NULL,
  nationality TEXT NOT NULL,
  dob DATE NOT NULL
);

-- Reschedules table
CREATE TABLE reschedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  old_flight_id UUID NOT NULL REFERENCES flights(id),
  new_flight_id UUID NOT NULL REFERENCES flights(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  fee_charged NUMERIC NOT NULL
);
