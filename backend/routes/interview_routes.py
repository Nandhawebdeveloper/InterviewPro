"""
routes/interview_routes.py - Mock Interview Simulation API

Provides endpoints to start, submit, and view results of mock interviews.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.mock_interview_model import MockInterview
from models.question_model import Question
from utils.response import success_response, error_response
from utils.feature_access import check_feature_access
from datetime import datetime
from sqlalchemy.sql.expression import func

interview_bp = Blueprint("interview", __name__)


@interview_bp.route("/interview/start", methods=["POST"])
@jwt_required()
@check_feature_access("mock_interview")
def start_interview():
    user_id = int(get_jwt_identity())

    data = request.get_json() or {}
    count = min(int(data.get("count", 10)), 30)  # max 30 questions
    difficulty = data.get("difficulty")  # optional filter
    topic = data.get("topic")  # optional filter

    query = Question.query
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    if topic:
        query = query.filter_by(topic=topic)

    # Random selection
    questions = query.order_by(func.rand()).limit(count).all()

    if len(questions) < 3:
        return error_response("Not enough questions available. Need at least 3.", 400)

    question_ids = [q.id for q in questions]

    interview = MockInterview(
        user_id=user_id,
        question_ids=question_ids,
        total=len(question_ids),
        time_limit=data.get("time_limit", 1800),
    )
    db.session.add(interview)
    db.session.commit()

    # Return questions without correct answers
    questions_data = [q.to_dict_safe() for q in questions]

    return success_response({
        "interview_id": interview.id,
        "questions": questions_data,
        "total": len(questions_data),
        "time_limit": interview.time_limit,
        "started_at": interview.started_at.isoformat(),
    }, "Mock interview started", 201)


@interview_bp.route("/interview/<int:interview_id>/submit", methods=["POST"])
@jwt_required()
def submit_interview(interview_id):
    user_id = int(get_jwt_identity())

    interview = MockInterview.query.get(interview_id)
    if not interview:
        return error_response("Interview not found", 404)
    if interview.user_id != user_id:
        return error_response("Unauthorized", 403)
    if interview.status == "completed":
        return error_response("Interview already submitted", 400)

    data = request.get_json()
    if not data or "answers" not in data:
        return error_response("Answers are required", 400)

    answers = data["answers"]  # {question_id: selected_answer}

    # Score the interview
    score = 0
    results = []
    questions = Question.query.filter(Question.id.in_(interview.question_ids)).all()
    question_map = {q.id: q for q in questions}

    for qid in interview.question_ids:
        q = question_map.get(qid)
        if not q:
            continue
        user_answer = answers.get(str(qid), "")
        is_correct = (
            user_answer.strip().lower() == q.correct_answer.strip().lower()
        )
        if is_correct:
            score += 1
        results.append({
            "question_id": qid,
            "title": q.title,
            "type": q.type,
            "difficulty": q.difficulty,
            "user_answer": user_answer,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
        })

    interview.answers = answers
    interview.score = score
    interview.status = "completed"
    interview.completed_at = datetime.utcnow()
    db.session.commit()

    percentage = round((score / interview.total * 100), 1) if interview.total > 0 else 0

    return success_response({
        "interview_id": interview.id,
        "score": score,
        "total": interview.total,
        "percentage": percentage,
        "results": results,
        "completed_at": interview.completed_at.isoformat(),
    }, "Interview submitted successfully")


@interview_bp.route("/interview/<int:interview_id>/result", methods=["GET"])
@jwt_required()
def get_interview_result(interview_id):
    user_id = int(get_jwt_identity())

    interview = MockInterview.query.get(interview_id)
    if not interview:
        return error_response("Interview not found", 404)
    if interview.user_id != user_id:
        return error_response("Unauthorized", 403)

    if interview.status != "completed":
        return error_response("Interview not yet completed", 400)

    # Rebuild detailed results
    questions = Question.query.filter(Question.id.in_(interview.question_ids)).all()
    question_map = {q.id: q for q in questions}
    answers = interview.answers or {}

    results = []
    for qid in interview.question_ids:
        q = question_map.get(qid)
        if not q:
            continue
        user_answer = answers.get(str(qid), "")
        results.append({
            "question_id": qid,
            "title": q.title,
            "type": q.type,
            "difficulty": q.difficulty,
            "topic": q.topic,
            "user_answer": user_answer,
            "correct_answer": q.correct_answer,
            "is_correct": user_answer.strip().lower() == q.correct_answer.strip().lower(),
        })

    percentage = round((interview.score / interview.total * 100), 1) if interview.total > 0 else 0

    return success_response({
        "interview_id": interview.id,
        "score": interview.score,
        "total": interview.total,
        "percentage": percentage,
        "time_limit": interview.time_limit,
        "started_at": interview.started_at.isoformat(),
        "completed_at": interview.completed_at.isoformat() if interview.completed_at else None,
        "results": results,
    })


@interview_bp.route("/interview/history", methods=["GET"])
@jwt_required()
def get_interview_history():
    user_id = int(get_jwt_identity())

    interviews = (
        MockInterview.query
        .filter_by(user_id=user_id)
        .order_by(MockInterview.started_at.desc())
        .limit(20)
        .all()
    )

    history = []
    for iv in interviews:
        percentage = round((iv.score / iv.total * 100), 1) if iv.total > 0 else 0
        history.append({
            "id": iv.id,
            "total": iv.total,
            "score": iv.score,
            "percentage": percentage,
            "status": iv.status,
            "time_limit": iv.time_limit,
            "started_at": iv.started_at.isoformat(),
            "completed_at": iv.completed_at.isoformat() if iv.completed_at else None,
        })

    return success_response({"interviews": history})


@interview_bp.route("/interview/<int:interview_id>", methods=["DELETE"])
@jwt_required()
def delete_interview(interview_id):
    user_id = int(get_jwt_identity())

    interview = MockInterview.query.get(interview_id)
    if not interview:
        return error_response("Interview not found", 404)
    if interview.user_id != user_id:
        return error_response("Unauthorized", 403)

    db.session.delete(interview)
    db.session.commit()
    return success_response({}, "Interview deleted")


@interview_bp.route("/interview/<int:interview_id>/resume", methods=["GET"])
@jwt_required()
def resume_interview(interview_id):
    user_id = int(get_jwt_identity())

    interview = MockInterview.query.get(interview_id)
    if not interview:
        return error_response("Interview not found", 404)
    if interview.user_id != user_id:
        return error_response("Unauthorized", 403)
    if interview.status == "completed":
        return error_response("Interview already completed", 400)

    # Calculate remaining time
    elapsed = int((datetime.utcnow() - interview.started_at).total_seconds())
    time_remaining = max(0, interview.time_limit - elapsed)

    if time_remaining == 0:
        interview.status = "expired"
        db.session.commit()
        return error_response("Interview time has expired", 400)

    questions = Question.query.filter(Question.id.in_(interview.question_ids)).all()
    question_map = {q.id: q for q in questions}
    ordered_questions = [question_map[qid] for qid in interview.question_ids if qid in question_map]

    return success_response({
        "interview_id": interview.id,
        "questions": [q.to_dict_safe() for q in ordered_questions],
        "answers": interview.answers or {},
        "total": interview.total,
        "time_remaining": time_remaining,
        "time_limit": interview.time_limit,
    }, "Interview resumed")
