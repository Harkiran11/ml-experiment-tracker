"""
ml_tracker_client.py — lightweight SDK for logging experiments from Python training scripts.

Usage:
    from ml_tracker_client import ExperimentTracker

    tracker = ExperimentTracker(base_url="http://localhost:5000/api")
    tracker.create_experiment(
        name="My Run",
        model_type="CNN",
        dataset="CIFAR-10",
        hyperparameters={"lr": 0.001, "epochs": 50},
        tags=["trial"],
    )
    tracker.start()

    for epoch in range(50):
        loss = train_one_epoch(model, loader)
        tracker.log({"train_loss": loss}, step=epoch + 1)

    tracker.complete(final_metrics={"accuracy": 0.92})
"""

import requests
import time
import logging

logger = logging.getLogger("ml_tracker")


class ExperimentTracker:
    def __init__(self, base_url="http://localhost:5000/api"):
        self.base_url = base_url.rstrip("/")
        self.experiment_id = None
        self._step = 0

    def create_experiment(self, name, model_type, dataset=None, hyperparameters=None, tags=None, description=None):
        payload = {
            "name": name,
            "model_type": model_type,
            "dataset": dataset,
            "hyperparameters": hyperparameters or {},
            "tags": tags or [],
            "description": description,
        }
        r = requests.post(f"{self.base_url}/experiments/", json=payload, timeout=10)
        r.raise_for_status()
        self.experiment_id = r.json()["id"]
        logger.info(f"Created experiment {self.experiment_id}: {name}")
        return self.experiment_id

    def start(self):
        self._update_status("running")

    def complete(self, final_metrics=None):
        data = {"status": "completed"}
        if final_metrics:
            data["final_metrics"] = final_metrics
        r = requests.patch(f"{self.base_url}/experiments/{self.experiment_id}", json=data, timeout=10)
        r.raise_for_status()
        logger.info(f"Experiment {self.experiment_id} completed")

    def fail(self):
        self._update_status("failed")

    def log(self, metrics: dict, step=None, epoch=None):
        if not self.experiment_id:
            raise ValueError("No experiment ID. Call create_experiment() first.")
        if step is None:
            self._step += 1
            step = self._step
        payload = [
            {"metric_name": k, "value": float(v), "step": step, "epoch": epoch}
            for k, v in metrics.items()
        ]
        r = requests.post(f"{self.base_url}/metrics/{self.experiment_id}", json=payload, timeout=10)
        r.raise_for_status()

    def _update_status(self, status):
        r = requests.patch(f"{self.base_url}/experiments/{self.experiment_id}", json={"status": status}, timeout=10)
        r.raise_for_status()


# Demo — run this directly to simulate a training run
if __name__ == "__main__":
    import math, random

    tracker = ExperimentTracker()
    tracker.create_experiment(
        name=f"Demo Run {int(time.time())}",
        model_type="CNN",
        dataset="CIFAR-10",
        hyperparameters={"lr": 0.001, "batch_size": 64, "epochs": 30},
        tags=["demo", "sdk"],
        description="Simulated training run via Python SDK",
    )
    tracker.start()
    print(f"Started experiment: {tracker.experiment_id}")

    for epoch in range(1, 31):
        noise = random.gauss(0, 0.008)
        train_loss = 2.0 * math.exp(-0.08 * epoch) + 0.12 + noise
        val_loss = 2.2 * math.exp(-0.07 * epoch) + 0.18 + abs(noise * 1.3)
        acc = min(0.98, 0.25 + 0.75 * (1 - math.exp(-0.1 * epoch)) + noise * 0.3)
        tracker.log({"train_loss": round(train_loss, 4), "val_loss": round(val_loss, 4), "accuracy": round(acc, 4)}, step=epoch)
        print(f"  Epoch {epoch:3d} | loss={train_loss:.4f} acc={acc:.4f}")
        time.sleep(0.05)

    tracker.complete(final_metrics={"accuracy": 0.9214, "val_loss": 0.2341})
    print("Done.")
