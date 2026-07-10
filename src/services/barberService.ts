import { api } from "./api";
import type { Booking } from "./schedulingService";

export interface BarberCustomer {
  id: number;
  username: string;
  phone: string;
  email: string;
  completed_bookings_year: number;
  total_bookings: number;
  loyalty: {
    months_active: number;
    completed_bookings_year: number;
    tier: {
      id: number;
      name: string;
      discount_percent: string;
    } | null;
  };
}

export const getBarberBookings = (date: string) =>
  api<Booking[]>(`/scheduling/barber/bookings/?date=${date}`);

export const getBarberCustomers = () => api<BarberCustomer[]>("/scheduling/barber/customers/");

export const completeBarberBooking = (id: number) =>
  api<Booking>(`/scheduling/barber/bookings/${id}/complete/`, { method: "POST" });

export const cancelBarberBooking = (id: number, reason = "") =>
  api<Booking>(`/scheduling/barber/bookings/${id}/cancel/`, {
    method: "POST",
    body: { reason },
  });

export const rescheduleBarberBooking = (id: number, new_start: string) =>
  api<Booking>(`/scheduling/barber/bookings/${id}/reschedule/`, {
    method: "POST",
    body: { new_start },
  });
