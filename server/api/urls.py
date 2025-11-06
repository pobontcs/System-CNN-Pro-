# server/api/urls.py
from django.urls import path
from .views import (
    root,           # "/" under /api/
    ping,           # /api/ping/
    InferView,      # /api/infer/ (POST image)
    tips,           # /api/tips/
    detections,     # /api/detections/
    alerts,         # /api/alerts/
    weather,        # /api/weather/
    air,            # /api/air/
)

urlpatterns = [
    path("", root, name="api-root"),
    path("ping/", ping, name="api-ping"),
    path("infer/", InferView.as_view(), name="api-infer"),
    path("tips/", tips, name="api-tips"),
    path("detections/", detections, name="api-detections"),
    path("alerts/", alerts, name="api-alerts"),
    path("weather/", weather, name="api-weather"),
    path("air/", air, name="api-air"),
]
