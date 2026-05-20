import SearchForm from '@/components/SearchForm';
import { Plane, Shield, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Find & Book Your Next Flight
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Search hundreds of flights, select your preferred seat, and manage your bookings — all in one place.
        </p>
      </div>

      {/* Search Form */}
      <SearchForm />

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <div className="text-center p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
            <Plane className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Booking</h3>
          <p className="text-gray-600 text-sm">
            Search flights by route and date, select your seat, and book in minutes.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Seats</h3>
          <p className="text-gray-600 text-sm">
            Real-time seat availability with instant confirmation and PNR generation.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible Changes</h3>
          <p className="text-gray-600 text-sm">
            Reschedule or cancel your bookings with transparent policies.
          </p>
        </div>
      </div>
    </div>
  );
}
