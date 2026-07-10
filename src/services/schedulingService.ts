import { api } from "./api";

export interface SlotsResponse {
  date: string;
  duration_min: number;
  slots: string[];
}

export interface Booking {
  id: number;
  start: string;
  end: string;
  status: string;
  total_price: string;
  client?: number;
  client_username?: string;
  client_phone?: string;
  cancel_reason?: string;
  can_client_change?: boolean;
}

export const getSlots = (date: string, serviceIds: number[]) =>
  api<SlotsResponse>(`/scheduling/slots/?date=${date}&services=${serviceIds.join(",")}`);

export const createBooking = (service_ids: number[], start: string) =>
  api<Booking>("/scheduling/bookings/create/", {
    method: "POST",
    body: { service_ids, start },
  });

export const getMyBookings = () => api<Booking[]>("/scheduling/bookings/");

export const cancelMyBooking = (id: number, reason = "") =>
  api<Booking>(`/scheduling/bookings/${id}/cancel/`, {
    method: "POST",
    body: { reason },
  });
