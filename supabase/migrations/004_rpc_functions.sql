-- Reserve seat (temporary 5-minute lock)
-- Uses auth.uid() to prevent callers from impersonating other users
CREATE OR REPLACE FUNCTION reserve_seat(p_seat_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_seat RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_seat FROM seats WHERE id = p_seat_id FOR UPDATE;

  IF NOT v_seat.is_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat already taken');
  END IF;

  IF v_seat.locked_by IS NOT NULL
     AND v_seat.locked_until > now()
     AND v_seat.locked_by != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat is temporarily locked by another user');
  END IF;

  UPDATE seats
  SET locked_by = v_user_id, locked_until = now() + interval '5 minutes'
  WHERE id = p_seat_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirm booking (permanent seat allocation)
-- Uses auth.uid() for user identity, accepts passenger data
CREATE OR REPLACE FUNCTION confirm_booking(
  p_seat_id UUID,
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
  v_total NUMERIC;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_seat FROM seats WHERE id = p_seat_id FOR UPDATE;

  IF NOT v_seat.is_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat no longer available');
  END IF;

  IF v_seat.locked_by != v_user_id OR v_seat.locked_until < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat lock expired or not yours');
  END IF;

  -- Generate PNR
  v_pnr := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));

  -- Calculate total
  SELECT base_price + v_seat.extra_fee INTO v_total
  FROM flights WHERE id = v_seat.flight_id;

  -- Update seat
  UPDATE seats
  SET is_available = false, locked_by = NULL, locked_until = NULL
  WHERE id = p_seat_id;

  -- Create booking
  INSERT INTO bookings (user_id, flight_id, seat_id, status, total_price, pnr_code)
  VALUES (v_user_id, v_seat.flight_id, p_seat_id, 'confirmed', v_total, v_pnr)
  RETURNING id INTO v_booking_id;

  -- Create passenger
  INSERT INTO passengers (booking_id, full_name, passport_no, nationality, dob)
  VALUES (v_booking_id, p_full_name, p_passport_no, p_nationality, p_dob);

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id, 'pnr', v_pnr);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release seat lock (manual release — only the user who locked it can release)
CREATE OR REPLACE FUNCTION release_seat_lock(p_seat_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE seats
  SET locked_by = NULL, locked_until = NULL
  WHERE id = p_seat_id AND locked_by = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cancel booking (atomic: update booking + free seat)
-- Verifies the caller owns the booking before cancelling
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_booking RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id AND user_id = v_user_id;

  IF v_booking IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found or not yours');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already cancelled');
  END IF;

  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE seats
  SET is_available = true, locked_by = NULL, locked_until = NULL
  WHERE id = v_booking.seat_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release expired seat locks (scheduled cleanup)
CREATE OR REPLACE FUNCTION release_expired_seats()
RETURNS void AS $$
BEGIN
  UPDATE seats SET locked_by = NULL, locked_until = NULL
  WHERE locked_until < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
