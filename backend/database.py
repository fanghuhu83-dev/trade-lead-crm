import os
from pathlib import Path
from models import db
from config import DATA_DIR


def init_db(app):
    # Production: Render sets DATABASE_URL (PostgreSQL)
    # Local: fall back to SQLite
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    else:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DATA_DIR / 'app.db'}"

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    with app.app_context():
        db.create_all()
