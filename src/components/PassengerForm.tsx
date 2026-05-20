'use client';

import { User, Plus, Trash2 } from 'lucide-react';
import { useFlightStore } from '@/store/useFlightStore';

export default function PassengerForm() {
  const { passengers, setPassenger, addPassenger, removePassenger } = useFlightStore();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Passenger Details</h3>
        {passengers.length < 6 && (
          <button
            type="button"
            onClick={addPassenger}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Passenger
          </button>
        )}
      </div>

      <div className="space-y-6">
        {passengers.map((passenger, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Passenger {index + 1}
              </h4>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removePassenger(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={passenger.full_name}
                  onChange={(e) => setPassenger(index, { full_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                <input
                  type="text"
                  value={passenger.passport_no}
                  onChange={(e) => setPassenger(index, { passport_no: e.target.value })}
                  placeholder="AB1234567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  value={passenger.nationality}
                  onChange={(e) => setPassenger(index, { nationality: e.target.value })}
                  placeholder="American"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={passenger.dob}
                  onChange={(e) => setPassenger(index, { dob: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
