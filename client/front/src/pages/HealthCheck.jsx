import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { Navigate, Link } from "react-router-dom";


const GEMINI_API_KEY = ""; 

const DJANGO_BASE = "http://127.0.0.1:8000/api";
const ML_BASE = "http://127.0.0.1:2526/api";


const FALLBACK_CURES = {
  "default": "•  Consult a local agricultural officer.\n• Ensure proper drainage.\n• Isolate the affected plant.",
  

  "Pepper bell Bacterial_spot": "•  Spray fixed copper bactericides immediately.\n• Remove infected leaves/plants to stop spread.\n• Avoid overhead watering.\n• Rotate crops every 2-3 years.",
  "Pepper bell healthy": "•  Plant is healthy! Continue regular watering.\n• Monitor for pests weekly.\n• Ensure soil drainage remains good.\n• Apply balanced fertilizer as scheduled.",
  

  "Potato Early blight": "• Apply fungicides containing Chlorothalonil or Mancozeb.\n• Remove lower infected leaves.\n• Use drip irrigation to keep foliage dry.\n• Practice crop rotation.",
  "Potato healthy": "•   Your potato plants look healthy.\n• Keep hilling up soil around the base.\n• Monitor for beetles or aphids.\n• Maintain consistent moisture.",
  "Potato Late blight": "•  CRITICAL: Destroy all infected plants immediately.\n• Spray fungicides like Metalaxyl or Cymoxanil.\n• Monitor weather: high humidity triggers rapid spread.\n• Do not compost infected tubers.",

  "Tomato Target Spot": "•  Improve air circulation by pruning.\n• Apply fungicides (Azoxystrobin or Difenoconazole).\n• Avoid wetting leaves when watering.\n• Remove crop debris after harvest.",
  "Tomato Tomato mosaic virus": "• No chemical cure exists. Remove infected plants.\n• Wash hands/tools with milk or bleach solution.\n• Control aphids which may spread viruses.\n• Use virus-free seeds next time.",
  "Tomato Tomato YellowLeaf Curl Virus": "•  Control whiteflies using sticky traps or imidacloprid.\n• Use virus-resistant tomato varieties.\n• Remove weeds which harbor the virus.\n• Cover seedlings with floating row covers.",
  "Tomato Bacterial spot": "• Apply copper sprays mixed with mancozeb.\n• Avoid working in the field when wet.\n• Remove symptomatic plants.\n• Use certified disease-free seeds.",
  "Tomato Early blight": "•  Mulch soil to prevent spores splashing on leaves.\n• Stake plants to keep them off the ground.\n• Apply copper fungicide every 7-10 days.\n• Remove infected debris at end of season.",
  "Tomato healthy": "•  Excellent! The plant is vibrant and disease-free.\n• Stake or cage plants for support.\n• Prune suckers for better fruit production.\n• Water consistently to prevent cracking.",
  "Tomato Late blight": "•  Remove and destroy infected plants immediately.\n• Apply preventive copper sprays.\n• Ensure good airflow between plants.\n• Check daily during cool, wet weather.",
  "Tomato Leaf Mold": "•  Increase spacing to lower humidity.\n• Water at the base, never the leaves.\n• Apply fungicides like Chlorothalonil if severe.\n• Ensure greenhouse ventilation (if applicable).",
  "Tomato Septoria leaf spot": "•  Remove lower leaves where infection starts.\n• Apply fungicide (Chlorothalonil) on schedule.\n• Mulch around the base of the plant.\n• Rotate to a new spot next year.",
  "Tomato Spider mites Two spotted spider mite": "•  Spray with Neem oil or insecticidal soap.\n• Increase humidity (mites hate moisture).\n• Release predatory mites (Phytoseiulus persimilis).\n• Remove heavily infested leaves."
};

function getFallbackSolution(disease) {
  return FALLBACK_CURES[disease] || FALLBACK_CURES["default"];
}



function Nav() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u && u !== "undefined") setUser(JSON.parse(u));
    } catch(e) {}
  }, []);

  return (
    <nav className="bg-white border-b h-14 flex items-center px-4 md:px-6 shadow-sm sticky top-0 z-50">
    <Link to="/" className="font-bold text-xl text-green-600 flex items-center gap-2 no-underline">
      <span>🌱</span> Smart CropCare
    </Link>
    
 
    {user && (
      <span className="text-lg text-gray-500 font-normal ml-2 hidden sm:inline border-l pl-2 ">
      {user.name && user.name !== "Farmer" ? user.name : "User"} 
      <span className="text-green-600 font-bold ml-1">#{user.AcNo}</span>
    </span>
    
    )}

    <div className="ml-auto flex gap-4 text-sm font-medium text-gray-600">
      <Link to="/dashboard" className="cursor-pointer hover:text-green-600">Dashboard</Link>
      <Link to="/history" className="cursor-pointer hover:text-green-600">History</Link>
    </div>
  </nav>
  );
}

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
    lon: data.lon,
    visualization: data.visualization || null 
  };
}

async function saveHistory(historyData) {
  const token = getToken();
  console.log("📡 Sending to Django:", `${DJANGO_BASE}/submit/`, historyData);
  
  const res = await fetch(`${DJANGO_BASE}/submit/`, {
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



function getWeatherCondition(code) {
  if (code === 0) return "Clear Sky";
  if (code >= 1 && code <= 3) return "Partly Cloudy";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 67) return "Rainy";
  if (code >= 71 && code <= 77) return "Snowy";
  if (code >= 80 && code <= 82) return "Heavy Rain";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
}

function getAqiStatus(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (Sensitive)";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

async function getWeather(lat, lon) {
  if (!lat || !lon) return null;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain,weather_code&wind_speed_unit=kmh`
    );
    if (!res.ok) throw new Error("Open-Meteo Weather API failed");
    
    const data = await res.json();
    const current = data.current;
    
    return { 
      temp_c: current.temperature_2m, 
      humidity: current.relative_humidity_2m, 
      rain_mm: current.rain, 
      condition: getWeatherCondition(current.weather_code)
    };
  } catch (e) {
    console.warn("Weather API failed, using fallback:", e);
    return { temp_c: "--", humidity: "--", rain_mm: 0, condition: "N/A" };
  }
}

async function getAirQuality(lat, lon) {
  if (!lat || !lon) return null;
  try {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
    );
    if (!res.ok) throw new Error("Open-Meteo Air API failed");

    const data = await res.json();
    const aqi = data.current.us_aqi;

    return { 
      aqi: aqi, 
      status: getAqiStatus(aqi) 
    };
  } catch (e) {
    console.warn("Air API failed, using fallback:", e);
    return { aqi: "--", status: "N/A" };
  }
}

async function getLocationName(lat, lon) {
  if (!lat || !lon) return null;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    const addr = data.address;
    
    const parts = [
        addr.neighbourhood || addr.suburb || addr.residential || addr.village, 
        addr.city || addr.town || addr.municipality,
        addr.state || addr.region,
        addr.country
    ].filter(Boolean); 
    
    return [...new Set(parts)].join(", ");
  } catch (e) {
    console.warn("Failed to reverse geocode", e);
    return null;
  }
}


async function fetchGeminiSolution(crop, disease) {
  if (!GEMINI_API_KEY) {
    console.warn("No Gemini API Key, using fallback.");
    return getFallbackSolution(disease);
  }


  if (disease.toLowerCase().includes("healthy")) {
    return getFallbackSolution(disease);
  }

  const prompt = `Act as an agricultural expert. My ${crop} plant has been diagnosed with ${disease}. 
  Provide a concise treatment plan in BENGALI language. 
  Include 2 organic cures and 2 chemical medicines. 
  Keep it short, actionable, and formatted as bullet points. give 4-5 tips only`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            safetySettings: [
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
            ]
        }),
      }
    );


    if (response.status === 429) {
        console.warn("Gemini Quota Exceeded. Using Demo Solution.");
        return getFallbackSolution(disease);
    }

    const data = await response.json();
    
   
    if (data.error) {
        console.warn("Gemini API Error:", data.error.message);
        return getFallbackSolution(disease);
    }
    
    if (data.candidates && data.candidates.length > 0) {
        if (data.candidates[0].finishReason === "SAFETY") {
             return "⚠️ Content blocked by AI safety filters.";
        }
        return data.candidates[0].content.parts[0].text;
    }

    return getFallbackSolution(disease);
  } catch (error) {
    console.error("Network Error:", error);

    return getFallbackSolution(disease);
  }
}

const CLASS_NAMES = [
  "Pepper bell Bacterial_spot",
  "Pepper bell healthy",
  "Potato Early blight",
  "Potato healthy",
  "Potato Late blight",
  "Tomato Target Spot",
  "Tomato Tomato mosaic virus",
  "Tomato Tomato YellowLeaf Curl Virus",
  "Tomato Bacterial spot",
  "Tomato Early blight",
  "Tomato healthy",
  "Tomato Late blight",
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


function HealthCheckContent() {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [cropType, setCropType] = useState("pepper");
  const [cropStage, setCropStage] = useState("vegetative");
  const [loc, setLoc] = useState(null);
  const [geoErr, setGeoErr] = useState("");
  
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [solution, setSolution] = useState("");
  const [loadingSolution, setLoadingSolution] = useState(false);
  

  const lastFetched = useRef({ disease: null, crop: null });

  const fileRef = useRef(null);

  const user = useMemo(() => {
    try {
      const u = localStorage.getItem("user");
      return u && u !== "undefined" ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => setPdfReady(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); }
  }, []);

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
        { enableHighAccuracy: false }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLoc({
        lat: 23.8191,
        lon: 90.4329,
        acc: 20
      });
      setGeoErr("");
    }
  }, [isLocationEnabled]);

  function onSelectFile(e) {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      setPreview(URL.createObjectURL(f));
      setSolution("");
      lastFetched.current = { disease: null, crop: null };
    }
  }

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
    setSolution(""); 
    inferMut.mutate({ image: imageFile, cropType, cropStage, loc });
  }

  async function handleGetCure() {
    if (!inferMut.data) return;
    
    const diseaseName = CLASS_NAMES[inferMut.data.class_id] || "Unknown Disease";

    if (lastFetched.current.disease === diseaseName && lastFetched.current.crop === cropType && solution) {
        return; 
    }

    setLoadingSolution(true);
    const text = await fetchGeminiSolution(cropType, diseaseName);
    setSolution(text);
    setLoadingSolution(false);
    
    lastFetched.current = { disease: diseaseName, crop: cropType };
  }

  async function handleSaveAndPdf() {
    if (!inferMut.data) return;
    setIsSaving(true);

    try {
      const diseaseName = CLASS_NAMES[inferMut.data.class_id] || "Unknown";

      if (user && user.AcNo) {
        try {
            await saveHistory({
            account_acno: user.AcNo,
            crop_type: cropType,
            disease: diseaseName,
            temperature: weather?.temp_c || null,
            humidity: weather?.humidity || null,
            location: locationName, 
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
            }
          }

          if (solution) {
              doc.addPage();
              doc.setFontSize(14);
              doc.setTextColor(46, 125, 50);
              doc.text("AI Recommended Treatment", 20, 20);
              doc.setFontSize(10);
              doc.setTextColor(0);

              const splitText = doc.splitTextToSize(solution, 170);
              doc.text(splitText, 20, 30);
          }

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
      <h3 className="text-3xl font-bold mb-20 text-emerald-600">Scan disease with Cropvision 2.0</h3>
        <div className="flex items-center justify-between mb-4">
          
          <h1 className="text-2xl font-bold flex items-center gap-3">
           
            {user?.AcNo && (
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                Account ID: <span className="text-gray-900 font-bold ">{user.AcNo}</span>
              </span>
            )}
          </h1>
        </div>

        <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-6">
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

          {/* Right Column: Results */}
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
                    
                    {/* --- ADDED: DISEASE VISUALIZATION --- */}
                    {inferMut.data.visualization ? (
                      <div className="mt-4 border-t pt-3">
                        <div className="text-xs font-semibold text-gray-500 mb-2">DETECTION OUTPUT</div>
                        <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex justify-center">
                          <img 
                            src={`data:image/jpeg;base64,${inferMut.data.visualization}`} 
                            alt="AI Detection Output" 
                            className="max-h-64 object-contain" 
                          />
                        </div>
                      </div>
                    ) : preview && (
                      <div className="mt-4 border-t pt-3 opacity-70">
                        <div className="text-xs font-semibold text-gray-500 mb-2">ORIGINAL IMAGE</div>
                        <img src={preview} alt="Uploaded" className="w-full h-32 object-cover rounded border" />
                      </div>
                    )}

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
                      <h4 className="font-bold text-green-800 mb-2">🌱 AI Expert Advice {solution.includes("Demo") && "(Offline Mode)"}</h4>
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