from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from .models import Detection, UserProfile
from .serializers import DetectionSerializer, UserProfileSerializer

User = get_user_model()

@api_view(["GET"])
def ping(request):
    return Response({"ok": True})

# -------- Detections (list/create) --------
@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([permissions.AllowAny])  # loosen for dev; tighten later
def detections(request):
    if request.method == "GET":
        qs = Detection.objects.all()[:500]
        return Response(DetectionSerializer(qs, many=True).data)

    # POST (multipart/form-data)
    photo = request.FILES.get("photo")
    label = request.data.get("label", "unknown")
    confidence = float(request.data.get("confidence", 0))
    severity_band = request.data.get("severity_band", "low")
    lat = request.data.get("lat")
    lon = request.data.get("lon")
    advice = request.data.get("advice", "")

    item = Detection.objects.create(
        user=request.user if request.user.is_authenticated else None,
        photo=photo,
        label=label,
        confidence=confidence,
        severity_band=severity_band,
        lat=lat or None,
        lon=lon or None,
        advice=advice,
    )
    return Response(DetectionSerializer(item).data, status=status.HTTP_201_CREATED)

# -------- Tips (simple: derive from last detection) --------
@api_view(["GET"])
def tips(request):
    last = Detection.objects.first()
    tips = []
    if last:
        if last.severity_band == "high":
            tips += ["Isolate affected leaves", "Apply recommended fungicide", "Improve airflow"]
        elif last.severity_band == "medium":
            tips += ["Increase monitoring frequency", "Use organic copper-based spray"]
        else:
            tips += ["Maintain spacing", "Avoid overhead watering in evenings"]
    return Response({"tips": tips})

# -------- Weather / Air passthrough (your existing function logic can stay) --------
@api_view(["GET"])
def weather(request):
    # placeholder: return minimal structure the FE expects
    return Response({"temp_c": 30.0, "humidity": 70, "wind_ms": 2.0, "uv_index": 5.0, "rain_mm": 0})

@api_view(["GET"])
def air(request):
    return Response({"aqi": 75, "category": "Moderate", "pm25": 35, "pm10": 40, "o3": 20})

# -------- Regional Alerts (keep or replace with your data) --------
@api_view(["GET"])
def alerts(request):
    # FE expects an array. You can replace with DB-backed data later.
    data = [
        {
            "region": "Gazipur",
            "center": {"lat": 23.999, "lon": 90.420},
            "top_disease": "Leaf Blight",
            "severity": "medium",
            "summary": "Humidity elevated; sporadic infections likely.",
            "tips": ["Scout every 2 days", "Remove heavily infected leaves"],
            "radius_m": 4000,
        }
    ]
    return Response(data)

# -------- Me (profile) --------
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def me(request):
    # dev-only: return anonymous profile placeholder
    prof, _ = UserProfile.objects.get_or_create(user=request.user) if request.user.is_authenticated else (None, False)
    data = {"name": prof.name if prof else "Guest", "avatar_url": prof.avatar.url if (prof and prof.avatar) else ""}
    return Response(data)

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def update_profile(request):
    prof, _ = UserProfile.objects.get_or_create(user=request.user)
    ser = UserProfileSerializer(prof, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data)
