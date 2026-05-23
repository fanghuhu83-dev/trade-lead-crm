from flask import Blueprint, jsonify, g
from sqlalchemy import func, extract
from models import db, Customer, ActivityLog
from middleware import login_required

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/overview")
@login_required
def overview():
    uid = g.current_user.id
    total = db.session.execute(
        db.select(func.count(Customer.id)).where(Customer.user_id == uid)
    ).scalar() or 0

    by_status = db.session.execute(
        db.select(Customer.status, func.count(Customer.id)).where(Customer.user_id == uid).group_by(Customer.status)
    ).all()

    status_counts = {s: 0 for s in ["potential", "contacted", "following", "won", "lost"]}
    status_counts.update({row[0]: row[1] for row in by_status})

    won = status_counts.get("won", 0)
    conversion_rate = round(won / total * 100, 1) if total > 0 else 0

    favorited = db.session.execute(
        db.select(func.count(Customer.id)).where(Customer.user_id == uid, Customer.favorite == True)
    ).scalar() or 0

    return jsonify({"data": {"total": total, "statusCounts": status_counts, "conversionRate": conversion_rate, "favorited": favorited}})


@analytics_bp.get("/pipeline")
@login_required
def pipeline_summary():
    uid = g.current_user.id
    customers = db.session.execute(
        db.select(Customer).where(Customer.user_id == uid).order_by(Customer.updated_at.desc())
    ).scalars().all()

    columns = {s: [] for s in ["potential", "contacted", "following", "won", "lost"]}
    for c in customers:
        if c.status in columns:
            columns[c.status].append(c.to_dict())

    return jsonify({"data": columns, "total": len(customers)})


@analytics_bp.get("/activity")
@login_required
def recent_activity():
    uid = g.current_user.id
    logs = db.session.execute(
        db.select(ActivityLog).join(Customer).where(Customer.user_id == uid)
        .order_by(ActivityLog.created_at.desc()).limit(30)
    ).scalars().all()
    return jsonify({"data": [log.to_dict() for log in logs]})


@analytics_bp.get("/country-distribution")
@login_required
def country_distribution():
    uid = g.current_user.id
    rows = db.session.execute(
        db.select(Customer.country, func.count(Customer.id))
        .where(Customer.user_id == uid, Customer.country != "")
        .group_by(Customer.country).order_by(func.count(Customer.id).desc()).limit(15)
    ).all()
    return jsonify({"data": [{"name": r[0], "value": r[1]} for r in rows]})


@analytics_bp.get("/industry-distribution")
@login_required
def industry_distribution():
    uid = g.current_user.id
    rows = db.session.execute(
        db.select(Customer.industry, func.count(Customer.id))
        .where(Customer.user_id == uid, Customer.industry != "")
        .group_by(Customer.industry).order_by(func.count(Customer.id).desc()).limit(10)
    ).all()
    return jsonify({"data": [{"name": r[0], "value": r[1]} for r in rows]})


@analytics_bp.get("/growth-trend")
@login_required
def growth_trend():
    uid = g.current_user.id
    year_col = extract("year", Customer.created_at).label("year")
    month_col = extract("month", Customer.created_at).label("month")
    rows = db.session.execute(
        db.select(year_col, month_col, func.count(Customer.id))
        .where(Customer.user_id == uid)
        .group_by("year", "month")
        .order_by("year", "month")
    ).all()
    return jsonify({"data": [{"month": f"{r[0]}-{r[1]:02d}", "count": r[2]} for r in rows]})
