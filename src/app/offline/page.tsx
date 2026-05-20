import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
          <WifiOff className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Offline</h1>
        <p className="text-gray-600 max-w-md">
          It looks like you&apos;ve lost your internet connection. Please check your connection and try again.
          Your cached bookings are still available in the My Bookings section.
        </p>
        <a
          href="/my-bookings"
          className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          View Cached Bookings
        </a>
      </div>
    </div>
  );
}
