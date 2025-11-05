export default function SuggestionsList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-2xl border p-4">
      <div className="font-semibold mb-2">Suggestions</div>
      <ul className="space-y-2">
        {items
          .slice() // avoid mutating parent state
          .sort((a, b) => a.rank - b.rank)
          .map((s, i) => (
            <li key={i} className="rounded-md bg-gray-50 p-3">
              <div className="text-sm font-medium">
                {s.title} <span className="text-xs text-gray-500">({s.category})</span>
              </div>
              <div className="text-sm text-gray-600">{s.content_md}</div>
            </li>
          ))}
      </ul>
    </div>
  );
}
