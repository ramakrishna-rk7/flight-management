'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/useFlightStore';
import type { Seat } from '@/types';

interface SeatMapProps {
  flightId: string;
  initialSeats: Seat[];
  confirmedSeatId?: string; // User's already-booked seat on this flight
}

const SEAT_COLS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function SeatMap({ flightId, initialSeats, confirmedSeatId }: SeatMapProps) {
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const { selectedSeat, selectSeat, clearSeat } = useFlightStore();
  const supabase = useMemo(() => createClient(), []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('seat-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          setSeats((prev) =>
            prev.map((s) =>
              s.id === payload.new.id ? { ...s, ...payload.new } : s
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flightId, supabase]);

  // Group seats by class
  const firstClass = seats.filter((s) => s.class === 'first');
  const businessClass = seats.filter((s) => s.class === 'business');
  const economyClass = seats.filter((s) => s.class === 'economy');

  const handleSeatClick = (seat: Seat) => {
    if (!seat.is_available) return;
    if (selectedSeat?.id === seat.id) {
      clearSeat();
    } else {
      selectSeat(seat);
    }
  };

  const renderSeatGroup = (groupSeats: Seat[], label: string) => {
    const rows: Record<number, Seat[]> = {};
    groupSeats.forEach((seat) => {
      const row = parseInt(seat.seat_number);
      if (!rows[row]) rows[row] = [];
      rows[row].push(seat);
    });

    return (
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          {label}
        </h4>
        <div className="space-y-2">
          {Object.entries(rows)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([rowNum, rowSeats]) => (
              <div key={rowNum} className="flex items-center gap-2">
                <span className="w-6 text-xs text-gray-400 text-right">{rowNum}</span>
                <div className="flex gap-1">
                  {SEAT_COLS.map((col) => {
                    const seat = rowSeats.find((s) => s.seat_number.endsWith(col));
                    if (!seat) return <div key={col} className="w-10 h-10" />;

                    const isSelected = selectedSeat?.id === seat.id;
                    const isConfirmed = confirmedSeatId === seat.id;
                    const isOccupied = !seat.is_available && !isConfirmed;
                    const isLocked = seat.locked_by !== null && seat.locked_until !== null && new Date(seat.locked_until) > new Date();

                    let bgColor = 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer';
                    if (isConfirmed) {
                      bgColor = 'bg-green-600 border-green-600 text-white ring-2 ring-green-300';
                    } else if (isOccupied) {
                      bgColor = 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed';
                    } else if (isLocked) {
                      bgColor = 'bg-yellow-100 border-yellow-300 text-yellow-600 cursor-not-allowed';
                    } else if (isSelected) {
                      bgColor = 'bg-blue-600 border-blue-600 text-white';
                    }

                    return (
                      <button
                        key={col}
                        onClick={() => handleSeatClick(seat)}
                        disabled={isOccupied || isLocked}
                        title={
                          isOccupied
                            ? `${seat.class} — Occupied`
                            : isLocked
                            ? `${seat.class} — Temporarily locked`
                            : `${seat.class} — $${seat.extra_fee} extra`
                        }
                        className={`w-10 h-10 rounded-lg border-2 text-xs font-medium transition-all flex items-center justify-center ${bgColor}`}
                      >
                        {seat.seat_number}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Seat</h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-600" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-600 ring-2 ring-green-300" />
          <span>Your Seat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300" />
          <span>Locked</span>
        </div>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto">
        {firstClass.length > 0 && renderSeatGroup(firstClass, 'First Class')}
        {businessClass.length > 0 && renderSeatGroup(businessClass, 'Business Class')}
        {economyClass.length > 0 && renderSeatGroup(economyClass, 'Economy')}
      </div>

      {/* Seat info */}
      {confirmedSeatId && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            Your Seat: <strong>{seats.find(s => s.id === confirmedSeatId)?.seat_number}</strong> ({seats.find(s => s.id === confirmedSeatId)?.class})
          </p>
        </div>
      )}
      {selectedSeat && !confirmedSeatId && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            Selected: <strong>{selectedSeat.seat_number}</strong> ({selectedSeat.class})
            {selectedSeat.extra_fee > 0 && ` — +$${selectedSeat.extra_fee} extra fee`}
          </p>
        </div>
      )}
    </div>
  );
}
