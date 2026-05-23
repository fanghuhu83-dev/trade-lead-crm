from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


def utc_now():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    company_name = db.Column(db.String(200), default="")
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    customers = db.relationship("Customer", back_populates="user", cascade="all, delete-orphan")
    tags = db.relationship("Tag", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "companyName": self.company_name,
            "createdAt": self.created_at.isoformat(),
        }


class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    company_name = db.Column(db.String(200), nullable=False)
    website = db.Column(db.String(500), default="")
    email = db.Column(db.String(200), default="")
    country = db.Column(db.String(100), default="")
    industry = db.Column(db.String(200), default="")
    product_keyword = db.Column(db.String(200), default="")
    status = db.Column(db.String(20), nullable=False, default="potential")
    notes = db.Column(db.Text, default="")
    favorite = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    user = db.relationship("User", back_populates="customers")
    followups = db.relationship("FollowUp", back_populates="customer", cascade="all, delete-orphan", order_by="FollowUp.created_at.desc()")
    tags = db.relationship("Tag", secondary="customer_tags", back_populates="customers")
    activities = db.relationship("ActivityLog", back_populates="customer", cascade="all, delete-orphan", order_by="ActivityLog.created_at.desc()")

    def to_dict(self):
        return {
            "id": self.id,
            "companyName": self.company_name,
            "website": self.website,
            "email": self.email,
            "country": self.country,
            "industry": self.industry,
            "productKeyword": self.product_keyword,
            "status": self.status,
            "notes": self.notes,
            "favorite": self.favorite,
            "tags": [t.to_dict() for t in self.tags],
            "followupCount": len(self.followups),
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }


class FollowUp(db.Model):
    __tablename__ = "followups"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    customer = db.relationship("Customer", back_populates="followups")

    def to_dict(self):
        return {
            "id": self.id,
            "customerId": self.customer_id,
            "content": self.content,
            "createdAt": self.created_at.isoformat(),
        }


class Tag(db.Model):
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), default="slate")

    user = db.relationship("User", back_populates="tags")
    customers = db.relationship("Customer", secondary="customer_tags", back_populates="tags")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "customerCount": len(self.customers),
        }


class ActivityLog(db.Model):
    __tablename__ = "activity_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    detail = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    customer = db.relationship("Customer", back_populates="activities")

    def to_dict(self):
        return {
            "id": self.id,
            "customerId": self.customer_id,
            "customerName": self.customer.company_name if self.customer else "",
            "action": self.action,
            "detail": self.detail,
            "createdAt": self.created_at.isoformat(),
        }


customer_tags = db.Table(
    "customer_tags",
    db.Column("customer_id", db.Integer, db.ForeignKey("customers.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tags.id"), primary_key=True),
)
