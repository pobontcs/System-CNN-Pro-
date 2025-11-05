import { useState } from "react";
import Container from "../components/Layout/Container";
import Nav from "../components/Layout/Nav";
import ImageUploader from "../components/Upload/ImageUploader";
import GeoCapture from "../components/Upload/GeoCapture";
import GradCamOverlay from "../components/Results/GradCamOverlay";
import ResultCard from "../components/Results/ResultCard";
import SuggestionsList from "../components/Results/SuggestionsList";
// import { inferImage, ping, USE_MOCK } from "../lib/api";
// import { mockInfer, mockPing } from "../lib/mock.js";

export default function HealthCheck(){
  const [status,setStatus] = useState("Ready");
  const [preview,setPreview] = useState();
  const [file,setFile] = useState();
  const [geo,setGeo] = useState({}); // {lat, lon}
  const [form,setForm] = useState({ plantName:"", crop:"", variety:"", notes:"" });
  const [res,setRes] = useState();
  const [explain,setExplain] = useState("");

  function onPick(f){
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  // Local explanation helper based on result label/severity.
  function explainFromResult(r) {
    const base = r.label;
    const sev = r.severity_band;
    const m = {
      healthy: "Leaf appears healthy; continue regular scouting and preventive practices.",
      blight: "Lesions suggest blight; early removal of hotspots and canopy airflow can slow spread.",
      rust: "Orange/brown pustules are consistent with rust; dry foliage reduces infection cycles.",
      mildew: "Powdery patches suggest mildew; reduce humidity, improve spacing, and scout adjacent plants."
    };
    return `${m[base] ?? "Signs indicate stress or disease."} Severity is ${sev}.`;
  }

  async function testBackend(){
    setStatus("Pinging...");
    try{
      const r = USE_MOCK ? await mockPing() : await ping();
      setStatus(r.ok ? "Backend connected ✅" : "Backend error ❌");
    }catch{ setStatus("Backend unreachable ❌"); }
  }

  async function analyze(){
    if (!file) return;
    setStatus("Analyzing...");
    try{
      const meta = { lat: geo.lat, lon: geo.lon, crop: form.crop, variety: form.variety, notes: form.notes };
      const r = USE_MOCK ? await mockInfer(file) : await inferImage(file, meta);
      setRes(r);
      setExplain(explainFromResult(r));
      setStatus("Done ✅");
    }catch(e){
      console.error(e);
      setStatus("Inference failed ❌");
    }
  }

  return (
    <>
      <Nav />
      <Container>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Health Check</h1>
          <button onClick={testBackend} className="rounded-lg bg-indigo-600 px-3 py-2 text-white">Test Backend</button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: capture + form */}
          <div className="space-y-4">
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-medium mb-2">Capture or upload</div>
              <input type="file" accept="image/*" capture="environment"
                     onChange={e => e.target.files?.[0] && onPick(e.target.files[0])}/>
              <div className="mt-2 text-xs text-gray-500">Tip: On mobile, this opens the camera.</div>
            </div>

            <div className="rounded-2xl border p-4 space-y-2">
              <div className="text-sm font-medium">Plant details</div>
              <input className="w-full rounded-md border p-2" placeholder="Plant name"
                     value={form.plantName} onChange={e=>setForm({...form, plantName: e.target.value})}/>
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded-md border p-2" placeholder="Crop"
                       value={form.crop} onChange={e=>setForm({...form, crop: e.target.value})}/>
                <input className="rounded-md border p-2" placeholder="Variety"
                       value={form.variety} onChange={e=>setForm({...form, variety: e.target.value})}/>
              </div>
              <textarea className="w-full rounded-md border p-2" placeholder="Notes (e.g., symptoms, field conditions)"
                        value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})}/>
              <div className="flex items-center gap-3">
                <GeoCapture onGeo={(lat,lon)=>setGeo({lat,lon})}/>
                <button className="rounded-lg bg-gray-900 px-3 py-2 text-white disabled:opacity-50" disabled={!file} onClick={analyze}>
                  Analyze
                </button>
                <div className="text-sm text-gray-600">Status: {status}</div>
              </div>
            </div>
          </div>

          {/* Right: results */}
          <div className="space-y-4">
            {preview && <GradCamOverlay src={preview} overlay={res?.gradcam_url} />}
            {res && (
              <>
                <ResultCard r={res} />
                <div className="rounded-2xl border p-4">
                  <div className="font-semibold mb-2">Possible cause & context</div>
                  <p className="text-sm text-gray-700">{explain}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6">
          <SuggestionsList items={res?.suggestions} />
        </div>
      </Container>
    </>
  );
}
