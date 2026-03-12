from extensions import db
from datetime import datetime


class DiscussionVote(db.Model):
    __tablename__ = "discussion_votes"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    discussion_id = db.Column(db.Integer, db.ForeignKey("discussions.id", ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "discussion_id", name="uq_user_discussion_vote"),
    )
