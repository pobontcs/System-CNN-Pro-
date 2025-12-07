import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import Nav from "../components/Layout/Nav";

// --- API BASE URLS ---
const DJANGO_BASE = "http://127.0.0.1:8000/api";
const ML_BASE = "http://127.0.0.1:2526/api";

// --- COLORS ---
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

// --- DEMO DATA (fallbacks) ---

const DEMO_USER = {
  name: "John Farmer",
  AcNo: "AC-102938",
  avatar_url: "https://i.pravatar.cc/150?img=12",
};

const DEMO_DETECTIONS = [
  { id: 1, crop_type: "Rice", severity: "low", captured_at: "2025-11-27T08:23:00Z" },
  { id: 2, crop_type: "Wheat", severity: "medium", captured_at: "2025-11-27T10:41:00Z" },
  { id: 3, crop_type: "Mango", severity: "high", captured_at: "2025-11-26T07:10:00Z" },
  { id: 4, crop_type: "Rice", severity: "high", captured_at: "2025-11-25T09:50:00Z" },
  { id: 5, crop_type: "Potato", severity: "low", captured_at: "2025-11-24T16:32:00Z" },
  { id: 6, crop_type: "Tomato", severity: "medium", captured_at: "2025-11-24T13:18:00Z" },
  { id: 7, crop_type: "Wheat", severity: "low", captured_at: "2025-11-23T11:20:00Z" },
  { id: 8, crop_type: "Rice", severity: "medium", captured_at: "2025-11-22T15:00:00Z" },
  { id: 9, crop_type: "Banana", severity: "high", captured_at: "2025-11-21T09:45:00Z" },
  { id: 10, crop_type: "Tomato", severity: "low", captured_at: "2025-11-21T08:15:00Z" },
];

const DEMO_TIPS = {
  tips: [
    "Ensure crops receive 6–8 hours of sunlight.",
    "Use neem oil weekly to protect from pests.",
    "Avoid overwatering to prevent root rot.",
    "Add compost every 15 days.",
    "Mulching reduces water loss and weeds.",
  ],
};

// --- HELPERS ---
function getToken() {
  try {
    return localStorage.getItem("cc_token") || "";
  } catch (e) {
    return "";
  }
}

// --- LAYOUT COMPONENT ---
function Container({ children }) {
  return <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>;
}

// --- PROFILE EDITOR ---
function ProfileEditor({ me, onClose, onSave }) {
  const [name, setName] = useState(me?.name || "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input className="w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} />

        <div className="flex justify-end gap-2 mt-4">
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

// --- API WITH FALLBACK DEMO ---


async function getMe() {
  try {
    const token = getToken();
    if (!token) return DEMO_USER;

    const res = await fetch(`${DJANGO_BASE}/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return DEMO_USER;

    return await res.json();
  } catch (e) {
    return DEMO_USER;
  }
}

async function getTips() {
  try {
    const res = await fetch(`${ML_BASE}/tips`);
    if (!res.ok) return DEMO_TIPS;
    return await res.json();
  } catch (e) {
    return DEMO_TIPS;
  }
}

// --- MAIN DASHBOARD ---
function DashboardContent() {
  const qc = useQueryClient();

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
    initialData: localUser || DEMO_USER,
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

  // --- CHART DATA ---
  const byDay = useMemo(() => {
    const map = new Map();
    for (const r of detections) {
      const key = new Date(r.captured_at).toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const now = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now - (13 - i) * 86400000);
      const key = d.toISOString().slice(0, 10);
      return { day: key.slice(5), scans: map.get(key) ?? 0 };
    });
  }, [detections]);

  const pie = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    for (const r of detections) counts[r.severity]++;

    return [
      { name: "Low", value: counts.low, color: COLORS.emerald },
      { name: "Medium", value: counts.medium, color: COLORS.amber },
      { name: "High", value: counts.high, color: COLORS.rose },
    ];
  }, [detections]);

  const accountId = me?.AcNo || "N/A";
  const displayName = me?.name || "Farmer";

  return (
    <>
      <Nav />
      <Container>

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-sm border">
          <button onClick={() => setOpenEdit(true)} className="relative group">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center text-2xl border-2 border-green-500 overflow-hidden">
              {me?.avatar_url ? (
                <img src={me.avatar_url} className="w-full h-full object-cover" />
              ) : "👨‍🌾"}
            </div>
            <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white text-green-600 text-xs border shadow-sm flex items-center justify-center">
              ✏️
            </span>
          </button>

          <div>
            <div className="text-sm text-gray-500 font-medium">Welcome back,</div>
            <div className="text-2xl font-extrabold text-gray-900">{displayName}</div>

            <span className="mt-1 inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border font-mono">
              Account ID: <strong>{accountId}</strong>
            </span>
          </div>
        </div>

        {/* STATS */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border p-5 shadow-sm bg-[#F1EDE8]">
            <div className="text-sm text-gray-600">Total Scans</div>
            <div className="text-4xl font-extrabold">{detections.length}</div>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm bg-[#F1EDE8]">
            <div className="text-sm text-gray-600">High Severity</div>
            <div className="text-4xl font-extrabold text-rose-600">
              {detections.filter(r => r.severity === "high").length}
            </div>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm bg-[#F1EDE8]">
            <div className="text-sm text-gray-600">Active Crops</div>
            <div className="text-4xl font-extrabold text-green-700">
              {new Set(detections.map(d => d.crop_type)).size}
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="rounded-2xl border p-5 shadow-sm bg-white h-80">
            <div className="font-bold mb-4">Activity (Last 14 Days)</div>

            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="scans" fill={COLORS.leaf} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="rounded-2xl border p-5 shadow-sm bg-white h-80">
            <div className="font-bold mb-4">Disease Severity</div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" outerRadius={80} innerRadius={50} paddingAngle={5}>
                  {pie.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TIPS */}
        <div className="mt-6 rounded-2xl border p-6 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <div className="font-bold text-green-800 mb-3 flex items-center gap-2">
            💡 AI Farming Tips
          </div>

          <ul className="space-y-3">
            {(tipsData?.tips || DEMO_TIPS.tips).map((t, i) => (
              <li key={i} className="flex gap-3 text-sm bg-white p-3 rounded-lg border shadow-sm">
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

// --- WRAPPER ---
const queryClient = new QueryClient();

export default function Dashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}
