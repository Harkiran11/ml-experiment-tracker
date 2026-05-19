from app import create_app, db
from app.models import Experiment, Metric, Tag
import random
import math
from datetime import datetime, timedelta

app = create_app()


@app.cli.command("seed")
def seed_db():
    """Seed the database with realistic ML experiment data."""
    print("Seeding database...")

    experiments_data = [
        {
            "name": "ResNet-50 ImageNet Baseline",
            "description": "Standard ResNet-50 training on ImageNet with SGD optimizer",
            "model_type": "CNN",
            "dataset": "ImageNet",
            "status": "completed",
            "hyperparameters": {"lr": 0.1, "batch_size": 256, "epochs": 90, "optimizer": "SGD", "weight_decay": 1e-4},
            "final_metrics": {"accuracy": 0.7613, "top5_accuracy": 0.9295, "val_loss": 0.8942},
            "tags": ["baseline", "resnet", "imagenet"],
        },
        {
            "name": "ViT-B/16 Fine-tune",
            "description": "Vision Transformer fine-tuned from pretrained weights",
            "model_type": "Transformer",
            "dataset": "ImageNet",
            "status": "completed",
            "hyperparameters": {"lr": 3e-4, "batch_size": 128, "epochs": 30, "optimizer": "AdamW", "warmup_steps": 500},
            "final_metrics": {"accuracy": 0.8112, "top5_accuracy": 0.9541, "val_loss": 0.6821},
            "tags": ["vit", "transformer", "fine-tune"],
        },
        {
            "name": "EfficientNet-B4 Experiment",
            "description": "EfficientNet-B4 with cosine annealing LR schedule",
            "model_type": "CNN",
            "dataset": "ImageNet",
            "status": "running",
            "hyperparameters": {"lr": 0.016, "batch_size": 64, "epochs": 100, "optimizer": "RMSprop"},
            "final_metrics": {},
            "tags": ["efficientnet", "lr-schedule"],
        },
        {
            "name": "GPT-2 Text Classifier",
            "description": "GPT-2 small adapted for sequence classification on SST-2",
            "model_type": "LLM",
            "dataset": "SST-2",
            "status": "completed",
            "hyperparameters": {"lr": 5e-5, "batch_size": 32, "epochs": 5, "optimizer": "AdamW", "max_seq_len": 512},
            "final_metrics": {"accuracy": 0.9312, "f1": 0.9298, "val_loss": 0.2041},
            "tags": ["nlp", "gpt2", "classification"],
        },
        {
            "name": "YOLO-v8 Object Detection",
            "description": "YOLOv8 training on COCO subset for vehicle detection",
            "model_type": "Object Detection",
            "dataset": "COCO-vehicles",
            "status": "failed",
            "hyperparameters": {"lr": 0.01, "batch_size": 16, "epochs": 200, "optimizer": "SGD"},
            "final_metrics": {},
            "tags": ["yolo", "detection", "coco"],
        },
        {
            "name": "LSTM Time Series Forecaster",
            "description": "Multi-layer LSTM for electricity demand forecasting",
            "model_type": "RNN",
            "dataset": "ElectricityDemand",
            "status": "queued",
            "hyperparameters": {"lr": 1e-3, "batch_size": 64, "hidden_size": 256, "num_layers": 3},
            "final_metrics": {},
            "tags": ["lstm", "forecasting", "timeseries"],
        },
    ]

    for edata in experiments_data:
        exp = Experiment(
            name=edata["name"],
            description=edata["description"],
            model_type=edata["model_type"],
            dataset=edata["dataset"],
            status=edata["status"],
            hyperparameters=edata["hyperparameters"],
            final_metrics=edata["final_metrics"],
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
        )
        if edata["status"] in ("running", "completed", "failed"):
            exp.started_at = exp.created_at + timedelta(minutes=random.randint(1, 10))
        if edata["status"] in ("completed", "failed"):
            exp.completed_at = exp.started_at + timedelta(hours=random.randint(2, 12))

        db.session.add(exp)
        db.session.flush()

        for tag_name in edata["tags"]:
            db.session.add(Tag(experiment_id=exp.id, name=tag_name))

        # Generate synthetic metric curves
        if edata["status"] in ("completed", "running"):
            steps = 90 if edata["status"] == "completed" else 40
            for step in range(1, steps + 1):
                noise = random.gauss(0, 0.01)
                train_loss = 2.5 * math.exp(-0.04 * step) + 0.15 + noise
                val_loss_val = 2.8 * math.exp(-0.035 * step) + 0.2 + abs(noise * 1.2)
                accuracy = min(0.99, 0.3 + 0.7 * (1 - math.exp(-0.06 * step)) + noise * 0.5)

                db.session.add(Metric(experiment_id=exp.id, metric_name="train_loss", value=round(train_loss, 4), step=step, epoch=step))
                db.session.add(Metric(experiment_id=exp.id, metric_name="val_loss", value=round(val_loss_val, 4), step=step, epoch=step))
                db.session.add(Metric(experiment_id=exp.id, metric_name="accuracy", value=round(accuracy, 4), step=step, epoch=step))
                if edata["model_type"] in ("CNN", "Transformer"):
                    lr_val = edata["hyperparameters"].get("lr", 0.01) * (0.1 ** (step // 30))
                    db.session.add(Metric(experiment_id=exp.id, metric_name="learning_rate", value=lr_val, step=step, epoch=step))

    db.session.commit()
    print("Database seeded successfully.")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
