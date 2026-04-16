"""
payment_model.py - Payment Database Model

Stores Razorpay payment records for plan upgrades.
Each row is an audit trail entry for a payment attempt.
"""

from extensions import db
from datetime import datetime


class Payment(db.Model):
    """Payment model for Razorpay transactions."""

    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    razorpay_order_id = db.Column(db.String(255), nullable=False)
    razorpay_payment_id = db.Column(db.String(255), nullable=True)
    razorpay_signature = db.Column(db.String(255), nullable=True)
    plan = db.Column(db.Enum("pro", "team"), nullable=False)
    amount = db.Column(db.Integer, nullable=False)  # Amount in paise
    currency = db.Column(db.String(10), default="INR", nullable=False)
    status = db.Column(db.Enum("created", "paid", "failed", "refunded"), default="created", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = db.relationship("User", backref=db.backref("payments", lazy=True))

    def to_dict(self):
        """Serialize payment object to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "razorpay_order_id": self.razorpay_order_id,
            "razorpay_payment_id": self.razorpay_payment_id,
            "plan": self.plan,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Payment {self.id} user={self.user_id} status={self.status}>"
