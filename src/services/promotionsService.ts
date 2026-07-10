import { api } from "./api";

export interface Promotion {
  id: number;
  title: string;
  description: string;
  discount_percent: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
}

export interface ClientGift {
  id: number;
  client: number;
  client_username?: string;
  title: string;
  description: string;
  valid_until: string;
  used_at: string | null;
  created_at: string;
}

export type PromotionPayload = Omit<Promotion, "id">;
export type GiftPayload = Pick<ClientGift, "client" | "title" | "description" | "valid_until">;

export const getActivePromotions = () => api<Promotion[]>("/promotions/active/");

export const getAdminPromotions = () => api<Promotion[]>("/promotions/admin/promotions/");

export const createPromotion = (payload: PromotionPayload) =>
  api<Promotion>("/promotions/admin/promotions/", {
    method: "POST",
    body: payload,
  });

export const getAdminGifts = () => api<ClientGift[]>("/promotions/admin/gifts/");

export const createGift = (payload: GiftPayload) =>
  api<ClientGift>("/promotions/admin/gifts/", {
    method: "POST",
    body: payload,
  });
