// src/lib/api.js
import axios from "axios";

// Use Vite proxy in dev; allow .env override if you deploy
const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE,
  // withCredentials: true, // enable if you switch to cookie auth
});

// --- Health / utils ---
export const ping = () => api.get("/ping/").then(r => r.data);

// --- Public data your backend already exposes ---
export const getTips = () => api.get("/tips/").then(r => r.data);                 // { tips: [...] }
export const listDetections = (params = {}) =>
  api.get("/detections/", { params }).then(r => r.data);                          // [ { ... } ]
export const getWeather = () => api.get("/weather/").then(r => r.data);           // { temp_c, humidity, uv_index }
export const getAir = () => api.get("/air/").then(r => r.data);                   // { pm25, pm10, aqi }

// --- Inference upload ---
export const inferImage = (file) => {
  const form = new FormData();
  form.append("image", file);
  return api.post("/infer/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);
};

// If/when you add user APIs later, add them here:
// export const getMe = () => api.get("/me/").then(r => r.data);
// export const updateMeProfile = (payload) => api.post("/me/update/", payload).then(r => r.data);
