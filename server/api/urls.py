# server/api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("ping", views.ping, name="ping"),
    path("detections", views.detections, name="detections"),     # GET list, POST create
    path("tips", views.tips, name="tips"),
    path("weather", views.weather, name="weather"),
    path("air", views.air, name="air"),
    path("alerts", views.alerts, name="alerts"),
    path("me", views.me, name="me"),
    path("me/update", views.update_profile, name="update_profile"),
]
