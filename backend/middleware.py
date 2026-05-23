from functools import wraps
from flask import request, jsonify, g
import jwt
from config import JWT_SECRET
from models import db, User


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

        if not token:
            return jsonify({"error": "Authentication required."}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                raise jwt.InvalidTokenError
            user = db.session.get(User, user_id)
            if not user:
                raise jwt.InvalidTokenError
            g.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401

        return f(*args, **kwargs)

    return decorated
