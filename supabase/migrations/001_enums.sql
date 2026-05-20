-- Enum types for type safety at DB level
CREATE TYPE seat_class AS ENUM ('economy', 'business', 'first');
CREATE TYPE booking_status AS ENUM ('confirmed', 'rescheduled', 'cancelled');
CREATE TYPE flight_status AS ENUM ('scheduled', 'boarding', 'departed', 'cancelled');
