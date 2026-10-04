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

export const createBarberBooking = (client_id: number, service_ids: number[], start: string, notes = "") =>
  api<Booking>("/scheduling/barber/bookings/create/", { method: "POST", body: { client_id, service_ids, start, notes } });

export const acceptBarberProposal = (id: number, version: number, start: string, consent_note: string) =>
  api<Booking>(`/scheduling/barber/proposals/${id}/accept/`, { method: "POST", body: { version, start, consent_note } });

export const completeBarberBooking = (id: number) =>
  api<Booking>(`/scheduling/barber/bookings/${id}/complete/`, { method: "POST" });

export const cancelBarberBooking = (id: number, reason = "") =>
  api<Booking>(`/scheduling/barber/bookings/${id}/cancel/`, {
    method: "POST",
    body: { reason },
  });

export const getBarberRescheduleSlots = (id: number, date: string, duration_min?: number) =>
  api<{ date: string; slots: string[] }>(
    `/scheduling/bookings/${id}/reschedule-slots/?date=${date}${duration_min === undefined ? "" : `&duration_min=${duration_min}`}`,
  );

export const rescheduleBarberBooking = (id: number, new_start: string, reason?: string, duration_min?: number) =>
  api<Booking>(`/scheduling/barber/bookings/${id}/reschedule/`, {
    method: "POST",
    body: { new_start, ...(reason === undefined ? {} : { reason }), ...(duration_min === undefined ? {} : { duration_min }) },
  });

/** Publica uma proposta; a avaliação conserva horário e observações. */
export const quoteBarberBooking = (id: number, price: string, notes = "", duration_min?: number, expires_at?: string) =>
  api<Booking>(`/scheduling/barber/bookings/${id}/quote/`, {
    method: "POST",
    body: { price, notes, ...(duration_min === undefined ? {} : { duration_min }), ...(expires_at ? { expires_at } : {}) },
  });

export const confirmBarberBooking = (id: number) =>
  api<Booking>(`/scheduling/barber/bookings/${id}/confirm/`, { method: 'POST' });
export const markBarberNoShow = (id: number) =>
  api<Booking>(`/scheduling/barber/bookings/${id}/noshow/`, { method: 'POST' });
export const confirmBarberDeposit = (id: number, amount: string, note: string) =>
  api<{deposit_paid:boolean;status:string;payment_status:string;amount:string}>(`/finance/bookings/${id}/confirm-deposit/`, { method:'POST', body:{amount,note} });

export const updateBarberExpense = (id: number, payload: {name:string;amount:string;incurred_on:string}) =>
  api<import('./financeService').Expense>(`/finance/expenses/${id}/`, {method:'PATCH',body:payload});

export const updateBarberPromotion = (id:number,payload:Partial<import('./promotionsService').Promotion>) =>
  api<import('./promotionsService').Promotion>(`/promotions/admin/promotions/${id}/`,{method:'PATCH',body:payload});
export const updateBarberGift = (id:number,payload:Partial<import('./promotionsService').ClientGift>) =>
  api<import('./promotionsService').ClientGift>(`/promotions/admin/gifts/${id}/`,{method:'PATCH',body:payload});
