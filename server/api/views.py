# server/api/views.py
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

def root(request):
    # GET /api/
    return JsonResponse({"message": "CropCare API is running!"})

@require_GET
def ping(request):
    # GET /api/ping/
    return JsonResponse({"status": "ok"})

def tips(request):
    # GET /api/tips/
    return JsonResponse({"tips": []})

def detections(request):
    # GET /api/detections/
    return JsonResponse([], safe=False)

def alerts(request):
    # GET /api/alerts/
    return JsonResponse({"alerts": []})

def weather(request):
    # GET /api/weather/
    return JsonResponse({"location": None, "forecast": []})

def air(request):
    # GET /api/air/
    return JsonResponse({"aqi": None})

class InferView(APIView):
    # POST /api/infer/  (multipart form-data: image=<file>)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        f = request.FILES.get("image") or request.FILES.get("file")
        if not f:
            return JsonResponse({"error": "image file required (field: 'image' or 'file')"}, status=400)

        # TODO: run your TensorFlow model here and return real results.
        # For now, just return a minimal, valid JSON response.
        return JsonResponse({
            "label": "healthy",
            "confidence": 0.99,
            "explainable_mask": None,
            "size_bytes": f.size,
            "filename": f.name,
        })
