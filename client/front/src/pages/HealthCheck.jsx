// HealthCheck page
// - Imports React hooks, layout components, data fetching utilities, and API helpers.

import { useEffect, useMemo, useRef, useState } from "react";
import Nav from "../components/Layout/Nav"; // top navigation bar
import Container from "../components/Layout/Container"; // centered content wrapper
import { useMutation, useQuery } from "@tanstack/react-query"; // data fetching + mutations
import { infer, getWeather, getAirQuality } from "../lib/api"; // backend API calls (Django)

// Static dropdown options for crop metadata selection.
const cropTypes = [
  { value: "rice", label: "Rice" },
  { value: "wheat", label: "Wheat" },
  { value: "maize", label: "Maize" },
  { value: "potato", label: "Potato" },
  { value: "tomato", label: "Tomato" },
];

const cropStages = [
  { value: "seedling", label: "Seedling" },
  { value: "vegetative", label: "Vegetative" },
  { value: "flowering", label: "Flowering" },
  { value: "fruiting", label: "Fruiting" },
  { value: "maturity", label: "Maturity" },
];

export default function HealthCheck() {
  // ---- Local UI state (frontend only) ----
  const [imageFile, setImageFile] = useState(null);        // selected leaf image file
  const [preview, setPreview] = useState("");              // preview URL for <img />
  const [cropType, setCropType] = useState("rice");        // selected crop
  const [cropStage, setCropStage] = useState("vegetative");// selected growth stage
  const [loc, setLoc] = useState(null);                    // { lat, lon, acc } from browser geolocation
  const [geoErr, setGeoErr] = useState("");                // geolocation error message

  // capture via file input
  // Called whenever user chooses an image from gallery/camera.
  function onSelectFile(e) {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      setPreview(URL.createObjectURL(f)); // preview only; actual image file is sent to backend
    }
  }

  // open camera (mobile) using capture attribute
  const fileRef = useRef(null);
  function openCamera() {
    fileRef.current?.click();
  }

  // Fetch user location from browser (used to query weather & AQI and send to backend).
  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoErr("Geolocation not supported in this browser.");
      return;
    }
    setGeoErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          acc: pos.coords.accuracy,
        });
      },
      (err) => setGeoErr(err.message || "Failed to get location."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  // ---- Weather / Air quality queries (frontend → backend → external APIs) ----
  // getWeather(lat, lon) should call your Django API which may call a weather provider.
  const { data: weather } = useQuery({
    queryKey: ["weather", loc?.lat, loc?.lon],
    enabled: Boolean(loc),
    queryFn: () => getWeather(loc.lat, loc.lon),
  });
  // getAirQuality(lat, lon) should call your Django API which may call an AQI provider.
  const { data: aqi } = useQuery({
    queryKey: ["aqi", loc?.lat, loc?.lon],
    enabled: Boolean(loc),
    queryFn: () => getAirQuality(loc.lat, loc.lon),
  });

  // Derive a simple weather-based risk note, based on humidity, rain, UV.
  const weatherNote = useMemo(() => {
    if (!weather) return "";
    const notes = [];
    if (weather.humidity >= 80)
      notes.push("High humidity — watch for fungal diseases.");
    if (weather.rain_mm && weather.rain_mm > 5)
      notes.push("Recent rain — risk of leaf wetness related infections.");
    if (weather.uv_index >= 9)
      notes.push("Strong UV — stress possible at midday.");
    return notes.join(" ");
  }, [weather]);

  // ---- Inference mutation (upload image + metadata → Django /api/infer) ----
  const inferMut = useMutation({
    mutationFn: async ({ image, cropType, cropStage, loc }) => {
      const fd = new FormData();
      // Backend receives file as "image" field.
      fd.append("image", image);
      // Basic metadata (crop type, stage).
      fd.append("crop_type", cropType);
      fd.append("crop_stage", cropStage);
      // Optional location for Geo-based risk analysis.
      if (loc) {
        fd.append("lat", String(loc.lat));
        fd.append("lon", String(loc.lon));
        if (typeof loc.acc === "number")
          fd.append("acc", String(Math.round(loc.acc)));
      }
      // infer(fd) → defined in /src/lib/api.ts, sends POST /api/infer to Django.
      return await infer(fd);
    },
  });

  // Handle form submission (user clicks Analyze).
  function onSubmit(e) {
    e.preventDefault();
    if (!imageFile) return;
    inferMut.mutate({ image: imageFile, cropType, cropStage, loc });
  }

  return (
    <>
      {/* Top navigation bar shared across pages */}
      <Nav />
      {/* Container keeps content centered / adds horizontal padding */}
      <Container>
        <h1 className="text-2xl font-bold mb-3">Health Check</h1>

        {/* Main layout: left = inputs, right = results */}
        <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Left: input */}
          <div className="lg:col-span-2 rounded-2xl border bg-[#F1EDE8] p-4">
            {/* Crop selection + location */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Crop</label>
                <select
                  className="w-full rounded-md border p-2 bg-white/80"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                >
                  {cropTypes.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Growth Stage
                </label>
                <select
                  className="w-full rounded-md border p-2 bg-white/80"
                  value={cropStage}
                  onChange={(e) => setCropStage(e.target.value)}
                >
                  {cropStages.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 bg-white/80"
                  onClick={useMyLocation}
                >
                  Use my location
                </button>
                {loc && (
                  <span className="text-xs text-gray-600">
                    ±{Math.round(loc.acc || 0)} m
                  </span>
                )}
              </div>
            </div>

            {geoErr && (
              <div className="text-xs text-rose-600 mt-2">{geoErr}</div>
            )}

            {/* Image capture / upload + preview */}
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border bg-white/70 p-3">
                <div className="font-semibold mb-1">Capture / Upload Leaf</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onSelectFile}
                  className="block w-full text-sm"
                />
                <button
                  type="button"
                  onClick={openCamera}
                  className="mt-2 rounded-md border px-3 py-1.5 bg-white/80"
                >
                  Open camera
                </button>
                <div className="text-xs text-gray-600 mt-2">
                  Tip: Fill the frame with the leaf, avoid harsh shadows.
                </div>
              </div>

              <div className="rounded-lg border bg-white/70 p-3">
                <div className="font-semibold mb-1">Preview</div>
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-56 object-contain rounded-md border"
                  />
                ) : (
                  <div className="h-56 flex items-center justify-center text-sm text-gray-600 border rounded-md">
                    No image selected
                  </div>
                )}
              </div>
            </div>

            {/* Analyze button */}
            <div className="mt-4">
              <button
                type="submit"
                disabled={!imageFile || inferMut.isPending}
                className="rounded-lg bg-[#4CAF50] hover:bg-[#43A047] text-white px-6 py-2 disabled:opacity-60"
              >
                {inferMut.isPending ? "Analyzing…" : "Analyze"}
              </button>
            </div>
          </div>

          {/* Right: results & context */}
          <div className="rounded-2xl border bg-[#F1EDE8] p-4">
            <div className="font-semibold mb-2">Result</div>

            {/* Initial instructions when nothing has been analyzed yet */}
            {!inferMut.data && !inferMut.isPending && (
              <div className="text-sm text-gray-600">
                Upload a leaf image and click Analyze.
              </div>
            )}

            {/* Loading state while backend model is running */}
            {inferMut.isPending && (
              <div className="text-sm text-gray-700">Running the model…</div>
            )}

            {/* Error from inference call */}
            {inferMut.error && (
              <div className="text-sm text-rose-600">
                Error: {String(inferMut.error)}
              </div>
            )}

            {/* Successful response from backend (AI model + generative AI + weather + air) */}
            {inferMut.data && (
              <>
                {/* Core model output: disease classification + severity */}
                <div className="rounded-md bg-white/70 border p-3">
                  <div className="text-sm text-gray-600">Disease</div>
                  <div className="text-lg font-bold">
                    {inferMut.data.label} (
                    {Math.round(
                      (inferMut.data.confidence || 0) * 100
                    )}
                    %)
                  </div>
                  <div className="mt-1 text-sm">
                    Severity:{" "}
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        inferMut.data.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : inferMut.data.severity === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {inferMut.data.severity || "low"}
                    </span>
                  </div>
                </div>

                {/* Grad-CAM / heatmap view: explainable AI */}
                {inferMut.data.heatmap_url && (
                  <div className="mt-3">
                    <div className="font-semibold">Explainable AI</div>
                    <div className="text-sm text-gray-600">
                      Highlighted regions the model focused on.
                    </div>
                    <img
                      src={inferMut.data.heatmap_url}
                      alt="Heatmap"
                      className="mt-1 w-full rounded-md border"
                    />
                  </div>
                )}

                {/* Rule-based / classical tips from backend (non-generative) */}
                <div className="mt-3">
                  <div className="font-semibold">Treatment & Prevention</div>
                  {Array.isArray(inferMut.data.tips) &&
                  inferMut.data.tips.length > 0 ? (
                    <ul className="mt-1 space-y-2">
                      {inferMut.data.tips.map((t, i) => (
                        <li
                          key={i}
                          className="text-sm rounded-md bg:white/70 border p-2 bg-white/70"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-600">
                      No tips available.
                    </div>
                  )}
                </div>

                {/* 🔹 NEW: Generative AI output – explanation focused */}
                {/* Expecting backend to send optional fields:
                    - gen_ai_summary: string (overall explanation)
                    - gen_ai_why: string (why this looks infected)
                    - gen_ai_reasons: string[] (bullet reasons)
                   You can rename these to match your real API. */}
                {(inferMut.data.gen_ai_summary ||
                  inferMut.data.gen_ai_why ||
                  (Array.isArray(inferMut.data.gen_ai_reasons) &&
                    inferMut.data.gen_ai_reasons.length > 0)) && (
                  <div className="mt-4 rounded-md border bg-white/80 p-3">
                    <div className="font-semibold">
                      AI-Generated Insights (Why this leaf is infected)
                    </div>

                    {/* Overall narrative summary from generative AI */}
                    {inferMut.data.gen_ai_summary && (
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                        {inferMut.data.gen_ai_summary}
                      </p>
                    )}

                    {/* Short “why” explanation */}
                    {inferMut.data.gen_ai_why && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Why the model flagged it as infected
                        </div>
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                          {inferMut.data.gen_ai_why}
                        </p>
                      </div>
                    )}

                    {/* Optional bullet list of concrete reasons */}
                    {Array.isArray(inferMut.data.gen_ai_reasons) &&
                      inferMut.data.gen_ai_reasons.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Key visual indicators
                          </div>
                          <ul className="mt-1 list-disc list-inside text-sm text-gray-700 space-y-1">
                            {inferMut.data.gen_ai_reasons.map(
                              (reason, idx) => (
                                <li key={idx}>{reason}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}

                {/* Weather-based risk panel */}
                {weather && (
                  <div className="mt-3 rounded-md border p-2 bg-white/70">
                    <div className="font-semibold">Weather-based Alert</div>
                    <div className="text-sm">
                      Temp {weather.temp_c?.toFixed?.(1)}°C · Humidity{" "}
                      {weather.humidity}% · Wind{" "}
                      {weather.wind_ms?.toFixed?.(1)} m/s · UV{" "}
                      {weather.uv_index?.toFixed?.(1)}
                      {weather.rain_mm != null ? (
                        <> · Rain(24h): {weather.rain_mm} mm</>
                      ) : null}
                    </div>
                    {weatherNote && (
                      <div className="text-xs text-gray-700 mt-1">
                        {weatherNote}
                      </div>
                    )}
                  </div>
                )}

                {/* Air quality summary */}
                {aqi && (
                  <div className="mt-2 text-xs text-gray-600">
                    Air Quality (AQI): <b>{aqi.aqi}</b> — {aqi.category}
                  </div>
                )}

                {/* Timestamp from backend (capture / inference time) */}
                {inferMut.data.captured_at && (
                  <div className="mt-2 text-xs text-gray-600">
                    Captured at:{" "}
                    {new Date(
                      inferMut.data.captured_at
                    ).toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>
        </form>
      </Container>
    </>
  );
}
