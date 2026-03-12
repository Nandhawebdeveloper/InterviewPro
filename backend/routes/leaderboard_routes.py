"""
routes/leaderboard_routes.py - Leaderboard API Routes

Shows top users ranked by accuracy.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from extensions import db
from models.user_model import User
from models.attempt_model import Attempt
from utils.response import success_response
from sqlalchemy import func, case

leaderboard_bp = Blueprint("leaderboard", __name__)


@leaderboard_bp.route("/leaderboard", methods=["GET"])
@jwt_required()
def get_leaderboard():
    """
    Get top users by accuracy (minimum 5 attempts required).

    GET /api/leaderboard?limit=20
    """
    limit = request.args.get("limit", 20, type=int)
    limit = min(limit, 100)  # cap at 100

    results = (
        db.session.query(
            User.id,
            User.name,
            func.count(Attempt.id).label("total_attempts"),
            func.sum(case((Attempt.is_correct == True, 1), else_=0)).label("correct"),
        )
        .join(Attempt, User.id == Attempt.user_id)
        .filter(User.role == "user")
        .group_by(User.id, User.name)
        .having(func.count(Attempt.id) >= 5)
        .order_by(
            (func.sum(case((Attempt.is_correct == True, 1), else_=0)) * 100.0 / func.count(Attempt.id)).desc()
        )
        .limit(limit)
        .all()
    )

    leaderboard = []
    for rank, (user_id, name, total, correct) in enumerate(results, 1):
        accuracy = round((correct / total * 100), 2) if total > 0 else 0
        leaderboard.append({
            "rank": rank,
            "user_id": user_id,
            "username": name,
            "total_attempts": total,
            "correct": int(correct),
            "accuracy": accuracy,
        })

    return success_response({"leaderboard": leaderboard}, "Leaderboard retrieved")
