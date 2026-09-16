import { api } from "./api";

export interface FinanceSeriesPoint {
  label: string;
  revenue: string;
  expenses: string;
  profit: string;
}

export interface FinanceBreakdownRow {
  name: string;
  count: number;
  total: string;
}

export interface FinanceSummary {
  year: number;
  month: number;
  revenue: string;
  expenses: string;
  profit: string;
  margin: number;
  completed_count: number;
  series: FinanceSeriesPoint[];
  breakdown: FinanceBreakdownRow[];
}

export interface Expense {
  id: number;
  name: string;
  amount: string;
  incurred_on: string;
}

export interface PaymentSettings {
  pix_key: string;
  pix_holder: string;
  pix_city: string;
  mercadopago_configured: boolean;
}

export interface BookingPix {
  configured?: boolean;
  expires_at?: string;
  requires_review?: boolean;
  auto?: boolean; // true = Mercado Pago (confirma sozinho)
  brcode: string;
  amount: string;
  holder?: string;
  deposit_paid?: boolean;
  qr_code_base64?: string; // imagem PNG do QR (só no MP)
  payment_status?: string | null;
}

export interface PaymentStatus {
  requires_review?: boolean;
  expires_at?: string;
  deposit_paid: boolean;
  status: string;
  payment_status: string | null;
}

export const getFinanceSummary = (year: number, month: number) =>
  api<FinanceSummary>(`/finance/summary/?year=${year}&month=${month}`);

export const getExpenses = (year: number, month: number) =>
  api<Expense[]>(`/finance/expenses/?year=${year}&month=${month}`);

export const createExpense = (payload: Omit<Expense, "id">) =>
  api<Expense>("/finance/expenses/", { method: "POST", body: payload });

export const deleteExpense = (id: number) =>
  api<null>(`/finance/expenses/${id}/`, { method: "DELETE" });

export const getPaymentSettings = () => api<PaymentSettings>("/finance/settings/");

export interface PaymentSettingsUpdate {
  pix_key?: string;
  pix_holder?: string;
  pix_city?: string;
  mercadopago_access_token?: string;
}

export const savePaymentSettings = (payload: PaymentSettingsUpdate) =>
  api<PaymentSettings>("/finance/settings/", { method: "PUT", body: payload });

export const getBookingPix = (bookingId: number, signal?: AbortSignal) =>
  api<BookingPix>(`/finance/bookings/${bookingId}/pix/`, { method: "POST", signal });

export const getBookingPaymentStatus = (bookingId: number, signal?: AbortSignal) =>
  api<PaymentStatus>(`/finance/bookings/${bookingId}/payment-status/`, { method: "POST", signal });
