from flask import Blueprint, jsonify, request
from app import db
from app.models import Metric, Experiment
from app.services import cache_service

metrics_bp = Blueprint("metrics", __name__)


@metrics_bp.route("/<experiment_id>", methods=["GET"])
def get_metrics(experiment_id):
    # Check cache first — this is the hot path
    cached = cache_service.get_metrics_cached(experiment_id)
    if cached:
        return jsonify({**cached, "cached": True})

    Experiment.query.get_or_404(experiment_id)

    metric_name = request.args.get("metric_name")
    query = Metric.query.filter_by(experiment_id=experiment_id).order_by(
        Metric.step.asc()
    )
    if metric_name:
        query = query.filter_by(metric_name=metric_name)

    metrics = query.all()

    # Group by metric name for easy frontend consumption
    grouped = {}
    for m in metrics:
        if m.metric_name not in grouped:
            grouped[m.metric_name] = []
        grouped[m.metric_name].append({"step": m.step, "value": m.value, "epoch": m.epoch})

    response = {"experiment_id": experiment_id, "metrics": grouped}
    cache_service.set_metrics_cached(experiment_id, response)

    return jsonify({**response, "cached": False})


@metrics_bp.route("/<experiment_id>", methods=["POST"])
def log_metric(experiment_id):
    Experiment.query.get_or_404(experiment_id)
    data = request.get_json()

    # Support batch logging
    entries = data if isinstance(data, list) else [data]
    metric_objects = []
    for entry in entries:
        m = Metric(
            experiment_id=experiment_id,
            metric_name=entry["metric_name"],
            value=entry["value"],
            step=entry["step"],
            epoch=entry.get("epoch"),
        )
        db.session.add(m)
        metric_objects.append(m)

    db.session.commit()

    # Invalidate cache so next fetch is fresh
    cache_service.invalidate(cache_service.cache_key_metrics(experiment_id))

    return jsonify([m.to_dict() for m in metric_objects]), 201


@metrics_bp.route("/<experiment_id>/latest", methods=["GET"])
def get_latest_metrics(experiment_id):
    """Returns the most recent value per metric — useful for live dashboards."""
    Experiment.query.get_or_404(experiment_id)

    # Subquery: max step per metric name for this experiment
    from sqlalchemy import func
    subq = (
        db.session.query(
            Metric.metric_name,
            func.max(Metric.step).label("max_step"),
        )
        .filter_by(experiment_id=experiment_id)
        .group_by(Metric.metric_name)
        .subquery()
    )

    latest = (
        db.session.query(Metric)
        .join(
            subq,
            (Metric.metric_name == subq.c.metric_name)
            & (Metric.step == subq.c.max_step)
            & (Metric.experiment_id == experiment_id),
        )
        .all()
    )

    return jsonify({m.metric_name: m.value for m in latest})
