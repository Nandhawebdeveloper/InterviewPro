"""
app.py - Flask Application Factory & Entry Point

InterviewPro – AI-based Interview Practice & Tracking System

This is the main entry point for the Flask backend.
It initializes the app, registers extensions and blueprints,
and starts the development server.
"""

import os
import logging
from flask import Flask, request, send_from_directory
from config import config_by_name, BASE_DIR
from extensions import db, jwt
from utils.response import error_response, success_response

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Path to built frontend files
FRONTEND_DIST = os.path.join(BASE_DIR, "..", "frontend", "dist")


def validate_env():
    """Validate that required environment variables are set."""
    required = ["SECRET_KEY", "DATABASE_URL"]
    missing = [var for var in required if not os.environ.get(var)]
    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}. "
            "Set them in your .env file or system environment."
        )


def create_app(config_name=None):
    """
    Application factory pattern.

    Args:
        config_name (str): Configuration name ('development', 'production', 'testing').

    Returns:
        Flask: Configured Flask application instance.
    """
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    # Validate env vars (skip for testing which uses SQLite)
    if config_name != "testing":
        validate_env()

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    # ---- Initialize Extensions ----
    db.init_app(app)
    jwt.init_app(app)

    # ---- CORS: inject headers on every response ----
    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin", "")
        allowed = [o.strip() for o in app.config.get("CORS_ORIGINS", [])]

        if origin in allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        elif app.config.get("DEBUG") and origin:
            # Allow all origins in development mode
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"

        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if not app.config.get("DEBUG"):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            resp = app.make_default_options_response()
            return add_cors_headers(resp)

    # ---- Register Blueprints ----
    from routes.auth_routes import auth_bp
    from routes.question_routes import question_bp
    from routes.attempt_routes import attempt_bp
    from routes.profile_routes import profile_bp
    from routes.bookmark_routes import bookmark_bp
    from routes.leaderboard_routes import leaderboard_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.code_routes import code_bp
    from routes.discussion_routes import discussion_bp
    from routes.roadmap_routes import roadmap_bp
    from routes.interview_routes import interview_bp
    from routes.badge_routes import badge_bp
    from routes.ai_routes import ai_bp

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(question_bp, url_prefix="/api")
    app.register_blueprint(attempt_bp, url_prefix="/api")
    app.register_blueprint(profile_bp, url_prefix="/api")
    app.register_blueprint(bookmark_bp, url_prefix="/api")
    app.register_blueprint(leaderboard_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api")
    app.register_blueprint(code_bp, url_prefix="/api")
    app.register_blueprint(discussion_bp, url_prefix="/api")
    app.register_blueprint(roadmap_bp, url_prefix="/api")
    app.register_blueprint(interview_bp, url_prefix="/api")
    app.register_blueprint(badge_bp, url_prefix="/api")
    app.register_blueprint(ai_bp, url_prefix="/api")

    # Conditionally register payment routes
    if app.config.get("PAYMENT_GATEWAY_ENABLED"):
        from routes.payment_routes import payment_bp
        app.register_blueprint(payment_bp, url_prefix="/api")
        logger.info("Payment gateway ENABLED — Razorpay routes registered")
    else:
        logger.info("Payment gateway DISABLED — Razorpay routes skipped")

    # ---- Error Handlers ----
    @app.errorhandler(404)
    def not_found(error):
        return error_response("Resource not found", 404)

    @app.errorhandler(500)
    def internal_error(error):
        return error_response("Internal server error", 500)

    @app.errorhandler(405)
    def method_not_allowed(error):
        return error_response("Method not allowed", 405)

    @app.errorhandler(422)
    def unprocessable_entity(error):
        return error_response("Unprocessable request", 422)

    # ---- JWT Error Handlers ----
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response("Token has expired", 401, code="TOKEN_EXPIRED")

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return error_response("Invalid token", 401, code="INVALID_TOKEN")

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return error_response("Authorization token is required", 401, code="MISSING_TOKEN")

    # ---- Health Check ----
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return success_response({"app": "InterviewPro API"}, "Healthy")

    # ---- Feature Config (public, optionally enriched if authenticated) ----
    @app.route("/api/config/features", methods=["GET"])
    def feature_config():
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        from utils.feature_access import get_user_feature_info

        base = {
            "payment_gateway": app.config.get("PAYMENT_GATEWAY_ENABLED", False),
        }

        # If user sends a valid token, include their plan/feature info
        try:
            verify_jwt_in_request(optional=True)
            identity = get_jwt_identity()
            if identity:
                from models.user_model import User
                user = User.query.get(int(identity))
                if user:
                    base["user_features"] = get_user_feature_info(user)
        except Exception:
            pass  # No token or invalid — just return base config

        return success_response(base, "Feature config retrieved")

    # ---- Serve Frontend Static Files (Production) ----
    if not app.config.get("DEBUG") and os.path.isdir(FRONTEND_DIST):
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            file_path = os.path.join(FRONTEND_DIST, path)
            if path and os.path.isfile(file_path):
                return send_from_directory(FRONTEND_DIST, path)
            return send_from_directory(FRONTEND_DIST, "index.html")

    # ---- Create Tables (Development Only) ----
    with app.app_context():
        # Import models so SQLAlchemy knows about them
        from models.user_model import User
        from models.question_model import Question
        from models.attempt_model import Attempt
        from models.bookmark_model import Bookmark
        from models.discussion_model import Discussion
        from models.discussion_vote_model import DiscussionVote
        from models.badge_model import Badge, UserBadge
        from models.mock_interview_model import MockInterview
        from models.ai_usage_model import AIUsage
        from models.payment_model import Payment

        db.create_all()

        # Seed badges
        from routes.badge_routes import seed_badges
        seed_badges()

    return app


# ---- Run Application ----
if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
