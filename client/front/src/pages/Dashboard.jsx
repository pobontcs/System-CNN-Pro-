import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import Nav from "../components/Layout/Nav";
// --- CONFIGURATION ---
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

// --- INLINE HELPERS ---
function getToken() {
  try {
    return localStorage.getItem("cc_token") || "";
  } catch (e) {
    return "";
  }
}

// --- INLINE COMPONENTS ---



function Container({ children }) {
  return <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>;
}

function ProfileEditor({ me, onClose, onSave }) {
  const [name, setName] = useState(me?.name || "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input 
            className="w-full border p-2 rounded" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button 
            onClick={() => { onSave({ name }); onClose(); }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// --- INLINE API LOGIC ---

async function listDetections({ limit = 500 } = {}) {
  // Safe fetch that returns empty array if Django endpoint missing
  try {
    const res = await fetch(`${DJANGO_BASE}/history_list/?limit=${limit}`);
    if (!res.ok) return []; 
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function getMe() {
  const token = getToken();
  if (!token || token.includes("session")) return null;
  
  try {
      const res = await fetch(`${DJANGO_BASE}/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return await res.json();
  } catch(e) {
      return null;
  }
}

async function getTips() {
  try {
    const res = await fetch(`${ML_BASE}/tips`);
    if (!res.ok) return { tips: [] };
    return await res.json();
  } catch (e) {
    return { tips: [] };
  }
}

// --- MAIN DASHBOARD COMPONENT ---

function DashboardContent() {
  const qc = useQueryClient();

  // 1. Retrieve User from LocalStorage
  const localUser = useMemo(() => {
    try {
      const u = localStorage.getItem("user");
      return u && u !== "undefined" ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    initialData: localUser, 
  });

  const { data: detections = [] } = useQuery({
    queryKey: ["detections"],
    queryFn: () => listDetections({ limit: 500 }),
  });

  const { data: tipsData } = useQuery({
    queryKey: ["tips"],
    queryFn: getTips,
  });

  const [openEdit, setOpenEdit] = useState(false);

  async function saveProfile(payload) {
    const updatedUser = { ...me, ...payload };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    qc.setQueryData(["me"], updatedUser);
  }

  const byDay = useMemo(() => {
    const map = new Map();
    for (const r of detections) {
      const key = new Date(r.captured_at || r.record_date || new Date()).toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const now = new Date();
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: key.slice(5), scans: map.get(key) ?? 0 });
    }
    return out;
  }, [detections]);

  const pie = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    for (const r of detections) counts[r.severity || "low"] = (counts[r.severity || "low"] ?? 0) + 1;
    return [
      { name: "Low", value: counts.low, color: COLORS.emerald },
      { name: "Medium", value: counts.medium, color: COLORS.amber },
      { name: "High", value: counts.high, color: COLORS.rose },
    ];
  }, [detections]);

  // Logic to display Name and Account Number
  const accountId = me?.AcNo || localUser?.AcNo || "N/A";
  const displayName = me?.name && me.name !== "Farmer" ? me.name : "Farmer";

  return (
    <>
      <Nav />
      <Container>
        {/* HEADER SECTION */}
        <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <button
            className="relative group"
            onClick={() => setOpenEdit(true)}
            title="Edit profile"
          >
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center text-2xl border-2 border-green-500 overflow-hidden">
               {me?.avatar_url ? <img src={me.avatar_url} className="w-full h-full object-cover" /> : "👨‍🌾"}
            </div>
            <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-green-600 text-xs border shadow-sm cursor-pointer hover:bg-gray-50">
              ✏️
            </span>
          </button>

          <div>
            <div className="text-sm text-gray-500 font-medium">Welcome back,</div>
            <div className="text-2xl font-extrabold text-gray-900">{displayName}</div>
            
            {/* --- ACCOUNT NUMBER DISPLAY --- */}
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200 font-mono">
                Account ID: <strong>{accountId}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border p-5 shadow-sm bg-[#F1EDE8]">
            <div className="text-sm text-gray-600 font-medium">Total Scans</div>
            <div className="text-4xl font-extrabold text-gray-800 mt-1">{detections.length}</div>
          </div>
          <div className="rounded-2xl border p-5 shadow-sm bg-[#F1EDE8]">
            <div className="text-sm text-gray-600 font-medium">High Severity</div>
            <div className="text-4xl font-extrabold text-rose-600 mt-1">
              {detections.filter((r) => r.severity === "high").length}
            </div>
          </div>
          <div className="rounded-2xl border p-5 shadow-sm bg-[#F1EDE8]">
            <div className="text-sm text-gray-600 font-medium">Active Crops</div>
            <div className="text-4xl font-extrabold text-green-700 mt-1">
              {new Set(detections.map(d => d.crop_type)).size}
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-5 shadow-sm bg-white h-80">
            <div className="font-bold text-gray-800 mb-4">Activity (Last 14 Days)</div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDay}>
                  <XAxis dataKey="day" tick={{fontSize: 12}} />
                  <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="scans" fill={COLORS.leaf} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm bg-white h-80">
            <div className="font-bold text-gray-800 mb-4">Disease Severity</div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pie} 
                    dataKey="value" 
                    nameKey="name" 
                    outerRadius={80} 
                    innerRadius={50}
                    paddingAngle={5}
                  >
                    {pie.map((entry, index) => (
                      <Cell key={`c-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36}/>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TIPS SECTION */}
        <div className="mt-6 rounded-2xl border p-6 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <div className="font-bold text-green-800 mb-3 flex items-center gap-2">
            <span>💡</span> AI Farming Tips
          </div>
          <ul className="space-y-3">
            {(tipsData?.tips?.length > 0 ? tipsData.tips : [
              "Rotate crops every season to prevent soil depletion.",
              "Water plants early in the morning to reduce evaporation.",
              "Inspect leaves regularly for early signs of yellowing."
            ]).map((t, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700 bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                <span className="text-green-500 font-bold">•</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {openEdit && (
          <ProfileEditor
            me={me}
            onClose={() => setOpenEdit(false)}
            onSave={saveProfile}
          />
        )}
      </Container>
    </>
  );
}

// --- APP WRAPPER ---
const queryClient = new QueryClient();

export default function Dashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}