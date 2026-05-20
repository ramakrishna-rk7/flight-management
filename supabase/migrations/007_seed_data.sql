-- Seed flights: 8 flights across 4 routes
INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price) VALUES
  ('SK101', 'JFK', 'LAX', '2026-05-25 08:00:00-04', '2026-05-25 11:30:00-07', 'Boeing 737', 'scheduled', 299),
  ('SK102', 'JFK', 'LAX', '2026-05-25 14:00:00-04', '2026-05-25 17:30:00-07', 'Airbus A320', 'scheduled', 349),
  ('SK201', 'LAX', 'ORD', '2026-05-26 09:00:00-07', '2026-05-26 15:00:00-05', 'Boeing 737', 'scheduled', 249),
  ('SK202', 'LAX', 'ORD', '2026-05-26 16:00:00-07', '2026-05-26 22:00:00-05', 'Airbus A320', 'scheduled', 279),
  ('SK301', 'ORD', 'MIA', '2026-05-27 07:00:00-05', '2026-05-27 11:00:00-05', 'Boeing 737', 'scheduled', 199),
  ('SK302', 'ORD', 'MIA', '2026-05-27 13:00:00-05', '2026-05-27 17:00:00-05', 'Airbus A320', 'scheduled', 229),
  ('SK401', 'MIA', 'JFK', '2026-05-28 06:00:00-05', '2026-05-28 09:30:00-04', 'Boeing 737', 'scheduled', 279),
  ('SK402', 'MIA', 'JFK', '2026-05-28 15:00:00-05', '2026-05-28 18:30:00-04', 'Airbus A320', 'scheduled', 319);

-- Seed seats for each flight (first: 4, business: 8, economy: 20 = 32 per flight)
DO $$
DECLARE
  flight RECORD;
  row_num INT;
  col TEXT;
  seat_cols TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F'];
BEGIN
  FOR flight IN SELECT id FROM flights LOOP
    -- First class (rows 1-2, cols A-D)
    FOR row_num IN 1..2 LOOP
      FOR col IN SELECT unnest(ARRAY['A', 'B', 'C', 'D']) LOOP
        INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (flight.id, row_num || col, 'first', true, 150);
      END LOOP;
    END LOOP;

    -- Business class (rows 3-6, cols A-D)
    FOR row_num IN 3..6 LOOP
      FOR col IN SELECT unnest(ARRAY['A', 'B', 'C', 'D']) LOOP
        INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (flight.id, row_num || col, 'business', true, 75);
      END LOOP;
    END LOOP;

    -- Economy (rows 7-16, cols A-F)
    FOR row_num IN 7..16 LOOP
      FOR i IN 1..6 LOOP
        INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (flight.id, row_num || seat_cols[i], 'economy', true, 0);
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
