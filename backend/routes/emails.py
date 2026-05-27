from flask import Blueprint, jsonify, request, g
from models import db, GeneratedEmail
from middleware import login_required

emails_bp = Blueprint("emails", __name__)


@emails_bp.post("")
@login_required
def save_email():
    """Save a generated email to history."""
    payload = request.get_json(silent=True) or {}
    body = (payload.get("body") or "").strip()
    if not body:
        return jsonify({"error": "Email body is required."}), 400

    email = GeneratedEmail(
        user_id=g.current_user.id,
        company_name=(payload.get("companyName") or "").strip(),
        product_name=(payload.get("productName") or "").strip(),
        country=(payload.get("country") or "").strip(),
        industry=(payload.get("industry") or "").strip(),
        contact_name=(payload.get("contactName") or "").strip(),
        scene=(payload.get("scene") or "first_contact").strip(),
        tone=(payload.get("tone") or "neutral").strip(),
        style=(payload.get("style") or "concise").strip(),
        body=body,
    )
    db.session.add(email)
    db.session.commit()
    return jsonify({"data": email.to_dict()}), 201


@emails_bp.get("")
@login_required
def list_emails():
    """List saved emails for current user."""
    uid = g.current_user.id
    query = request.args.get("q", "").strip()

    stmt = db.select(GeneratedEmail).where(GeneratedEmail.user_id == uid)
    if query:
        like = f"%{query}%"
        stmt = stmt.where(
            db.or_(
                GeneratedEmail.company_name.ilike(like),
                GeneratedEmail.product_name.ilike(like),
            )
        )
    stmt = stmt.order_by(GeneratedEmail.created_at.desc())

    emails = db.session.execute(stmt).scalars().all()
    return jsonify({"data": [e.to_dict() for e in emails], "total": len(emails)})


@emails_bp.delete("/<int:email_id>")
@login_required
def delete_email(email_id):
    """Delete a saved email."""
    email = db.session.get(GeneratedEmail, email_id)
    if not email or email.user_id != g.current_user.id:
        return jsonify({"error": "Email not found."}), 404
    db.session.delete(email)
    db.session.commit()
    return "", 204
