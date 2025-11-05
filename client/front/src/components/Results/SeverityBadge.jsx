export default function SeverityBadge({ band }) {
  const cls =
    band === "low"
      ? "bg-emerald-100 text-emerald-700"
      : band === "medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";
  return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${cls}`}>{band}</span>;
}
