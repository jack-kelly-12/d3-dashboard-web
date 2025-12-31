import argparse
import secrets
import hashlib
import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

def init_firebase():
    if not firebase_admin._apps:
        cert_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH')
        cred = credentials.Certificate(cert_path)
        firebase_admin.initialize_app(cred)
    return firestore.client()


def generate_api_key():
    return f"kd_{secrets.token_urlsafe(32)}"


def hash_key(api_key):
    return hashlib.sha256(api_key.encode()).hexdigest()


def create_api_key(name, email, rate_limit=100):
    db = init_firebase()
    
    api_key = generate_api_key()
    key_hash = hash_key(api_key)
    
    doc_ref = db.collection('api_keys').document()
    doc_ref.set({
        'name': name,
        'email': email,
        'key_hash': key_hash,
        'key_prefix': api_key[:12],
        'rate_limit': rate_limit,
        'window_minutes': 1,
        'is_active': True,
        'created_at': datetime.utcnow(),
        'total_requests': 0,
    })
    
    print("\n" + "=" * 60)
    print("API KEY CREATED SUCCESSFULLY")
    print("=" * 60)
    print(f"\nName: {name}")
    print(f"Email: {email}")
    print(f"Rate Limit: {rate_limit} requests/minute")
    print("\n🔑 API Key (SAVE THIS - shown only once):\n")
    print(f"   {api_key}")
    print("\n" + "=" * 60)
    print("\nUsage:")
    print('   curl -H "X-API-Key: YOUR_KEY" https://d3-dashboard.com/api/batting')
    print("=" * 60 + "\n")
    
    return api_key


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new API key")
    parser.add_argument("--name", required=True, help="Name/description for this key")
    parser.add_argument("--email", required=True, help="Contact email for key owner")
    parser.add_argument("--rate-limit", type=int, default=100, help="Requests per minute (default: 100)")
    
    args = parser.parse_args()
    create_api_key(args.name, args.email, args.rate_limit)


