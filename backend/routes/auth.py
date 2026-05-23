from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, request
import jwt
from models import db, User
from config import JWT_SECRET, JWT_EXPIRY_HOURS
from middleware import login_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = (payload.get("password") or "")
    company_name = (payload.get("companyName") or "").strip()

    errors = {}
    if not email or "@" not in email:
        errors["email"] = "Valid email is required."
    if len(password) < 6:
        errors["password"] = "Password must be at least 6 characters."
    if not company_name:
        errors["companyName"] = "Company name is required."

    if errors:
        return jsonify({"error": "Validation failed.", "fields": errors}), 400

    existing = db.session.execute(db.select(User).where(User.email == email)).scalar()
    if existing:
        return jsonify({"error": "Email already registered."}), 409

    user = User(email=email, company_name=company_name)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = _make_token(user)
    return jsonify({"data": {"user": user.to_dict(), "token": token}}), 201


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = db.session.execute(db.select(User).where(User.email == email)).scalar()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = _make_token(user)
    return jsonify({"data": {"user": user.to_dict(), "token": token}})


@auth_bp.get("/me")
@login_required
def me():
    from flask import g
    return jsonify({"data": {"user": g.current_user.to_dict()}})


def _make_token(user):
    exp = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    return jwt.encode(
        {"user_id": user.id, "exp": exp},
        JWT_SECRET,
        algorithm="HS256",
    )
