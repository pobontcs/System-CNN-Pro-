import axios from "axios";
import { getToken } from "./auth";

export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const http = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

// attach token (if you later switch to DRF Token/JWT)
http.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/** Health ping */
export async function ping() {
  const { data } = await http.get("/ping");
  return data;
}

/** Upload image & options -> model inference */
export async function infer(formData) {
  // formData must include: { image: File, crop?: string/json, crop_type?: string, crop_stage?: string }
  const { data } = await http.post("/infer", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // { id, label, confidence, severity, heatmap_url?, tips?:[], captured_at, ... }
}

/** Tips (general AI tips) */
export async function getTips() {
  const { data } = await http.get("/tips");
  return data; // { tips: [...] }
}

/** Weather & Air Quality by coords */
export async function getWeather(lat, lon) {
  const { data } = await http.get("/weather", { params: { lat, lon } });
  return data; // { temp_c, humidity, wind_ms, uv_index, rain_mm? }
}

export async function getAirQuality(lat, lon) {
  const { data } = await http.get("/air", { params: { lat, lon } });
  return data; // { aqi, category, pm25?, pm10?, o3? }
}

/** Regional alerts overlays */
export async function getRegionalAlerts() {
  const { data } = await http.get("/alerts");
  // Normalize to array if backend returns an object or {results:[]}
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  return []; // fallback
}


/** Detection history */
export async function listDetections({ limit = 100, offset = 0 } = {}) {
  const { data } = await http.get("/detections", { params: { limit, offset } });
  return data; // [ detections... ]
}

/** Me (profile) – keep simple; adjust when backend has auth endpoints */
export async function getMe() {
  // If you don’t have /me yet, stub this call on server or return a default object here.
  // For now, return a minimal object so the UI renders.
  try {
    const { data } = await http.get("/me");
    return data;
  } catch {
    return { name: "Farmer", avatar_url: "" };
  }
}

export async function updateMeProfile({ name, avatarFile }) {
  const fd = new FormData();
  if (name) fd.append("name", name);
  if (avatarFile) fd.append("avatar", avatarFile);
  const { data } = await http.post("/me", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return data;
}
