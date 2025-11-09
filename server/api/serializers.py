from rest_framework import serializers
from .models import Detection, UserProfile

class DetectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detection
        fields = [
            "id", "user", "photo", "lat", "lon",
            "label", "confidence", "severity_band",
            "explainable_overlay", "advice",
            "weather_json", "captured_at",
        ]
        read_only_fields = ["id", "user", "captured_at", "explainable_overlay", "weather_json"]

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["name", "avatar", "home_lat", "home_lon"]
