"""
services/dashboard_service.py - Dashboard Analytics Service

Computes analytics data for user dashboards including
accuracy, topic-wise performance, and activity trends.
"""

from datetime import datetime, timedelta
from sqlalchemy import func, case
from extensions import db
from models.attempt_model import Attempt
from models.question_model import Question
from models.user_model import User


def get_user_dashboard(user_id):
    """
    Calculate comprehensive dashboard analytics for a user.

    Args:
        user_id (int): The user's ID.

    Returns:
        dict: Dashboard summary with accuracy, topic/difficulty breakdown, etc.
    """
    # --- Overall Stats ---
    total_attempts = Attempt.query.filter_by(user_id=user_id).count()
    correct_attempts = Attempt.query.filter_by(
        user_id=user_id, is_correct=True
    ).count()

    accuracy = round((correct_attempts / total_attempts * 100), 2) if total_attempts > 0 else 0

    # --- Topic-wise Performance ---
    topic_stats = (
        db.session.query(
            Question.topic,
            func.count(Attempt.id).label("total"),
            func.sum(case((Attempt.is_correct == True, 1), else_=0)).label("correct"),
        )
        .join(Question, Attempt.question_id == Question.id)
        .filter(Attempt.user_id == user_id)
        .group_by(Question.topic)
        .all()
    )

    topic_performance = []
    weak_topics = []
    strong_topics = []

    for topic, total, correct in topic_stats:
        topic_acc = round((correct / total * 100), 2) if total > 0 else 0
        topic_performance.append({
            "topic": topic,
            "total": total,
            "correct": int(correct),
            "accuracy": topic_acc,
        })

        # Classify topics based on accuracy threshold
        if topic_acc < 50:
            weak_topics.append(topic)
        elif topic_acc >= 75:
            strong_topics.append(topic)

    # --- Difficulty-wise Performance ---
    difficulty_stats = (
        db.session.query(
            Question.difficulty,
            func.count(Attempt.id).label("total"),
            func.sum(case((Attempt.is_correct == True, 1), else_=0)).label("correct"),
        )
        .join(Question, Attempt.question_id == Question.id)
        .filter(Attempt.user_id == user_id)
        .group_by(Question.difficulty)
        .all()
    )

    difficulty_performance = []
    for difficulty, total, correct in difficulty_stats:
        diff_acc = round((correct / total * 100), 2) if total > 0 else 0
        difficulty_performance.append({
            "difficulty": difficulty,
            "total": total,
            "correct": int(correct),
            "accuracy": diff_acc,
        })

    # --- Last 7 Days Activity ---
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    daily_stats = (
        db.session.query(
            func.date(Attempt.attempted_at).label("date"),
            func.count(Attempt.id).label("total"),
            func.sum(case((Attempt.is_correct == True, 1), else_=0)).label("correct"),
        )
        .filter(Attempt.user_id == user_id, Attempt.attempted_at >= seven_days_ago)
        .group_by(func.date(Attempt.attempted_at))
        .order_by(func.date(Attempt.attempted_at))
        .all()
    )

    # Build activity array for all 7 days (fill missing days with zeros)
    activity = []
    for i in range(7):
        date = (datetime.utcnow() - timedelta(days=6 - i)).strftime("%Y-%m-%d")
        day_data = {"date": date, "total": 0, "correct": 0}

        for stat_date, total, correct in daily_stats:
            if str(stat_date) == date:
                day_data["total"] = total
                day_data["correct"] = int(correct)
                break

        activity.append(day_data)

    return {
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "accuracy": accuracy,
        "topic_performance": topic_performance,
        "difficulty_performance": difficulty_performance,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "last_7_days": activity,
    }


def get_admin_analytics():
    """
    Calculate system-wide analytics for admin dashboard.

    Returns:
        dict: Admin analytics including user/question counts and system stats.
    """
    total_users = User.query.filter_by(role="user").count()
    total_admins = User.query.filter_by(role="admin").count()
    total_questions = Question.query.count()
    total_mcq = Question.query.filter_by(type="MCQ").count()
    total_coding = Question.query.filter_by(type="CODING").count()
    total_attempts = Attempt.query.count()
    correct_attempts = Attempt.query.filter_by(is_correct=True).count()

    system_accuracy = (
        round((correct_attempts / total_attempts * 100), 2) if total_attempts > 0 else 0
    )

    # Topic distribution
    topic_distribution = (
        db.session.query(
            Question.topic, func.count(Question.id).label("count")
        )
        .group_by(Question.topic)
        .all()
    )

    # Most popular topic (by attempts)
    popular_topic_result = (
        db.session.query(
            Question.topic,
            func.count(Attempt.id).label("attempt_count"),
        )
        .join(Question, Attempt.question_id == Question.id)
        .group_by(Question.topic)
        .order_by(func.count(Attempt.id).desc())
        .first()
    )
    most_popular_topic = popular_topic_result[0] if popular_topic_result else "N/A"

    # Recent users
    recent_users = (
        User.query.order_by(User.created_at.desc()).limit(10).all()
    )

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_questions": total_questions,
        "total_mcq": total_mcq,
        "total_coding": total_coding,
        "total_attempts": total_attempts,
        "system_accuracy": system_accuracy,
        "most_popular_topic": most_popular_topic,
        "topic_distribution": [
            {"topic": t, "count": c} for t, c in topic_distribution
        ],
        "recent_users": [u.to_dict() for u in recent_users],
    }
