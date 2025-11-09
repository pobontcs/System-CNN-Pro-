import { useEffect, useMemo, useRef, useState } from "react";
import Nav from "../components/Layout/Nav";
import Container from "../components/Layout/Container";
import { useMutation, useQuery } from "@tanstack/react-query";
import { infer, getWeather, getAirQuality } from "../lib/api";

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
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [cropType, setCropType] = useState("rice");
  const [cropStage, setCropStage] = useState("vegetative");
  const [loc, setLoc] = useState(null); // { lat, lon, acc }
  const [geoErr, setGeoErr] = useState("");

  // capture via file input
  function onSelectFile(e) {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  // open camera (mobile) using capture attribute
  const fileRef = useRef(null);
  function openCamera() {
    fileRef.current?.click();
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoErr("Geolocation not supported in this browser.");
      return;
    }
    setGeoErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy });
      },
      (err) => setGeoErr(err.message || "Failed to get location."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  // fetch live weather/air for location (optional context)
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

  const weatherNote = useMemo(() => {
    if (!weather) return "";
    const notes = [];
    if (weather.humidity >= 80) notes.push("High humidity — watch for fungal diseases.");
    if (weather.rain_mm && weather.rain_mm > 5) notes.push("Recent rain — risk of leaf wetness related infections.");
    if (weather.uv_index >= 9) notes.push("Strong UV — stress possible at midday.");
    return notes.join(" ");
  }, [weather]);

  const inferMut = useMutation({
    mutationFn: async ({ image, cropType, cropStage, loc }) => {
      const fd = new FormData();
      fd.append("image", image);
      fd.append("crop_type", cropType);
      fd.append("crop_stage", cropStage);
      if (loc) {
        fd.append("lat", String(loc.lat));
        fd.append("lon", String(loc.lon));
        if (typeof loc.acc === "number") fd.append("acc", String(Math.round(loc.acc)));
      }
      return await infer(fd);
    },
  });

  function onSubmit(e) {
    e.preventDefault();
    if (!imageFile) return;
    inferMut.mutate({ image: imageFile, cropType, cropStage, loc });
  }

  return (
    <>
      <Nav />
      <Container>
        <h1 className="text-2xl font-bold mb-3">Health Check</h1>

        <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Left: input */}
          <div className="lg:col-span-2 rounded-2xl border bg-[#F1EDE8] p-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Crop</label>
                <select className="w-full rounded-md border p-2 bg-white/80"
                        value={cropType} onChange={(e)=>setCropType(e.target.value)}>
                  {cropTypes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Growth Stage</label>
                <select className="w-full rounded-md border p-2 bg-white/80"
                        value={cropStage} onChange={(e)=>setCropStage(e.target.value)}>
                  {cropStages.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button type="button" className="rounded-md border px-3 py-2 bg-white/80"
                        onClick={useMyLocation}>
                  Use my location
                </button>
                {loc && <span className="text-xs text-gray-600">±{Math.round(loc.acc || 0)} m</span>}
              </div>
            </div>

            {geoErr && <div className="text-xs text-rose-600 mt-2">{geoErr}</div>}

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
                <button type="button" onClick={openCamera}
                        className="mt-2 rounded-md border px-3 py-1.5 bg-white/80">
                  Open camera
                </button>
                <div className="text-xs text-gray-600 mt-2">
                  Tip: Fill the frame with the leaf, avoid harsh shadows.
                </div>
              </div>

              <div className="rounded-lg border bg-white/70 p-3">
                <div className="font-semibold mb-1">Preview</div>
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-56 object-contain rounded-md border" />
                ) : (
                  <div className="h-56 flex items-center justify-center text-sm text-gray-600 border rounded-md">
                    No image selected
                  </div>
                )}
              </div>
            </div>

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

            {!inferMut.data && !inferMut.isPending && (
              <div className="text-sm text-gray-600">Upload a leaf image and click Analyze.</div>
            )}

            {inferMut.isPending && (
              <div className="text-sm text-gray-700">Running the model…</div>
            )}

            {inferMut.error && (
              <div className="text-sm text-rose-600">Error: {String(inferMut.error)}</div>
            )}

            {inferMut.data && (
              <>
                <div className="rounded-md bg-white/70 border p-3">
                  <div className="text-sm text-gray-600">Disease</div>
                  <div className="text-lg font-bold">{inferMut.data.label} ({Math.round((inferMut.data.confidence||0)*100)}%)</div>
                  <div className="mt-1 text-sm">
                    Severity:{" "}
                    <span className={`px-2 py-0.5 rounded-md ${
                      inferMut.data.severity === "high" ? "bg-red-100 text-red-700" :
                      inferMut.data.severity === "medium" ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      {inferMut.data.severity || "low"}
                    </span>
                  </div>
                </div>

                {inferMut.data.heatmap_url && (
                  <div className="mt-3">
                    <div className="font-semibold">Explainable AI</div>
                    <div className="text-sm text-gray-600">Highlighted regions the model focused on.</div>
                    <img src={inferMut.data.heatmap_url} alt="Heatmap" className="mt-1 w-full rounded-md border" />
                  </div>
                )}

                <div className="mt-3">
                  <div className="font-semibold">Treatment & Prevention</div>
                  {Array.isArray(inferMut.data.tips) && inferMut.data.tips.length > 0 ? (
                    <ul className="mt-1 space-y-2">
                      {inferMut.data.tips.map((t,i)=>(
                        <li key={i} className="text-sm rounded-md bg-white/70 border p-2">{t}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-600">No tips available.</div>
                  )}
                </div>

                {weather && (
                  <div className="mt-3 rounded-md border p-2 bg-white/70">
                    <div className="font-semibold">Weather-based Alert</div>
                    <div className="text-sm">
                      Temp {weather.temp_c?.toFixed?.(1)}°C · Humidity {weather.humidity}% · Wind {weather.wind_ms?.toFixed?.(1)} m/s · UV {weather.uv_index?.toFixed?.(1)}
                      {weather.rain_mm != null ? <> · Rain(24h): {weather.rain_mm} mm</> : null}
                    </div>
                    {weatherNote && <div className="text-xs text-gray-700 mt-1">{weatherNote}</div>}
                  </div>
                )}

                {aqi && (
                  <div className="mt-2 text-xs text-gray-600">
                    Air Quality (AQI): <b>{aqi.aqi}</b> — {aqi.category}
                  </div>
                )}

                {inferMut.data.captured_at && (
                  <div className="mt-2 text-xs text-gray-600">
                    Captured at: {new Date(inferMut.data.captured_at).toLocaleString()}
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
