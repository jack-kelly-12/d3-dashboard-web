import logging
from functools import wraps
from flask import request, Response, make_response

from .rate_limiter import get_redis_client

logger = logging.getLogger(__name__)

DEFAULT_TTL = 300  # 5 minutes


def cache_response(ttl: int = DEFAULT_TTL, key_prefix: str = None):
    """
    Cache GET endpoint responses in Redis.
    
    Args:
        ttl: Cache TTL in seconds (default 5 minutes)
        key_prefix: Optional prefix for cache key (defaults to endpoint path)
    
    Usage:
        @bp.get('/batting')
        @require_api_auth
        @cache_response(ttl=300)
        def get_batting():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.method != 'GET':
                return f(*args, **kwargs)
            
            client = get_redis_client()
            if not client:
                return f(*args, **kwargs)
            
            prefix = key_prefix or request.path
            sorted_args = sorted(request.args.items())
            args_str = '&'.join(f"{k}={v}" for k, v in sorted_args)
            cache_key = f"cache:{prefix}:{args_str}"
            
            try:
                cached = client.get(cache_key)
                if cached:
                    logger.debug(f"Cache hit: {cache_key}")
                    return Response(
                        cached,
                        mimetype='application/json',
                        headers={'X-Cache': 'HIT'}
                    )
            except Exception as e:
                logger.warning(f"Cache read error: {e}")
            
            response = f(*args, **kwargs)

            resp = make_response(response)
            if resp.status_code != 200:
                return resp
            if resp.mimetype != 'application/json':
                return resp

            try:
                json_data = resp.get_data(as_text=True)
                client.setex(cache_key, ttl, json_data)
                logger.debug(f"Cache set: {cache_key} (TTL: {ttl}s)")
                resp.headers['X-Cache'] = 'MISS'
            except Exception as e:
                logger.warning(f"Cache write error: {e}")

            return resp
        
        return decorated_function
    return decorator


def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "cache:/api/batting:*")
    """
    client = get_redis_client()
    if not client:
        return 0
    
    try:
        keys = list(client.scan_iter(match=pattern))
        if keys:
            client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache entries matching {pattern}")
        return len(keys)
    except Exception as e:
        logger.warning(f"Cache invalidation error: {e}")
        return 0

