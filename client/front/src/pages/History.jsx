import { useMemo, useState } from "react";
import Nav from "../components/Layout/Nav";
import Container from "../components/Layout/Container";
import { useQuery } from "@tanstack/react-query";
import { listDetections } from "../lib/api";

export default function History() {
  const [query, setQuery] = useState("");
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["detections", 500],
    queryFn: () => listDetections({ limit: 500 }),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.label || "").toLowerCase().includes(q) ||
      (r.severity || "").toLowerCase().includes(q) ||
      (r.crop_type || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <>
      <Nav />
      <Container>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Scan History</h1>
          <input
            className="rounded-md border p-2 bg-white/80 w-60"
            placeholder="Search disease / severity / crop"
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border shadow-sm bg-[#F1EDE8] p-3 overflow-auto">
          {isLoading && <div className="text-sm text-gray-600">Loading…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="text-sm text-gray-600">No scans found.</div>
          )}

          {filtered.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Crop</th>
                  <th className="py-2 pr-3">Disease</th>
                  <th className="py-2 pr-3">Severity</th>
                  <th className="py-2 pr-3">Confidence</th>
                  <th className="py-2 pr-3">Location</th>
                  <th className="py-2 pr-3">Preview</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id || i} className="border-b last:border-0">
                    <td className="py-2 pr-3">{r.captured_at ? new Date(r.captured_at).toLocaleString() : "-"}</td>
                    <td className="py-2 pr-3 capitalize">{r.crop_type || "-"}</td>
                    <td className="py-2 pr-3">{r.label || "-"}</td>
                    <td className="py-2 pr-3 capitalize">
                      <span className={`px-2 py-0.5 rounded-md ${
                        r.severity === "high" ? "bg-red-100 text-red-700" :
                        r.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {r.severity || "low"}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{r.confidence != null ? `${Math.round(r.confidence*100)}%` : "-"}</td>
                    <td className="py-2 pr-3">
                      {r.lat && r.lon ? `${r.lat.toFixed(4)}, ${r.lon.toFixed(4)}` : "-"}
                    </td>
                    <td className="py-2 pr-3">
                      {r.image_url ? (
                        <img src={r.image_url} alt="" className="h-12 w-12 rounded border object-cover" />
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Container>
    </>
  );
}
