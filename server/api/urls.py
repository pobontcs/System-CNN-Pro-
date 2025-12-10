from django.urls import path
from . import views

urlpatterns = [
    # temporary test route 
    path('', views.hello, name='hello'),
    path('test/', views.thelo, name='hello'),
    path('api/signup/', views.signup, name='signup'),
    path('api/login/', views.login, name='login'),
    path('api/submit/', views.save_history, name='save_history'),
    path('api/history_list/', views.get_history, name='get_history'),
  path('api/regional_alerts/', views.regional_alerts, name='regional_alerts'),
    path('api/me/',views.user_Auth, name='user_auth'),
       
]
