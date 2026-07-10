import { api } from "./api";

export interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  email: string;
}

export const getGoogleStatus = () => api<GoogleStatus>("/integrations/google/status/");

export const getGoogleConnectUrl = () => api<{ auth_url: string }>("/integrations/google/connect/");

export const disconnectGoogle = () =>
  api<null>("/integrations/google/disconnect/", { method: "POST" });
