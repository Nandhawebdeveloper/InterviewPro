"""
attempt_model.py - Attempt Database Model

Tracks user practice attempts, storing selected answers
and correctness for analytics.
"""

from extensions import db
from datetime import datetime


class Attempt(db.Model):
    """Attempt model for tracking user practice sessions."""

    __tablename__ = "attempts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    question_id = db.Column(
        db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    selected_answer = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    attempted_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Serialize attempt object to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "selected_answer": self.selected_answer,
            "is_correct": self.is_correct,
            "attempted_at": (
                self.attempted_at.isoformat() if self.attempted_at else None
            ),
        }

    def __repr__(self):
        return f"<Attempt user={self.user_id} question={self.question_id} correct={self.is_correct}>"
