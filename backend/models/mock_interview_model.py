from extensions import db
from datetime import datetime
import json


class MockInterview(db.Model):
    __tablename__ = "mock_interviews"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_ids = db.Column(db.JSON, nullable=False)  # list of question IDs
    answers = db.Column(db.JSON, nullable=True)  # {question_id: selected_answer}
    score = db.Column(db.Integer, default=0)
    total = db.Column(db.Integer, default=0)
    time_limit = db.Column(db.Integer, default=1800)  # seconds (30 min)
    status = db.Column(db.Enum("in_progress", "completed", "expired"), default="in_progress")
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", backref=db.backref("mock_interviews", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_ids": self.question_ids,
            "answers": self.answers,
            "score": self.score,
            "total": self.total,
            "time_limit": self.time_limit,
            "status": self.status,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
