from flask import Blueprint, jsonify, request, g
from firebase_admin import auth, firestore
from datetime import datetime, timedelta
from functools import wraps
import secrets
import time

from middleware.api_auth import hash_key

bp = Blueprint('api_keys', __name__, url_prefix='/api')

db = None
rate_limit_cache = {}

def get_db():
    global db
    if db is None:
        db = firestore.client()
    return db


def generate_api_key():
    return f"kd_{secrets.token_urlsafe(32)}"


def rate_limit_by_user(max_requests=5, window_seconds=3600):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = g.get('firebase_uid')
            if not user_id:
                return jsonify({"error": "Authentication required"}), 401
            
            now = time.time()
            cache_key = f"token_create_{user_id}"
            
            if cache_key in rate_limit_cache:
                requests, window_start = rate_limit_cache[cache_key]
                if now - window_start < window_seconds:
                    if requests >= max_requests:
                        return jsonify({
                            "error": "Rate limit exceeded",
                            "message": f"Maximum {max_requests} token creations per hour"
                        }), 429
                    rate_limit_cache[cache_key] = (requests + 1, window_start)
                else:
                    rate_limit_cache[cache_key] = (1, now)
            else:
                rate_limit_cache[cache_key] = (1, now)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_firebase_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        id_token = auth_header.split('Bearer ')[1]
        
        try:
            decoded_token = auth.verify_id_token(id_token)
            
            if decoded_token.get('firebase', {}).get('sign_in_provider') == 'anonymous':
                return jsonify({"error": "Anonymous users cannot create API keys"}), 403
            
            email = decoded_token.get('email')
            if not email:
                return jsonify({"error": "Email required to create API keys"}), 403
            
            if not decoded_token.get('email_verified', False):
                return jsonify({"error": "Please verify your email first"}), 403
            
            g.firebase_uid = decoded_token['uid']
            g.firebase_email = email
            g.firebase_name = decoded_token.get('name', email.split('@')[0])
            
        except auth.InvalidIdTokenError:
            return jsonify({"error": "Invalid authentication token"}), 401
        except auth.ExpiredIdTokenError:
            return jsonify({"error": "Authentication token expired"}), 401
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
        
        return f(*args, **kwargs)
    return decorated_function


@bp.route('/keys', methods=['GET'])
@require_firebase_auth
def list_api_keys():
    db = get_db()
    
    keys = db.collection('api_keys').where('user_id', '==', g.firebase_uid).stream()
    
    result = []
    now = datetime.utcnow()
    
    for doc in keys:
        data = doc.to_dict()
        expires_at = data.get('expires_at')
        is_expired = expires_at and expires_at.replace(tzinfo=None) < now
        
        result.append({
            'id': doc.id,
            'name': data.get('name'),
            'key_prefix': data.get('key_prefix'),
            'created_at': data.get('created_at').isoformat() if data.get('created_at') else None,
            'expires_at': expires_at.isoformat() if expires_at else None,
            'is_active': data.get('is_active', True) and not is_expired,
            'is_expired': is_expired,
            'rate_limit': data.get('rate_limit', 100),
            'total_requests': data.get('total_requests', 0),
        })
    
    return jsonify(result)


@bp.route('/keys', methods=['POST'])
@require_firebase_auth
@rate_limit_by_user(max_requests=5, window_seconds=3600)
def create_api_key():
    db = get_db()
    data = request.get_json() or {}
    
    name = data.get('name', f"{g.firebase_name}'s API Key")
    
    existing = list(db.collection('api_keys')
        .where('user_id', '==', g.firebase_uid)
        .where('is_active', '==', True)
        .stream())
    
    if len(existing) >= 3:
        return jsonify({
            "error": "Maximum 3 active API keys per user",
            "message": "Please revoke an existing key before creating a new one"
        }), 400
    
    api_key = generate_api_key()
    key_hash = hash_key(api_key)
    now = datetime.utcnow()
    expires_at = now + timedelta(days=90)
    
    doc_ref = db.collection('api_keys').document()
    doc_ref.set({
        'user_id': g.firebase_uid,
        'email': g.firebase_email,
        'name': name,
        'key_hash': key_hash,
        'key_prefix': api_key[:12],
        'rate_limit': 100,
        'window_minutes': 1,
        'is_active': True,
        'created_at': now,
        'expires_at': expires_at,
        'total_requests': 0,
    })
    
    return jsonify({
        'id': doc_ref.id,
        'api_key': api_key,
        'name': name,
        'expires_at': expires_at.isoformat(),
        'rate_limit': 100,
        'message': 'Save this key securely - it will not be shown again'
    }), 201


@bp.route('/keys/<key_id>', methods=['DELETE'])
@require_firebase_auth
def revoke_api_key(key_id):
    db = get_db()
    
    doc_ref = db.collection('api_keys').document(key_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return jsonify({"error": "API key not found"}), 404
    
    key_data = doc.to_dict()
    if key_data.get('user_id') != g.firebase_uid:
        return jsonify({"error": "Not authorized to revoke this key"}), 403
    
    doc_ref.update({'is_active': False})
    
    return jsonify({"message": "API key revoked successfully"})


@bp.route('/keys/<key_id>/regenerate', methods=['POST'])
@require_firebase_auth
@rate_limit_by_user(max_requests=5, window_seconds=3600)
def regenerate_api_key(key_id):
    db = get_db()
    
    doc_ref = db.collection('api_keys').document(key_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return jsonify({"error": "API key not found"}), 404
    
    key_data = doc.to_dict()
    if key_data.get('user_id') != g.firebase_uid:
        return jsonify({"error": "Not authorized"}), 403
    
    api_key = generate_api_key()
    key_hash = hash_key(api_key)
    now = datetime.utcnow()
    expires_at = now + timedelta(days=90)
    
    doc_ref.update({
        'key_hash': key_hash,
        'key_prefix': api_key[:12],
        'created_at': now,
        'expires_at': expires_at,
        'is_active': True,
    })
    
    return jsonify({
        'id': key_id,
        'api_key': api_key,
        'name': key_data.get('name'),
        'expires_at': expires_at.isoformat(),
        'message': 'Save this key securely - it will not be shown again'
    })

