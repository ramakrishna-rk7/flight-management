'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useFlightStore } from '@/store/useFlightStore';
import FlightCard from '@/components/FlightCard';
import type { Flight, SeatClass } from '@/types';

export default function SearchResultsClient({
  initialFlights,
  origin,
  destination,
  date,
  passengers,
  seatClass,
}: {
  initialFlights: Flight[];
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  seatClass: SeatClass;
}) {
  const router = useRouter();
  const { setSelectedFlight, setSearchQuery } = useFlightStore();

  useEffect(() => {
    setSearchQuery({ origin, destination, date, passengers, class: seatClass });
  }, [origin, destination, date, passengers, seatClass, setSearchQuery]);

  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlight(flight);
    router.push(`/booking/${flight.id}`);
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {initialFlights.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No flights found for this route and date.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Search again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {initialFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              selectedClass={seatClass}
              onSelect={handleSelectFlight}
            />
          ))}
        </div>
      )}
    </>
  );
}
