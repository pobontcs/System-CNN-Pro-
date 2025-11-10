from django.http import JsonResponse
import requests
def hello(request):
    return JsonResponse({'message': 'API is working!'})
def thelo(request):
    return JsonResponse({'':'Test 1 cleared'})