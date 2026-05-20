'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/useFlightStore';
import SeatMap from '@/components/SeatMap';
import PassengerForm from '@/components/PassengerForm';
import type { Flight, Seat } from '@/types';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BookingClient({
  flight,
  flightId,
  initialSeats,
}: {
  flight: Flight;
  flightId: string;
  initialSeats: Seat[];
}) {
  const router = useRouter();
  const { selectedSeat, bookingStep, setBookingStep, passengers, clearSeat } = useFlightStore();
  const [reserving, setReserving] = useState(false);
  const supabase = createClient();

  const handleContinue = async () => {
    if (!selectedSeat) {
      toast.error('Please select a seat');
      return;
    }

    setReserving(true);
    try {
      const { data, error } = await supabase.rpc('reserve_seat', {
        p_seat_id: selectedSeat.id,
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Failed to reserve seat');
        clearSeat();
        return;
      }

      setBookingStep(2);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setReserving(false);
    }
  };

  const classMultiplier = flight.base_price;
  const seatExtra = selectedSeat?.extra_fee || 0;
  const totalPerPassenger = classMultiplier + seatExtra;

  return (
    <>
      {/* Steps indicator */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${bookingStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${bookingStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="text-sm font-medium">Select Seat</span>
        </div>
        <div className="flex-1 border-t border-gray-300" />
        <div className={`flex items-center gap-2 ${bookingStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${bookingStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="text-sm font-medium">Passenger Details</span>
        </div>
      </div>

      {bookingStep === 1 ? (
        <>
          {/* Seat Selection */}
          <SeatMap flightId={flightId} initialSeats={initialSeats} />

          {/* Price summary */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Base price</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(classMultiplier)}</p>
              </div>
              {seatExtra > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Seat extra</p>
                  <p className="text-lg font-bold text-orange-600">+{formatPrice(seatExtra)}</p>
                </div>
              )}
              <div className="text-right">
                <p className="text-sm text-gray-500">Total per passenger</p>
                <p className="text-2xl font-bold text-blue-600">{formatPrice(totalPerPassenger)}</p>
              </div>
            </div>
          </div>

          {/* Continue button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleContinue}
              disabled={!selectedSeat || reserving}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {reserving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Passenger Form */}
          <PassengerForm />

          {/* Price summary */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Seat</p>
                <p className="font-medium">{selectedSeat?.seat_number} ({selectedSeat?.class})</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total ({passengers.length} passenger{passengers.length > 1 ? 's' : ''})</p>
                <p className="text-2xl font-bold text-blue-600">{formatPrice(totalPerPassenger * passengers.length)}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={async () => {
                if (selectedSeat) {
                  await supabase.rpc('release_seat_lock', { p_seat_id: selectedSeat.id });
                }
                clearSeat();
                setBookingStep(1);
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => {
                const isValid = passengers.every(p => p.full_name && p.passport_no && p.nationality && p.dob);
                if (!isValid) {
                  toast.error('Please fill in all passenger details');
                  return;
                }
                router.push(`/booking/${flightId}/confirm`);
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              Review & Confirm
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
