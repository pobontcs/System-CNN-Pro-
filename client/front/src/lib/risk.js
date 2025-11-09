/**
 * @typedef {Object} WeatherData
 * @property {number=} temperatureC
 * @property {number=} humidity           // 0..1
 * @property {number=} rainfallMm
 * @property {number=} windKph
 * @property {number=} uvIndex
 * @property {number=} airQualityIndex
 * @property {number=} chanceOfRain       // 0..1
 */

/**
 * @typedef {"low"|"medium"|"high"|"critical"} RiskLevel
 */

/**
 * @typedef {{ level: RiskLevel, notes?: string[] }} Risk
 */

/** @param {WeatherData} w */
export function riskFromWeather(w = {}) {
  const t = w.temperatureC ?? 28;
  const h = w.humidity ?? 0.7;
  const r = w.rainfallMm ?? 0;
  const wind = w.windKph ?? 5;

  let score = 0;
  const notes = [];
  if (t >= 26 && t <= 34) { score += 2; notes.push("Warm temperature"); }
  if (h >= 0.75)         { score += 2; notes.push("High humidity"); }
  if (r >= 5)            { score += 2; notes.push("Recent rainfall"); }
  if (wind <= 8)         { score += 1; notes.push("Low wind"); }

  const level =
    score >= 6 ? "critical" :
    score >= 4 ? "high" :
    score >= 2 ? "medium" :
                 "low";

  return { level, notes };
}

export function formatAQI(aqi) {
  if (aqi == null) return { label: "—", band: "unknown" };
  const band =
    aqi <= 50  ? "Good" :
    aqi <= 100 ? "Moderate" :
    aqi <= 150 ? "Unhealthy (SG)" :
    aqi <= 200 ? "Unhealthy" :
    aqi <= 300 ? "Very Unhealthy" : "Hazardous";
  return { label: String(aqi), band };
}

export function formatUV(uv) {
  if (uv == null) return { label: "—", band: "unknown" };
  const band =
    uv < 3 ? "Low" :
    uv < 6 ? "Moderate" :
    uv < 8 ? "High" :
    uv < 11 ? "Very High" : "Extreme";
  return { label: String(uv), band };
}
