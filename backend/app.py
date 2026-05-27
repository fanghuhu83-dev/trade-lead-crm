from flask import Flask, jsonify
from flask_cors import CORS
import click

from config import ALLOWED_STATUSES, STATUS_LABELS
from database import init_db
from models import db
from routes.customers import customers_bp
from routes.email_generator import email_gen_bp
from routes.analytics import analytics_bp
from routes.auth import auth_bp


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    init_db(app)

    from demo_seed import ensure_demo_user
    with app.app_context():
        ensure_demo_user()

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(customers_bp, url_prefix="/api/customers")
    app.register_blueprint(email_gen_bp, url_prefix="/api/email/generate")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    @app.get("/api/health")
    def health_check():
        return jsonify({"status": "ok", "service": "trade-lead-api"})

    @app.get("/api/config/statuses")
    def get_statuses():
        return jsonify({
            "data": [{"value": s, "label": STATUS_LABELS[s]} for s in ALLOWED_STATUSES]
        })

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Resource not found."}), 404

    @app.errorhandler(500)
    def internal_error(_error):
        return jsonify({"error": "Internal server error."}), 500

    @app.cli.command("seed")
    @click.option("--force", is_flag=True, help="Force reseed even if data exists")
    def seed_command(force):
        """Initialize database with demo data."""
        from seed import seed_data
        with app.app_context():
            seed_data()
            click.echo("Database seeded successfully!")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
