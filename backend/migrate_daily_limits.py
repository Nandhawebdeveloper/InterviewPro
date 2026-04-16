"""
migrate_daily_limits.py - Add daily usage tracking columns to users table.

Run once: python migrate_daily_limits.py
"""

from app import create_app
from extensions import db

app = create_app()

migrations = [
    ("questions_used_today", "ALTER TABLE users ADD COLUMN questions_used_today INT NOT NULL DEFAULT 0"),
    ("last_active_date", "ALTER TABLE users ADD COLUMN last_active_date DATE NULL"),
]

with app.app_context():
    result = db.session.execute(db.text("SHOW COLUMNS FROM users"))
    existing = {row[0] for row in result.fetchall()}

    for col_name, sql in migrations:
        if col_name in existing:
            print(f"  Column '{col_name}' already exists — skipping.")
        else:
            db.session.execute(db.text(sql))
            print(f"  Added column '{col_name}'.")

    db.session.commit()
    print("Migration complete.")
