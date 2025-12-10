from django.http import JsonResponse
import requests
from .models import Account,History
from django.views.decorators.csrf import csrf_exempt    
import json
from django.contrib.auth.hashers import make_password, check_password
from geopy.geocoders import Nominatim
from collections import Counter

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






@csrf_exempt
def user_Auth(request):
    if request.method == "GET":
        try:
            acNo = request.GET.get('acNo')
            if acNo:
             
                histories = History.objects.filter(account_acno__AcNo=acNo).order_by('-record_date')
            else:
                return JsonResponse({'message': 'acNo parameter is required'}, status=400)
            
            data = []
            disease_list = [] 
            
            for h in histories:
 
                if h.disease:
                    disease_list.append(h.disease)

                data.append({
                    'recordNo': h.recordNo,
                    'disease': h.disease,
                    'crop_type': h.crop_type,
                    'temperature': h.temperature,
                    'humidity': h.humidity,
                    'location': h.location,
                    'date': h.record_date,
                })
            
            scanCnt = len(data)
            mostSeenDisease = None
        
            if disease_list:
                most_counted = Counter(disease_list).most_common(1)
                if most_counted:
                    mostSeenDisease = most_counted[0][0]

            return JsonResponse({
                'message': 'User info fetched successfully', 
                'scan_count': scanCnt, 
                'most_seen_disease': mostSeenDisease, 
                'data': data
            }, safe=False, status=200)

        except Exception as e:

            return JsonResponse({'message': 'Error fetching user info', 'error': str(e)}, status=400)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
            
@csrf_exempt
def regional_alerts(request):
    """
    Endpoint: /api/regional_alerts/
    Used by: MapPage.jsx
    """
    if request.method == "GET":
        # Data matching the 8 regions in MapPage.jsx
        data = [
            {
                "region": "Dhaka",
                "top_disease": "Tomato Early Blight",
                "severity": "high",
                "summary": "উত্তরাঞ্চলে টমেটো ব্লাইটের প্রাদুর্ভাব দেখা দিয়েছে।",
                "tips": ["তামাযুক্ত ছত্রাকনাশক ব্যবহার করুন", "বাতাস চলাচলের ব্যবস্থা করুন", "অতিরিক্ত সেচ এড়িয়ে চলুন"],
                "center": { "lat": 23.8103, "lon": 90.4125 },
                "radius_m": 4000
            },
            {
                "region": "Sylhet",
                "top_disease": "Tea Blister Blight",
                "severity": "medium",
                "summary": "আর্দ্রতা বৃদ্ধির ফলে চা বাগানে ব্লাইট রোগের ঝুঁকি বাড়ছে।",
                "tips": ["প্রতিদিন কচি পাতা পরীক্ষা করুন", "আক্রান্ত অংশ ছাঁটাই করুন", "নিকাশী ব্যবস্থা ঠিক রাখুন"],
                "center": { "lat": 24.8949, "lon": 91.8687 },
                "radius_m": 6000
            },
            {
                "region": "Chittagong",
                "top_disease": "Red Pumpkin Beetle",
                "severity": "medium",
                "summary": "কুমড়া জাতীয় সবজিতে রেড পাম্পকিন বিটল পোকার আক্রমণ হতে পারে।",
                "tips": ["চারা রোপণের পর মশারি জাল ব্যবহার করুন", "ক্ষেত পরিষ্কার রাখুন", "প্রয়োজনে অনুমোদিত কীটনাশক স্প্রে করুন"],
                "center": { "lat": 22.3569, "lon": 91.7832 },
                "radius_m": 5000
            },
            {
                "region": "Rajshahi",
                "top_disease": "Mango Hopper",
                "severity": "high",
                "summary": "আমের মুকুল আসার এই সময়ে হপার পোকার আক্রমণ ফলন কমিয়ে দিতে পারে।",
                "tips": ["মুকুল আসার আগে একবার স্প্রে করুন", "আক্রান্ত ডালপালা ছাঁটাই করুন", "বাগান আগাছামুক্ত রাখুন"],
                "center": { "lat": 24.3636, "lon": 88.6241 },
                "radius_m": 4500
            },
            {
                "region": "Khulna",
                "top_disease": "Salinity Stress (Rice)",
                "severity": "high",
                "summary": "নদীতে লবনাক্ততা বৃদ্ধির ফলে বোরো ধানের চারা ক্ষতিগ্রস্ত হতে পারে।",
                "tips": ["লবনাক্ততা সহনশীল জাত নির্বাচন করুন", "নিয়মিত সেচ দিয়ে জমির লবনাক্ততা কমান", "জিপসাম সার ব্যবহার করুন"],
                "center": { "lat": 22.8456, "lon": 89.5403 },
                "radius_m": 7000
            },
            {
                "region": "Barisal",
                "top_disease": "Rice Hispa",
                "severity": "medium",
                "summary": "স্থানীয় আমন ক্ষেতে পামরি পোকার (Rice Hispa) উপস্থিতি লক্ষ্য করা গেছে।",
                "tips": ["আলোক ফাঁদ ব্যবহার করুন", "জমির আগাছা পরিষ্কার রাখুন", "পাতার সবুজ অংশ খেয়ে ফেললে ব্যবস্থা নিন"],
                "center": { "lat": 22.7010, "lon": 90.3535 },
                "radius_m": 5500
            },
            {
                "region": "Rangpur",
                "top_disease": "Potato Late Blight",
                "severity": "high",
                "summary": "ঘন কুয়াশা ও শীতে আলুর লেইট ব্লাইট বা মড়ক রোগের ঝুঁকি অত্যন্ত বেশি।",
                "tips": ["কুয়াশাচ্ছন্ন আবহাওয়ায় আগাম স্প্রে করুন", "আক্রান্ত গাছ তুলে পুড়িয়ে ফেলুন", "সেচ কমিয়ে দিন"],
                "center": { "lat": 25.7439, "lon": 89.2752 },
                "radius_m": 4000
            },
            {
                "region": "Mymensingh",
                "top_disease": "Rice Blast",
                "severity": "medium",
                "summary": "আবহাওয়া অনুকূল থাকায় ধানে ব্লাস্ট রোগের সংক্রমণ হতে পারে।",
                "tips": ["জমিতে পানি ধরে রাখুন", "ইউরিয়া সার কম ব্যবহার করুন", "পটাস সার প্রয়োগ করুন"],
                "center": { "lat": 24.7471, "lon": 90.4203 },
                "radius_m": 5000
            }
        ]
        return JsonResponse(data, safe=False, status=200)

    return JsonResponse({'error': 'Method not allowed'}, status=405)
    