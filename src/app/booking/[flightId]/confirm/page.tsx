'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Loader2, Plane, Copy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/useFlightStore';
import { formatTime, formatDate, formatPrice, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ConfirmPage() {
  const router = useRouter();
  const { selectedFlight, selectedSeat, passengers, resetBooking } = useFlightStore();
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pnr, setPnr] = useState('');
  const supabase = useMemo(() => createClient(), []);

  const handleConfirm = async () => {
    if (!selectedSeat || !selectedFlight) return;

    setConfirming(true);
    try {
      // Confirm booking for first passenger (creates booking + passenger)
      const primary = passengers[0];
      const { data, error } = await supabase.rpc('confirm_booking', {
        p_seat_id: selectedSeat.id,
        p_full_name: primary.full_name,
        p_passport_no: primary.passport_no,
        p_nationality: primary.nationality,
        p_dob: primary.dob,
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Failed to confirm booking');
        return;
      }

      // Insert additional passengers if any
      if (passengers.length > 1 && data.booking_id) {
        const additionalPassengers = passengers.slice(1).map((p) => ({
          booking_id: data.booking_id,
          full_name: p.full_name,
          passport_no: p.passport_no,
          nationality: p.nationality,
          dob: p.dob,
        }));
        await supabase.from('passengers').insert(additionalPassengers);
      }

      setPnr(data.pnr);
      setConfirmed(true);
      toast.success('Booking confirmed!');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setConfirming(false);
    }
  };

  const copyPNR = () => {
    navigator.clipboard.writeText(pnr);
    toast.success('PNR copied to clipboard');
  };

  if (confirmed) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your flight has been booked successfully.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          {/* PNR */}
          <div className="text-center mb-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">Your PNR Code</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-mono font-bold text-blue-600 tracking-wider">{pnr}</span>
              <button onClick={copyPNR} className="p-2 hover:bg-blue-100 rounded-lg">
                <Copy className="h-5 w-5 text-blue-600" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Save this code for check-in</p>
          </div>

          {/* Flight details */}
          {selectedFlight && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatTime(selectedFlight.departs_at)}</div>
                  <div className="text-sm text-gray-500">{selectedFlight.origin}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs text-gray-500">{formatDuration(selectedFlight.departs_at, selectedFlight.arrives_at)}</div>
                  <Plane className="h-5 w-5 text-blue-600 my-1" />
                  <div className="text-xs text-gray-500">{selectedFlight.flight_no}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatTime(selectedFlight.arrives_at)}</div>
                  <div className="text-sm text-gray-500">{selectedFlight.destination}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Date</span>
                  <p className="font-medium">{formatDate(selectedFlight.departs_at)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Seat</span>
                  <p className="font-medium">{selectedSeat?.seat_number}</p>
                </div>
                <div>
                  <span className="text-gray-500">Class</span>
                  <p className="font-medium capitalize">{selectedSeat?.class}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total Paid</span>
                  <p className="font-medium text-blue-600">
                    {formatPrice((selectedFlight.base_price + (selectedSeat?.extra_fee || 0)) * passengers.length)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Passengers */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Passengers</h3>
            {passengers.map((p, i) => (
              <div key={i} className="text-sm text-gray-600 mb-1">
                {i + 1}. {p.full_name} — {p.passport_no}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => {
              resetBooking();
              router.push('/');
            }}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Book Another Flight
          </button>
          <button
            onClick={() => router.push('/my-bookings')}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Review & Confirm</h1>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Flight Details</h3>
        {selectedFlight && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-xl font-bold">{formatTime(selectedFlight.departs_at)}</div>
                <div className="text-sm text-gray-500">{selectedFlight.origin}</div>
              </div>
              <Plane className="h-5 w-5 text-blue-600" />
              <div className="text-center">
                <div className="text-xl font-bold">{formatTime(selectedFlight.arrives_at)}</div>
                <div className="text-sm text-gray-500">{selectedFlight.destination}</div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {formatDate(selectedFlight.departs_at)} · {selectedFlight.flight_no}
            </div>
          </>
        )}

        <div className="border-t border-gray-200 mt-4 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Seat</span>
            <span className="font-medium">{selectedSeat?.seat_number} ({selectedSeat?.class})</span>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Passengers</h4>
          {passengers.map((p, i) => (
            <div key={i} className="text-sm text-gray-600 mb-1">
              {p.full_name} — {p.nationality} — {p.passport_no}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-blue-600">
              {selectedFlight && formatPrice((selectedFlight.base_price + (selectedSeat?.extra_fee || 0)) * passengers.length)}
            </span>
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={confirming}
        className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-semibold"
      >
        {confirming ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <CheckCircle className="h-6 w-6" />
            Confirm Booking
          </>
        )}
      </button>
    </div>
  );
}
