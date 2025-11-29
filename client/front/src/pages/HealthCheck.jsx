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
  const { data: weather } = useQuery({
    queryKey: ["weather", loc?.lat, loc?.lon],
    enabled: Boolean(loc),
    queryFn: () => getWeather(loc.lat, loc.lon),
  });

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
      fd.append("image", image);           // Backend receives file as "image" field.
      fd.append("crop_type", cropType);    // Basic metadata (crop type, stage).
      fd.append("crop_stage", cropStage);

      // Optional location for Geo-based risk analysis.
      if (loc) {
        fd.append("lat", String(loc.lat));
        fd.append("lon", String(loc.lon));
        if (typeof loc.acc === "number")
          fd.append("acc", String(Math.round(loc.acc)));
      }
      return await infer(fd);              // POST /api/infer to Django.
    },
  });

  // ---- Derived values for visualization in the Result panel ----
  // These are recalculated whenever a new prediction comes in.
  const confidencePct =
    inferMut.data && typeof inferMut.data.confidence === "number"
      ? Math.round((inferMut.data.confidence || 0) * 100)
      : 0;

  // severity is a string like "low" | "medium" | "high" from backend.
  const severityLevel = inferMut.data?.severity || "low";

  // severityScore: used only for the coloured bar (0–100).
  const severityScore =
    severityLevel === "high" ? 90 : severityLevel === "medium" ? 60 : 30;

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

          {/* ========================= Right: AI Result panel ========================= */}
          <div className="rounded-2xl border bg-[#F1EDE8] p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Result</div>
              {/* Small badge to show this whole panel is AI-powered and experimental */}
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#D35400] border border-[#F97316]/40">
                AI Beta
              </span>
            </div>

            {/* Initial instructions when nothing has been analyzed yet */}
            {!inferMut.data && !inferMut.isPending && (
              <div className="text-sm text-gray-600">
                Upload a leaf image and click <b>Analyze</b> to see AI result,
                explanation, and prevention methods.
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

            {/* Content when we have an AI response */}
            {inferMut.data && (
              <>
                {/* ---------------------------------------------------------------- */}
                {/* 1) RESULT SECTION: prediction + severity + compact meters        */}
                {/* ---------------------------------------------------------------- */}
                <section className="rounded-lg bg-white/80 border p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-gray-600 uppercase tracking-wide">
                        Result (AI prediction)
                      </div>
                      <div className="mt-1 text-base font-bold">
                        {inferMut.data.label} ({confidencePct}%)
                      </div>
                      <p className="mt-1 text-[11px] text-gray-600">
                        Prediction generated by the leaf disease AI model. This
                        feature is still under development.
                      </p>
                    </div>

                    {/* Severity pill */}
                    <div className="text-right">
                      <div className="text-[11px] font-medium text-gray-600">
                        Severity
                      </div>
                      <span
                        className={`mt-1 inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          severityLevel === "high"
                            ? "bg-red-100 text-red-700"
                            : severityLevel === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {severityLevel}
                      </span>
                    </div>
                  </div>

                  {/* Visual meters for confidence + severity */}
                  <div className="mt-3 space-y-2">
                    {/* Confidence bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                        <span>Model confidence</span>
                        <span>{confidencePct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                          style={{ width: `${confidencePct}%` }}
                        />
                      </div>
                    </div>

                    {/* Severity bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                        <span>Infection severity (visual)</span>
                        <span>{severityScore}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            severityLevel === "high"
                              ? "bg-red-500"
                              : severityLevel === "medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          } transition-[width] duration-500`}
                          style={{ width: `${severityScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* ---------------------------------------------------------------- */}
                {/* 2) EXPLANATION SECTION: why AI thinks healthy / diseased        */}
                {/* ---------------------------------------------------------------- */}
                <section className="mt-3 rounded-lg bg-white/80 border p-3 text-sm">
                  <div className="font-semibold text-sm">
                    Explanation — Why AI detected it as healthy or diseased
                  </div>
                  <p className="mt-1 text-[11px] text-gray-600">
                    This combines the model&apos;s focus areas with an
                    experimental generative AI explanation. Always confirm with
                    a local expert.
                  </p>

                  <div className="mt-2 space-y-2">
                    {/* Grad-CAM heatmap: visual explanation */}
                    {inferMut.data.heatmap_url && (
                      <div>
                        <div className="text-[11px] font-medium text-gray-700 mb-1">
                          Focus areas on the leaf (Grad-CAM)
                        </div>
                        <img
                          src={inferMut.data.heatmap_url}
                          alt="Heatmap"
                          className="w-full rounded-md border"
                        />
                        <p className="mt-1 text-[11px] text-gray-600">
                          Bright / red zones show where the model looked to
                          decide if the leaf is healthy or diseased.
                        </p>
                      </div>
                    )}

                    {/* Generative AI explanation: summary + reasons */}
                    {(inferMut.data.gen_ai_summary ||
                      inferMut.data.gen_ai_why ||
                      (Array.isArray(inferMut.data.gen_ai_reasons) &&
                        inferMut.data.gen_ai_reasons.length > 0)) && (
                      <div className="mt-1 rounded-md bg-[#F8FAFC] border border-gray-200 p-2">
                        {inferMut.data.gen_ai_summary && (
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {inferMut.data.gen_ai_summary}
                          </p>
                        )}

                        {inferMut.data.gen_ai_why && (
                          <div className="mt-2">
                            <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
                              Why the AI flagged it this way
                            </div>
                            <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                              {inferMut.data.gen_ai_why}
                            </p>
                          </div>
                        )}

                        {Array.isArray(inferMut.data.gen_ai_reasons) &&
                          inferMut.data.gen_ai_reasons.length > 0 && (
                            <div className="mt-2">
                              <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                                Key visual indicators
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {inferMut.data.gen_ai_reasons.map(
                                  (reason, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[11px] rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5"
                                    >
                                      {reason}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Placeholder text when explanation AI is not wired yet */}
                    {!inferMut.data.gen_ai_summary &&
                      !inferMut.data.gen_ai_why &&
                      !(Array.isArray(inferMut.data.gen_ai_reasons) &&
                        inferMut.data.gen_ai_reasons.length > 0) && (
                        <p className="text-[11px] text-gray-600">
                          The explanation module is still being developed. In a
                          future version, this box will describe in simple
                          language why the AI decided the leaf is healthy or
                          diseased.
                        </p>
                      )}
                  </div>
                </section>

                {/* ---------------------------------------------------------------- */}
                {/* 3) PREVENTION SECTION: prevention methods from AI / fallback    */}
                {/* ---------------------------------------------------------------- */}
                <section className="mt-3 rounded-lg bg-white/80 border p-3 text-sm">
                  <div className="font-semibold text-sm">Prevention methods</div>
                  <p className="mt-1 text-[11px] text-gray-600">
                    These are AI-suggested practices. Adapt them to your local
                    conditions and always follow expert or label guidance.
                  </p>

                  {/* Prefer backend-provided prevention_tips if available */}
                  {Array.isArray(inferMut.data.prevention_tips) &&
                  inferMut.data.prevention_tips.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {inferMut.data.prevention_tips.map((p, i) => (
                        <li
                          key={i}
                          className="text-sm rounded-md border p-2 bg-white/70"
                        >
                          {p}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    // Fallback generic prevention guidance (safe defaults)
                    <ul className="mt-2 space-y-1.5 text-sm text-gray-700 list-disc list-inside">
                      <li>Remove and safely dispose of heavily infected leaves.</li>
                      <li>
                        Avoid overhead irrigation late in the day to reduce leaf
                        wetness.
                      </li>
                      <li>Maintain enough spacing between plants for airflow.</li>
                      <li>
                        Monitor nearby plants regularly for similar symptoms.
                      </li>
                      <li>
                        Rotate crops and avoid planting the same crop in the
                        same plot every season.
                      </li>
                    </ul>
                  )}
                </section>

                {/* Global disclaimer for all 3 sections */}
                <p className="mt-2 text-[11px] text-gray-600">
                  Note: All results, explanations, and prevention tips on this
                  page are generated by an AI system that is still in
                  development. Use them as decision support, not as a final
                  diagnosis.
                </p>

                {/* ------------------- Weather-based context + AQI ------------------- */}
                {weather && (
                  <div className="mt-3 rounded-md border p-2 bg-white/70 text-xs">
                    <div className="font-semibold text-sm mb-0.5">
                      Weather-based Alert
                    </div>
                    <div>
                      Temp {weather.temp_c?.toFixed?.(1)}°C · Humidity{" "}
                      {weather.humidity}% · Wind{" "}
                      {weather.wind_ms?.toFixed?.(1)} m/s · UV{" "}
                      {weather.uv_index?.toFixed?.(1)}
                      {weather.rain_mm != null ? (
                        <> · Rain(24h): {weather.rain_mm} mm</>
                      ) : null}
                    </div>
                    {weatherNote && (
                      <div className="mt-1 text-[11px] text-gray-700">
                        {weatherNote}
                      </div>
                    )}
                  </div>
                )}

                {aqi && (
                  <div className="mt-2 text-[11px] text-gray-600">
                    Air Quality (AQI): <b>{aqi.aqi}</b> — {aqi.category}
                  </div>
                )}

                {inferMut.data.captured_at && (
                  <div className="mt-1 text-[11px] text-gray-600">
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
