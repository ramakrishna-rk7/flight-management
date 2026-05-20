'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { useFlightStore } from '@/store/useFlightStore';
import type { SeatClass } from '@/types';

const CITIES = [
  { code: 'JFK', name: 'New York' },
  { code: 'LAX', name: 'Los Angeles' },
  { code: 'ORD', name: 'Chicago' },
  { code: 'MIA', name: 'Miami' },
];

export default function SearchForm() {
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useFlightStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localQuery);
    const params = new URLSearchParams({
      origin: localQuery.origin,
      destination: localQuery.destination,
      date: localQuery.date,
      passengers: String(localQuery.passengers),
      class: localQuery.class,
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Origin */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={localQuery.origin}
              onChange={(e) => setLocalQuery({ ...localQuery, origin: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              required
            >
              <option value="">Select origin</option>
              {CITIES.map((city) => (
                <option key={city.code} value={city.code}>
                  {city.code} — {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={localQuery.destination}
              onChange={(e) => setLocalQuery({ ...localQuery, destination: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              required
            >
              <option value="">Select destination</option>
              {CITIES.filter((c) => c.code !== localQuery.origin).map((city) => (
                <option key={city.code} value={city.code}>
                  {city.code} — {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={localQuery.date}
              onChange={(e) => setLocalQuery({ ...localQuery, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Passengers & Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={localQuery.passengers}
              onChange={(e) => setLocalQuery({ ...localQuery, passengers: Number(e.target.value) })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'passenger' : 'passengers'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select
            value={localQuery.class}
            onChange={(e) => setLocalQuery({ ...localQuery, class: e.target.value as SeatClass })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="economy">Economy</option>
            <option value="business">Business</option>
            <option value="first">First Class</option>
          </select>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-6">
        <button
          type="submit"
          className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Search className="h-5 w-5" />
          Search Flights
        </button>
      </div>
    </form>
  );
}
