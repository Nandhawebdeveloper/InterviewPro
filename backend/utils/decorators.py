"""
utils/decorators.py - Custom Decorators

Provides role-based access control decorators
for protecting API endpoints.
"""

from functools import wraps
from flask_jwt_extended import get_jwt_identity

from utils.response import error_response
from models.user_model import User


def admin_required(fn):
    """
    Decorator to restrict endpoint access to admin users only.

    Usage:
        @jwt_required()
        @admin_required
        def admin_endpoint():
            ...
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return error_response("User not found", 404)

        if user.role != "admin":
            return error_response("Admin access required", 403)

        return fn(*args, **kwargs)

    return wrapper
