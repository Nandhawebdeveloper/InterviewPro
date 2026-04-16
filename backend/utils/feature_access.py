"""
utils/feature_access.py - Plan-based Feature Access Configuration & Decorator

Defines which features each plan (free / pro / team) can access,
and provides a decorator to enforce restrictions on routes.

When PAYMENT_GATEWAY_ENABLED is False, all users get PRO-level access
(dev / demo mode).
"""

from functools import wraps
from datetime import date, datetime

from flask import current_app
from flask_jwt_extended import get_jwt_identity

from extensions import db
from models.user_model import User
from utils.response import error_response


# ─────────────────────────────────────────────
# Feature Access Matrix
# ─────────────────────────────────────────────
FEATURE_ACCESS = {
    "free": {
        "daily_question_limit": 20,
        "coding": False,
        "topics_limit": 5,       # max number of distinct topics
        "ai_feedback": False,
        "mock_interview": False,
        "advanced_analytics": False,
        "team_features": False,
    },
    "pro": {
        "daily_question_limit": None,  # unlimited
        "coding": True,
        "topics_limit": None,          # unlimited
        "ai_feedback": True,
        "mock_interview": True,
        "advanced_analytics": True,
        "team_features": False,
    },
    "team": {
        "daily_question_limit": None,
        "coding": True,
        "topics_limit": None,
        "ai_feedback": True,
        "mock_interview": True,
        "advanced_analytics": True,
        "team_features": True,
    },
}

# Topics available to free-plan users
FREE_TOPICS = ["JavaScript", "React", "Python", "SQL", "DSA"]


def _get_effective_plan(user):
    """
    Return the user's effective plan, considering:
    - If payment gateway is disabled → always 'pro'
    - If plan has expired → auto-downgrade to 'free'
    """
    if not current_app.config.get("PAYMENT_GATEWAY_ENABLED"):
        return "pro"

    plan = user.plan or "free"

    # Check expiry for paid plans
    if plan in ("pro", "team") and user.plan_expires_at:
        if datetime.utcnow() > user.plan_expires_at:
            # Auto-downgrade
            user.plan = "free"
            user.plan_expires_at = None
            db.session.commit()
            return "free"

    return plan


def _reset_daily_counter_if_needed(user):
    """Reset questions_used_today if the date has changed."""
    today = date.today()
    if user.last_active_date != today:
        user.questions_used_today = 0
        user.last_active_date = today
        db.session.commit()


def get_user_feature_info(user):
    """
    Build a dict of the user's current feature access + usage info.
    Used by the /api/config/features endpoint for frontend gating.
    """
    plan = _get_effective_plan(user)
    access = FEATURE_ACCESS.get(plan, FEATURE_ACCESS["free"])
    _reset_daily_counter_if_needed(user)

    daily_limit = access["daily_question_limit"]
    return {
        "plan": plan,
        "plan_expires_at": user.plan_expires_at.isoformat() if user.plan_expires_at else None,
        "daily_question_limit": daily_limit,
        "questions_used_today": user.questions_used_today or 0,
        "questions_remaining": (
            max(0, daily_limit - (user.questions_used_today or 0))
            if daily_limit is not None
            else None
        ),
        "coding": access["coding"],
        "ai_feedback": access["ai_feedback"],
        "mock_interview": access["mock_interview"],
        "advanced_analytics": access["advanced_analytics"],
        "topics_limit": access["topics_limit"],
        "allowed_topics": FREE_TOPICS if access["topics_limit"] else None,
        "team_features": access["team_features"],
    }


# ─────────────────────────────────────────────
# Decorator
# ─────────────────────────────────────────────

def check_feature_access(feature_name):
    """
    Decorator to restrict an endpoint based on the user's plan.

    Usage:
        @jwt_required()
        @check_feature_access("coding")
        def run_code():
            ...

    If PAYMENT_GATEWAY_ENABLED is False, access is always granted.
    If the user's plan has expired, they are auto-downgraded to free.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Skip gating when payment is disabled
            if not current_app.config.get("PAYMENT_GATEWAY_ENABLED"):
                return fn(*args, **kwargs)

            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if not user:
                return error_response("User not found", 404)

            plan = _get_effective_plan(user)
            access = FEATURE_ACCESS.get(plan, FEATURE_ACCESS["free"])

            if not access.get(feature_name, False):
                return error_response(
                    f"This feature requires a Pro plan. Please upgrade to continue.",
                    403,
                    code="UPGRADE_REQUIRED",
                )

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def check_daily_limit():
    """
    Decorator to enforce the daily question limit for free-plan users.

    Should be applied to the submit-attempt endpoint.
    Increments the counter on success.

    Usage:
        @jwt_required()
        @check_daily_limit()
        def submit_attempt():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Skip gating when payment is disabled
            if not current_app.config.get("PAYMENT_GATEWAY_ENABLED"):
                return fn(*args, **kwargs)

            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if not user:
                return error_response("User not found", 404)

            plan = _get_effective_plan(user)
            access = FEATURE_ACCESS.get(plan, FEATURE_ACCESS["free"])
            daily_limit = access["daily_question_limit"]

            if daily_limit is not None:
                _reset_daily_counter_if_needed(user)
                if (user.questions_used_today or 0) >= daily_limit:
                    return error_response(
                        f"Daily question limit reached ({daily_limit}). Upgrade to Pro for unlimited practice.",
                        403,
                        code="DAILY_LIMIT_REACHED",
                    )

                # Increment counter
                user.questions_used_today = (user.questions_used_today or 0) + 1
                db.session.commit()

            return fn(*args, **kwargs)
        return wrapper
    return decorator
