"""
question_model.py - Question Database Model

Defines the Questions table schema for MCQ and Coding questions.
Supports JSON storage for MCQ options.
"""

from extensions import db
from datetime import datetime
import json


class Question(db.Model):
    """Question model for the interview question bank."""

    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    type = db.Column(db.Enum("MCQ", "CODING"), nullable=False)
    difficulty = db.Column(db.Enum("Easy", "Medium", "Hard"), nullable=False)
    topic = db.Column(db.String(100), nullable=False)
    options = db.Column(db.JSON, nullable=True)  # JSON array for MCQ options
    correct_answer = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    attempts = db.relationship("Attempt", backref="question", lazy=True)

    def to_dict(self):
        """Serialize question object to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "type": self.type,
            "difficulty": self.difficulty,
            "topic": self.topic,
            "options": self.options,
            "correct_answer": self.correct_answer,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_dict_safe(self):
        """Serialize without correct answer (for practice mode)."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "type": self.type,
            "difficulty": self.difficulty,
            "topic": self.topic,
            "options": self.options,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Question {self.title} [{self.type}]>"
