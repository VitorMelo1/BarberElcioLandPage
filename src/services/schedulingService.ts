import { api } from "./api";

export interface SlotsResponse {
  reason?: string;
  availability?: "open" | "closed" | "blocked" | "full" | "past";
  date: string;
  duration_min: number;
  slots: string[];
}

export interface BookingService {
  id: number;
  slug?: string;
  name: string;
  price: string;
  price_type: "fixed" | "quote";
  duration_min: number;
}

export interface Booking {
  id: number;
  start: string;
  end: string;
  status: string;
  total_price: string;
  services?: BookingService[];
  client?: number;
  client_username?: string;
  client_phone?: string;
  notes?: string;
  cancel_reason?: string;
  can_client_change?: boolean;
  deposit_paid?: boolean;
  deposit_amount?: string;
  hold_expires_at?: string | null;
  hold_expires_in_seconds?: number | null;
  services_snapshot?: { id?: number; name: string; price: string }[];
  kind?: "consultation" | "procedure";
  duration_min?: number;
  agreed_duration_min?: number | null;
  source_consultation?: number | null;
  accepted_proposal?: number | null;
  proposals?: Proposal[];
  latest_change?: RescheduleNotice | null;
}

export interface Proposal {
  id: number;
  consultation: number;
  version: number;
  price: string;
  deposit_amount: string;
  duration_min: number;
  notes: string;
  expires_at: string;
  owner: number | null;
  status: "sent" | "accepted" | "declined" | "expired" | "superseded";
  created_at: string;
  accepted_at: string | null;
  accepted_by: number | null;
  consent_note?: string;
  procedure: number | null;
}

export interface RescheduleNotice {
  id: number;
  booking: number;
  old_start: string;
  old_end: string;
  new_start: string;
  new_end: string;
  reason: string;
  changed_by: number | null;
  changed_by_name: string;
  created_at: string;
  acknowledged_at: string | null;
}

export const getProposalSlots = (id: number, date: string, signal?: AbortSignal) =>
  api<SlotsResponse>(`/scheduling/proposals/${id}/slots/?date=${date}`, { signal });
export const acceptProposal = (id: number, version: number, start: string) =>
  api<Booking>(`/scheduling/proposals/${id}/accept/`, { method: "POST", body: { version, start } });
export const declineProposal = (id: number, version: number) =>
  api<Proposal>(`/scheduling/proposals/${id}/decline/`, { method: "POST", body: { version } });
export const getMyNotifications = (signal?: AbortSignal) =>
  api<RescheduleNotice[]>("/scheduling/notifications/", { signal });
export const acknowledgeNotification = (id: number) =>
  api<RescheduleNotice>(`/scheduling/notifications/${id}/ack/`, { method: "POST", body: {} });

export const getSlots = (date: string, serviceIds: number[], signal?: AbortSignal) =>
  api<SlotsResponse>(`/scheduling/slots/?date=${date}&services=${serviceIds.join(",")}`, { signal });

export const createBooking = (service_ids: number[], start: string, notes = "") =>
  api<Booking>("/scheduling/bookings/create/", {
    method: "POST",
    body: { service_ids, start, notes },
  });

export const getMyBookings = (signal?: AbortSignal) => api<Booking[]>("/scheduling/bookings/", { signal });

export const cancelMyBooking = (id: number, reason = "") =>
  api<Booking>(`/scheduling/bookings/${id}/cancel/`, {
    method: "POST",
    body: { reason },
  });

export const getMyRescheduleSlots = (id: number, date: string, signal?: AbortSignal) =>
  api<{ date: string; slots: string[] }>(
    `/scheduling/bookings/${id}/reschedule-slots/?date=${date}`,
    { signal },
  );

export const rescheduleMyBooking = (id: number, new_start: string) =>
  api<Booking>(`/scheduling/bookings/${id}/reschedule/`, {
    method: "POST",
    body: { new_start },
  });

/* ── Disponibilidade do barbeiro (horário semanal + bloqueios + calendário) ── */

export interface WorkingHour {
  weekday: number; // 0 = Segunda … 6 = Domingo
  weekday_label: string;
  is_open: boolean;
  opens_at: string; // "09:00:00"
  closes_at: string;
}

export interface Blackout {
  id: number;
  start: string;
  end: string;
  reason: string;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  weekday: number;
  is_open: boolean;
  blocked: boolean;
  bookings: number;
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

export const getWorkingHours = () =>
  api<WorkingHour[]>("/scheduling/barber/working-hours/");

export const saveWorkingHours = (days: Omit<WorkingHour, "weekday_label">[]) =>
  api<WorkingHour[]>("/scheduling/barber/working-hours/", { method: "PUT", body: days });

export const getBarberCalendar = (year: number, month: number) =>
  api<CalendarMonth>(`/scheduling/barber/calendar/?year=${year}&month=${month}`);

export const getBlackouts = (from: string, to: string) =>
  api<Blackout[]>(`/scheduling/barber/blackouts/?from=${from}&to=${to}`);

export const createBlackout = (start: string, end: string, reason = "") =>
  api<Blackout>("/scheduling/barber/blackouts/", { method: "POST", body: { start, end, reason } });

export const deleteBlackout = (id: number) =>
  api<null>(`/scheduling/barber/blackouts/${id}/`, { method: "DELETE" });
