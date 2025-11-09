import SeverityBadge from "./SeverityBadge";
import { pc1, pct } from "../../lib/utils";

export default function ResultCard({ r }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-600">Detected</div>
      <div className="text-xl font-semibold">
        {r.label} <span className="text-sm text-gray-500">({pc1(r.confidence)})</span>
      </div>
      <div className="mt-1">
        <SeverityBadge band={r.severity_band} />
        <span className="ml-2 text-sm text-gray-600">Severity: {pct(r.severity_percent)}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {new Date(r.captured_at).toLocaleString()}
        {r.lat != null && r.lon != null && (
          <> • {r.lat.toFixed(5)}, {r.lon.toFixed(5)}</>
        )}
      </div>
    </div>
  );
}
