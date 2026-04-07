"""
seed_questions.py - Bulk Question Insertion Script

Reads JSON question files from backend/data/ and inserts them into the database.
Skips duplicates based on title to avoid re-inserting existing questions.

Usage:
    cd backend
    python seed_questions.py
"""

import json
import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from extensions import db
from models.question_model import Question

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

QUESTION_FILES = [
    "questions_react.json",
    "questions_javascript.json",
    "questions_mysql.json",
    "questions_htmlcss.json",
    "questions_coding.json",
    "questions_react_2.json",
    "questions_javascript_2.json",
    "questions_mysql_2.json",
    "questions_htmlcss_2.json",
    "questions_coding_2.json",
    "questions_python.json",
    "questions_react_3.json",
    "questions_javascript_3.json",
    "questions_mysql_3.json",
    "questions_htmlcss_3.json",
    "questions_coding_3.json",
    "questions_python_2.json",
    "questions_react_4.json",
    "questions_javascript_4.json",
    "questions_mysql_4.json",
    "questions_htmlcss_4.json",
    "questions_coding_4.json",
    "questions_python_3.json",
    "questions_java.json",
    "questions_java_2.json",
    "questions_react_5.json",
    "questions_javascript_5.json",
    "questions_mysql_5.json",
    "questions_htmlcss_5.json",
    "questions_coding_5.json",
    "questions_python_4.json",
    "questions_react_6.json",
    "questions_javascript_6.json",
    "questions_mysql_6.json",
    "questions_htmlcss_6.json",
    "questions_coding_6.json",
    "questions_python_5.json",
    "questions_react_7.json",
    "questions_javascript_7.json",
    "questions_mysql_7.json",
    "questions_htmlcss_7.json",
    "questions_coding_7.json",
    "questions_java_3.json",
    "questions_python_6.json",
    "questions_final_batch.json",
]


def load_questions_from_file(filepath):
    """Load questions from a JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_questions():
    """Insert questions into the database, skipping duplicates by title."""
    app = create_app()

    with app.app_context():
        # Get all existing question titles for duplicate detection
        existing_titles = set(
            row[0] for row in db.session.query(Question.title).all()
        )

        total_inserted = 0
        total_skipped = 0

        for filename in QUESTION_FILES:
            filepath = os.path.join(DATA_DIR, filename)
            if not os.path.exists(filepath):
                print(f"[WARN] File not found: {filename}, skipping.")
                continue

            questions = load_questions_from_file(filepath)
            inserted = 0
            skipped = 0

            for q_data in questions:
                title = q_data.get("title", "").strip()
                if title in existing_titles:
                    skipped += 1
                    continue

                question = Question(
                    title=title,
                    description=q_data["description"].strip(),
                    type=q_data["type"],
                    difficulty=q_data["difficulty"],
                    topic=q_data["topic"].strip(),
                    options=q_data.get("options"),
                    correct_answer=q_data["correct_answer"].strip(),
                    is_ai_generated=False,
                    created_by=None,
                )
                db.session.add(question)
                existing_titles.add(title)
                inserted += 1

            db.session.commit()
            total_inserted += inserted
            total_skipped += skipped
            print(f"[{filename}] Inserted: {inserted}, Skipped (duplicates): {skipped}")

        print(f"\n=== TOTAL: Inserted {total_inserted}, Skipped {total_skipped} ===")
        print(f"Total questions in database: {db.session.query(Question).count()}")


if __name__ == "__main__":
    seed_questions()
