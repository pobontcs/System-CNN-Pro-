import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Circle, Polygon, Popup, useMap, Marker } from "react-leaflet";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Nav from "../components/Layout/Nav";
const DJANGO_BASE = "http://127.0.0.1:8000/api";
const MANUAL_LOCATIONS = [
  { name: "Dhaka", lat: 23.8103, lon: 90.4125 },
  { name: "Chittagong", lat: 22.3569, lon: 91.7832 },
  { name: "Sylhet", lat: 24.8949, lon: 91.8687 },
  { name: "Rajshahi", lat: 24.3636, lon: 88.6241 },
  { name: "Khulna", lat: 22.8456, lon: 89.5403 },
  { name: "Barisal", lat: 22.7010, lon: 90.3535 },
  { name: "Rangpur", lat: 25.7439, lon: 89.2752 },
  { name: "Mymensingh", lat: 24.7471, lon: 90.4203 },
];




function Container({ children }) {
  return <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>;
}


const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const UserIcon = L.divIcon({
  className: "bg-blue-600 rounded-full ring-2 ring-white shadow-lg",
  html: '<div style="width:12px;height:12px;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// --- HELPER COMPONENTS ---
function FitTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lon], 11);
  }, [center, map]);
  return null;
}

// --- API FETCHERS ---
async function getRegionalAlerts() {
  try {
    const res = await fetch(`${DJANGO_BASE}/regional_alerts/`);
    if (!res.ok) throw new Error("Failed to fetch");
    return await res.json();
  } catch (e) {
    console.warn("Using demo alerts due to error:", e);
    // Demo data for visual check if backend is empty
    return [
      {
        region: "Dhaka",
        top_disease: "Tomato Early Blight",
        severity: "high",
        summary: "উত্তরাঞ্চলে টমেটো ব্লাইটের প্রাদুর্ভাব দেখা দিয়েছে।",
        tips: ["তামাযুক্ত ছত্রাকনাশক ব্যবহার করুন", "বাতাস চলাচলের ব্যবস্থা করুন", "অতিরিক্ত সেচ এড়িয়ে চলুন"],
        center: { lat: 23.8103, lon: 90.4125 },
        radius_m: 4000
      },
      {
        region: "Sylhet",
        top_disease: "Tea Blister Blight",
        severity: "medium",
        summary: "আর্দ্রতা বৃদ্ধির ফলে চা বাগানে ব্লাইট রোগের ঝুঁকি বাড়ছে।",
        tips: ["প্রতিদিন কচি পাতা পরীক্ষা করুন", "আক্রান্ত অংশ ছাঁটাই করুন", "নিকাশী ব্যবস্থা ঠিক রাখুন"],
        center: { lat: 24.8949, lon: 91.8687 },
        radius_m: 6000
      }
    ];
  }
}

async function getWeather(lat, lon) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain&wind_speed_unit=kmh`);
    const data = await res.json();
    return {
      temp_c: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      rain_mm: data.current.rain
    };
  } catch (e) { return null; }
}

async function getAirQuality(lat, lon) {
  try {
    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`);
    const data = await res.json();
    return { aqi: data.current.us_aqi };
  } catch (e) { return null; }
}

const sevColor = {
  low: "#10b981", 
  medium: "#f59e0b", 
  high: "#ef4444", 
};

// --- MAIN CONTENT COMPONENT ---

function MapContent() {
  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: getRegionalAlerts,
  });

  const [selected, setSelected] = useState(null);
  const [myLoc, setMyLoc] = useState(null);
  const [geoErr, setGeoErr] = useState("");

  // Handler for manual location selection
  function handleManualLocation(e) {
    const regionName = e.target.value;
    if (!regionName) return;

    const loc = MANUAL_LOCATIONS.find(l => l.name === regionName);
    if (loc) {
      setMyLoc({ lat: loc.lat, lon: loc.lon, acc: 500 }); // Mock accuracy
      setSelected(null); // Clear selected alert to focus on location
    }
  }

  const DEFAULT_LOCATION = { lat: 23.8103, lon: 90.4125, acc: 5000 }; 

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoErr("Geolocation not supported. Defaulting to Dhaka.");
      setMyLoc(DEFAULT_LOCATION);
      setSelected(null);
      return;
    }
    
    setGeoErr(""); 

    navigator.geolocation.getCurrentPosition(
      (pos) => {

        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy };
        setMyLoc(loc);
        setSelected(null); 
      },
      (err) => {
  
        console.warn("GPS Failed, using default:", err.message);
        setGeoErr("GPS unavailable. Defaulting to Dhaka.");
        setMyLoc(DEFAULT_LOCATION);
        setSelected(null);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }

  const target = selected?.center ?? myLoc;

  const { data: weather } = useQuery({
    queryKey: ["weather", target?.lat, target?.lon],
    enabled: !!target,
    queryFn: () => getWeather(target.lat, target.lon),
  });

  const { data: aqi } = useQuery({
    queryKey: ["aqi", target?.lat, target?.lon],
    enabled: !!target,
    queryFn: () => getAirQuality(target.lat, target.lon),
  });

  const localRisk = useMemo(() => {
    if (!weather) return null;
    const notes = [];
    let level = "low";

    if (weather.humidity > 90) {
        notes.push("Extreme humidity: Severe fungal/mold risk.");
        level = "high";
    } else if (weather.humidity > 80) {
        notes.push("High humidity: Monitor for fungal growth.");
        if (level !== "high") level = "medium";
    }

    if (weather.precip_mm > 50) {
        notes.push("Heavy rainfall: Flood risk & soil erosion likely.");
        level = "high";
    } else if (weather.precip_mm > 10) {
        notes.push("Moderate rain: Check drainage systems.");
        if (level !== "high") level = "medium";
    }

    if (weather.temp_c > 35) {
        notes.push("Extreme Heat: Heat stress risk for crops/livestock.");
        level = "high";
    } else if (weather.temp_c > 30) {
        notes.push("High Temperature: Ensure adequate hydration/irrigation.");
        if (level !== "high") level = "medium";
    } else if (weather.temp_c < 0) {
        notes.push("Freeze Warning: Frost damage risk to sensitive plants.");
        level = "high";
    } else if (weather.temp_c < 4) {
        notes.push("Cold Warning: Potential for frost.");
        if (level !== "high") level = "medium";
    }

   
    if (weather.wind_kph > 60) {
        notes.push("Gale Force Winds: Structural damage risk. Avoid spraying.");
        level = "high";
    } else if (weather.wind_kph > 30) {
        notes.push("High Winds: Spray drift risk. Secure loose equipment.");
        if (level !== "high") level = "medium";
    }

    if (weather.uv > 8) {
        notes.push("Extreme UV: High radiation risk for field workers.");
        if (level === "low") level = "medium";
    }

    if (weather.vis_km < 1) {
        notes.push("Dense Fog: Low visibility. Use caution with machinery.");
        if (level !== "high") level = "medium";
    }

    return { level, notes };
}, [weather]);

  return (
    <>
      <Nav />
      <Container>
        {/* Force Load Leaflet CSS via style tag */}
        <style>{`
          .leaflet-container { width: 100%; height: 100%; z-index: 0; }
          @import url("https://unpkg.com/leaflet@1.7.1/dist/leaflet.css");
        `}</style>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Regional Disease Alerts</h1>
            <p className="text-sm text-gray-500">AI-generated warnings based on recent crop scans.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Manual Location Selector */}
            <select 
                onChange={handleManualLocation}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
                <option value="">Select Region...</option>
                {MANUAL_LOCATIONS.map(loc => (
                    <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
            </select>

            <button
                onClick={useMyLocation}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
                📍 My GPS
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[75vh]">
          {/* MAP COLUMN */}
          <div className="lg:col-span-2 rounded-2xl border shadow-sm overflow-hidden relative z-0 bg-gray-100">
            <MapContainer center={[23.685, 90.356]} zoom={7} className="h-full w-full">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {(selected || myLoc) && <FitTo center={target} />}

              {myLoc && (
                <>
                  <Marker position={[myLoc.lat, myLoc.lon]} icon={UserIcon}>
                    <Popup>Selected Location</Popup>
                  </Marker>
                  <Circle center={[myLoc.lat, myLoc.lon]} radius={myLoc.acc || 2000} pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.1 }} />
                </>
              )}

              {alerts.map((a, i) => (
                <Circle
                  key={i}
                  center={[a.center.lat, a.center.lon]}
                  radius={a.radius_m || 5000}
                  pathOptions={{
                    color: sevColor[a.severity] || sevColor.low,
                    fillColor: sevColor[a.severity] || sevColor.low,
                    fillOpacity: 0.4,
                    weight: 1
                  }}
                  eventHandlers={{
                    click: () => { setSelected(a); setMyLoc(null); }
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <strong className="block text-lg">{a.region}</strong>
                      <span className={`inline-block px-2 py-0.5 rounded text-white text-xs uppercase font-bold bg-${a.severity === 'high' ? 'red' : 'yellow'}-500`}>
                        {a.severity} Risk
                      </span>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
            
            <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow-md text-xs z-[1000] backdrop-blur-sm">
                <div className="font-bold mb-2">Severity Legend</div>
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> High Risk</div>
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Medium Risk</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Low Risk</div>
            </div>
          </div>

          {/* INFO PANEL */}
          <div className="bg-[#F8F9FA] rounded-2xl border shadow-sm p-5 overflow-y-auto">
            {selected ? (
              <div className="animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selected.region}</h2>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase text-white`} style={{ backgroundColor: sevColor[selected.severity] }}>
                            {selected.severity} Severity
                        </span>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Top Threat</h3>
                    <p className="text-lg font-medium text-gray-900">{selected.top_disease}</p>
                </div>

                <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-blue-600 mb-1">🤖 AI Summary (Bengali)</h3>
                    <p className="text-gray-700 italic text-sm leading-relaxed">"{selected.summary}"</p>
                </div>

                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Prevention Tips</h3>
                    <ul className="space-y-2">
                        {selected.tips.map((tip, idx) => (
                            <li key={idx} className="flex gap-3 text-sm bg-white p-3 rounded-lg border border-gray-100">
                                <span className="text-green-500 font-bold">•</span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
              </div>
            ) : myLoc ? (
              <div className="animate-in fade-in">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Location Analysis</h2>
                
                {weather ? (
                    <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-gray-800">{weather.temp_c}°C</div>
                                <div className="text-xs text-gray-500">Temp</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{weather.humidity}%</div>
                                <div className="text-xs text-gray-500">Humidity</div>
                            </div>
                        </div>
                    </div>
                ) : <div className="text-sm text-gray-500">Loading weather...</div>}

                {localRisk && (
                    <div className={`p-4 rounded-xl border ${localRisk.level === 'high' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
                        <div className="font-bold mb-2">General Risk: {localRisk.level.toUpperCase()}</div>
                        <p className="text-xs mb-2">Based on live weather data:</p>
                        <ul className="list-disc ml-4 text-sm">
                            {localRisk.notes.length > 0 ? localRisk.notes.map((n, i) => <li key={i}>{n}</li>) : <li>Conditions look stable.</li>}
                        </ul>
                    </div>
                )}
                
                <p className="text-sm text-gray-500 mt-6 text-center">
                    Select a colored zone on the map to view regional alerts.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <span className="text-4xl mb-3">🗺️</span>
                <p>Select a region on the map<br/>or use the location selector.</p>
              </div>
            )}

            {target && (selected || myLoc) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                       <div>Rain (24h): {weather?.rain_mm ?? 0}mm</div>
                       <div>AQI: {aqi?.aqi ?? '--'}</div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}

const queryClient = new QueryClient();

export default function MapPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <MapContent />
    </QueryClientProvider>
  );
}