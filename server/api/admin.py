from django.contrib import admin
from .models import Detection, UserProfile

@admin.register(Detection)
class DetectionAdmin(admin.ModelAdmin):
    list_display = ("id", "label", "severity_band", "confidence", "captured_at", "user")
    list_filter = ("severity_band", "label", "captured_at")
    search_fields = ("label", "advice")

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "name", "home_lat", "home_lon")
