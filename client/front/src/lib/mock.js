// --- helpers / constants ---
const LABELS = ["healthy", "blight", "rust", "mildew"];
const SEVERITIES = ["low", "medium", "high"];

// keep an in-memory "me" state for mock mode
let mockMeState = { name: "Sabbir Ahmed", avatar_url: "/profile.jpg" };

// optional: reset mocks between tests
export function __resetMockState() {
  mockMeState = { name: "Sabbir Ahmed", avatar_url: "/profile.jpg" };
}

// --- connectivity ---
export async function mockPing() {
  await new Promise((r) => setTimeout(r, 200));
  return { ok: true };
}

// --- inference ---
export async function mockInfer(_file) {
  await new Promise((r) => setTimeout(r, 800));

  const label = LABELS[Math.floor(Math.random() * LABELS.length)];
  const severity_band = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
  const severity_percent =
    severity_band === "low" ? 7.2 : severity_band === "medium" ? 24.9 : 48.3;

  const gradcam_url = "/mock/gradcam.png";

  return {
    id: (crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    label,
    confidence: 0.92,
    severity_percent,
    severity_band,
    gradcam_url,
    captured_at: new Date().toISOString(),
    suggestions: [
      {
        title: "Improve airflow",
        category: "preventive",
        content_md: "Thin canopy; avoid late overhead irrigation.",
        rank: 1,
      },
      {
        title: "Scout hot spots",
        category: "immediate",
        content_md: "Inspect nearby leaves and prune infected tissue.",
        rank: 2,
      },
      {
        title: "Rotate actives",
        category: "immediate",
        content_md: "If spraying, rotate MoA as per local guidance.",
        rank: 3,
      },
    ],
  };
}

// --- profile (me) ---
export async function mockMe() {
  await new Promise((r) => setTimeout(r, 100));
  return { ...mockMeState };
}

export async function mockUpdateMeProfile(payload) {
  await new Promise((r) => setTimeout(r, 150));

  if (payload.name) mockMeState.name = payload.name;

  if (payload.avatarFile) {
    const blobUrl = URL.createObjectURL(payload.avatarFile);
    mockMeState.avatar_url = blobUrl;
  }
  return { ...mockMeState };
}

// --- detections & tips for Dashboard ---
export async function mockListDetections() {
  await new Promise((r) => setTimeout(r, 200));
  const now = Date.now();

  return Array.from({ length: 24 }, (_, i) => {
    const label = LABELS[Math.floor(Math.random() * LABELS.length)];
    const severity_band = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
    const raw =
      severity_band === "low"
        ? Math.random() * 10 + 1
        : severity_band === "medium"
        ? Math.random() * 20 + 15
        : Math.random() * 30 + 35;

    return {
      id: (crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + i)),
      label,
      confidence: 0.7 + Math.random() * 0.3,
      severity_percent: Math.round(raw),
      severity_band,
      gradcam_url: undefined,
      captured_at: new Date(
        now - i * 24 * 60 * 60 * 1000 - Math.random() * 1e6
      ).toISOString(),
      lat: 23.7 + Math.random() * 0.3,
      lon: 90.3 + Math.random() * 0.3,
      suggestions: [],
    };
  });
}

export async function mockGetTips() {
  await new Promise((r) => setTimeout(r, 120));
  return {
    tips: [
      "Avoid late-day overhead irrigation; keep foliage dry.",
      "Rotate fungicide modes of action to reduce resistance.",
      "Prune hotspots and sanitize tools between rows.",
    ],
  };
}

export async function mockRegionalAlerts() {
  await new Promise((r) => setTimeout(r, 180));
  return [
    {
      region: "Dhaka",
      center: { lat: 23.7806, lon: 90.4070 },
      radius_m: 7000,
      top_disease: "blight",
      severity: "high",
      summary: "Increased blight reports clustered near northern fields.",
      tips: [
        "Avoid late-day overhead irrigation",
        "Prune hotspots; bag and discard",
        "Consider protectant sprays per local guidance"
      ]
    },
    {
      region: "Gazipur",
      polygon: [
        [23.995, 90.38],
        [24.015, 90.42],
        [24.000, 90.50],
        [23.970, 90.46],
      ],
      center: { lat: 24.0, lon: 90.44 },
      top_disease: "mildew",
      severity: "medium",
      summary: "Favorable humidity for mildew, scattered cases.",
      tips: [
        "Increase spacing / airflow",
        "Scout undersides of leaves",
        "Avoid overhead irrigation late"
      ]
    }
  ];
}

export async function mockGetWeather(lat, lon) {
  await new Promise(r => setTimeout(r, 140));
  return {
    lat, lon,
    temp_c: 31.2,
    humidity: 72,
    wind_ms: 3.4,
    uv_index: 9.1,
    rain_mm: 2.5,
    clouds_pct: 45,
  };
}

export async function mockGetAirQuality(_lat, _lon) {
  await new Promise(r => setTimeout(r, 120));
  const aqi = 65; // Moderate
  return { aqi, category: aqi <= 50 ? "Good" : aqi <= 100 ? "Moderate" : "Unhealthy for SG", pm25: 22.4, pm10: 41.3, o3: 32 };
}
