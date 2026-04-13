import axios from "axios";

const visitorStorageKey = "fansq_visitor_id";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
});

function createVisitorId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorId() {
  let visitorId = localStorage.getItem(visitorStorageKey);
  if (!visitorId) {
    visitorId = createVisitorId();
    localStorage.setItem(visitorStorageKey, visitorId);
  }
  return visitorId;
}

apiClient.interceptors.request.use((config) => {
  config.headers["X-Visitor-Id"] = getVisitorId();
  return config;
});

export interface PublicSummaryResponse {
  project_name: string;
  subtitle: string;
  time_range: string;
  organizer: string;
  visible_count: number;
  featured_count: number;
  total_like_count: number;
}

export interface PublicReflection {
  id: number;
  display_name: string;
  reflection_title: string | null;
  submit_content: string;
  submit_time: string;
  source_group_name: string | null;
  reflection_type_name: string | null;
  teaching_project_name: string | null;
  is_featured: boolean;
  is_top: boolean;
  like_count: number;
  liked: boolean;
}

export interface ReflectionTypeOption {
  id: number;
  name: string;
  code: string;
  requires_project: boolean;
  sort_order: number;
}

export interface TeachingProjectOption {
  id: number;
  name: string;
  code: string | null;
  sort_order: number;
}
