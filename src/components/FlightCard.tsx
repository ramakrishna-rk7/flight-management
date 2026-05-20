'use client';

import { Plane, Clock, ArrowRight } from 'lucide-react';
import type { Flight } from '@/types';
import { formatTime, formatDuration, formatPrice, formatDate } from '@/lib/utils';

interface FlightCardProps {
  flight: Flight;
  selectedClass: string;
  onSelect: (flight: Flight) => void;
}

export default function FlightCard({ flight, selectedClass, onSelect }: FlightCardProps) {
  const duration = formatDuration(flight.departs_at, flight.arrives_at);

  const classMultiplier = selectedClass === 'first' ? 3 : selectedClass === 'business' ? 2 : 1;
  const displayPrice = flight.base_price * classMultiplier;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(flight)}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Flight info */}
        <div className="flex items-center gap-6">
          {/* Departure */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatTime(flight.departs_at)}</div>
            <div className="text-sm text-gray-500">{flight.origin}</div>
          </div>

          {/* Duration & route */}
          <div className="flex flex-col items-center gap-1 min-w-[120px]">
            <div className="text-xs text-gray-500">{duration}</div>
            <div className="relative w-full">
              <div className="border-t border-gray-300 w-full" />
              <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 bg-white" />
            </div>
            <div className="text-xs text-gray-500">{flight.flight_no}</div>
          </div>

          {/* Arrival */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatTime(flight.arrives_at)}</div>
            <div className="text-sm text-gray-500">{flight.destination}</div>
          </div>
        </div>

        {/* Price & action */}
        <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{formatPrice(displayPrice)}</div>
            <div className="text-xs text-gray-500 capitalize">{selectedClass} class</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(flight);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
          >
            Select
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Flight details */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(flight.departs_at)}
        </span>
        <span>{flight.aircraft_type}</span>
        <span className="capitalize">Status: {flight.status}</span>
      </div>
    </div>
  );
}
