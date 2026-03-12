"""
routes/profile_routes.py - User Profile API Routes

Provides endpoints for viewing and updating user profile,
including password change functionality.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user_model import User
from models.attempt_model import Attempt
from services.auth_service import hash_password, verify_password
from utils.response import success_response, error_response
from sqlalchemy import func, case

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """
    Get current user's full profile with stats.

    GET /api/profile
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return error_response("User not found", 404)

    # Calculate stats
    total_attempts = Attempt.query.filter_by(user_id=user_id).count()
    correct_attempts = Attempt.query.filter_by(user_id=user_id, is_correct=True).count()
    accuracy = round((correct_attempts / total_attempts * 100), 2) if total_attempts > 0 else 0

    profile = user.to_dict()
    profile.update({
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "accuracy": accuracy,
    })

    return success_response({"profile": profile}, "Profile retrieved")


@profile_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """
    Update current user's profile (name and/or password).

    PUT /api/profile
    Body: { "name": str (optional), "current_password": str, "new_password": str (optional) }
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return error_response("User not found", 404)

    data = request.get_json()
    if not data:
        return error_response("Request body is required", 400)

    # Update name
    new_name = data.get("name", "").strip()
    if new_name:
        if len(new_name) < 2:
            return error_response("Name must be at least 2 characters", 400)
        user.name = new_name

    # Change password
    new_password = data.get("new_password", "")
    if new_password:
        current_password = data.get("current_password", "")
        if not current_password:
            return error_response("Current password is required to change password", 400)

        if not verify_password(current_password, user.password):
            return error_response("Current password is incorrect", 401)

        if len(new_password) < 6:
            return error_response("New password must be at least 6 characters", 400)

        user.password = hash_password(new_password)

    db.session.commit()

    return success_response({"profile": user.to_dict()}, "Profile updated successfully")
