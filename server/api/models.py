from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    name = models.CharField(max_length=120, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    home_lat = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    home_lon = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    def __str__(self):
        return self.name or f"Profile({self.user_id})"

SEVERITY = (
    ("low", "Low"),
    ("medium", "Medium"),
    ("high", "High"),
)

class Detection(models.Model):
    # Leaf Image Capture + Geolocation Tagging
    user = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    photo = models.ImageField(upload_to="detections/")
    lat = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    lon = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    # Model Output
    label = models.CharField(max_length=120)                # disease/class name
    confidence = models.FloatField(default=0.0)
    severity_band = models.CharField(max_length=10, choices=SEVERITY, default="low")

    # Explainable AI (store path to heatmap/overlay if you generate it)
    explainable_overlay = models.ImageField(upload_to="explain/", blank=True, null=True)

    # Treatment & Prevention Suggestions
    advice = models.TextField(blank=True, default="")

    # Weather-based Alerts (cache the weather snapshot if you want)
    weather_json = models.JSONField(blank=True, null=True)

    captured_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-captured_at"]

    def __str__(self):
        return f"{self.label} ({self.severity_band}) @ {self.captured_at:%Y-%m-%d}"
