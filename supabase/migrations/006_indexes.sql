-- Performance indexes
CREATE INDEX idx_flights_route ON flights(origin, destination);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_seats_flight ON seats(flight_id);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_reschedule_booking ON reschedules(booking_id);
CREATE INDEX idx_departure ON flights(departs_at);
