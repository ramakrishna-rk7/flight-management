'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Booking, Flight } from '@/types';
import { formatTime, formatPrice } from '@/lib/utils';

interface RescheduleModalProps {
  booking: Booking;
  onClose: () => void;
  onConfirm: (newFlightId: string) => void;
}

export default function RescheduleModal({ booking, onClose, onConfirm }: RescheduleModalProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchFlights() {
      if (!booking.flight) return;
      const { data } = await supabase
        .from('flights')
        .select('*')
        .eq('origin', booking.flight.origin)
        .eq('destination', booking.flight.destination)
        .neq('id', booking.flight_id)
        .eq('status', 'scheduled')
        .order('departs_at');

      setFlights(data || []);
      setLoading(false);
    }
    fetchFlights();
  }, [booking, supabase]);

  const selectedFlight = flights.find((f) => f.id === selectedFlightId);
  const priceDiff = selectedFlight && booking.flight
    ? selectedFlight.base_price - booking.flight.base_price
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Reschedule Flight</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Select an alternative flight on the same route ({booking.flight?.origin} → {booking.flight?.destination})
          </p>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading flights...</div>
          ) : flights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No alternative flights available</div>
          ) : (
            <div className="space-y-3">
              {flights.map((flight) => (
                <button
                  key={flight.id}
                  onClick={() => setSelectedFlightId(flight.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedFlightId === flight.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-bold">{formatTime(flight.departs_at)}</div>
                        <div className="text-xs text-gray-500">{flight.origin}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="text-center">
                        <div className="font-bold">{formatTime(flight.arrives_at)}</div>
                        <div className="text-xs text-gray-500">{flight.destination}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{formatPrice(flight.base_price)}</div>
                      <div className="text-xs text-gray-500">{flight.flight_no}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Fee info */}
          {selectedFlight && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              {priceDiff > 0 ? (
                <p className="text-sm text-gray-700">
                  Price difference: <span className="font-bold text-orange-600">+{formatPrice(priceDiff)}</span> (will be charged)
                </p>
              ) : (
                <p className="text-sm text-gray-700">
                  No additional charge for this flight.
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedFlightId)}
              disabled={!selectedFlightId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Reschedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
