import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Flight, Seat, SearchQuery, PassengerForm, SeatClass } from '@/types';

interface FlightState {
  // Search
  searchQuery: SearchQuery;
  setSearchQuery: (query: Partial<SearchQuery>) => void;

  // Selected flight & seat
  selectedFlight: Flight | null;
  selectedSeat: Seat | null;
  setSelectedFlight: (flight: Flight | null) => void;
  selectSeat: (seat: Seat) => void;
  clearSeat: () => void;

  // Booking flow
  bookingStep: number;
  setBookingStep: (step: number) => void;

  // Passengers
  passengers: PassengerForm[];
  setPassenger: (index: number, data: Partial<PassengerForm>) => void;
  addPassenger: () => void;
  removePassenger: (index: number) => void;

  // Reset
  resetBooking: () => void;
}

const defaultPassenger: PassengerForm = {
  full_name: '',
  passport_no: '',
  nationality: '',
  dob: '',
};

export const useFlightStore = create<FlightState>()(
  persist(
    (set) => ({
      // Search
      searchQuery: {
        origin: '',
        destination: '',
        date: '',
        passengers: 1,
        class: 'economy' as SeatClass,
      },
      setSearchQuery: (query) =>
        set((state) => ({
          searchQuery: { ...state.searchQuery, ...query },
        })),

      // Selected flight & seat
      selectedFlight: null,
      selectedSeat: null,
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),
      selectSeat: (seat) => set({ selectedSeat: seat }),
      clearSeat: () => set({ selectedSeat: null }),

      // Booking flow
      bookingStep: 1,
      setBookingStep: (step) => set({ bookingStep: step }),

      // Passengers
      passengers: [{ ...defaultPassenger }],
      setPassenger: (index, data) =>
        set((state) => {
          const updated = [...state.passengers];
          updated[index] = { ...updated[index], ...data };
          return { passengers: updated };
        }),
      addPassenger: () =>
        set((state) => ({
          passengers: [...state.passengers, { ...defaultPassenger }],
        })),
      removePassenger: (index) =>
        set((state) => ({
          passengers: state.passengers.filter((_, i) => i !== index),
        })),

      // Reset
      resetBooking: () =>
        set({
          selectedFlight: null,
          selectedSeat: null,
          bookingStep: 1,
          passengers: [{ ...defaultPassenger }],
        }),
    }),
    {
      name: 'flight-storage',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        bookingStep: state.bookingStep,
        // Exclude passengers with passport data from localStorage
        passengers: state.passengers.map((p) => ({
          full_name: p.full_name,
          nationality: p.nationality,
          dob: p.dob,
          passport_no: '', // excluded for security
        })),
      }),
    }
  )
);
