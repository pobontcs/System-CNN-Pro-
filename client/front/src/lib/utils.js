export const pct = (n) => `${n.toFixed(1)}%`;
export const pc1 = (n) => `${(n * 100).toFixed(1)}%`;
export function clsx(...xs) {
  return xs.filter(Boolean).join(" ");
}
