from flask import Blueprint, jsonify, request
from app import db
from app.models import Experiment, Tag, Metric
from app.services import cache_service
from datetime import datetime

experiments_bp = Blueprint("experiments", __name__)


@experiments_bp.route("/", methods=["GET"])
def list_experiments():
    status = request.args.get("status")
    model_type = request.args.get("model_type")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))

    query = Experiment.query.order_by(Experiment.created_at.desc())

    if status:
        query = query.filter(Experiment.status == status)
    if model_type:
        query = query.filter(Experiment.model_type == model_type)

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "experiments": [e.to_dict() for e in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": page,
    })


@experiments_bp.route("/summary", methods=["GET"])
def get_summary():
    cached = cache_service.get_summary_cached()
    if cached:
        return jsonify({**cached, "cached": True})

    total = Experiment.query.count()
    running = Experiment.query.filter_by(status="running").count()
    completed = Experiment.query.filter_by(status="completed").count()
    failed = Experiment.query.filter_by(status="failed").count()
    queued = Experiment.query.filter_by(status="queued").count()

    summary = {
        "total": total,
        "running": running,
        "completed": completed,
        "failed": failed,
        "queued": queued,
        "cached": False,
    }
    cache_service.set_summary_cached(summary)
    return jsonify(summary)


@experiments_bp.route("/<experiment_id>", methods=["GET"])
def get_experiment(experiment_id):
    cached = cache_service.get_experiment_cached(experiment_id)
    if cached:
        return jsonify({**cached, "cached": True})

    exp = Experiment.query.get_or_404(experiment_id)
    data = exp.to_dict()
    cache_service.set_experiment_cached(experiment_id, data)
    return jsonify({**data, "cached": False})


@experiments_bp.route("/", methods=["POST"])
def create_experiment():
    data = request.get_json()

    exp = Experiment(
        name=data["name"],
        description=data.get("description"),
        model_type=data["model_type"],
        dataset=data.get("dataset"),
        hyperparameters=data.get("hyperparameters", {}),
        status="queued",
    )
    db.session.add(exp)

    tags = data.get("tags", [])
    for tag_name in tags:
        tag = Tag(name=tag_name)
        exp.tags.append(tag)

    db.session.commit()
    cache_service.invalidate(cache_service.cache_key_summary())
    return jsonify(exp.to_dict()), 201


@experiments_bp.route("/<experiment_id>", methods=["PATCH"])
def update_experiment(experiment_id):
    exp = Experiment.query.get_or_404(experiment_id)
    data = request.get_json()

    if "status" in data:
        old_status = exp.status
        exp.status = data["status"]
        if data["status"] == "running" and old_status != "running":
            exp.started_at = datetime.utcnow()
        if data["status"] in ("completed", "failed"):
            exp.completed_at = datetime.utcnow()

    if "final_metrics" in data:
        exp.final_metrics = data["final_metrics"]

    if "description" in data:
        exp.description = data["description"]

    db.session.commit()
    cache_service.invalidate_experiment(experiment_id)

    return jsonify(exp.to_dict())


@experiments_bp.route("/<experiment_id>", methods=["DELETE"])
def delete_experiment(experiment_id):
    exp = Experiment.query.get_or_404(experiment_id)
    db.session.delete(exp)
    db.session.commit()
    cache_service.invalidate_experiment(experiment_id)
    return jsonify({"message": "Experiment deleted"}), 200
