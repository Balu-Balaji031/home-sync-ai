import os
import sys
import json
import requests
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

load_dotenv()

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "serviceAccountKey.json"

if not firebase_admin._apps:
    cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Find a customer user
users_ref = db.collection('users').where('role', '==', 'customer').limit(1).stream()
customer = None
for u in users_ref:
    customer = u.to_dict()
    break

if not customer:
    print("No customer found.")
    sys.exit(1)

uid = customer['uid']
print(f"Testing with UID: {uid}")

# Find a device for this customer
devices_ref = db.collection('devices').where('userId', '==', uid).limit(1).stream()
device = None
for d in devices_ref:
    device = d.to_dict()
    device['id'] = d.id
    break

if not device:
    print(f"No device found for UID {uid}. Creating a mock device for testing.")
    device_id = "test_device_123"
    db.collection('devices').document(device_id).set({
        "userId": uid,
        "deviceType": "Light",
        "category": "Lighting",
        "deviceName": "bed light",
        "brand": "samsung",
        "room": "Bedroom"
    })
    device = {"id": device_id}

# Create custom token
custom_token = auth.create_custom_token(uid).decode('utf-8')

# Exchange for ID token
API_KEY = os.getenv("FIREBASE_WEB_API_KEY")
if not API_KEY:
    print("FIREBASE_WEB_API_KEY must be set in the backend environment.")
    sys.exit(1)
url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={API_KEY}"
data = {
    "token": custom_token,
    "returnSecureToken": True
}
res = requests.post(url, json=data)
if res.status_code != 200:
    print("Failed to get ID token", res.text)
    sys.exit(1)

id_token = res.json()["idToken"]

# Test the backend endpoint
backend_url = "http://127.0.0.1:8000/api/ai/sessions"
headers = {
    "Authorization": f"Bearer {id_token}",
    "Content-Type": "application/json"
}
payload = {
    "deviceId": device["id"],
    "language": "en",
    "problem": "light is not working"
}

print(f"Calling {backend_url}...")
resp = requests.post(backend_url, headers=headers, json=payload)
print("Status Code:", resp.status_code)
print("Response:", resp.json())
