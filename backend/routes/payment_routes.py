"""
payment_routes.py - Razorpay Payment Gateway Routes

Endpoints:
  POST /api/payments/create-order   – Create a Razorpay order for plan upgrade
  POST /api/payments/verify         – Verify payment signature and upgrade plan
  GET  /api/payments/history        – Get user's payment history
  GET  /api/payments/plan           – Get current plan info
"""

import logging
from datetime import datetime, timedelta

import razorpay
from flask import Blueprint, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user_model import User
from models.payment_model import Payment
from utils.response import success_response, error_response

logger = logging.getLogger(__name__)

payment_bp = Blueprint("payment", __name__)

# Plan prices in paise (₹399 = 39900 paise, ₹999 = 99900 paise)
PLAN_PRICES = {
    "pro": 39900,
    "team": 99900,
}


def _get_razorpay_client():
    """Create a Razorpay client using app config."""
    key_id = current_app.config.get("RAZORPAY_KEY_ID", "")
    key_secret = current_app.config.get("RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))


def _check_payment_enabled():
    """Return error response if payment gateway is disabled."""
    if not current_app.config.get("PAYMENT_GATEWAY_ENABLED"):
        return error_response("Payment gateway is disabled", 403)
    return None


# ─────────────────────────────────────────────
# POST /api/payments/create-order
# ─────────────────────────────────────────────
@payment_bp.route("/payments/create-order", methods=["POST"])
@jwt_required()
def create_order():
    """Create a Razorpay order for plan upgrade."""
    gate = _check_payment_enabled()
    if gate:
        return gate

    from flask import request
    data = request.get_json() or {}
    plan = data.get("plan", "").lower()

    if plan not in PLAN_PRICES:
        return error_response("Invalid plan. Choose 'pro' or 'team'.", 400)

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    # Check if user already has this plan and it's still active
    if user.plan == plan and user.plan_expires_at and user.plan_expires_at > datetime.utcnow():
        return error_response(f"You already have an active {plan} plan.", 400)

    client = _get_razorpay_client()
    if not client:
        return error_response("Payment gateway is not configured", 500)

    amount = PLAN_PRICES[plan]

    try:
        order_data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"order_{user_id}_{int(datetime.utcnow().timestamp())}",
            "notes": {
                "user_id": str(user_id),
                "plan": plan,
            },
        }
        razorpay_order = client.order.create(data=order_data)
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        return error_response("Failed to create payment order", 500)

    # Save payment record
    payment = Payment(
        user_id=user_id,
        razorpay_order_id=razorpay_order["id"],
        plan=plan,
        amount=amount,
        currency="INR",
        status="created",
    )
    db.session.add(payment)
    db.session.commit()

    return success_response({
        "order_id": razorpay_order["id"],
        "amount": amount,
        "currency": "INR",
        "key_id": current_app.config.get("RAZORPAY_KEY_ID"),
        "user_name": user.name,
        "user_email": user.email,
    }, "Order created successfully")


# ─────────────────────────────────────────────
# POST /api/payments/verify
# ─────────────────────────────────────────────
@payment_bp.route("/payments/verify", methods=["POST"])
@jwt_required()
def verify_payment():
    """Verify Razorpay payment signature and upgrade user plan."""
    gate = _check_payment_enabled()
    if gate:
        return gate

    from flask import request
    data = request.get_json() or {}

    razorpay_order_id = data.get("razorpay_order_id", "")
    razorpay_payment_id = data.get("razorpay_payment_id", "")
    razorpay_signature = data.get("razorpay_signature", "")

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return error_response("Missing payment verification parameters", 400)

    user_id = int(get_jwt_identity())

    # Find the payment record
    payment = Payment.query.filter_by(
        razorpay_order_id=razorpay_order_id,
        user_id=user_id,
    ).first()

    if not payment:
        return error_response("Payment order not found", 404)

    if payment.status == "paid":
        return error_response("Payment already verified", 400)

    client = _get_razorpay_client()
    if not client:
        return error_response("Payment gateway is not configured", 500)

    # Verify signature
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        payment.status = "failed"
        db.session.commit()
        logger.warning(f"Payment signature verification failed for order {razorpay_order_id}")
        return error_response("Payment verification failed. Invalid signature.", 400)

    # Signature valid — upgrade user plan
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.status = "paid"

    user = User.query.get(user_id)
    user.plan = payment.plan
    user.plan_expires_at = datetime.utcnow() + timedelta(days=30)

    db.session.commit()

    logger.info(f"User {user_id} upgraded to {payment.plan} plan via payment {razorpay_payment_id}")

    return success_response({
        "plan": user.plan,
        "plan_expires_at": user.plan_expires_at.isoformat(),
        "payment_id": razorpay_payment_id,
    }, "Payment verified and plan upgraded successfully")


# ─────────────────────────────────────────────
# GET /api/payments/history
# ─────────────────────────────────────────────
@payment_bp.route("/payments/history", methods=["GET"])
@jwt_required()
def payment_history():
    """Get user's payment history."""
    gate = _check_payment_enabled()
    if gate:
        return gate

    user_id = int(get_jwt_identity())
    payments = Payment.query.filter_by(user_id=user_id).order_by(Payment.created_at.desc()).all()

    return success_response({
        "payments": [p.to_dict() for p in payments],
    }, "Payment history retrieved")


# ─────────────────────────────────────────────
# GET /api/payments/plan
# ─────────────────────────────────────────────
@payment_bp.route("/payments/plan", methods=["GET"])
@jwt_required()
def current_plan():
    """Get current user's plan info."""
    gate = _check_payment_enabled()
    if gate:
        return gate

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    is_active = False
    if user.plan in ("pro", "team") and user.plan_expires_at:
        is_active = user.plan_expires_at > datetime.utcnow()

    return success_response({
        "plan": user.plan or "free",
        "plan_expires_at": user.plan_expires_at.isoformat() if user.plan_expires_at else None,
        "is_active": is_active,
    }, "Current plan retrieved")
