from extensions import db
from datetime import datetime


class Discussion(db.Model):
    __tablename__ = "discussions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("discussions.id", ondelete="CASCADE"), nullable=True)
    comment = db.Column(db.Text, nullable=False)
    upvotes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("discussions", lazy=True))
    question = db.relationship("Question", backref=db.backref("discussions", lazy=True))
    replies = db.relationship("Discussion", backref=db.backref("parent", remote_side=[id]), lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "question_id": self.question_id,
            "parent_id": self.parent_id,
            "comment": self.comment,
            "upvotes": self.upvotes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "replies": [r.to_dict() for r in self.replies],
        }
