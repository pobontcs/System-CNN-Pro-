from django.urls import path
from . import views

urlpatterns = [
    path("ping", views.ping, name="ping"),
    path("infer", views.InferView.as_view(), name="infer"),
    path("tips", views.tips, name="tips"),
    path("detections", views.detections, name="detections"),
    path("alerts", views.alerts, name="alerts"),
    path("weather", views.weather, name="weather"),
    path("air", views.air, name="air"),
    path("me", views.me, name="me"),
]
