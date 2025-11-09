import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import Nav from "../components/Layout/Nav";
import Container from "../components/Layout/Container";
import { MapContainer, TileLayer, Circle, Polygon, Popup, useMap, Marker } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { getRegionalAlerts, getWeather, getAirQuality } from "../lib/api";

const UserIcon = L.divIcon({
  className: "bg-blue-600 rounded-full ring-2 ring-white",
  html: '<div style="width:12px;height:12px;border-radius:9999px;background:#2563eb"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const mapH = "h-[70vh]";

function FitTo({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lon], 11);
  }, [center, map]);
  return null;
}

const sevColor = {
  low: "#10b98188",
  medium: "#f59e0b88",
  high: "#ef444488",
};

export default function MapPage() {
  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => getRegionalAlerts(),
  });

  const [selected, setSelected] = useState(null);
  const [myLoc, setMyLoc] = useState(null);
  const [geoErr, setGeoErr] = useState("");

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoErr("Geolocation not supported in this browser.");
      return;
    }
    setGeoErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelected(null);
        setMyLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy });
      },
      (err) => setGeoErr(err.message || "Failed to get location."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  const condTarget = selected?.center ?? myLoc ?? null;

  const { data: weather } = useQuery({
    queryKey: ["weather", condTarget?.lat, condTarget?.lon],
    enabled: Boolean(condTarget),
    queryFn: () => getWeather(condTarget.lat, condTarget.lon),
  });

  const { data: aqi } = useQuery({
    queryKey: ["aqi", condTarget?.lat, condTarget?.lon],
    enabled: Boolean(condTarget),
    queryFn: () => getAirQuality(condTarget.lat, condTarget.lon),
  });

  const risk = useMemo(() => {
    if (!weather) return null;
    const notes = [];
    let level = "low";
    if (weather.humidity >= 80) { notes.push("High humidity can promote fungal diseases."); level = "medium"; }
    if ((weather.rain_mm || 0) > 5) { notes.push("Recent rain increases leaf wetness duration."); level = "medium"; }
    if (weather.temp_c >= 34 && weather.humidity >= 70) { notes.push("Hot & humid — disease pressure may be elevated."); level = "high"; }
    return { level, notes };
  }, [weather]);

  const mapCenter =
    selected?.center ??
    myLoc ??
    { lat: alerts[0]?.center?.lat ?? 23.78, lon: alerts[0]?.center?.lon ?? 90.41 };

  return (
    <>
      <Nav />
      <Container>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Regional Alerts</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={useMyLocation}
              className="rounded-md border px-3 py-1.5 bg-white/80 hover:bg-white text-sm"
              title="Center map on my location and load local conditions"
            >
              Use my location
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border shadow-sm bg-[#F1EDE8]">
            <div className={`rounded-2xl overflow-hidden ${mapH}`}>
              <MapContainer center={[mapCenter.lat, mapCenter.lon]} zoom={10} className="h-full w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                />

                {(selected || myLoc) && <FitTo center={selected?.center ?? myLoc} />}

                {myLoc && (
                  <>
                    <Marker position={[myLoc.lat, myLoc.lon]} icon={UserIcon}>
                      <Popup>
                        <div className="font-semibold">You are here</div>
                        {typeof myLoc.acc === "number" && (
                          <div className="text-sm text-gray-600">±{Math.round(myLoc.acc)} m accuracy</div>
                        )}
                      </Popup>
                    </Marker>
                    {typeof myLoc.acc === "number" && myLoc.acc > 0 && (
                      <Circle
                        center={[myLoc.lat, myLoc.lon]}
                        radius={Math.min(myLoc.acc, 150)}
                        pathOptions={{ color: "#2563eb88", fillColor: "#2563eb55", fillOpacity: 0.25 }}
                      />
                    )}
                  </>
                )}

                {alerts.map((a, i) =>
                  a.polygon ? (
                    <Polygon
                      key={`poly-${i}`}
                      pathOptions={{ color: sevColor[a.severity], fillColor: sevColor[a.severity], fillOpacity: 0.35 }}
                      positions={a.polygon.map(([lat, lon]) => [lat, lon])}
                      eventHandlers={{ click: () => setSelected(a) }}
                    >
                      <Popup>
                        <div className="font-semibold">{a.region}</div>
                        <div>{a.top_disease} • {a.severity}</div>
                      </Popup>
                    </Polygon>
                  ) : (
                    <Circle
                      key={`circle-${i}`}
                      center={[a.center.lat, a.center.lon]}
                      radius={a.radius_m ?? 3000}
                      pathOptions={{ color: sevColor[a.severity], fillColor: sevColor[a.severity], fillOpacity: 0.35 }}
                      eventHandlers={{ click: () => setSelected(a) }}
                    >
                      <Popup>
                        <div className="font-semibold">{a.region}</div>
                        <div>{a.top_disease} • {a.severity}</div>
                      </Popup>
                    </Circle>
                  )
                )}
              </MapContainer>
            </div>
          </div>

          <div className="rounded-2xl border shadow-sm p-4 bg-[#F1EDE8]">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Details</div>
              <select
                className="rounded-md border bg-white/80 px-2 py-1 text-sm"
                value={selected?.region ?? ""}
                onChange={(e) => {
                  const r = alerts.find(a => a.region === e.target.value) || null;
                  setSelected(r);
                  if (r) setMyLoc(null);
                }}
              >
                <option value="">(choose region)</option>
                {alerts.map(a => <option key={a.region} value={a.region}>{a.region}</option>)}
              </select>
            </div>

            {geoErr && <div className="text-xs text-rose-600 mb-2">{geoErr}</div>}

            {selected && (
              <>
                <div className="rounded-lg border p-3 bg-white/70">
                  <div className="text-sm text-gray-600">{selected.region}</div>
                  <div className="text-lg font-bold capitalize">{selected.top_disease} • {selected.severity}</div>
                  <p className="mt-1 text-sm text-gray-700">{selected.summary}</p>
                </div>

                <div className="mt-4">
                  <div className="font-semibold">Prevention methods</div>
                  <ul className="mt-2 space-y-2">
                    {selected.tips.map((t, i) => (
                      <li key={i} className="text-sm rounded-md bg-white/70 border p-2">{t}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <div className="mt-4">
              <div className="font-semibold">Current conditions</div>
              {!condTarget && <div className="text-sm text-gray-600">Select a region or click “Use my location”.</div>}

              {condTarget && (
                <>
                  {!weather && <div className="text-sm text-gray-600 mt-1">Loading weather…</div>}
                  {weather && (
                    <div className="mt-2 text-sm rounded-md bg-white/70 border p-2">
                      <div>Temperature: <strong>{weather.temp_c.toFixed(1)}°C</strong></div>
                      <div>Humidity: <strong>{weather.humidity}%</strong></div>
                      <div>Wind: <strong>{weather.wind_ms.toFixed(1)} m/s</strong></div>
                      <div>UV Index: <strong>{weather.uv_index.toFixed(1)}</strong></div>
                      {weather.rain_mm != null && <div>Rain (24h): <strong>{weather.rain_mm} mm</strong></div>}
                    </div>
                  )}

                  {!aqi && <div className="text-sm text-gray-600 mt-2">Loading air quality…</div>}
                  {aqi && (
                    <div className="mt-2 text-sm rounded-md bg-white/70 border p-2">
                      <div>Air Quality (AQI): <strong>{aqi.aqi}</strong> — {aqi.category}</div>
                      <div className="text-xs text-gray-600">
                        {aqi.pm25 != null && <>PM2.5: {aqi.pm25} μg/m³ · </>}
                        {aqi.pm10 != null && <>PM10: {aqi.pm10} μg/m³ · </>}
                        {aqi.o3 != null && <>O₃: {aqi.o3} ppb</>}
                      </div>
                    </div>
                  )}

                  {weather && (
                    <div className={`mt-2 text-sm rounded-md border p-2 ${
                      risk?.level === "high" ? "bg-red-50" : risk?.level === "medium" ? "bg-amber-50" : "bg-emerald-50"
                    }`}>
                      <div className="font-semibold capitalize">Crop risk: {risk?.level ?? "low"}</div>
                      <ul className="mt-1 list-disc ml-5">
                        {risk?.notes?.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
