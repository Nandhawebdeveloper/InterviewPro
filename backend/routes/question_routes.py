"""
routes/question_routes.py - Question Bank API Routes

Provides CRUD endpoints for interview questions.
Admin-only access for create, update, and delete operations.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.question_model import Question
from utils.validators import validate_question
from utils.response import success_response, error_response
from utils.decorators import admin_required

# Create blueprint for question routes
question_bp = Blueprint("questions", __name__)


@question_bp.route("/questions", methods=["GET"])
@jwt_required()
def get_questions():
    """
    Get all questions with optional filtering, search, and pagination.

    GET /api/questions?type=MCQ&difficulty=Easy&topic=React&search=hook&page=1&limit=10
    Returns: { "questions": list, "total": int, "page": int, "total_pages": int, "results": int }
    """
    # Optional query filters
    q_type = request.args.get("type")
    difficulty = request.args.get("difficulty")
    topic = request.args.get("topic")
    search = request.args.get("search", "").strip()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", request.args.get("limit", 20, type=int), type=int)
    per_page = min(per_page, 100)  # cap at 100

    # Build query with filters
    query = Question.query

    if q_type:
        query = query.filter_by(type=q_type)
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    if topic:
        query = query.filter(Question.topic.ilike(f"%{topic}%"))
    if search:
        query = query.filter(
            db.or_(
                Question.title.ilike(f"%{search}%"),
                Question.description.ilike(f"%{search}%"),
                Question.topic.ilike(f"%{search}%"),
            )
        )

    # Paginate results
    pagination = query.order_by(Question.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return success_response(
        {
            "questions": [q.to_dict() for q in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "total_pages": pagination.pages,
            "results": len(pagination.items),
            "pages": pagination.pages,
            "current_page": pagination.page,
        },
        "Questions retrieved",
    )


@question_bp.route("/questions/<int:question_id>", methods=["GET"])
@jwt_required()
def get_question(question_id):
    """
    Get a single question by ID.

    GET /api/questions/:id
    Returns: { "question": dict }
    """
    question = Question.query.get(question_id)

    if not question:
        return error_response("Question not found", 404)

    return success_response({"question": question.to_dict()}, "Question retrieved")


@question_bp.route("/questions", methods=["POST"])
@jwt_required()
@admin_required
def create_question():
    """
    Create a new question (Admin only).

    POST /api/questions
    Body: { "title": str, "description": str, "type": str, ... }
    Returns: { "message": str, "question": dict }
    """
    data = request.get_json()

    # Validate input
    is_valid, error = validate_question(data)
    if not is_valid:
        return error_response(error, 400)

    admin_id = int(get_jwt_identity())

    # Create question
    question = Question(
        title=data["title"].strip(),
        description=data["description"].strip(),
        type=data["type"],
        difficulty=data["difficulty"],
        topic=data["topic"].strip(),
        options=data.get("options"),
        correct_answer=data["correct_answer"].strip(),
        created_by=admin_id,
    )

    db.session.add(question)
    db.session.commit()

    return success_response({"question": question.to_dict()}, "Question created successfully", 201)


@question_bp.route("/questions/<int:question_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_question(question_id):
    """
    Update an existing question (Admin only).

    PUT /api/questions/:id
    Body: { fields to update }
    Returns: { "message": str, "question": dict }
    """
    question = Question.query.get(question_id)

    if not question:
        return error_response("Question not found", 404)

    data = request.get_json()

    # Validate if full update
    is_valid, error = validate_question(data)
    if not is_valid:
        return error_response(error, 400)

    # Update fields
    question.title = data.get("title", question.title).strip()
    question.description = data.get("description", question.description).strip()
    question.type = data.get("type", question.type)
    question.difficulty = data.get("difficulty", question.difficulty)
    question.topic = data.get("topic", question.topic).strip()
    question.options = data.get("options", question.options)
    question.correct_answer = data.get("correct_answer", question.correct_answer).strip()

    db.session.commit()

    return success_response({"question": question.to_dict()}, "Question updated successfully")


@question_bp.route("/questions/<int:question_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_question(question_id):
    """
    Delete a question (Admin only).

    DELETE /api/questions/:id
    Returns: { "message": str }
    """
    question = Question.query.get(question_id)

    if not question:
        return error_response("Question not found", 404)

    db.session.delete(question)
    db.session.commit()

    return success_response({}, "Question deleted successfully")


@question_bp.route("/questions/topics", methods=["GET"])
@jwt_required()
def get_topics():
    """
    Get list of all unique topics.

    GET /api/questions/topics
    Returns: { "topics": list[str] }
    """
    topics = db.session.query(Question.topic).distinct().all()
    return success_response({"topics": [t[0] for t in topics]}, "Topics retrieved")
