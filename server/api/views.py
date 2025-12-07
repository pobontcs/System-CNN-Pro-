from django.http import JsonResponse
import requests
from .models import Account,History
from django.views.decorators.csrf import csrf_exempt    
import json
from django.contrib.auth.hashers import make_password, check_password
from geopy.geocoders import Nominatim


def hello(request):
    return JsonResponse({'message': 'API is working!'})
def thelo(request):
    return JsonResponse({'':'Test 1 cleared'})


@csrf_exempt
def signup(request):
    # (CORS) 
    if request.method == 'OPTIONS':
        response = JsonResponse({'message': 'OK'})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        return response

    # POST
    if request.method == 'POST': 
        try:
           data = json.loads(request.body)
           
           
           if Account.objects.filter(email=data['email']).exists():
               return JsonResponse({'message': 'Email already registered'}, status=400)
           
       
           if data.get('phone') and Account.objects.filter(phone=data['phone']).exists():
               return JsonResponse({'message': 'Phone number already registered'}, status=400)
           
     
           new_account = Account(
               name=data['name'],
               email=data['email'],
               password=make_password(data['password']),
               
        
               phone=data.get('phone') or None, 
               
               region=data.get('region'),
               area=data.get('area', ''),
               country=data.get('country', ''),
               zip_postal_code=data.get('zip', '')
           )
           new_account.save()
           
           return JsonResponse({'message':'Account created successfully', 'id': new_account.AcNo,'name': new_account.name }, status=201)

        except Exception as e:
            return JsonResponse({'message':'Invalid data format', 'error': str(e)}, status=400)
        

    return JsonResponse({'error': "Method not allowed"}, status=405)
@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            try:
                account = Account.objects.get(email=email)
            except Account.DoesNotExist:
                return JsonResponse({'message': 'Invalid email or password'}, status=401)

            if check_password(password, account.password):
                return JsonResponse({'message': 'Login successful', 'id': account.AcNo,'name':account.name}, status=200)
            else:
                return JsonResponse({'message': 'Invalid email or password'}, status=401)

        except Exception as e:
            return JsonResponse({'message': 'Invalid data format', 'error': str(e)}, status=400)
def getLocation(lat,lon):
    try:
       
        geolocator=Nominatim(user_agent="smart_cropcare_app_v1")
        location= geolocator.reverse((lat, lon),language='en',timeout=5)
        
        if location:
            address= location.raw.get('address', {})
            city =address.get('city') or address.get('town') or address.get('village','')
            state =address.get('state','')
            country =address.get('country','')
            
            #  "Mirpur, Dhaka, Bangladesh"
            parts = [p for p in [city, state, country] if p]
            return ", ".join(parts) # loc,loc2,country
            
    except Exception as e:
        print(f"Geocoding error: {e}")
    
    return None
    
    

@csrf_exempt
def save_history(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
          
            print("\n" + "="*40)
            
            print(f" AcNo: {data.get('account_acno')}")
            print(f"Crop: {data.get('crop_type')}")
            print(f"Disease: {data.get('disease')}")
            print(f"Coordinates: {data.get('lat')}, {data.get('lon')}")
            print("="*40 + "\n")
    
            account_acno = data.get('account_acno')
            crop_type = data.get('crop_type')
            disease = data.get('disease')
            temperature = data.get('temperature')
            humidity = data.get('humidity')
            
           
            lat = data.get('lat')
            lon = data.get('lon')
            location_val = data.get('location') 

            if lat and lon:
                try:
                   
                    generated_name = getLocation(float(lat), float(lon))
                    if generated_name:
                        location_val = generated_name
                        print(f"✅ Address Found: {location_val}") # Debug
                    else:
                        print("⚠️ Could not resolve address from coordinates.")
                except ValueError:
                    print("⚠️ Invalid coordinate format.")

      
            try:
                account = Account.objects.get(AcNo=account_acno)
            except Account.DoesNotExist:
                print(f"Account {account_acno} not found!") # Debug
                return JsonResponse({'message': 'Account does not exist'}, status=400)


            history_record = History(
                account_acno=account,
                crop_type=crop_type,
                disease=disease,
                temperature=temperature,
                humidity=humidity,
                location=location_val
            )
            history_record.save()
            
            print(f"💾 SAVED SUCCESS! Record No: {history_record.recordNo}") # Debug

            return JsonResponse({
                'message': 'History record saved successfully', 
                'location_saved': location_val,
                'recordNo': history_record.recordNo
            }, status=201)

        except Exception as e:
            print(f"🔥 ERROR in save_history: {e}") # Debug
            return JsonResponse({'message': 'Invalid data format', 'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def get_history(request):
    
  if request.method=="GET":
    try:
        limit = int(request.GET.get('limit', 100))
        offset = int(request.GET.get('offset', 0))
        
        histories = History.objects.all().order_by('-record_date')[offset:offset+limit]
        
        data=[]
        
        for h in histories:
            data.append(
                {
                    'recordNo':h.recordNo,
                    'disease':h.disease,
                    'crop_type':h.crop_type,
                    'temperature':h.temperature,
                    'humidity':h.humidity,
                    'location':h.location,
                    'date':h.record_date,
                    
                }
            )
        
        
        return JsonResponse({'message':'History fetched successfully', 'data':data},safe=False, status=200)
    
    except Exception as e:
        return JsonResponse({'message':'Error fetching history', 'error': str(e)}, status=400)
  return JsonResponse({'error': 'Method not allowed'}, status=405)