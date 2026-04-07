"""
ai_usage_model.py - AI Usage Tracking Model

Tracks daily AI question generation usage per user
to enforce the 5 questions/day limit.
"""

from extensions import db
from datetime import date


class AIUsage(db.Model):
    """Tracks how many AI questions a user has generated per day."""

    __tablename__ = "ai_usage"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    usage_date = db.Column(db.Date, nullable=False, default=date.today)
    count = db.Column(db.Integer, nullable=False, default=0)

    __table_args__ = (
        db.UniqueConstraint("user_id", "usage_date", name="uq_user_date"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "date": self.usage_date.isoformat(),
            "count": self.count,
        }

    def __repr__(self):
        return f"<AIUsage user={self.user_id} date={self.usage_date} count={self.count}>"
