import csv
import io
from datetime import datetime
from flask import Blueprint, jsonify, request, Response, g
from models import db, Customer, FollowUp, Tag, ActivityLog
from config import ALLOWED_STATUSES, STATUS_LABELS
from middleware import login_required

customers_bp = Blueprint("customers", __name__)

SOURCES = ["Alibaba", "LinkedIn", "展会", "Google", "老客户推荐", "其他"]


def _get_customer(customer_id):
    c = db.session.get(Customer, customer_id)
    if c and c.user_id == g.current_user.id:
        return c
    return None


def _log_activity(customer_id, action, detail=""):
    log = ActivityLog(customer_id=customer_id, action=action, detail=detail)
    db.session.add(log)


def _parse_date(value):
    """Parse ISO date string (date-only or datetime) to a Python date."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


# -- LIST --

@customers_bp.get("")
@login_required
def list_customers():
    uid = g.current_user.id
    query = request.args.get("q", "").strip()
    status = request.args.get("status", "").strip()
    country = request.args.get("country", "").strip()
    favorite = request.args.get("favorite", "").strip()
    tag_id = request.args.get("tagId", "").strip()
    sort = request.args.get("sort", "updated_at").strip()
    order = request.args.get("order", "desc").strip()

    stmt = db.select(Customer).where(Customer.user_id == uid)

    if query:
        like = f"%{query}%"
        stmt = stmt.where(
            db.or_(
                Customer.company_name.ilike(like), Customer.email.ilike(like),
                Customer.website.ilike(like), Customer.country.ilike(like),
                Customer.industry.ilike(like), Customer.product_keyword.ilike(like),
                Customer.contact_name.ilike(like),
            )
        )

    if status and status in ALLOWED_STATUSES:
        stmt = stmt.where(Customer.status == status)

    if country:
        stmt = stmt.where(Customer.country.ilike(f"%{country}%"))

    if favorite == "true":
        stmt = stmt.where(Customer.favorite == True)

    if tag_id and tag_id.isdigit():
        stmt = stmt.join(Customer.tags).where(Tag.id == int(tag_id))

    sort_col = getattr(Customer, sort, Customer.updated_at)
    stmt = stmt.order_by(sort_col.desc() if order == "desc" else sort_col.asc())

    customers = db.session.execute(stmt).scalars().all()
    return jsonify({"data": [c.to_dict() for c in customers], "total": len(customers)})


# -- CREATE --

@customers_bp.post("")
@login_required
def create_customer():
    payload = request.get_json(silent=True) or {}
    company_name = (payload.get("companyName") or "").strip()

    if not company_name:
        return jsonify({"error": "companyName is required."}), 400

    customer = Customer(
        user_id=g.current_user.id,
        company_name=company_name,
        website=(payload.get("website") or "").strip(),
        email=(payload.get("email") or "").strip(),
        country=(payload.get("country") or "").strip(),
        industry=(payload.get("industry") or "").strip(),
        product_keyword=(payload.get("productKeyword") or "").strip(),
        contact_name=(payload.get("contactName") or "").strip(),
        phone=(payload.get("phone") or "").strip(),
        source=(payload.get("source") or "").strip(),
        next_follow_up=_parse_date(payload.get("nextFollowUp")),
        status=payload.get("status", "potential"),
        notes=(payload.get("notes") or "").strip(),
    )

    tag_ids = payload.get("tagIds", [])
    if tag_ids:
        tags = db.session.execute(
            db.select(Tag).where(Tag.id.in_(tag_ids), Tag.user_id == g.current_user.id)
        ).scalars().all()
        customer.tags = tags

    db.session.add(customer)
    db.session.flush()
    _log_activity(customer.id, "created", f"Created customer: {company_name}")
    db.session.commit()
    return jsonify({"data": customer.to_dict()}), 201


# -- GET ONE --

@customers_bp.get("/<int:customer_id>")
@login_required
def get_customer(customer_id):
    c = _get_customer(customer_id)
    if not c:
        return jsonify({"error": "Customer not found."}), 404

    data = c.to_dict()
    data["followups"] = [f.to_dict() for f in c.followups]
    data["activities"] = [a.to_dict() for a in c.activities[:20]]
    return jsonify({"data": data})


# -- UPDATE --

@customers_bp.put("/<int:customer_id>")
@login_required
def update_customer(customer_id):
    c = _get_customer(customer_id)
    if not c:
        return jsonify({"error": "Customer not found."}), 404
    if g.current_user.email == "demo@example.com":
        return jsonify({"error": "演示账号不支持删除和修改操作"}), 403

    payload = request.get_json(silent=True) or {}

    for field, attr in [
        ("companyName", "company_name"), ("website", "website"), ("email", "email"),
        ("country", "country"), ("industry", "industry"),
        ("productKeyword", "product_keyword"), ("contactName", "contact_name"),
        ("phone", "phone"), ("source", "source"), ("notes", "notes"),
    ]:
        if field in payload:
            setattr(c, attr, (payload[field] or "").strip())

    if "nextFollowUp" in payload:
        c.next_follow_up = _parse_date(payload["nextFollowUp"])

    if "status" in payload and payload["status"] in ALLOWED_STATUSES:
        if payload["status"] != c.status:
            _log_activity(c.id, "status_changed",
                          f"Status: {STATUS_LABELS.get(c.status, c.status)} → {STATUS_LABELS.get(payload['status'], payload['status'])}")
        c.status = payload["status"]

    if "tagIds" in payload:
        tags = db.session.execute(
            db.select(Tag).where(Tag.id.in_(payload["tagIds"]), Tag.user_id == g.current_user.id)
        ).scalars().all()
        c.tags = tags

    db.session.commit()
    return jsonify({"data": c.to_dict()})


# -- DELETE --

@customers_bp.delete("/<int:customer_id>")
@login_required
def delete_customer(customer_id):
    c = _get_customer(customer_id)
    if not c:
        return jsonify({"error": "Customer not found."}), 404
    if g.current_user.email == "demo@example.com":
        return jsonify({"error": "演示账号不支持删除和修改操作"}), 403
    db.session.delete(c)
    db.session.commit()
    return "", 204


# -- STATUS --

@customers_bp.patch("/<int:customer_id>/status")
@login_required
def update_status(customer_id):
    c = _get_customer(customer_id)
    if not c:
        return jsonify({"error": "Customer not found."}), 404
    if g.current_user.email == "demo@example.com":
        return jsonify({"error": "演示账号不支持删除和修改操作"}), 403

    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    if status not in ALLOWED_STATUSES:
        return jsonify({"error": "Invalid status.", "allowed": ALLOWED_STATUSES}), 400

    if status != c.status:
        _log_activity(c.id, "status_changed",
                      f"Status: {STATUS_LABELS.get(c.status, c.status)} → {STATUS_LABELS.get(status, status)}")
    c.status = status
    db.session.commit()
    return jsonify({"data": c.to_dict()})


# -- BATCH STATUS --

@customers_bp.patch("/batch/status")
@login_required
def batch_update_status():
    payload = request.get_json(silent=True) or {}
    if g.current_user.email == "demo@example.com":
        return jsonify({"error": "演示账号不支持删除和修改操作"}), 403
    ids = payload.get("ids", [])
    status = payload.get("status")

    if not ids or status not in ALLOWED_STATUSES:
        return jsonify({"error": "Invalid request."}), 400

    customers = db.session.execute(
        db.select(Customer).where(Customer.id.in_(ids), Customer.user_id == g.current_user.id)
    ).scalars().all()
    for c in customers:
        if status != c.status:
            _log_activity(c.id, "status_changed",
                          f"Batch: {STATUS_LABELS.get(c.status, c.status)} → {STATUS_LABELS.get(status, status)}")
        c.status = status

    db.session.commit()
    return jsonify({"data": {"updated": len(customers)}})


# -- FAVORITE --

@customers_bp.patch("/<int:customer_id>/favorite")
@login_required
def toggle_favorite(customer_id):
    c = _get_customer(customer_id)
    if not c:
        return jsonify({"error": "Customer not found."}), 404
    if g.current_user.email == "demo@example.com":
        return jsonify({"error": "演示账号不支持删除和修改操作"}), 403
    c.favorite = not c.favorite
    db.session.commit()
    return jsonify({"data": c.to_dict()})


# -- EXPORT CSV --

@customers_bp.get("/export/csv")
@login_required
def export_csv():
    customers = db.session.execute(
        db.select(Customer).where(Customer.user_id == g.current_user.id).order_by(Customer.updated_at.desc())
    ).scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Company Name", "Website", "Email", "Country", "Industry",
                     "Product Keyword", "Contact Name", "Phone", "Source", "Next Follow Up",
                     "Status", "Tags", "Favorited", "Created At", "Updated At"])
    for c in customers:
        writer.writerow([
            c.id, c.company_name, c.website, c.email, c.country, c.industry,
            c.product_keyword, c.contact_name, c.phone, c.source,
            c.next_follow_up.strftime("%Y-%m-%d") if c.next_follow_up else "",
            STATUS_LABELS.get(c.status, c.status),
            ", ".join(t.name for t in c.tags),
            "Yes" if c.favorite else "No",
            c.created_at.strftime("%Y-%m-%d %H:%M"),
            c.updated_at.strftime("%Y-%m-%d %H:%M"),
        ])
    output.seek(0)
    return Response(output.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=customers_export.csv"})


# -- FOLLOWUPS --

@customers_bp.get("/<int:customer_id>/followups")
@login_required
def list_followups(customer_id):
    c = _get_customer(customer_id)
    if not c:
        return jsonify({"error": "Customer not found."}), 404
    return jsonify({"data": [f.to_dict() for f in c.followups]})


@customers_bp.post("/<int:customer_id>/followups")
@login_required
def create_followup(customer_id):
    c = _get_customer(customer_id)
    if not c:
        return jsonify({"error": "Customer not found."}), 404

    payload = request.get_json(silent=True) or {}
    content = (payload.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required."}), 400

    fu = FollowUp(customer_id=customer_id, content=content)
    db.session.add(fu)
    _log_activity(customer_id, "followup_added", "Added follow-up note")
    db.session.commit()
    return jsonify({"data": fu.to_dict()}), 201


# -- TAGS --

@customers_bp.get("/tags/list")
@login_required
def list_tags():
    tags = db.session.execute(
        db.select(Tag).where(Tag.user_id == g.current_user.id).order_by(Tag.name)
    ).scalars().all()
    return jsonify({"data": [t.to_dict() for t in tags]})


@customers_bp.post("/tags/create")
@login_required
def create_tag():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required."}), 400

    existing = db.session.execute(
        db.select(Tag).where(Tag.user_id == g.current_user.id, Tag.name == name)
    ).scalar()
    if existing:
        return jsonify({"data": existing.to_dict()}), 200

    tag = Tag(user_id=g.current_user.id, name=name, color=payload.get("color", "slate"))
    db.session.add(tag)
    db.session.commit()
    return jsonify({"data": tag.to_dict()}), 201
