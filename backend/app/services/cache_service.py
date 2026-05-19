import json
from app import redis_client
import logging

logger = logging.getLogger(__name__)

METRICS_CACHE_TTL = 30       # 30 seconds for live metrics
EXPERIMENT_CACHE_TTL = 120   # 2 minutes for experiment data
SUMMARY_CACHE_TTL = 60       # 1 minute for dashboard summary


def cache_key_metrics(experiment_id):
    return f"metrics:{experiment_id}"


def cache_key_experiment(experiment_id):
    return f"experiment:{experiment_id}"


def cache_key_summary():
    return "dashboard:summary"


def get_cached(key):
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        logger.warning(f"Redis GET failed for key {key}: {e}")
    return None


def set_cached(key, value, ttl):
    try:
        redis_client.setex(key, ttl, json.dumps(value))
    except Exception as e:
        logger.warning(f"Redis SET failed for key {key}: {e}")


def invalidate(key):
    try:
        redis_client.delete(key)
    except Exception as e:
        logger.warning(f"Redis DELETE failed for key {key}: {e}")


def invalidate_experiment(experiment_id):
    invalidate(cache_key_experiment(experiment_id))
    invalidate(cache_key_metrics(experiment_id))
    invalidate(cache_key_summary())


def get_metrics_cached(experiment_id):
    return get_cached(cache_key_metrics(experiment_id))


def set_metrics_cached(experiment_id, data):
    set_cached(cache_key_metrics(experiment_id), data, METRICS_CACHE_TTL)


def get_experiment_cached(experiment_id):
    return get_cached(cache_key_experiment(experiment_id))


def set_experiment_cached(experiment_id, data):
    set_cached(cache_key_experiment(experiment_id), data, EXPERIMENT_CACHE_TTL)


def get_summary_cached():
    return get_cached(cache_key_summary())


def set_summary_cached(data):
    set_cached(cache_key_summary(), data, SUMMARY_CACHE_TTL)
