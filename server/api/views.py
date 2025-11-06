from datetime import datetime, timedelta
import random
from pathlib import Path

from django.conf import settings
from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# -------------------------
# Simple helpers
# -------------------------
def _now_iso():
    return datetime.utcnow().isoformat() + "Z"

def _rand_latlon():
    # Somewhere around Dhaka
    lat = 23.7 + random.uniform(-0.3, 0.3)
    lon = 90.4 + random.uniform(-0.3, 0.3)
    return round(lat, 6), round(lon, 6)

# In-memory "DB" for demo; replace with real models later
DETECTIONS = []

# -------------------------
# /api/ping
# -------------------------
def ping(request):
    return JsonResponse({"ok": True, "time": _now_iso()})

# -------------------------
# /api/infer (multipart/form-data)
# fields: image, crop_type, crop_stage, [lat, lon, acc]
# -------------------------
class InferView(APIView):
    def post(self, request):
        # Validate
        img = request.FILES.get("image")
        if not img:
            return Response({"detail": "image is required"}, status=status.HTTP_400_BAD_REQUEST)

        crop_type = request.data.get("crop_type") or ""
        crop_stage = request.data.get("crop_stage") or ""
        lat = request.data.get("lat")
        lon = request.data.get("lon")
        acc = request.data.get("acc")

        # Save the uploaded file to MEDIA_ROOT
        media_root = Path(settings.MEDIA_ROOT)
        media_root.mkdir(parents=True, exist_ok=True)
        saved_path = default_storage.save(f"uploads/{datetime.utcnow().timestamp()}_{img.name}", img)
        image_url = settings.MEDIA_URL + saved_path

        # Fake "model" output
        label = random.choice(["Leaf Blight", "Leaf Spot", "Brown Rust", "Healthy"])
        conf = random.uniform(0.55, 0.98)
        severity = random.choices(["low", "medium", "high"], weights=[3, 4, 2])[0]

        # Optional fake heatmap
        heatmap_url = None  # You can host a placeholder or generate one later

        tips = [
            "Remove severely infected leaves to reduce spread.",
            "Avoid overhead irrigation late in the day.",
            "Apply a recommended fungicide if symptoms worsen.",
            "Ensure good air flow between plants.",
        ]

        item = {
            "id": len(DETECTIONS) + 1,
            "label": label,
            "confidence": round(conf, 3),
            "severity": severity,
            "crop_type": crop_type,
            "crop_stage": crop_stage,
            "image_url": image_url,
            "heatmap_url": heatmap_url,
            "tips": tips[: random.randint(2, 4)],
            "captured_at": _now_iso(),
        }
        if lat and lon:
            try:
                item["lat"] = float(lat)
                item["lon"] = float(lon)
                if acc:
                    item["acc"] = float(acc)
            except ValueError:
                pass

        # Persist to memory for history
        DETECTIONS.append(item)

        return Response(item, status=200)

# -------------------------
# /api/tips
# -------------------------
def tips(request):
    out = {
        "tips": [
            "Scout your field after rainfall for early symptoms.",
            "Disinfect tools when moving between fields.",
            "Use resistant varieties when available.",
            "Maintain proper plant spacing to reduce humidity.",
        ]
    }
    return JsonResponse(out)

# -------------------------
# /api/detections?limit=&offset=
# -------------------------
def detections(request):
    try:
        limit = int(request.GET.get("limit", "100"))
        offset = int(request.GET.get("offset", "0"))
    except ValueError:
        limit, offset = 100, 0

    data = DETECTIONS[offset : offset + limit]
    return JsonResponse(data, safe=False)

# -------------------------
# /api/alerts
# Returns a LIST of regional alerts (not an object)
# Each item has: region, center{lat,lon}, severity, top_disease, tips[], summary, [radius_m|polygon]
# -------------------------
def alerts(request):
    regions = [
        {
            "region": "Gazipur",
            "center": {"lat": 23.999, "lon": 90.420},
            "severity": "medium",
            "top_disease": "Leaf Blight",
            "radius_m": 6000,
            "tips": [
                "Rotate crops to break disease cycles.",
                "Spray at dusk to reduce leaf burn risk.",
            ],
            "summary": "Several cases reported after a wet week; monitor seedlings closely.",
        },
        {
            "region": "Narayanganj",
            "center": {"lat": 23.620, "lon": 90.510},
            "severity": "high",
            "top_disease": "Brown Rust",
            "polygon": [
                [23.63, 90.49], [23.64, 90.55], [23.60, 90.57], [23.58, 90.50],
            ],
            "tips": [
                "Remove volunteer plants acting as hosts.",
                "Consider a protective fungicide if symptoms spread fast.",
            ],
            "summary": "High humidity and warmth have driven localized outbreaks.",
        },
        {
            "region": "Tangail",
            "center": {"lat": 24.251, "lon": 89.916},
            "severity": "low",
            "top_disease": "Leaf Spot",
            "radius_m": 8000,
            "tips": [
                "Ensure field sanitation.",
                "Avoid overhead watering during late evening.",
            ],
            "summary": "Only sporadic reports; keep regular scouting.",
        },
    ]
    return JsonResponse(regions, safe=False)

# -------------------------
# /api/weather?lat=&lon=
# Returns minimal weather context to drive risk notes
# -------------------------
def weather(request):
    # If lat/lon missing, just return a default "near Dhaka"
    try:
        lat = float(request.GET.get("lat", "23.78"))
        lon = float(request.GET.get("lon", "90.41"))
    except ValueError:
        lat, lon = 23.78, 90.41

    # Static-but-realistic sample values; plug in real API later
    out = {
        "lat": lat,
        "lon": lon,
        "temp_c": round(random.uniform(24, 36), 1),
        "humidity": random.randint(55, 95),
        "wind_ms": round(random.uniform(0.5, 6.5), 1),
        "uv_index": round(random.uniform(3, 11), 1),
        "rain_mm": random.choice([0, 0, 2, 5, 12]),
        "time": _now_iso(),
    }
    return JsonResponse(out)

# -------------------------
# /api/air?lat=&lon=
# -------------------------
def air(request):
    try:
        lat = float(request.GET.get("lat", "23.78"))
        lon = float(request.GET.get("lon", "90.41"))
    except ValueError:
        lat, lon = 23.78, 90.41

    aqi = random.randint(35, 160)
    category = (
        "Good" if aqi < 50 else
        "Moderate" if aqi < 100 else
        "Unhealthy for Sensitive Groups"
    )
    out = {
        "lat": lat,
        "lon": lon,
        "aqi": aqi,
        "category": category,
        "pm25": round(random.uniform(8, 75), 1),
        "pm10": round(random.uniform(12, 110), 1),
        "o3": round(random.uniform(10, 70), 1),
        "time": _now_iso(),
    }
    return JsonResponse(out)

# -------------------------
# /api/me  (simple demo profile)
# GET -> return a simple profile
# POST (multipart) -> update name/avatar (store file)
# -------------------------
@csrf_exempt
def me(request):
    if request.method == "POST":
        name = request.POST.get("name", "Farmer")
        avatar = request.FILES.get("avatar")
        avatar_url = ""
        if avatar:
            saved_path = default_storage.save(f"avatars/{datetime.utcnow().timestamp()}_{avatar.name}", avatar)
            avatar_url = settings.MEDIA_URL + saved_path
        return JsonResponse({"name": name, "avatar_url": avatar_url})

    # GET
    return JsonResponse({"name": "Farmer", "avatar_url": ""})
