from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),  # <- all backend API endpoints live here
]

# Serve uploaded media (user-uploaded images, etc.)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Optional: serve React build if you later build the frontend into Django
# (uncomment when deploying a single-port app)
# urlpatterns += [
#     path("", TemplateView.as_view(template_name="index.html")),
# ]
