import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Cloud, Droplets, Wind, MapPin, Sun, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
import Nav from "../components/Layout/Nav";

const DJANGO_BASE = "http://127.0.0.1:8000/api";
const ML_BASE = "http://127.0.0.1:2526/api";

const COLORS = {
  cream: "#F1EDE8",
  leaf: "#4CAF50",
  leafDark: "#43A047",
  rose: "#ef4444",
  amber: "#f59e0b",
  emerald: "#10b981",
  text: "#333333",
  border: "#DAD7CD",
};


function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

//dhaka
  const DEFAULT_LAT = 23.8103;
  const DEFAULT_LON = 90.4125;

  useEffect(() => {
    const fetchWeather = async (lat, lon, fallback = false) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
        );
        if (!res.ok) throw new Error("Weather API Error");
        const data = await res.json();
        setWeather(data.current);
        if (fallback) setIsFallback(true);
      } catch (err) {
        setError("Weather unavailable");
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.geolocation) {
      fetchWeather(DEFAULT_LAT, DEFAULT_LON, true);
      return;
    }

    const handleSuccess = (position) => {
      fetchWeather(position.coords.latitude, position.coords.longitude);
    };

    const handleError = (err) => {
      console.warn("Geolocation Error or Timeout:", err);
 
      fetchWeather(DEFAULT_LAT, DEFAULT_LON, true);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 60000
    });
  }, []);

  // WMO Weather Code Mapper
  const getWeatherIcon = (code) => {
    if (code === 0) return <Sun className="w-12 h-12 text-yellow-500" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-12 h-12 text-gray-400" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-12 h-12 text-blue-500" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="w-12 h-12 text-blue-200" />;
    if (code >= 95) return <CloudLightning className="w-12 h-12 text-purple-500" />;
    return <Cloud className="w-12 h-12 text-gray-400" />;
  };

  const getWeatherLabel = (code) => {
    if (code === 0) return "Clear Sky";
    if (code >= 1 && code <= 3) return "Partly Cloudy";
    if (code >= 45 && code <= 48) return "Foggy";
    if (code >= 51 && code <= 67) return "Rainy";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 95) return "Thunderstorm";
    return "Overcast";
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400 animate-pulse">Locating...</div>;
  if (error) return <div className="h-full flex items-center justify-center text-gray-400 text-sm">{error}</div>;
  if (!weather) return null;

  return (
    <div className="h-full flex flex-col justify-between p-2">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <MapPin className="w-4 h-4" /> 
            {isFallback ? "Dhaka (Default)" : "Current Location"}
          </div>
          <div className="text-4xl font-bold text-gray-800">{weather.temperature_2m}°C</div>
          <div className="text-blue-600 font-medium">{getWeatherLabel(weather.weather_code)}</div>
        </div>
        {getWeatherIcon(weather.weather_code)}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
          <Droplets className="w-5 h-5 text-blue-500" />
          <div>
            <div className="text-xs text-gray-500">Humidity</div>
            <div className="font-semibold text-gray-800">{weather.relative_humidity_2m}%</div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
          <Wind className="w-5 h-5 text-gray-500" />
          <div>
            <div className="text-xs text-gray-500">Wind</div>
            <div className="font-semibold text-gray-800">{weather.wind_speed_10m} km/h</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEMO_USER_STATS = {
  scan_count: 0,
  most_seen_disease: "None",
  data: []
};

const DEMO_TIPS = {
  tips: [
    "Ensure crops receive 6–8 hours of sunlight.",
    "Use neem oil weekly to protect from pests.",
    "Avoid overwatering to prevent root rot.",
    "Add compost every 15 days.",
    "Mulching reduces water loss and weeds.",
  ],
};


function getLocalUser() {
  try {
    const u = localStorage.getItem("user");
    return u && u !== "undefined" ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
}

// --- LAYOUT ---
function Container({ children }) {
  return <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>;
}


async function getUserStats() {
  const localUser = getLocalUser();

  const acNo = localUser?.AcNo;

  if (!acNo) return DEMO_USER_STATS;

  try {

    const res = await fetch(`${DJANGO_BASE}/me/?acNo=${acNo}`);
    
    if (res.ok) {
      const data = await res.json();

      return {
        scan_count: data.scan_count || 0,
        most_seen_disease: data.most_seen_disease || "None",
        data: Array.isArray(data.data) ? data.data : []
      };
    }
    return DEMO_USER_STATS;
  } catch (e) {
    console.warn("API Error:", e);
    return DEMO_USER_STATS;
  }
}


const getDiseaseForPrompt = (stats) => {
    return stats && stats.most_seen_disease && stats.most_seen_disease !== "None" 
        ? stats.most_seen_disease 
        : "General Crops";
}

const GEMINI_API_KEY = ""; 

async function getTips(statsData) {
    
        if(!GEMINI_API_KEY){
            console.log("No Gemini API Key provided, using demo tips.");
            return DEMO_TIPS;
        }

        const disease = getDiseaseForPrompt(statsData);
        const prompt = `provide 5 concise tips for farmers to improve crop health according to modern agricultural practices. The most occurred disease detected is ${disease}. Return only the tips as simple sentences.`;

        try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                  })
                });
                
                if(!res.ok) throw new Error("Gemini API Failed");

                const data = await res.json();
                const text = data.candidates[0].content.parts[0].text;

                const tips = text.split('\n')
                    .map(t => t.replace(/^[\d\-\*\.]+\s*/, '').trim())
                    .filter(t => t.length > 5)
                    .slice(0, 5);

                return { tips };
        } 
        catch (error) {
            console.error("AI Tip Fetch Error:", error);
            return DEMO_TIPS;
        }
}


function DashboardContent() {
  const localUser = useMemo(() => getLocalUser(), []);
  
  const { data: stats } = useQuery({
    queryKey: ["userStats", localUser?.AcNo],
    queryFn: getUserStats,
    initialData: DEMO_USER_STATS,
    enabled: !!localUser?.AcNo,
  });


  const { data: tipsData } = useQuery({
    queryKey: ["tips", stats?.most_seen_disease], 
    queryFn: () => getTips(stats),
    initialData: DEMO_TIPS,
  });

  const history = Array.isArray(stats?.data) ? stats.data : [];

  const byDay = useMemo(() => {
    const map = new Map();
    for (const r of history) {
      if (!r.date) continue;

      const key = r.date.includes('T') ? r.date.split('T')[0] : r.date; 
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * 86400000);
      const key = d.toISOString().slice(0, 10);
      return { day: key.slice(5), scans: map.get(key) ?? 0 };
    });
  }, [history]);

  const pie = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    for (const r of history) {

        let sev = 'low';
        if (r.disease && r.disease.toLowerCase().includes('blight')) sev = 'high';
        else if (r.disease && r.disease.toLowerCase().includes('rot')) sev = 'medium';
        
        counts[sev]++;
    }

    return [
      { name: "Low", value: counts.low, color: COLORS.emerald },
      { name: "Medium", value: counts.medium, color: COLORS.amber },
      { name: "High", value: counts.high, color: COLORS.rose },
    ];
  }, [history]);


  const displayName = localUser?.name || "Farmer";
  const accountId = localUser?.AcNo || "N/A";

  return (
    <>
      <Nav />
      <Container>

        <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center text-3xl border-2 border-green-500 shadow-sm shrink-0">
            👨‍🌾
          </div>

          <div className="text-center md:text-left">
            <div className="text-sm text-gray-500 font-medium mb-1">Welcome back,</div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{displayName}</div>

            <span className="mt-2 inline-flex items-center gap-2 bg-gray-50 text-gray-600 text-xs px-3 py-1 rounded-full border border-gray-200 font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              ID: <strong>{accountId}</strong>
            </span>
          </div>
        </div>


        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          

          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm bg-white hover:shadow-md transition-all">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Scans</div>
            <div className="text-4xl font-black text-gray-900">{stats.scan_count}</div>
            <div className="text-xs text-gray-400 mt-2">Recorded in history</div>
          </div>


          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm bg-white hover:shadow-md transition-all">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Top Threat</div>
            <div className={`text-xl font-bold leading-tight line-clamp-2 ${stats.most_seen_disease !== "None" ? 'text-rose-600' : 'text-gray-400'}`}>
              {stats.most_seen_disease !== "None" ? stats.most_seen_disease : "No detections yet"}
            </div>
             <div className="text-xs text-gray-400 mt-2">Most frequent issue</div>
          </div>

     
          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm bg-white hover:shadow-md transition-all">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Active Crops</div>
            <div className="text-4xl font-black text-green-700">
              {new Set(history.map(d => d.crop_type)).size}
            </div>
             <div className="text-xs text-gray-400 mt-2">Unique varieties scanned</div>
          </div>
        </div>


        <div className="grid lg:grid-cols-3 gap-8 mb-8">

          <div className="lg:col-span-2 rounded-2xl border border-gray-200 p-6 shadow-sm bg-white h-80 flex flex-col">
            <div className="font-bold text-lg mb-6 text-gray-800">Recent Activity (7 Days)</div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDay}>
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="scans" fill={COLORS.leaf} radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Modern Weather Widget */}
          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm bg-white h-80 flex flex-col">
            <div className="font-bold text-lg mb-4 text-gray-800">Live Weather</div>
            <div className="flex-1">
              <WeatherWidget />
            </div>
          </div>
        </div>

        {/* AI TIPS */}
        <div className="rounded-2xl border border-green-100 p-8 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <div className="font-bold text-green-800 mb-4 flex items-center gap-3 text-lg">
            <span>💡</span> AI Farming Tips
          </div>
          <ul className="grid md:grid-cols-2 gap-4">
            {(tipsData?.tips || DEMO_TIPS.tips).map((t, i) => (
              <li key={i} className="flex gap-3 text-sm bg-white p-4 rounded-xl border border-green-100 shadow-sm items-start">
                <span className="text-green-500 font-bold mt-0.5">•</span>
                <span className="text-gray-700 leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </div>

      </Container>
    </>
  );
}

const queryClient = new QueryClient();

export default function Dashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}