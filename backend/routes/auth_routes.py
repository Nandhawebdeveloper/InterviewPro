"""
routes/auth_routes.py - Authentication API Routes

Provides endpoints for user registration and login.
Issues JWT tokens upon successful authentication.
"""

from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from services.auth_service import register_user, authenticate_user
from utils.validators import validate_registration, validate_login
from utils.response import success_response, error_response
from models.user_model import User

# Create blueprint for auth routes
auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user.

    POST /api/register
    Body: { "name": str, "email": str, "password": str }
    Returns: { "message": str, "user": dict }
    """
    data = request.get_json()

    # Validate input
    is_valid, error = validate_registration(data)
    if not is_valid:
        return error_response(error, 400)

    # Register user via service
    user_data, error = register_user(
        name=data["name"].strip(),
        email=data["email"].strip().lower(),
        password=data["password"],
    )

    if error:
        return error_response(error, 409)

    return success_response({"user": user_data}, "Registration successful", 201)


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate user and return JWT token.

    POST /api/login
    Body: { "email": str, "password": str }
    Returns: { "token": str, "user": dict }
    """
    data = request.get_json()

    # Validate input
    is_valid, error = validate_login(data)
    if not is_valid:
        return error_response(error, 400)

    # Authenticate via service
    user, error = authenticate_user(
        email=data["email"].strip().lower(),
        password=data["password"],
    )

    if error:
        return error_response(error, 401)

    # Create JWT token with user ID as identity (must be str for PyJWT 2.x)
    access_token = create_access_token(identity=str(user.id))

    return success_response(
        {"token": access_token, "user": user.to_dict()},
        "Login successful",
    )


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user's profile.

    GET /api/me
    Headers: Authorization: Bearer <token>
    Returns: { "user": dict }
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return error_response("User not found", 404)

    return success_response({"user": user.to_dict()}, "User profile retrieved")
