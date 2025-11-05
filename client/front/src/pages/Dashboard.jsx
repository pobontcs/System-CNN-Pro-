// src/pages/Dashboard.jsx
import { useMemo } from "react";
import Nav from "../components/Layout/Nav";
import Container from "../components/Layout/Container";
import { useQuery } from "@tanstack/react-query";
import { listDetections, getTips } from "../lib/api";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = {
  cream: "#F1EDE8",
  leaf: "#4CAF50",
  rose: "#ef4444",
  amber: "#f59e0b",
  emerald: "#10b981",
  border: "#DAD7CD",
};

export default function Dashboard() {
  const { data: detections = [], isLoading: detLoading, error: detErr } = useQuery({
    queryKey: ["detections", { limit: 500 }],
    queryFn: () => listDetections({ limit: 500 }),
  });

  const { data: tipsData, isLoading: tipsLoading, error: tipsErr } = useQuery({
    queryKey: ["tips"],
    queryFn: getTips,
  });

  const byDay = useMemo(() => {
    const map = new Map();
    for (const r of detections) {
      const d = r.captured_at ? new Date(r.captured_at) : new Date();
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const now = new Date();
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: key.slice(5), scans: map.get(key) ?? 0 });
    }
    return out;
  }, [detections]);

  const pie = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    for (const r of detections) {
      const band = r.severity_band || "low";
      counts[band] = (counts[band] ?? 0) + 1;
    }
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
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {(detLoading || tipsLoading) && <p className="text-sm text-gray-600">Loading…</p>}
          {detErr && <p className="text-sm text-red-600">Error loading detections</p>}
          {tipsErr && <p className="text-sm text-red-600">Error loading tips</p>}
        </div>

        {/* KPIs */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card title="Total Scans" value={detections.length} />
          <Card
            title="High Severity"
            value={detections.filter((r) => r.severity_band === "high").length}
          />
          <Card
            title="Last 7 Days"
            value={
              detections.filter(
                (r) => Date.now() - new Date(r.captured_at || Date.now()).getTime() < 7 * 86400000
              ).length
            }
          />
        </div>

        {/* Charts */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <ChartCard title="Scans by Day (last 14)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay} margin={{ left: 8, right: 8 }}>
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="scans" fill={COLORS.leaf} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Severity Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" outerRadius={90} label>
                  {pie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* AI Tips */}
        <div className="mt-6 rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.cream, borderColor: COLORS.border }}>
          <div className="font-semibold mb-2">AI Tips</div>
          <ul className="space-y-2 text-sm text-gray-700">
            {(tipsData?.tips ?? []).map((t, i) => (
              <li key={i} className="rounded-md bg-white/70 p-2 border" style={{ borderColor: COLORS.border }}>
                {t}
              </li>
            ))}
            {(!tipsData?.tips || tipsData.tips.length === 0) && (
              <li className="text-gray-500">No tips yet.</li>
            )}
          </ul>
        </div>
      </Container>
    </>
  );
}

function Card({ title, value }) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{ background: COLORS.cream, borderColor: COLORS.border }}
    >
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-3xl font-extrabold">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-sm h-80"
      style={{ background: COLORS.cream, borderColor: COLORS.border }}
    >
      <div className="font-semibold mb-2">{title}</div>
      <div className="h-64">{children}</div>
    </div>
  );
}
