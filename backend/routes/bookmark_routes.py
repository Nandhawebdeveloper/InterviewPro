"""
routes/bookmark_routes.py - Bookmark API Routes

Provides endpoints for saving, retrieving, and removing bookmarked questions.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.bookmark_model import Bookmark
from models.question_model import Question
from utils.response import success_response, error_response

bookmark_bp = Blueprint("bookmarks", __name__)


@bookmark_bp.route("/bookmarks", methods=["POST"])
@jwt_required()
def add_bookmark():
    """
    Bookmark a question.

    POST /api/bookmarks
    Body: { "question_id": int }
    """
    data = request.get_json()
    if not data or not data.get("question_id"):
        return error_response("question_id is required", 400)

    user_id = int(get_jwt_identity())
    question_id = data["question_id"]

    # Verify question exists
    question = Question.query.get(question_id)
    if not question:
        return error_response("Question not found", 404)

    # Check if already bookmarked
    existing = Bookmark.query.filter_by(user_id=user_id, question_id=question_id).first()
    if existing:
        return error_response("Question already bookmarked", 409)

    bookmark = Bookmark(user_id=user_id, question_id=question_id)
    db.session.add(bookmark)
    db.session.commit()

    return success_response({"bookmark": bookmark.to_dict()}, "Question bookmarked", 201)


@bookmark_bp.route("/bookmarks", methods=["GET"])
@jwt_required()
def get_bookmarks():
    """
    Get all bookmarked questions for current user.

    GET /api/bookmarks
    """
    user_id = int(get_jwt_identity())

    bookmarks = (
        Bookmark.query
        .filter_by(user_id=user_id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )

    return success_response(
        {"bookmarks": [b.to_dict() for b in bookmarks]},
        "Bookmarks retrieved"
    )


@bookmark_bp.route("/bookmarks/<int:bookmark_id>", methods=["DELETE"])
@jwt_required()
def remove_bookmark(bookmark_id):
    """
    Remove a bookmark.

    DELETE /api/bookmarks/:id
    """
    user_id = int(get_jwt_identity())

    bookmark = Bookmark.query.get(bookmark_id)
    if not bookmark:
        return error_response("Bookmark not found", 404)

    if bookmark.user_id != user_id:
        return error_response("Unauthorized", 403)

    db.session.delete(bookmark)
    db.session.commit()

    return success_response({}, "Bookmark removed")


@bookmark_bp.route("/bookmarks/question/<int:question_id>", methods=["DELETE"])
@jwt_required()
def remove_bookmark_by_question(question_id):
    """
    Remove a bookmark by question ID (convenience endpoint).

    DELETE /api/bookmarks/question/:question_id
    """
    user_id = int(get_jwt_identity())

    bookmark = Bookmark.query.filter_by(user_id=user_id, question_id=question_id).first()
    if not bookmark:
        return error_response("Bookmark not found", 404)

    db.session.delete(bookmark)
    db.session.commit()

    return success_response({}, "Bookmark removed")


@bookmark_bp.route("/bookmarks/check/<int:question_id>", methods=["GET"])
@jwt_required()
def check_bookmark(question_id):
    """
    Check if a question is bookmarked by the current user.

    GET /api/bookmarks/check/:question_id
    """
    user_id = int(get_jwt_identity())
    bookmark = Bookmark.query.filter_by(user_id=user_id, question_id=question_id).first()

    return success_response(
        {"is_bookmarked": bookmark is not None, "bookmark_id": bookmark.id if bookmark else None},
        "Bookmark status retrieved"
    )
