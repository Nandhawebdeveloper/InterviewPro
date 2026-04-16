"""Add plan columns to users table and create payments table."""
from app import create_app
from extensions import db

app = create_app()
with app.app_context():
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN plan ENUM('free','pro','team') DEFAULT 'free'"))
        print("Added 'plan' column")
    except Exception as e:
        print(f"plan column: {e}")

    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN plan_expires_at DATETIME DEFAULT NULL"))
        print("Added 'plan_expires_at' column")
    except Exception as e:
        print(f"plan_expires_at column: {e}")

    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN razorpay_customer_id VARCHAR(255) DEFAULT NULL"))
        print("Added 'razorpay_customer_id' column")
    except Exception as e:
        print(f"razorpay_customer_id column: {e}")

    db.session.commit()
    print("Migration complete!")
