"""
routes/badge_routes.py - Achievement & Badge System API

Manages badges, awards them based on user activity, and retrieves earned badges.
"""

from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.badge_model import Badge, UserBadge
from models.attempt_model import Attempt
from models.user_model import User
from utils.response import success_response, error_response

badge_bp = Blueprint("badge", __name__)

# Badge definitions that are seeded into the database
BADGE_DEFINITIONS = [
    {"name": "First Step", "description": "Attempted your first question", "icon": "🎯"},
    {"name": "10 Questions Solved", "description": "Solved 10 questions correctly", "icon": "🔟"},
    {"name": "50 Questions Solved", "description": "Solved 50 questions correctly", "icon": "🏅"},
    {"name": "100 Questions Solved", "description": "Solved 100 questions correctly", "icon": "💯"},
    {"name": "Accuracy Master", "description": "Achieved 80%+ accuracy with 20+ attempts", "icon": "🎯"},
    {"name": "Speed Demon", "description": "Completed a mock interview with 90%+ score", "icon": "⚡"},
    {"name": "7 Day Streak", "description": "Practiced for 7 days in a row", "icon": "🔥"},
    {"name": "30 Day Streak", "description": "Practiced for 30 days in a row", "icon": "💎"},
    {"name": "React Expert", "description": "Solved 10+ React questions correctly", "icon": "⚛️"},
    {"name": "Python Expert", "description": "Solved 10+ Python questions correctly", "icon": "🐍"},
    {"name": "JavaScript Expert", "description": "Solved 10+ JavaScript questions correctly", "icon": "📜"},
    {"name": "SQL Expert", "description": "Solved 10+ SQL questions correctly", "icon": "🗃️"},
    {"name": "Bookworm", "description": "Bookmarked 10+ questions", "icon": "📚"},
    {"name": "Community Helper", "description": "Posted 5+ discussion comments", "icon": "💬"},
    {"name": "Interview Ready", "description": "Completed 3 mock interviews", "icon": "🎤"},
]


def seed_badges():
    """Ensure all badge definitions exist in the database."""
    for defn in BADGE_DEFINITIONS:
        existing = Badge.query.filter_by(name=defn["name"]).first()
        if not existing:
            badge = Badge(name=defn["name"], description=defn["description"], icon=defn["icon"])
            db.session.add(badge)
    db.session.commit()


def check_and_award_badges(user_id):
    """Check all badge conditions and award any newly earned badges."""
    from models.bookmark_model import Bookmark
    from models.discussion_model import Discussion
    from models.mock_interview_model import MockInterview

    user = User.query.get(user_id)
    if not user:
        return []

    earned_badge_ids = {ub.badge_id for ub in UserBadge.query.filter_by(user_id=user_id).all()}
    new_badges = []

    total_attempts = Attempt.query.filter_by(user_id=user_id).count()
    correct_attempts = Attempt.query.filter_by(user_id=user_id, is_correct=True).count()

    badge_checks = {
        "First Step": total_attempts >= 1,
        "10 Questions Solved": correct_attempts >= 10,
        "50 Questions Solved": correct_attempts >= 50,
        "100 Questions Solved": correct_attempts >= 100,
        "Accuracy Master": (
            total_attempts >= 20
            and correct_attempts / total_attempts >= 0.8
            if total_attempts > 0 else False
        ),
        "7 Day Streak": (user.streak or 0) >= 7 or (user.longest_streak or 0) >= 7,
        "30 Day Streak": (user.streak or 0) >= 30 or (user.longest_streak or 0) >= 30,
        "Bookworm": Bookmark.query.filter_by(user_id=user_id).count() >= 10,
        "Community Helper": Discussion.query.filter_by(user_id=user_id).count() >= 5,
        "Interview Ready": MockInterview.query.filter_by(user_id=user_id, status="completed").count() >= 3,
    }

    # Topic-specific badges
    topic_badges = {
        "React Expert": "React",
        "Python Expert": "Python",
        "JavaScript Expert": "JavaScript",
        "SQL Expert": "SQL",
    }
    for badge_name, topic in topic_badges.items():
        from models.question_model import Question
        topic_correct = (
            db.session.query(Attempt)
            .join(Question)
            .filter(Attempt.user_id == user_id, Attempt.is_correct == True, Question.topic == topic)
            .count()
        )
        badge_checks[badge_name] = topic_correct >= 10

    # Mock interview score badge
    high_score_interview = (
        MockInterview.query
        .filter_by(user_id=user_id, status="completed")
        .filter(MockInterview.total > 0)
        .all()
    )
    badge_checks["Speed Demon"] = any(
        iv.score / iv.total >= 0.9 for iv in high_score_interview if iv.total > 0
    )

    # Award new badges
    for badge_name, earned in badge_checks.items():
        if not earned:
            continue
        badge = Badge.query.filter_by(name=badge_name).first()
        if not badge or badge.id in earned_badge_ids:
            continue
        user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
        db.session.add(user_badge)
        new_badges.append(badge.to_dict())

    if new_badges:
        db.session.commit()

    return new_badges


@badge_bp.route("/badges", methods=["GET"])
@jwt_required()
def get_all_badges():
    badges = Badge.query.all()
    return success_response({"badges": [b.to_dict() for b in badges]})


@badge_bp.route("/badges/my", methods=["GET"])
@jwt_required()
def get_my_badges():
    user_id = int(get_jwt_identity())

    # Check for new badges first
    new_badges = check_and_award_badges(user_id)

    user_badges = (
        UserBadge.query
        .filter_by(user_id=user_id)
        .order_by(UserBadge.earned_at.desc())
        .all()
    )

    return success_response({
        "badges": [ub.to_dict() for ub in user_badges],
        "new_badges": new_badges,
        "total": len(user_badges),
    })


@badge_bp.route("/badges/check", methods=["POST"])
@jwt_required()
def check_badges():
    """Manually trigger badge check (called after actions)."""
    user_id = int(get_jwt_identity())
    new_badges = check_and_award_badges(user_id)
    return success_response({
        "new_badges": new_badges,
        "awarded_count": len(new_badges),
    })
