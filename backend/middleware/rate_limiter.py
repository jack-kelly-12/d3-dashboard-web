import os
import time
import logging
from collections import defaultdict
import threading

logger = logging.getLogger(__name__)

_redis_client = None
_redis_available = None

_memory_store = defaultdict(lambda: {'count': 0, 'window_start': 0})
_memory_lock = threading.Lock()

_usage_store = defaultdict(lambda: {'count': 0, 'last_flush': 0})
_usage_lock = threading.Lock()
USAGE_FLUSH_INTERVAL = 300  # 5 minutes

_write_store = defaultdict(lambda: {'count': 0, 'window_start': 0})
_write_lock = threading.Lock()

WRITE_LIMITS = {
    'anonymous': {'rpm': 5, 'burst': 10},
    'signed_in': {'rpm': 20, 'burst': 30},
    'api_key': {'rpm': 30, 'burst': 50},
}


def get_redis_client():
    global _redis_client, _redis_available
    
    if _redis_available is False:
        return None
    
    if _redis_client is not None:
        return _redis_client
    
    redis_url = os.getenv('REDIS_URL')
    if not redis_url:
        _redis_available = False
        logger.info("REDIS_URL not set, using in-memory rate limiting")
        return None
    
    try:
        import redis
        _redis_client = redis.from_url(redis_url, decode_responses=True)
        _redis_client.ping()
        _redis_available = True
        logger.info("Redis rate limiter connected")
        return _redis_client
    except Exception as e:
        _redis_available = False
        logger.warning(f"Redis unavailable, using in-memory: {e}")
        return None


def check_rate_limit(identifier: str, limit_type: str, limits: dict) -> tuple[bool, dict]:
    """
    Check rate limit. Uses Redis if available, falls back to in-memory.
    
    Args:
        identifier: UID or API key doc_id
        limit_type: 'anonymous', 'signed_in', or 'api_key'
        limits: dict with 'rpm' and 'burst' keys
    
    Returns:
        (allowed, headers)
    """
    client = get_redis_client()
    
    if client:
        return _redis_check(client, identifier, limit_type, limits)
    else:
        return _memory_check(identifier, limits)


def _redis_check(client, identifier: str, limit_type: str, limits: dict) -> tuple[bool, dict]:
    rpm = limits['rpm']
    burst = limits['burst']
    window_seconds = 60
    
    now = time.time()
    window_start = now - window_seconds
    key = f"ratelimit:{limit_type}:{identifier}"
    
    try:
        pipe = client.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window_seconds + 1)
        results = pipe.execute()
        
        request_count = results[2]
        allowed = request_count <= burst
        remaining = max(0, burst - request_count)
        reset_time = int(now + window_seconds)
        
        headers = {
            'X-RateLimit-Limit': str(burst),
            'X-RateLimit-Remaining': str(remaining),
            'X-RateLimit-Reset': str(reset_time),
        }
        
        return allowed, headers
        
    except Exception as e:
        logger.warning(f"Redis error, allowing request: {e}")
        return True, {}


def _memory_check(identifier: str, limits: dict) -> tuple[bool, dict]:
    rpm = limits['rpm']
    burst = limits['burst']
    window_seconds = 60
    now = time.time()
    
    with _memory_lock:
        entry = _memory_store[identifier]
        
        if now - entry['window_start'] >= window_seconds:
            entry['count'] = 1
            entry['window_start'] = now
            allowed = True
        else:
            entry['count'] += 1
            allowed = entry['count'] <= burst
        
        remaining = max(0, burst - entry['count'])
        reset_time = int(entry['window_start'] + window_seconds)
    
    headers = {
        'X-RateLimit-Limit': str(burst),
        'X-RateLimit-Remaining': str(remaining),
        'X-RateLimit-Reset': str(reset_time),
    }
    
    return allowed, headers


def track_api_key_usage(doc_id: str, firestore_db, firestore_module):
    """
    Track API key usage with batched Firestore writes.
    Only flushes to Firestore every 5 minutes per key.
    """
    client = get_redis_client()
    
    if client:
        _redis_track_usage(client, doc_id, firestore_db, firestore_module)
    else:
        _memory_track_usage(doc_id, firestore_db, firestore_module)


def _redis_track_usage(client, doc_id: str, firestore_db, firestore_module):
    now = time.time()
    count_key = f"usage:count:{doc_id}"
    flush_key = f"usage:flush:{doc_id}"
    
    try:
        pipe = client.pipeline()
        pipe.incr(count_key)
        pipe.get(flush_key)
        results = pipe.execute()
        
        last_flush = float(results[1]) if results[1] else 0
        
        if now - last_flush >= USAGE_FLUSH_INTERVAL:
            count = int(client.getset(count_key, 0) or 0)
            client.set(flush_key, str(now))
            
            if count > 0:
                _flush_to_firestore(doc_id, count, firestore_db, firestore_module)
    except Exception as e:
        logger.warning(f"Redis usage tracking error: {e}")


def _memory_track_usage(doc_id: str, firestore_db, firestore_module):
    now = time.time()
    
    with _usage_lock:
        entry = _usage_store[doc_id]
        entry['count'] += 1
        
        if now - entry['last_flush'] >= USAGE_FLUSH_INTERVAL:
            count = entry['count']
            entry['count'] = 0
            entry['last_flush'] = now
            
            if count > 0:
                _flush_to_firestore(doc_id, count, firestore_db, firestore_module)


def _flush_to_firestore(doc_id: str, count: int, firestore_db, firestore_module):
    try:
        from datetime import datetime
        firestore_db.collection('api_keys').document(doc_id).update({
            'total_requests': firestore_module.Increment(count),
            'last_used': datetime.utcnow()
        })
        logger.debug(f"Flushed {count} requests for key {doc_id}")
    except Exception as e:
        logger.warning(f"Failed to flush usage to Firestore: {e}")


def check_write_rate_limit(identifier: str, limit_type: str) -> tuple[bool, dict]:
    """
    Stricter rate limit for write operations (POST, PUT, DELETE, uploads).
    """
    limits = WRITE_LIMITS.get(limit_type, WRITE_LIMITS['anonymous'])
    client = get_redis_client()
    
    if client:
        return _redis_check(client, identifier, f"write:{limit_type}", limits)
    else:
        return _memory_write_check(identifier, limits)


def _memory_write_check(identifier: str, limits: dict) -> tuple[bool, dict]:
    rpm = limits['rpm']
    burst = limits['burst']
    window_seconds = 60
    now = time.time()
    
    with _write_lock:
        entry = _write_store[identifier]
        
        if now - entry['window_start'] >= window_seconds:
            entry['count'] = 1
            entry['window_start'] = now
            allowed = True
        else:
            entry['count'] += 1
            allowed = entry['count'] <= burst
        
        remaining = max(0, burst - entry['count'])
        reset_time = int(entry['window_start'] + window_seconds)
    
    headers = {
        'X-RateLimit-Limit': str(burst),
        'X-RateLimit-Remaining': str(remaining),
        'X-RateLimit-Reset': str(reset_time),
    }
    
    return allowed, headers

