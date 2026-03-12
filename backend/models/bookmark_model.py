"""
bookmark_model.py - Bookmark Database Model

Allows users to save/bookmark questions for later review.
"""

from extensions import db
from datetime import datetime


class Bookmark(db.Model):
    """Bookmark model for saved questions."""

    __tablename__ = "bookmarks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    question_id = db.Column(
        db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint: one bookmark per user per question
    __table_args__ = (
        db.UniqueConstraint("user_id", "question_id", name="uq_user_question"),
    )

    # Relationships
    user = db.relationship("User", backref=db.backref("bookmarks", lazy=True))
    question = db.relationship("Question", backref=db.backref("bookmarked_by", lazy=True))

    def to_dict(self):
        """Serialize bookmark object to dictionary."""
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if self.question:
            data["question"] = self.question.to_dict()
        return data

    def __repr__(self):
        return f"<Bookmark user={self.user_id} question={self.question_id}>"
