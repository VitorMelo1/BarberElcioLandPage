import { api } from "./api";

export interface ApiService {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: string;
  duration_min: number;
}

export const getServices = () => api<ApiService[]>("/catalog/services/");
