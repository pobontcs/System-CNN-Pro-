import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import Nav from "../components/Layout/Nav";
// --- CONFIGURATION ---
const GEMINI_API_KEY = "AIzaSyAsr3ewbk2IktvoR1QyvNQNdlHkCqzNbWY"; 

const DJANGO_BASE = "http://127.0.0.1:8000/api";
const ML_BASE = "http://127.0.0.1:2526/api";

// --- INLINE COMPONENTS ---



function Container({ children }) {
  return <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-600 border border-red-200 m-4 rounded">
          <h2 className="font-bold text-lg">Something went wrong.</h2>
          <p className="text-sm mt-2">Error: {this.state.error?.toString()}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- INLINE API LOGIC ---

function getToken() {
  try {
    return localStorage.getItem("cc_token") || ""; 
  } catch (e) {
    return "";
  }
}

async function infer(formData) {
  const res = await fetch(`${ML_BASE}/predict`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("AI Service Failed: " + res.statusText);
  const data = await res.json();
  return {
    class_id: data.class_id,
    confidence: data.confidence,
    captured_at: data.captured_at || new Date().toISOString(),
    crop_type: data.crop_type,
    crop_stage: data.crop_stage,
    lat: data.lat,
    lon: data.lon
  };
}

async function saveHistory(historyData) {
  const token = getToken();
  console.log("📡 Sending to Django:", `${DJANGO_BASE}/save_history/`, historyData);
  
  const res = await fetch(`${DJANGO_BASE}/save_history/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(historyData),
  });
  
  if (!res.ok) {
      const errText = await res.text();
      console.error("Django Error Response:", errText);
      throw new Error(`Failed to save history: ${res.status} ${errText}`);
  }
  return await res.json();
}

async function getWeather(lat, lon) {
  if (!lat || !lon) return null;
  const res = await fetch(`${ML_BASE}/weather?lat=${lat}&lon=${lon}`);
  if (!res.ok) return null;
  return await res.json();
}

async function getAirQuality(lat, lon) {
  if (!lat || !lon) return null;
  const res = await fetch(`${ML_BASE}/air?lat=${lat}&lon=${lon}`);
  if (!res.ok) return null;
  return await res.json();
}

// --- UPDATED: Helper to get Area, City, State, Country ---
async function getLocationName(lat, lon) {
  if (!lat || !lon) return null;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    const addr = data.address;
    
    // Build specific string: Area, City, State, Country
    const parts = [
        // 1. Area / Neighborhood
        addr.neighbourhood || addr.suburb || addr.residential || addr.village, 
        // 2. City / Town
        addr.city || addr.town || addr.municipality,
        // 3. State / Division
        addr.state || addr.region,
        // 4. Country
        addr.country
    ].filter(Boolean); // Remove null/undefined values
    
    // Remove duplicates and join with commas
    return [...new Set(parts)].join(", ");
  } catch (e) {
    console.warn("Failed to reverse geocode", e);
    return null;
  }
}

// --- NEW GEMINI API FUNCTION ---
async function fetchGeminiSolution(crop, disease) {
  const prompt = `Act as an agricultural expert. My ${crop} plant has been diagnosed with ${disease}. 
  Provide a concise treatment plan in BENGALI language. 
  Include 2 organic cures and 2 chemical medicines. 
  Keep it short, actionable, and formatted as bullet points.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No solution found.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error fetching solution. Please check your internet connection.";
  }
}

// --- CONSTANTS ---
const CLASS_NAMES = [
  "Pepper bell Bacterial spot",
  "Pepper bell healthy",
  "Potato Early blight",
  "Potato healthy",
  "Potato Late_blight",
  "Tomato Target_Spot",
  "Tomato Tomato_mosaic virus",
  "Tomato Tomato YellowLeaf Curl Virus",
  "Tomato Bacterial spot",
  "Tomato Early blight",
  "Tomato healthy",
  "Tomato Late Blight",
  "Tomato Leaf Mold",
  "Tomato Septoria leaf spot",
  "Tomato Spider mites Two spotted spider mite",
];

const cropTypes = [
  { value: "pepper", label: "Pepper" },
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

// --- MAIN CONTENT COMPONENT ---
function HealthCheckContent() {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [cropType, setCropType] = useState("pepper");
  const [cropStage, setCropStage] = useState("vegetative");
  const [loc, setLoc] = useState(null);
  const [geoErr, setGeoErr] = useState("");
  
  // NEW STATES
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [solution, setSolution] = useState("");
  const [loadingSolution, setLoadingSolution] = useState(false);

  const fileRef = useRef(null);

  // Retrieve User Info for Header
  const user = useMemo(() => {
    try {
      const u = localStorage.getItem("user");
      return u && u !== "undefined" ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }, []);

  // Load jsPDF
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => setPdfReady(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); }
  }, []);

  // Location Logic
  useEffect(() => {
    if (isLocationEnabled) {
      if (!navigator.geolocation) {
        setGeoErr("Geolocation not supported.");
        setIsLocationEnabled(false);
        return;
      }
      setGeoErr("");
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLoc({ 
            lat: pos.coords.latitude, 
            lon: pos.coords.longitude, 
            acc: pos.coords.accuracy 
          });
        },
        (err) => {
          setGeoErr(err.message || "Failed to get location.");
          setIsLocationEnabled(false);
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLoc(null);
      setGeoErr("");
    }
  }, [isLocationEnabled]);

  function onSelectFile(e) {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      setPreview(URL.createObjectURL(f));
      setSolution(""); // Clear previous solution on new image
    }
  }

  // Queries
  const { data: weather } = useQuery({
    queryKey: ["weather", loc?.lat, loc?.lon],
    enabled: Boolean(loc?.lat),
    queryFn: () => getWeather(loc.lat, loc.lon),
  });

  const { data: aqi } = useQuery({
    queryKey: ["aqi", loc?.lat, loc?.lon],
    enabled: Boolean(loc?.lat),
    queryFn: () => getAirQuality(loc.lat, loc.lon),
  });

  // Query to fetch Location Name (Area, City, State, Country)
  const { data: locationName } = useQuery({
    queryKey: ["locationName", loc?.lat, loc?.lon],
    enabled: Boolean(loc?.lat),
    queryFn: () => getLocationName(loc.lat, loc.lon),
  });

  const weatherNote = useMemo(() => {
    if (!weather) return "";
    const notes = [];
    if (weather.humidity >= 80) notes.push("High humidity — risk of fungus.");
    if (weather.rain_mm > 5) notes.push("Recent rain — risk of infection.");
    if (weather.uv_index >= 9) notes.push("Strong UV — plant stress possible.");
    return notes.join(" ");
  }, [weather]);

  const inferMut = useMutation({
    mutationFn: async ({ image, cropType, cropStage, loc }) => {
      const fd = new FormData();
      fd.append("file", image);
      fd.append("crop_type", cropType);
      fd.append("crop_stage", cropStage);
      if (loc) {
        fd.append("lat", String(loc.lat));
        fd.append("lon", String(loc.lon));
        if (loc.acc) fd.append("acc", String(Math.round(loc.acc)));
      }
      return await infer(fd);
    },
  });

  function onSubmit(e) {
    e.preventDefault();
    if (!imageFile) return;
    setSolution(""); // Clear old solution
    inferMut.mutate({ image: imageFile, cropType, cropStage, loc });
  }

  // --- HANDLER FOR GENERATING AI SOLUTION ---
  async function handleGetCure() {
    if (!inferMut.data) return;
    
    setLoadingSolution(true);
    const diseaseName = CLASS_NAMES[inferMut.data.class_id] || "Unknown Disease";
    
    // Call Gemini
    const text = await fetchGeminiSolution(cropType, diseaseName);
    
    setSolution(text);
    setLoadingSolution(false);
  }

  // Save & PDF Handler
  async function handleSaveAndPdf() {
    if (!inferMut.data) return;
    setIsSaving(true);

    try {
      const diseaseName = CLASS_NAMES[inferMut.data.class_id] || "Unknown";

      // A. Save to Django
      if (user && user.AcNo) {
        try {
            await saveHistory({
            account_acno: user.AcNo,
            crop_type: cropType,
            disease: diseaseName,
            temperature: weather?.temp_c || null,
            humidity: weather?.humidity || null,
            location: locationName, // Pass the detected Area/City/State to DB
            lat: loc?.lat,
            lon: loc?.lon
            });
            console.log("✅ History saved.");
        } catch(dbError) {
            console.error("❌ DB Error:", dbError);
            alert("Error saving to database! Check console.");
        }
      } else {
        alert("Not logged in. Report not saved to account.");
      }

      // B. Generate PDF
      if (window.jspdf) {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          
          doc.setFontSize(22);
          doc.setTextColor(46, 125, 50); 
          doc.text("Smart CropCare Report", 20, 20);
          
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
          
          if (user && user.AcNo) {
             doc.text(`Farmer ID: #${user.AcNo}`, 150, 30);
          }

          doc.setLineWidth(0.5);
          doc.line(20, 35, 190, 35);
    
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text("Diagnosis Results", 20, 50);
          
          doc.setFontSize(12);
          doc.text(`Crop: ${cropType}`, 20, 60);
          doc.text(`Stage: ${cropStage}`, 20, 70);
          
          doc.setFontSize(14);
          doc.setTextColor(220, 53, 69); 
          doc.text(`Identified Issue: ${diseaseName}`, 20, 85);
          
          doc.setFontSize(12);
          doc.setTextColor(0);
          doc.text(`Confidence: ${Math.round((inferMut.data.confidence || 0) * 100)}%`, 20, 95);
    
          if (weather) {
            doc.setFontSize(14);
            doc.text("Environmental Context", 20, 115);
            doc.setFontSize(12);
            doc.text(`Temperature: ${weather.temp_c}°C`, 20, 125);
            doc.text(`Humidity: ${weather.humidity}%`, 20, 135);
            if (locationName) {
                doc.text(`Location: ${locationName}`, 20, 145);
            } else if(loc) {
               doc.text(`Coordinates: ${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}`, 20, 145);
            }
          }
          
          doc.setFontSize(10);
          doc.setTextColor(150);
          doc.text("Note: View the full Bengali treatment plan on the app.", 20, 270);
    
          doc.save(`CropReport_${Date.now()}.pdf`);
          alert("Report downloaded!");
      } 

    } catch (err) {
      console.error(err);
      alert("Failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Nav />
      <Container>
        {/* --- HEADER WITH ID --- */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Health Check
            {user?.AcNo && (
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                Account ID: <span className="text-gray-900 font-bold">{user.AcNo}</span>
              </span>
            )}
          </h1>
        </div>

        <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 rounded-2xl border bg-[#F1EDE8] p-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Crop</label>
                <select className="w-full rounded-md border p-2 bg-white" value={cropType} onChange={(e) => setCropType(e.target.value)}>
                  {cropTypes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stage</label>
                <select className="w-full rounded-md border p-2 bg-white" value={cropStage} onChange={(e) => setCropStage(e.target.value)}>
                  {cropStages.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              
              <div className="flex flex-col justify-end pb-1">
                <label className="block text-sm font-medium mb-2 text-gray-700">Location</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLocationEnabled(!isLocationEnabled)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      isLocationEnabled ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${isLocationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-xs text-gray-500 font-medium">
                    {isLocationEnabled ? (loc ? "Active" : "Locating...") : "Off"}
                  </span>
                </div>
              </div>
            </div>
            
            {isLocationEnabled && loc && (
               <div className="mt-2 text-xs text-green-700 flex flex-col gap-1">
                 <div className="flex items-center gap-1">
                    📍 <span className="font-mono">{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</span>
                 </div>
                 {/* Display Location Name */}
                 {locationName && (
                    <div className="font-semibold text-gray-800">{locationName}</div>
                 )}
               </div>
            )}
            
            {geoErr && <div className="text-xs text-red-600 mt-2">{geoErr}</div>}

            <div className="mt-4 p-4 border rounded bg-white text-center">
               <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
               
               {preview ? (
                 <img src={preview} alt="Preview" className="h-64 mx-auto object-contain mb-4" />
               ) : (
                 <div className="h-32 flex items-center justify-center text-gray-400 border-2 border-dashed rounded mb-4">
                   No Image Selected
                 </div>
               )}

               <div className="flex justify-center gap-4">
                 <button type="button" onClick={() => fileRef.current.click()} className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100">
                   📂 Upload
                 </button>
                 <button type="button" onClick={() => fileRef.current.click()} className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100">
                   📷 Camera
                 </button>
               </div>
            </div>

            <button
              type="submit"
              disabled={!imageFile || inferMut.isPending}
              className="w-full mt-4 rounded-lg bg-green-600 hover:bg-green-700 text-white px-6 py-3 font-bold disabled:opacity-50 transition-colors"
            >
              {inferMut.isPending ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {/* Right Column */}
          <div className="rounded-2xl border bg-[#F1EDE8] p-4 flex flex-col h-full">
            <h3 className="font-bold mb-3 text-lg">Results</h3>

            <div className="flex-grow">
              {inferMut.data ? (
                <>
                  <div className="bg-white p-4 rounded border shadow-sm animate-in fade-in">
                    <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Detected Disease</div>
                    <div className="text-xl font-bold text-gray-900 mt-1">
                      {CLASS_NAMES[inferMut.data.class_id] || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Confidence: <span className="font-mono bg-gray-100 px-1 rounded">{Math.round((inferMut.data.confidence || 0) * 100)}%</span>
                    </div>
                    
                    {/* --- GET CURE BUTTON --- */}
                    <div className="mt-4 border-t pt-3">
                      <button 
                        type="button"
                        onClick={handleGetCure}
                        disabled={loadingSolution}
                        className="text-sm font-medium text-green-700 hover:text-green-800 flex items-center gap-1"
                      >
                        {loadingSolution ? "Consulting AI Expert..." : "💊 Get Cure & Medicine (Bengali)"}
                      </button>
                    </div>
                  </div>

                  {/* --- DISPLAY SOLUTION --- */}
                  {solution && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2">
                      <h4 className="font-bold text-green-800 mb-2">🌱 AI Expert Advice:</h4>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {solution}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-500 text-sm italic">
                  Upload an image and click Analyze.
                </div>
              )}

              {weather && (
                <div className="mt-4 bg-white/60 p-3 rounded border text-sm">
                  <div className="font-semibold mb-1">
                    Local Weather 
                    {/* Display Location Name in Weather Box too */}
                    {locationName && <span className="font-normal text-gray-600 ml-1">({locationName})</span>}
                  </div>
                  <div>Temp: {weather.temp_c}°C</div>
                  <div>Humidity: {weather.humidity}%</div>
                  {weatherNote && <div className="text-xs text-orange-600 mt-2 pt-2 border-t border-orange-200">⚠️ {weatherNote}</div>}
                </div>
              )}
            </div>

            {/* DOWNLOAD BUTTON */}
            {inferMut.isSuccess && (
              <div className="mt-6 pt-4 border-t border-gray-300">
                <button
                  type="button"
                  onClick={handleSaveAndPdf}
                  disabled={isSaving || !pdfReady}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-70 shadow-sm"
                >
                  {isSaving ? "Processing..." : <><span>📄</span> Save & Download Report</>}
                </button>
              </div>
            )}
          </div>
        </form>
      </Container>
    </>
  );
}

const queryClient = new QueryClient();

export default function HealthCheck() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HealthCheckContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}