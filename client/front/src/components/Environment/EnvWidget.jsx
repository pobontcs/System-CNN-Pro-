import { useQueries } from "@tanstack/react-query";
import { getWeather, getAir } from "../../lib/api";

export default function EnvWidget() {
  const results = useQueries({
    queries: [
      { queryKey: ["weather"], queryFn: getWeather, select: (r) => r.data },
      { queryKey: ["air"],     queryFn: getAir,     select: (r) => r.data },
    ],
  });
  const [wx, aq] = results;

  if (wx.isLoading || aq.isLoading) return <div>Loading environment…</div>;
  if (wx.error || aq.error) return <div className="text-red-600">Env error</div>;

  return (
    <div className="p-3 rounded border">
      <div className="font-semibold mb-1">Environment</div>
      <pre className="bg-gray-100 p-2 rounded overflow-auto">
        {JSON.stringify({ weather: wx.data, air: aq.data }, null, 2)}
      </pre>
    </div>
  );
}
