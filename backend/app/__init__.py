from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_redis import FlaskRedis
from flask_cors import CORS
import os

db = SQLAlchemy()
redis_client = FlaskRedis()


def create_app(config_name=None):
    app = Flask(__name__)

    # Config
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "postgresql://mluser:mlpass@db:5432/mltracker"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["REDIS_URL"] = os.getenv("REDIS_URL", "redis://redis:6379/0")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")

    # Init extensions
    db.init_app(app)
    redis_client.init_app(app)
    CORS(app, origins=["http://localhost:3000", "http://frontend:3000"])

    # Register blueprints
    from app.routes.experiments import experiments_bp
    from app.routes.metrics import metrics_bp
    from app.routes.health import health_bp

    app.register_blueprint(experiments_bp, url_prefix="/api/experiments")
    app.register_blueprint(metrics_bp, url_prefix="/api/metrics")
    app.register_blueprint(health_bp, url_prefix="/api")

    return app
