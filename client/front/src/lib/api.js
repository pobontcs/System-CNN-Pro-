import axios from "axios";

// ------ env & base client ------
export const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "false") === "true";

export const http = axios.create({
  baseURL: API,
  timeout: 20000,
});

// (optional) attach auth token if you add real login later
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("cropcare_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ------ basic health ------
export async function ping() {
  const { data } = await http.get("/ping");
  return data;
}

// ------ inference ------
export async function inferImage(file, meta) {
  const form = new FormData();
  form.append("image", file);
  if (meta?.lat != null) form.append("lat", String(meta.lat));
  if (meta?.lon != null) form.append("lon", String(meta.lon));
  if (meta?.crop) form.append("crop", meta.crop);
  if (meta?.variety) form.append("variety", meta.variety);
  if (meta?.notes) form.append("notes", meta.notes);

  const { data } = await http.post("/api/infer", form);
  return data;
}

// ------ user profile ------
export async function getMe() {
  const { data } = await http.get("/api/me");
  return data;
}

export async function updateMeProfile(payload) {
  const form = new FormData();
  if (payload.name) form.append("name", payload.name);
  if (payload.avatarFile) form.append("avatar", payload.avatarFile);
  const { data } = await http.patch("/api/me", form);
  return data;
}

// ------ tips & detections (for Dashboard) ------
export async function getTips() {
  const { data } = await http.get("/api/tips");
  return data;
}

export async function listDetections(params) {
  const { data } = await http.get("/api/detections", { params });
  return data;
}

// ------ regional alerts / weather / air ------
export async function getRegionalAlerts() {
  const { data } = await http.get("/api/alerts");
  return data;
}

export async function getWeather(lat, lon) {
  const { data } = await http.get("/api/weather", { params: { lat, lon } });
  return data;
}

export async function getAirQuality(lat, lon) {
  const { data } = await http.get("/api/air", { params: { lat, lon } });
  return data;
}
