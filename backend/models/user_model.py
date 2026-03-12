"""
user_model.py - User Database Model

Defines the User table schema and helper methods for
authentication and serialization.
"""

from extensions import db
from datetime import datetime


class User(db.Model):
    """User model for authentication and role-based access."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("user", "admin"), default="user", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Streak / gamification fields
    streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    last_practice_date = db.Column(db.Date, nullable=True)

    # Relationships
    questions = db.relationship("Question", backref="creator", lazy=True)
    attempts = db.relationship("Attempt", backref="user", lazy=True)

    def to_dict(self):
        """Serialize user object to dictionary (excludes password)."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "streak": self.streak or 0,
            "longest_streak": self.longest_streak or 0,
        }

    def __repr__(self):
        return f"<User {self.name} ({self.email})>"
