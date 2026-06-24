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
}

export const getSlots = (date: string, serviceIds: number[]) =>
  api<SlotsResponse>(`/scheduling/slots/?date=${date}&services=${serviceIds.join(",")}`);

export const createBooking = (service_ids: number[], start: string) =>
  api<Booking>("/scheduling/bookings/create/", {
    method: "POST",
    auth: true,
    body: { service_ids, start },
  });

export const getMyBookings = () => api<Booking[]>("/scheduling/bookings/", { auth: true });
