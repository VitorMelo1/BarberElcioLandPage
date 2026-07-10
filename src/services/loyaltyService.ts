import { api } from "./api";

export interface LoyaltyTier {
  id: number;
  name: string;
  min_months: number;
  min_completed_bookings_year: number;
  discount_percent: string;
  order: number;
  active: boolean;
}

export interface LoyaltySummary {
  months_active: number;
  completed_bookings_year: number;
  tier: LoyaltyTier | null;
}

export type LoyaltyTierPayload = Omit<LoyaltyTier, "id">;

export const getMyLoyalty = () => api<LoyaltySummary>("/loyalty/me/");

export const getLoyaltyTiers = () => api<LoyaltyTier[]>("/loyalty/tiers/");

export const createLoyaltyTier = (payload: LoyaltyTierPayload) =>
  api<LoyaltyTier>("/loyalty/tiers/", {
    method: "POST",
    body: payload,
  });

export const updateLoyaltyTier = (id: number, payload: Partial<LoyaltyTierPayload>) =>
  api<LoyaltyTier>(`/loyalty/tiers/${id}/`, {
    method: "PATCH",
    body: payload,
  });
