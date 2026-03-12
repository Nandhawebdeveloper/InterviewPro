"""
routes/discussion_routes.py - Question Discussion Forum API

CRUD operations for discussion comments on questions.
Supports nested replies and upvoting.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.discussion_model import Discussion
from models.discussion_vote_model import DiscussionVote
from models.question_model import Question
from utils.response import success_response, error_response

discussion_bp = Blueprint("discussion", __name__)


@discussion_bp.route("/questions/<int:question_id>/discussions", methods=["GET"])
@jwt_required()
def get_discussions(question_id):
    question = Question.query.get(question_id)
    if not question:
        return error_response("Question not found", 404)

    # Get top-level comments (no parent) — replies are nested via relationship
    discussions = (
        Discussion.query
        .filter_by(question_id=question_id, parent_id=None)
        .order_by(Discussion.upvotes.desc(), Discussion.created_at.desc())
        .all()
    )

    return success_response({
        "discussions": [d.to_dict() for d in discussions],
        "total": len(discussions),
    })


@discussion_bp.route("/questions/<int:question_id>/discussions", methods=["POST"])
@jwt_required()
def create_discussion(question_id):
    user_id = int(get_jwt_identity())

    question = Question.query.get(question_id)
    if not question:
        return error_response("Question not found", 404)

    data = request.get_json()
    if not data:
        return error_response("Request body is required", 400)

    comment = data.get("comment", "").strip()
    if not comment:
        return error_response("Comment is required", 400)
    if len(comment) > 2000:
        return error_response("Comment must be under 2000 characters", 400)

    parent_id = data.get("parent_id")
    if parent_id:
        parent = Discussion.query.get(parent_id)
        if not parent or parent.question_id != question_id:
            return error_response("Parent comment not found", 404)

    discussion = Discussion(
        user_id=user_id,
        question_id=question_id,
        parent_id=parent_id,
        comment=comment,
    )
    db.session.add(discussion)
    db.session.commit()

    return success_response({"discussion": discussion.to_dict()}, "Comment posted", 201)


@discussion_bp.route("/discussions/<int:discussion_id>/upvote", methods=["POST"])
@jwt_required()
def upvote_discussion(discussion_id):
    user_id = int(get_jwt_identity())

    discussion = Discussion.query.get(discussion_id)
    if not discussion:
        return error_response("Comment not found", 404)

    existing = DiscussionVote.query.filter_by(user_id=user_id, discussion_id=discussion_id).first()
    if existing:
        # Toggle — remove vote
        db.session.delete(existing)
        discussion.upvotes = max(0, discussion.upvotes - 1)
        db.session.commit()
        return success_response({"upvotes": discussion.upvotes, "voted": False}, "Vote removed")

    vote = DiscussionVote(user_id=user_id, discussion_id=discussion_id)
    db.session.add(vote)
    discussion.upvotes += 1
    db.session.commit()

    return success_response({"upvotes": discussion.upvotes, "voted": True}, "Upvoted")


@discussion_bp.route("/discussions/<int:discussion_id>", methods=["DELETE"])
@jwt_required()
def delete_discussion(discussion_id):
    user_id = int(get_jwt_identity())

    discussion = Discussion.query.get(discussion_id)
    if not discussion:
        return error_response("Comment not found", 404)

    if discussion.user_id != user_id:
        return error_response("You can only delete your own comments", 403)

    db.session.delete(discussion)
    db.session.commit()

    return success_response(message="Comment deleted")
