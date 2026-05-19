from app import db
from datetime import datetime
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class Experiment(db.Model):
    __tablename__ = "experiments"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    model_type = db.Column(db.String(100), nullable=False)
    status = db.Column(
        db.String(50), default="queued"
    )  # queued, running, completed, failed
    dataset = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Hyperparameters stored as JSON
    hyperparameters = db.Column(db.JSON, default=dict)

    # Final results
    final_metrics = db.Column(db.JSON, default=dict)

    # Relationships
    metrics = db.relationship("Metric", backref="experiment", lazy=True, cascade="all, delete-orphan")
    tags = db.relationship("Tag", backref="experiment", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "model_type": self.model_type,
            "status": self.status,
            "dataset": self.dataset,
            "hyperparameters": self.hyperparameters or {},
            "final_metrics": self.final_metrics or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "tags": [t.name for t in self.tags],
        }


class Metric(db.Model):
    __tablename__ = "metrics"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    experiment_id = db.Column(
        db.String(36), db.ForeignKey("experiments.id"), nullable=False
    )
    metric_name = db.Column(db.String(100), nullable=False)
    value = db.Column(db.Float, nullable=False)
    step = db.Column(db.Integer, nullable=False)
    epoch = db.Column(db.Integer, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "experiment_id": self.experiment_id,
            "metric_name": self.metric_name,
            "value": self.value,
            "step": self.step,
            "epoch": self.epoch,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class Tag(db.Model):
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    experiment_id = db.Column(
        db.String(36), db.ForeignKey("experiments.id"), nullable=False
    )
    name = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}
