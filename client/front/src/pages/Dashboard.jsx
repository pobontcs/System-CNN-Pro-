import { useMemo, useState } from "react";
import Nav from "../components/Layout/Nav";
import Container from "../components/Layout/Container";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDetections, getMe, getTips, updateMeProfile } from "../lib/api";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import ProfileEditor from "../components/Profile/ProfileEditor";

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

export default function Dashboard() {
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });

  const { data: detections = [] } = useQuery({
    queryKey: ["detections"],
    queryFn: () => listDetections({ limit: 500 }),
  });

  const { data: tipsData } = useQuery({
    queryKey: ["tips"],
    queryFn: () => getTips(),
  });

  const [openEdit, setOpenEdit] = useState(false);

  async function saveProfile(payload) {
    const next = await updateMeProfile(payload);
    qc.setQueryData(["me"], next);
  }

  const byDay = useMemo(() => {
    const map = new Map();
    for (const r of detections) {
      const key = new Date(r.captured_at).toISOString().slice(0, 10);
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
    for (const r of detections) counts[r.severity_band || r.severity || "low"] = (counts[r.severity_band || r.severity || "low"] ?? 0) + 1;
    return [
      { name: "Low", value: counts.low, color: COLORS.emerald },
      { name: "Medium", value: counts.medium, color: COLORS.amber },
      { name: "High", value: counts.high, color: COLORS.rose },
    ];
  }, [detections]);

  return (
    <>
      <Nav />
      <Container>
        <div className="flex items-center gap-3 mb-4">
          <button
            className="relative group"
            onClick={() => setOpenEdit(true)}
            title="Edit profile"
            aria-label="Edit profile"
          >
            <img
              src={me?.avatar_url || "/profile.jpg"}
              alt={me?.name || "User"}
              className="h-10 w-10 rounded-full object-cover border"
            />
            <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#4CAF50] text-white text-[10px] border">
              ✎
            </span>
          </button>

          <div>
            <div className="text-sm text-gray-600">Welcome</div>
            <div className="text-xl font-bold">{me?.name || "Your Name"}</div>
          </div>

          <div className="flex-1" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.cream, borderColor: COLORS.border }}>
            <div className="text-sm text-gray-600">Total Scans</div>
            <div className="text-3xl font-extrabold">{detections.length}</div>
          </div>
          <div className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.cream, borderColor: COLORS.border }}>
            <div className="text-sm text-gray-600">High Severity</div>
            <div className="text-3xl font-extrabold">
              {detections.filter((r) => (r.severity || r.severity_band) === "high").length}
            </div>
          </div>
          <div className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.cream, borderColor: COLORS.border }}>
            <div className="text-sm text-gray-600">Last 7 Days</div>
            <div className="text-3xl font-extrabold">
              {
                detections.filter(
                  (r) => Date.now() - new Date(r.captured_at).getTime() < 7 * 24 * 60 * 60 * 1000
                ).length
              }
            </div>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.cream, borderColor: COLORS.border }}>
            <div className="font-semibold mb-2">Scans by Day (last 14)</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDay} margin={{ left: 8, right: 8 }}>
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="scans" fill={COLORS.leaf} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.cream, borderColor: COLORS.border }}>
            <div className="font-semibold mb-2">Severity Distribution</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[...pie]} dataKey="value" nameKey="name" outerRadius={90} label>
                    {pie.map((entry, index) => (
                      <Cell key={`c-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.cream, borderColor: COLORS.border }}>
          <div className="font-semibold mb-2">AI Tips</div>
          <ul className="space-y-2 text-sm text-gray-700">
            {(tipsData?.tips ?? []).map((t, i) => (
              <li key={i} className="rounded-md bg-white/70 p-2 border" style={{ borderColor: COLORS.border }}>
                {t}
              </li>
            ))}
            {(!tipsData?.tips || tipsData.tips.length === 0) && (
              <li className="text-gray-500">No tips yet. Run a Health Check to see suggestions.</li>
            )}
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
