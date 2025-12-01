import axios from "axios";
import { getToken } from "./auth";

// --- Configuration ---

// 1. Django Server (Auth, History) - Port 8000
// Ensure this matches your Django urls.py
export const DJANGO_BASE = "http://127.0.0.1:8000/api";

// 2. FastAPI Server (AI, Weather) - Port 2526
// FIX: I added '/api' back to the end of this URL
export const ML_BASE = "http://127.0.0.1:2526/api"; 

// --- Axios Instances ---
const djangoHttp = axios.create({ baseURL: DJANGO_BASE, timeout: 10000 });
const mlHttp = axios.create({ baseURL: ML_BASE, timeout: 20000 });

// Attach Token to Django Requests (for saving history to specific user)
djangoHttp.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// --- ML SERVER CALLS (FastAPI :2526) ---

export async function infer(formData) {
  // This will now call: http://127.0.0.1:2526/api/predict
  const { data } = await mlHttp.post("/predict", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  
  // Return the standardized format your App expects
  return {
    class_id: data.class_id,
    confidence: data.confidence,
    captured_at: data.captured_at || new Date().toISOString(), // Fallback if missing
    crop_type: data.crop_type,
    crop_stage: data.crop_stage,
    lat: data.lat,
    lon: data.lon
  };
}

export async function getWeather(lat, lon) {
  const { data } = await mlHttp.get("/weather", { params: { lat, lon } });
  return data;
}

export async function getAirQuality(lat, lon) {
  const { data } = await mlHttp.get("/air", { params: { lat, lon } });
  return data;
}

export async function getTips() {
    const { data } = await mlHttp.get("/tips");
    return data;
}

// --- DJANGO SERVER CALLS (Port 8000) ---

export async function saveHistory(historyData) {
  // This calls: http://127.0.0.1:8000/api/save_history/
  const { data } = await djangoHttp.post("/save_history/", historyData);
  return data;
}

// CRITICAL FIX: Restored this function because Dashboard.jsx imports it.
// Without this, the app will crash with "Uncaught SyntaxError".
export async function listDetections({ limit = 100, offset = 0 } = {}) {
  const { data } = await djangoHttp.get("/history_list/", { params: { limit, offset } });
  return data; 
}

export async function getMe() {
  try {
      const { data } = await djangoHttp.get("/me/");
      return data;
  } catch (err) {
      console.warn("Failed to fetch user profile", err);
      return null;
  }
}

// CRITICAL FIX: Restored updateMeProfile because Dashboard.jsx imports it.
export async function updateMeProfile({ name, avatarFile }) {
  const fd = new FormData();
  if (name) fd.append("name", name);
  if (avatarFile) fd.append("avatar", avatarFile);
  
  // We send this to Django since it handles User accounts
  const { data } = await djangoHttp.post("/me/update/", fd, { 
    headers: { "Content-Type": "multipart/form-data" } 
  });
  return data;
}