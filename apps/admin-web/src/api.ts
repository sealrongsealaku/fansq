import axios from "axios";

const tokenKey = "fansq_admin_token";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function saveAdminToken(token: string) {
  localStorage.setItem(tokenKey, token);
}

export function clearAdminToken() {
  localStorage.removeItem(tokenKey);
}

export function getAdminToken() {
  return localStorage.getItem(tokenKey);
}
