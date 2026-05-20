-- DB trigger: enforce 2-hour cancellation rule
CREATE OR REPLACE FUNCTION validate_cancellation()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'cancelled' AND EXISTS (
    SELECT 1 FROM flights
    WHERE id = OLD.flight_id
    AND departs_at - now() < interval '2 hours'
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
