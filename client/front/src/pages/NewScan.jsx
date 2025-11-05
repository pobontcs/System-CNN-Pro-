import { useState } from "react";
import Container from "../components/Layout/Container";
import Nav from "../components/Layout/Nav";
import ImageUploader from "../components/Upload/ImageUploader";
import GeoCapture from "../components/Upload/GeoCapture";
import GradCamOverlay from "../components/Results/GradCamOverlay";
import ResultCard from "../components/Results/ResultCard";
import SuggestionsList from "../components/Results/SuggestionsList";
import { inferImage, ping, USE_MOCK } from "../lib/api";
import { mockInfer, mockPing } from "../lib/mock";

export default function NewScan(){
  const [status,setStatus] = useState("Ready");
  const [preview,setPreview] = useState();
  const [file,setFile] = useState();
  const [geo,setGeo] = useState({}); // {lat, lon}
  const [res,setRes] = useState();

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
      const r = USE_MOCK ? await mockInfer(file) : await inferImage(file, geo);
      setRes(r);
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold mb-4">New Scan</h1>
          <button onClick={testBackend} className="rounded-lg bg-indigo-600 px-3 py-2 text-white">Test Backend</button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <ImageUploader onPick={(f)=>{ setFile(f); setPreview(URL.createObjectURL(f)); }} />
            <div className="flex gap-3">
              <GeoCapture onGeo={(lat,lon)=>setGeo({lat,lon})} />
              <button
                className="rounded-lg bg-gray-900 px-3 py-2 text-white disabled:opacity-50"
                onClick={analyze}
                disabled={!file}
              >
                Analyze Image
              </button>
            </div>
            <div className="text-sm text-gray-600">Status: {status}</div>
          </div>

          <div className="space-y-4">
            {preview && <GradCamOverlay src={preview} overlay={res?.gradcam_url} />}
            {res && <ResultCard r={res} />}
          </div>
        </div>

        <div className="mt-6">
          <SuggestionsList items={res?.suggestions} />
        </div>
      </Container>
    </>
  );
}
