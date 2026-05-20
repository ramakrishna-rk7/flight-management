'use client';

import { Plane, Hash, RotateCcw, XCircle, CheckCircle } from 'lucide-react';
import type { Booking } from '@/types';
import { formatTime, formatDate, formatPrice, canCancel } from '@/lib/utils';

interface BookingCardProps {
  booking: Booking;
  onReschedule: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}

const statusConfig = {
  confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Confirmed' },
  rescheduled: { color: 'bg-yellow-100 text-yellow-800', icon: RotateCcw, label: 'Rescheduled' },
  cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
};

export default function BookingCard({ booking, onReschedule, onCancel }: BookingCardProps) {
  const status = statusConfig[booking.status];
  const StatusIcon = status.icon;
  const isActive = booking.status !== 'cancelled';
  const canCancelBooking = isActive && booking.flight ? canCancel(booking.flight.departs_at) : false;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-mono text-gray-600">{booking.pnr_code}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      {/* Flight info */}
      {booking.flight && (
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{formatTime(booking.flight.departs_at)}</div>
            <div className="text-sm text-gray-500">{booking.flight.origin}</div>
          </div>

          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="text-xs text-gray-500">{booking.flight.flight_no}</div>
            <div className="relative w-full">
              <div className="border-t border-gray-300 w-full" />
              <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 bg-white" />
            </div>
          </div>

          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{formatTime(booking.flight.arrives_at)}</div>
            <div className="text-sm text-gray-500">{booking.flight.destination}</div>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-500">Date</span>
          <p className="font-medium">{booking.flight ? formatDate(booking.flight.departs_at) : '—'}</p>
        </div>
        <div>
          <span className="text-gray-500">Seat</span>
          <p className="font-medium">{booking.seat?.seat_number || '—'}</p>
        </div>
        <div>
          <span className="text-gray-500">Class</span>
          <p className="font-medium capitalize">{booking.seat?.class || '—'}</p>
        </div>
        <div>
          <span className="text-gray-500">Total</span>
          <p className="font-medium text-blue-600">{formatPrice(booking.total_price)}</p>
        </div>
      </div>

      {/* Passenger */}
      {booking.passengers && booking.passengers.length > 0 && (
        <div className="text-sm text-gray-600 mb-4">
          <span className="text-gray-500">Passenger: </span>
          {booking.passengers.map((p) => p.full_name).join(', ')}
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => onReschedule(booking)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            Reschedule
          </button>
          <button
            onClick={() => onCancel(booking)}
            disabled={!canCancelBooking}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canCancelBooking
                ? 'border border-red-600 text-red-600 hover:bg-red-50'
                : 'border border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
            title={!canCancelBooking ? 'Cannot cancel within 2 hours of departure' : ''}
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
