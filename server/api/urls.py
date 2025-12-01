from django.urls import path
from . import views

urlpatterns = [
    # temporary test route 
    path('', views.hello, name='hello'),
    path('test/', views.thelo, name='hello'),
    path('api/signup/', views.signup, name='signup'),
    path('api/login/', views.login, name='login'),
    
    
    
]
