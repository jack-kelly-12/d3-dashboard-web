from functools import wraps
from flask import request, jsonify, g, make_response
from firebase_admin import firestore, auth
from datetime import datetime
import hashlib
import hmac
import os
import logging

from .rate_limiter import check_rate_limit, check_write_rate_limit, track_api_key_usage, WRITE_LIMITS

logger = logging.getLogger(__name__)

API_KEY_PEPPER = os.getenv('API_KEY_PEPPER', '')


RATE_LIMITS = {
    'anonymous': {'rpm': 120, 'burst': 200},
    'signed_in': {'rpm': 200, 'burst': 300},
    'api_key': {'rpm': 300, 'burst': 400},
}

_db = None

def get_firestore_db():
    global _db
    if _db is None:
        _db = firestore.client()
    return _db


def hash_key(api_key: str) -> str:
    if API_KEY_PEPPER:
        return hmac.new(
            API_KEY_PEPPER.encode(),
            api_key.encode(),
            hashlib.sha256
        ).hexdigest()
    return hashlib.sha256(api_key.encode()).hexdigest()


def add_rate_limit_headers(response, headers):
    for key, value in headers.items():
        response.headers[key] = value
    return response

def verify_firebase_token(id_token: str) -> tuple[dict | None, str | None]:
    """
    Verify Firebase ID token.
    
    Returns:
        (user_data, None) if valid
        (None, error_message) if invalid
    """
    try:
        decoded = auth.verify_id_token(id_token)
        
        provider = decoded.get('firebase', {}).get('sign_in_provider', '')
        is_anonymous = provider == 'anonymous'
        
        user_data = {
            'uid': decoded['uid'],
            'email': decoded.get('email'),
            'email_verified': decoded.get('email_verified', False),
            'is_anonymous': is_anonymous,
            'provider': provider,
            'auth_type': 'firebase',
        }
        
        return user_data, None
        
    except auth.InvalidIdTokenError:
        return None, "Invalid token"
    except auth.ExpiredIdTokenError:
        return None, "Token expired"
    except auth.RevokedIdTokenError:
        return None, "Token revoked"
    except Exception as e:
        logger.error(f"Firebase auth error: {e}")
        return None, "Authentication failed"

def validate_api_key(api_key: str) -> tuple[dict | None, str | None]:
    """
    Validate an API key against Firestore.
    
    Returns:
        (user_data, None) if valid
        (None, error_message) if invalid
    """
    if not api_key:
        return None, "API key required"
    
    if not api_key.startswith('kd_'):
        return None, "Invalid API key format"
    
    db = get_firestore_db()
    key_hash = hash_key(api_key)
    
    docs = db.collection('api_keys').where('key_hash', '==', key_hash).limit(1).stream()
    key_doc = next(docs, None)
    
    if not key_doc:
        return None, "Invalid API key"
    
    key_data = key_doc.to_dict()
    doc_id = key_doc.id
    
    if not key_data.get('is_active', True):
        return None, "API key has been revoked"
    
    expires_at = key_data.get('expires_at')
    if expires_at:
        if hasattr(expires_at, 'replace'):
            expires_at = expires_at.replace(tzinfo=None)
        if expires_at < datetime.utcnow():
            return None, "API key has expired"
    
    user_data = {
        'uid': key_data.get('user_id'),
        'email': key_data.get('email'),
        'is_anonymous': False,
        'auth_type': 'api_key',
        'key_id': doc_id,
        'key_name': key_data.get('name'),
    }
    
    track_api_key_usage(doc_id, db, firestore)
    
    return user_data, None


def require_api_auth(f):
    """
    Decorator requiring authentication via:
    1. Firebase ID Token (Authorization: Bearer <token>), OR
    2. API Key (X-API-Key: <key>)
    
    Sets g.user with:
        - uid: Firebase UID
        - email: user email (if available)
        - is_anonymous: True if anonymous Firebase user
        - auth_type: 'firebase' or 'api_key'
        - key_id: API key doc ID (if using API key)
    
    Applies tiered rate limits by UID.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
        
        user_data = None
        error = None
        
        auth_header = request.headers.get('Authorization', '')
        api_key = request.headers.get('X-API-Key', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[1]
            user_data, error = verify_firebase_token(token)
            
        elif api_key:
            user_data, error = validate_api_key(api_key)
        
        if not user_data and not error:
            return jsonify({
                "error": "Authentication required",
                "message": "Include Authorization: Bearer <token> or X-API-Key header",
                "docs": "https://d3-dashboard.com/docs"
            }), 401
        
        if error:
            status = 401
            return jsonify({
                "error": error,
                "message": "Please sign in or check your API key"
            }), status
        
        if user_data['auth_type'] == 'api_key':
            limit_type = 'api_key'
        elif user_data.get('is_anonymous'):
            limit_type = 'anonymous'
        else:
            limit_type = 'signed_in'
        
        identifier = user_data.get('key_id') or user_data['uid']
        limits = RATE_LIMITS.get(limit_type, RATE_LIMITS['anonymous'])
        allowed, rate_headers = check_rate_limit(identifier, limit_type, limits)
        
        if not allowed:
            response = jsonify({
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Limit: {RATE_LIMITS[limit_type]['rpm']} per minute",
                "retry_after": 60
            })
            response.status_code = 429
            return add_rate_limit_headers(response, rate_headers)
        
        g.user = user_data
        g.rate_limit_headers = rate_headers
        
        response = f(*args, **kwargs)
        
        resp = make_response(response)
        add_rate_limit_headers(resp, rate_headers)
        return resp
    
    return decorated_function

def require_firebase_auth(f):
    """
    Decorator for endpoints requiring a verified Firebase account.
    Used for API key management (create, revoke, list).
    Anonymous users are blocked.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({
                "error": "Authorization required",
                "message": "Sign in to manage API keys"
            }), 401
        
        token = auth_header.split('Bearer ')[1]
        
        try:
            decoded = auth.verify_id_token(token)
            
            provider = decoded.get('firebase', {}).get('sign_in_provider', '')
            if provider == 'anonymous':
                return jsonify({
                    "error": "Account required",
                    "message": "Create an account to manage API keys"
                }), 403
            
            if not decoded.get('email_verified', False):
                return jsonify({
                    "error": "Email verification required",
                    "message": "Please verify your email address"
                }), 403
            
            g.firebase_user = decoded
            g.user_id = decoded['uid']
            g.user_email = decoded.get('email', '')
            
            return f(*args, **kwargs)
            
        except auth.InvalidIdTokenError:
            return jsonify({"error": "Invalid token"}), 401
        except auth.ExpiredIdTokenError:
            return jsonify({"error": "Token expired", "message": "Please sign in again"}), 401
        except Exception as e:
            logger.error(f"Auth error: {e}")
            return jsonify({"error": "Authentication failed"}), 401
    
    return decorated_function


def require_api_auth_write(f):
    """
    Decorator for write operations (POST, PUT, DELETE, uploads).
    Same as require_api_auth but with stricter rate limits.
    
    Write limits:
        - Anonymous: 5 rpm
        - Signed-in: 20 rpm  
        - API Key: 30 rpm
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
        
        user_data = None
        error = None
        
        auth_header = request.headers.get('Authorization', '')
        api_key = request.headers.get('X-API-Key', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[1]
            user_data, error = verify_firebase_token(token)
        elif api_key:
            user_data, error = validate_api_key(api_key)
        
        if not user_data and not error:
            return jsonify({
                "error": "Authentication required",
                "message": "Include Authorization: Bearer <token> or X-API-Key header",
                "docs": "https://d3-dashboard.com/docs"
            }), 401
        
        if error:
            return jsonify({
                "error": error,
                "message": "Please sign in or check your API key"
            }), 401
        
        if user_data['auth_type'] == 'api_key':
            limit_type = 'api_key'
        elif user_data.get('is_anonymous'):
            limit_type = 'anonymous'
        else:
            limit_type = 'signed_in'
        
        identifier = user_data.get('key_id') or user_data['uid']
        allowed, rate_headers = check_write_rate_limit(identifier, limit_type)
        
        if not allowed:
            response = jsonify({
                "error": "Write rate limit exceeded",
                "message": f"Too many write requests. Limit: {WRITE_LIMITS[limit_type]['burst']} per minute",
                "retry_after": 60
            })
            response.status_code = 429
            return add_rate_limit_headers(response, rate_headers)
        
        g.user = user_data
        g.rate_limit_headers = rate_headers
        
        response = f(*args, **kwargs)
        
        resp = make_response(response)
        add_rate_limit_headers(resp, rate_headers)
        return resp
    
    return decorated_function

