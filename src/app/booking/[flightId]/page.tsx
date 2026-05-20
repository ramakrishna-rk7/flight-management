import { createClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import { formatDate, formatDuration } from '@/lib/utils';
import BookingClient from './BookingClient';

async function fetchFlight(flightId: string) {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('flights')
    .select('*')
    .eq('id', flightId)
    .single();

  return data;
}

async function fetchSeats(flightId: string) {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('seats')
    .select('*')
    .eq('flight_id', flightId)
    .order('seat_number');

  return data || [];
}

export default async function BookingPage({
  params,
}: {
  params: { flightId: string };
}) {
  const flightId = params.flightId;
  
  const [flight, seats] = await Promise.all([
    fetchFlight(flightId),
    fetchSeats(flightId),
  ]);

  if (!flight) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Flight not found</p>
        <a href="/" className="mt-4 text-blue-600">
          Search again
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <a href="/" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {flight.origin} → {flight.destination}
          </h1>
          <p className="text-sm text-gray-500">
            {flight.flight_no} · {formatDate(flight.departs_at)} · {formatDuration(flight.departs_at, flight.arrives_at)}
          </p>
        </div>
      </div>

      <BookingClient 
        flight={flight}
        flightId={flightId}
        initialSeats={seats}
      />
    </div>
  );
}
