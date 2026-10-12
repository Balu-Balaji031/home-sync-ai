import os
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings

# Initialize Firebase Admin SDK securely
# It uses GOOGLE_APPLICATION_CREDENTIALS env var if present
# Or explicit FIREBASE_PROJECT_ID for local dev without writing if no creds
def init_firebase():
    if not firebase_admin._apps:
        try:
            # First try default initialization (relies on GOOGLE_APPLICATION_CREDENTIALS)
            firebase_admin.initialize_app()
            print("Firebase Admin initialized with default credentials.")
        except Exception as e:
            print(f"Default Firebase initialization failed: {e}. Trying project_id fallback...")
            # Fallback for verifying tokens locally if no credentials are provided
            # Note: This allows token verification but won't allow writing to Firestore
            if settings.FIREBASE_PROJECT_ID:
                cred = credentials.ApplicationDefault() if 'GOOGLE_APPLICATION_CREDENTIALS' in os.environ else None
                firebase_admin.initialize_app(cred, {
                    'projectId': settings.FIREBASE_PROJECT_ID
                })
                print(f"Firebase Admin initialized with project_id: {settings.FIREBASE_PROJECT_ID}")
            else:
                print("WARNING: Firebase Admin could not be initialized securely. Firestore access will fail.")

init_firebase()

def get_firestore():
    try:
        return firestore.client()
    except Exception as e:
        print(f"Error accessing Firestore. Ensure GOOGLE_APPLICATION_CREDENTIALS is set. {e}")
        return None
