import { api } from "./api";

export interface ApiService {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: string;
  duration_min: number;
  tool: string;
  active: boolean;
  order: number;
}

export interface ApiPlan {
  id: number;
  slug: string;
  name: string;
  items: string;
  price_from: string;
  price: string;
  active: boolean;
  order: number;
}

export interface ApiDiscountTier {
  id: number;
  range_label: string;
  discount_label: string;
  active: boolean;
  order: number;
}

export interface ApiPortfolioImage {
  id: number;
  image: string;
  image_url: string;
  alt: string;
  look: string;
  mandala: boolean;
  active: boolean;
  order: number;
}

export type ServicePayload = Omit<ApiService, "id">;
export type PlanPayload = Omit<ApiPlan, "id">;
export type DiscountTierPayload = Omit<ApiDiscountTier, "id">;

export const getServices = () => api<ApiService[]>("/catalog/services/");
export const getPlans = () => api<ApiPlan[]>("/catalog/plans/");
export const getDiscountTiers = () => api<ApiDiscountTier[]>("/catalog/discount-tiers/");
export const getPortfolioImages = () => api<ApiPortfolioImage[]>("/catalog/portfolio/");

export const getAdminServices = () => api<ApiService[]>("/catalog/admin/services/");
export const createService = (payload: ServicePayload) =>
  api<ApiService>("/catalog/admin/services/", { method: "POST", body: payload });
export const updateService = (id: number, payload: Partial<ServicePayload>) =>
  api<ApiService>(`/catalog/admin/services/${id}/`, { method: "PATCH", body: payload });
export const deleteService = (id: number) =>
  api<null>(`/catalog/admin/services/${id}/`, { method: "DELETE" });

export const getAdminPlans = () => api<ApiPlan[]>("/catalog/admin/plans/");
export const createPlan = (payload: PlanPayload) =>
  api<ApiPlan>("/catalog/admin/plans/", { method: "POST", body: payload });
export const updatePlan = (id: number, payload: Partial<PlanPayload>) =>
  api<ApiPlan>(`/catalog/admin/plans/${id}/`, { method: "PATCH", body: payload });
export const deletePlan = (id: number) =>
  api<null>(`/catalog/admin/plans/${id}/`, { method: "DELETE" });

export const getAdminDiscountTiers = () => api<ApiDiscountTier[]>("/catalog/admin/discount-tiers/");
export const createDiscountTier = (payload: DiscountTierPayload) =>
  api<ApiDiscountTier>("/catalog/admin/discount-tiers/", { method: "POST", body: payload });
export const updateDiscountTier = (id: number, payload: Partial<DiscountTierPayload>) =>
  api<ApiDiscountTier>(`/catalog/admin/discount-tiers/${id}/`, { method: "PATCH", body: payload });
export const deleteDiscountTier = (id: number) =>
  api<null>(`/catalog/admin/discount-tiers/${id}/`, { method: "DELETE" });

export const getAdminPortfolioImages = () => api<ApiPortfolioImage[]>("/catalog/admin/portfolio/");
export const createPortfolioImage = (payload: FormData) =>
  api<ApiPortfolioImage>("/catalog/admin/portfolio/", { method: "POST", body: payload });
export const updatePortfolioImage = (id: number, payload: Partial<Omit<ApiPortfolioImage, "id" | "image" | "image_url">>) =>
  api<ApiPortfolioImage>(`/catalog/admin/portfolio/${id}/`, { method: "PATCH", body: payload });
export const deletePortfolioImage = (id: number) =>
  api<null>(`/catalog/admin/portfolio/${id}/`, { method: "DELETE" });
