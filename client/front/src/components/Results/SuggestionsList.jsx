import { useQuery } from "@tanstack/react-query";
import { listDetections } from "../../lib/api";

export default function ResultsList() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["detections"],
    queryFn: listDetections,
    select: (r) => r.data,  // array
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Loading results...</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Recent Detections</h2>
        <button onClick={refetch} disabled={isRefetching} className="btn">
          {isRefetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <ul className="space-y-2">
        {data?.map((d) => (
          <li key={d.id ?? d.created_at} className="p-3 rounded border">
            <div><b>{d.label}</b> {(d.confidence*100).toFixed?.(1) ?? d.confidence}%</div>
            <div>Severity: {d.severity || "n/a"}</div>
            {d.image && <img src={d.image} alt={d.label} className="mt-2 max-h-40 rounded" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
