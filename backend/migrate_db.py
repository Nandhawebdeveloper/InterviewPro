"""One-time migration: add streak columns to users + create bookmarks table."""
from app import create_app
from extensions import db

app = create_app()

STATEMENTS = [
    "ALTER TABLE users ADD COLUMN streak INT NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN longest_streak INT NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN last_practice_date DATE DEFAULT NULL",
    """CREATE TABLE IF NOT EXISTS bookmarks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_question (user_id, question_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )""",
]

with app.app_context():
    with db.engine.connect() as conn:
        for sql in STATEMENTS:
            try:
                conn.execute(db.text(sql))
                conn.commit()
                print(f"OK: {sql[:60]}...")
            except Exception as e:
                if "Duplicate column" in str(e) or "already exists" in str(e):
                    print(f"SKIP (already exists): {sql[:60]}...")
                else:
                    print(f"ERROR: {e}")
    print("\nMigration complete!")
