-- Enable RLS on all tables
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- Flights: public read
CREATE POLICY "Flights public read"
  ON flights FOR SELECT
  USING (true);

-- Seats: public read, no direct write (only via RPC)
CREATE POLICY "Seats public read"
  ON seats FOR SELECT
  USING (true);

-- Bookings: users can only access their own
CREATE POLICY "Users own bookings"
  ON bookings FOR ALL
  USING (auth.uid() = user_id);

-- Passengers: users can only access passengers for their bookings
CREATE POLICY "Users own passengers"
  ON passengers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = passengers.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Reschedules: users can only access reschedules for their bookings
CREATE POLICY "Users own reschedules"
  ON reschedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reschedules.booking_id
      AND bookings.user_id = auth.uid()
    )
  );
