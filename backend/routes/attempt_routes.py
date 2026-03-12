"""
routes/attempt_routes.py - Practice Attempt API Routes

Provides endpoints for submitting practice attempts
and retrieving attempt history.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date, timedelta

from extensions import db
from models.attempt_model import Attempt
from models.question_model import Question
from utils.validators import validate_attempt
from utils.response import success_response, error_response
from services.dashboard_service import get_user_dashboard, get_admin_analytics
from utils.decorators import admin_required

# Create blueprint for attempt routes
attempt_bp = Blueprint("attempts", __name__)


@attempt_bp.route("/attempt", methods=["POST"])
@jwt_required()
def submit_attempt():
    """
    Submit a practice attempt for a question.

    POST /api/attempt
    Body: { "question_id": int, "selected_answer": str }
    Returns: { "message": str, "is_correct": bool, "correct_answer": str }
    """
    data = request.get_json()

    # Validate input
    is_valid, error = validate_attempt(data)
    if not is_valid:
        return error_response(error, 400)

    user_id = int(get_jwt_identity())
    question_id = data["question_id"]
    selected_answer = data["selected_answer"].strip()

    # Fetch the question
    question = Question.query.get(question_id)
    if not question:
        return error_response("Question not found", 404)

    # Check if answer is correct (case-insensitive comparison)
    is_correct = selected_answer.lower() == question.correct_answer.strip().lower()

    # Save the attempt
    attempt = Attempt(
        user_id=user_id,
        question_id=question_id,
        selected_answer=selected_answer,
        is_correct=is_correct,
    )

    db.session.add(attempt)

    # Update practice streak
    from models.user_model import User
    user = User.query.get(user_id)
    if user:
        today = date.today()
        if user.last_practice_date is None:
            user.streak = 1
        elif user.last_practice_date == today:
            pass  # already practiced today, no streak change
        elif user.last_practice_date == today - timedelta(days=1):
            user.streak = (user.streak or 0) + 1
        else:
            user.streak = 1  # streak reset

        if (user.streak or 0) > (user.longest_streak or 0):
            user.longest_streak = user.streak

        user.last_practice_date = today

    db.session.commit()

    return success_response(
        {
            "attempt": attempt.to_dict(),
            "is_correct": is_correct,
            "correct_answer": question.correct_answer,
        },
        "Attempt recorded",
        201,
    )


@attempt_bp.route("/attempts/user/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_attempts(user_id):
    """
    Get all attempts for a specific user.

    GET /api/attempts/user/:id
    Returns: { "attempts": list[dict] }
    """
    current_user_id = int(get_jwt_identity())

    # Users can only view their own attempts (admins can view any)
    from models.user_model import User
    current_user = User.query.get(current_user_id)

    if current_user_id != user_id and current_user.role != "admin":
        return error_response("Unauthorized access", 403)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    pagination = (
        Attempt.query.filter_by(user_id=user_id)
        .order_by(Attempt.attempted_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    # Include question details in response
    attempts_data = []
    for attempt in pagination.items:
        attempt_dict = attempt.to_dict()
        if attempt.question:
            attempt_dict["question_title"] = attempt.question.title
            attempt_dict["question_topic"] = attempt.question.topic
            attempt_dict["question_difficulty"] = attempt.question.difficulty
        attempts_data.append(attempt_dict)

    return success_response(
        {
            "attempts": attempts_data,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": pagination.page,
        },
        "Attempts retrieved",
    )


@attempt_bp.route("/dashboard/summary", methods=["GET"])
@jwt_required()
def dashboard_summary():
    """
    Get dashboard analytics summary for the current user.

    GET /api/dashboard/summary
    Returns: { comprehensive analytics data }
    """
    user_id = int(get_jwt_identity())
    summary = get_user_dashboard(user_id)
    return success_response(summary, "Dashboard summary retrieved")


@attempt_bp.route("/admin/analytics", methods=["GET"])
@jwt_required()
@admin_required
def admin_analytics():
    """
    Get system-wide analytics for admin panel.

    GET /api/admin/analytics
    Returns: { admin analytics data }
    """
    analytics = get_admin_analytics()
    return success_response(analytics, "Admin analytics retrieved")


@attempt_bp.route("/admin/users", methods=["GET"])
@jwt_required()
@admin_required
def get_all_users():
    """
    Get all registered users (Admin only).

    GET /api/admin/users
    Returns: { "users": list[dict] }
    """
    from models.user_model import User

    users = User.query.order_by(User.created_at.desc()).all()
    return success_response({"users": [u.to_dict() for u in users]}, "Users retrieved")


@attempt_bp.route("/admin/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(user_id):
    """
    Delete a user (Admin only).

    DELETE /api/admin/users/:id
    Returns: { "message": str }
    """
    from models.user_model import User

    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    if user.role == "admin":
        return error_response("Cannot delete admin users", 403)

    db.session.delete(user)
    db.session.commit()

    return success_response({}, "User deleted successfully")
