'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import BookingCard from '@/components/BookingCard';
import RescheduleModal from '@/components/RescheduleModal';
import CancelDialog from '@/components/CancelDialog';
import type { Booking } from '@/types';
import toast from 'react-hot-toast';

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setLocalBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchBookings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Try cache first for offline support
      const cached = localStorage.getItem('bookings-cache');
      if (cached) {
        try {
          setLocalBookings(JSON.parse(cached) as Booking[]);
        } catch {
          // ignore cache parse errors
        }
      }

      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          flight:flights(*),
          seat:seats(*),
          passengers(*)
        `)
        .eq('user_id', user.id)
        .order('booked_at', { ascending: false });

      if (data) {
        setLocalBookings(data);
        localStorage.setItem('bookings-cache', JSON.stringify(data));
      }
      setLoading(false);
    }

    fetchBookings();
  }, [supabase, router]);

  const handleReschedule = async (newFlightId: string) => {
    if (!rescheduleBooking) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get new flight price
      const { data: newFlight } = await supabase
        .from('flights')
        .select('base_price')
        .eq('id', newFlightId)
        .single();

      const oldPrice = rescheduleBooking.flight?.base_price || 0;
      const fee = newFlight ? Math.max(0, newFlight.base_price - oldPrice) : 0;

      // Get old seat details to find matching class on new flight
      const oldSeatClass = rescheduleBooking.seat?.class || 'economy';

      // Find an available seat on the new flight with same class
      const { data: availableSeats } = await supabase
        .from('seats')
        .select('*')
        .eq('flight_id', newFlightId)
        .eq('class', oldSeatClass)
        .eq('status', 'available')
        .limit(1);

      if (!availableSeats || availableSeats.length === 0) {
        toast.error(`No ${oldSeatClass} seats available on new flight`);
        return;
      }

      const newSeat = availableSeats[0];

      // Free old seat
      await supabase
        .from('seats')
        .update({ status: 'available', reserved_by: null, reserved_until: null })
        .eq('id', rescheduleBooking.seat_id);

      // Reserve new seat
      await supabase
        .from('seats')
        .update({ status: 'occupied', reserved_by: user.id })
        .eq('id', newSeat.id);

      // Insert reschedule record
      await supabase.from('reschedules').insert({
        booking_id: rescheduleBooking.id,
        old_flight_id: rescheduleBooking.flight_id,
        new_flight_id: newFlightId,
        fee_charged: fee,
      });

      // Update booking with new flight AND new seat
      await supabase
        .from('bookings')
        .update({ flight_id: newFlightId, seat_id: newSeat.id, status: 'rescheduled' })
        .eq('id', rescheduleBooking.id);

      // Refresh bookings
      const { data } = await supabase
        .from('bookings')
        .select(`*, flight:flights(*), seat:seats(*), passengers(*)`)
        .eq('user_id', user.id)
        .order('booked_at', { ascending: false });

      if (data) {
        setLocalBookings(data);
        localStorage.setItem('bookings-cache', JSON.stringify(data));
      }

      toast.success('Flight rescheduled successfully');
      setRescheduleBooking(null);
    } catch {
      toast.error('Failed to reschedule');
    }
  };

  const handleCancel = async () => {
    if (!cancelBooking) return;

    try {
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: cancelBooking.id,
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Failed to cancel booking');
        setCancelBooking(null);
        return;
      }

      // Refresh bookings
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: updated } = await supabase
          .from('bookings')
          .select(`*, flight:flights(*), seat:seats(*), passengers(*)`)
          .eq('user_id', user.id)
          .order('booked_at', { ascending: false });

        if (updated) {
          setLocalBookings(updated);
          localStorage.setItem('bookings-cache', JSON.stringify(updated));
        }
      }

      toast.success('Booking cancelled');
      setCancelBooking(null);
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No bookings yet</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Search flights
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onReschedule={setRescheduleBooking}
              onCancel={setCancelBooking}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          onConfirm={handleReschedule}
        />
      )}
      {cancelBooking && (
        <CancelDialog
          booking={cancelBooking}
          onClose={() => setCancelBooking(null)}
          onConfirm={handleCancel}
        />
      )}
    </div>
  );
}
