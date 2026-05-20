import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { SeatClass } from '@/types';
import SearchResultsClient from './SearchResultsClient';

async function fetchFlights(origin: string, destination: string, date: string) {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .gte('departs_at', `${date}T00:00:00`)
    .lte('departs_at', `${date}T23:59:59`)
    .eq('status', 'scheduled')
    .order('departs_at');

  return data || [];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { origin?: string; destination?: string; date?: string; passengers?: string; class?: string };
}) {
  const origin = searchParams.origin || '';
  const destination = searchParams.destination || '';
  const date = searchParams.date || '';
  const passengers = Number(searchParams.passengers || '1');
  const seatClass = (searchParams.class || 'economy') as SeatClass;

  let flights = [];
  if (origin && destination && date) {
    flights = await fetchFlights(origin, destination, date);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {origin} → {destination}
          </h1>
          <p className="text-sm text-gray-500">
            {date} · {passengers} {passengers === 1 ? 'passenger' : 'passengers'} · {seatClass} class
          </p>
        </div>
      </div>

      {/* Results */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      }>
        <SearchResultsClient 
          initialFlights={flights}
          origin={origin}
          destination={destination}
          date={date}
          passengers={passengers}
          seatClass={seatClass}
        />
      </Suspense>
    </div>
  );
}
