from flask import Blueprint, jsonify
from app import db, redis_client
import time

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    status = {"api": "ok", "database": "unknown", "redis": "unknown", "timestamp": time.time()}

    try:
        db.session.execute(db.text("SELECT 1"))
        status["database"] = "ok"
    except Exception as e:
        status["database"] = f"error: {str(e)}"

    try:
        redis_client.ping()
        status["redis"] = "ok"
    except Exception as e:
        status["redis"] = f"error: {str(e)}"

    overall = "ok" if all(v == "ok" for k, v in status.items() if k != "timestamp") else "degraded"
    status["status"] = overall

    return jsonify(status), 200 if overall == "ok" else 503
