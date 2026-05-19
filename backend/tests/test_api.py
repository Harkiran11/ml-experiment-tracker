import pytest
import json
from app import create_app, db as _db


@pytest.fixture(scope="session")
def app():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["REDIS_URL"] = "redis://localhost:6379/1"
    return app


@pytest.fixture(scope="session")
def db(app):
    with app.app_context():
        _db.create_all()
        yield _db
        _db.drop_all()


@pytest.fixture
def client(app, db):
    with app.test_client() as c:
        yield c


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code in (200, 503)
    data = json.loads(r.data)
    assert "api" in data
    assert data["api"] == "ok"


def test_create_experiment(client):
    payload = {
        "name": "Test Experiment",
        "model_type": "CNN",
        "dataset": "CIFAR-10",
        "hyperparameters": {"lr": 0.001, "batch_size": 32},
        "tags": ["test"],
    }
    r = client.post("/api/experiments/", json=payload)
    assert r.status_code == 201
    data = json.loads(r.data)
    assert data["name"] == "Test Experiment"
    assert data["status"] == "queued"
    assert "id" in data
    return data["id"]


def test_list_experiments(client):
    r = client.get("/api/experiments/")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert "experiments" in data
    assert "total" in data


def test_get_experiment(client):
    # Create one first
    payload = {"name": "Fetch Test", "model_type": "RNN", "dataset": "PTB"}
    r = client.post("/api/experiments/", json=payload)
    exp_id = json.loads(r.data)["id"]

    r2 = client.get(f"/api/experiments/{exp_id}")
    assert r2.status_code == 200
    assert json.loads(r2.data)["id"] == exp_id


def test_update_experiment_status(client):
    payload = {"name": "Status Test", "model_type": "CNN", "dataset": "MNIST"}
    r = client.post("/api/experiments/", json=payload)
    exp_id = json.loads(r.data)["id"]

    r2 = client.patch(f"/api/experiments/{exp_id}", json={"status": "running"})
    assert r2.status_code == 200
    assert json.loads(r2.data)["status"] == "running"


def test_log_and_fetch_metrics(client):
    payload = {"name": "Metrics Test", "model_type": "CNN", "dataset": "MNIST"}
    r = client.post("/api/experiments/", json=payload)
    exp_id = json.loads(r.data)["id"]

    metrics = [
        {"metric_name": "train_loss", "value": 1.5, "step": 1},
        {"metric_name": "train_loss", "value": 1.2, "step": 2},
        {"metric_name": "accuracy", "value": 0.6, "step": 1},
    ]
    r2 = client.post(f"/api/metrics/{exp_id}", json=metrics)
    assert r2.status_code == 201

    r3 = client.get(f"/api/metrics/{exp_id}")
    assert r3.status_code == 200
    data = json.loads(r3.data)
    assert "train_loss" in data["metrics"]
    assert len(data["metrics"]["train_loss"]) == 2


def test_delete_experiment(client):
    payload = {"name": "Delete Me", "model_type": "CNN", "dataset": "MNIST"}
    r = client.post("/api/experiments/", json=payload)
    exp_id = json.loads(r.data)["id"]

    r2 = client.delete(f"/api/experiments/{exp_id}")
    assert r2.status_code == 200

    r3 = client.get(f"/api/experiments/{exp_id}")
    assert r3.status_code == 404


def test_experiment_summary(client):
    r = client.get("/api/experiments/summary")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert "total" in data
    assert "running" in data
    assert "completed" in data
