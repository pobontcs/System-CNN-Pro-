import React, { useMemo, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Nav from "../components/Layout/Nav";

const DJANGO_BASE = "http://127.0.0.1:8000/api";





function Container({ children }) {
  return <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>;
}



function HistoryContent() {

  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  
  useEffect(() => {
    let isMounted = true; 

    async function fetchHistoryData() {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem("cc_token");
       
        const url = `${DJANGO_BASE}/history_list/?limit=500`;

        console.log("Fetching real history from:", url);

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Server Error: ${res.status} ${errText}`);
        }

        const jsonResponse = await res.json();

        let data = [];
        if (Array.isArray(jsonResponse)) {
            data = jsonResponse;
        } else if (jsonResponse && Array.isArray(jsonResponse.data)) {
            data = jsonResponse.data;
        }

        if (isMounted) {
          setRows(data);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHistoryData();

 
    return () => {
      isMounted = false;
    };
  }, []); 


  const filtered = useMemo(() => {
    if (!Array.isArray(rows)) return [];

    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter(r => {
      const disease = (r.disease || r.label || "").toLowerCase();
      const crop = (r.crop_type || "").toLowerCase();
      const loc = (r.location || "").toLowerCase();
      const rec = String(r.recordNo || "");

      return disease.includes(q) || crop.includes(q) || loc.includes(q) || rec.includes(q);
    });
  }, [rows, query]);

  return (
    <>
      <Nav />
      <Container>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Scan History</h1>
          <input
            className="rounded-md border p-2 bg-white/80 w-60"
            placeholder="Search Record, Disease, Address..."
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border shadow-sm bg-[#F1EDE8] p-3 overflow-auto min-h-[50vh]">
          {isLoading && <div className="text-sm text-gray-600 p-4">Loading history records...</div>}
          
          {error && (
            <div className="text-sm text-red-600 p-4 bg-red-50 border border-red-200 rounded">
              <strong>Error:</strong> Could not load history. {error.message}
            </div>
          )}
          
          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-sm text-gray-600 p-4">No history records found.</div>
          )}

          {!isLoading && filtered.length > 0 && (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
                <tr className="border-b">
                  <th className="py-3 px-3">Record No</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Crop</th>
                  <th className="py-3 px-3">Disease</th>
                  <th className="py-3 px-3">Temp</th>
                  <th className="py-3 px-3">Humidity</th>
                  <th className="py-3 px-3">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((r, i) => (
                  <tr key={r.recordNo || i} className="hover:bg-white/50 transition-colors">
                    {/* Record Number */}
                    <td className="py-3 px-3 font-mono font-bold text-gray-600">
                      #{r.recordNo}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                      {r.record_date 
                        ? new Date(r.record_date).toLocaleString() 
                        : (r.captured_at ? new Date(r.captured_at).toLocaleString() : "-")}
                    </td>

                    {/* Crop Type */}
                    <td className="py-3 px-3 capitalize font-medium">
                      {r.crop_type || "-"}
                    </td>

                    {/* Disease Name */}
                    <td className="py-3 px-3 text-red-600 font-medium">
                      {r.disease || r.label || "Unknown"}
                    </td>

                    {/* Temperature */}
                    <td className="py-3 px-3">
                      {r.temperature ? `${r.temperature}°C` : "-"}
                    </td>

                    {/* Humidity */}
                    <td className="py-3 px-3">
                      {r.humidity ? `${r.humidity}%` : "-"}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 text-gray-500 text-xs max-w-[200px] truncate" title={r.location}>
                      {r.location || (r.lat ? `${r.lat}, ${r.lon}` : "-")}
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

const queryClient = new QueryClient();

export default function History() {
  return (
    <QueryClientProvider client={queryClient}>
      <HistoryContent />
    </QueryClientProvider>
  );
}