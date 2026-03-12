"""
services/auth_service.py - Authentication Business Logic

Handles user registration, login, and password operations.
Keeps route handlers clean by extracting business logic.
"""

import bcrypt
from models.user_model import User
from extensions import db


def hash_password(password):
    """
    Hash a plain-text password using bcrypt.

    Args:
        password (str): Plain-text password.

    Returns:
        str: Bcrypt hashed password string.
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password, hashed_password):
    """
    Verify a plain-text password against a bcrypt hash.

    Args:
        plain_password (str): Plain-text password to check.
        hashed_password (str): Stored bcrypt hash.

    Returns:
        bool: True if password matches, False otherwise.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def register_user(name, email, password, role="user"):
    """
    Register a new user in the database.

    Args:
        name (str): User's full name.
        email (str): User's email address.
        password (str): Plain-text password (will be hashed).
        role (str): User role ('user' or 'admin').

    Returns:
        tuple: (user_dict, error_message)
    """
    # Check if email already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return None, "Email already registered"

    # Create new user with hashed password
    new_user = User(
        name=name,
        email=email,
        password=hash_password(password),
        role=role,
    )

    db.session.add(new_user)
    db.session.commit()

    return new_user.to_dict(), None


def authenticate_user(email, password):
    """
    Authenticate user credentials.

    Args:
        email (str): User's email address.
        password (str): Plain-text password.

    Returns:
        tuple: (user_object, error_message)
    """
    user = User.query.filter_by(email=email).first()

    if not user:
        return None, "Invalid email or password"

    if not verify_password(password, user.password):
        return None, "Invalid email or password"

    return user, None
