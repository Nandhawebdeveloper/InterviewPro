"""
utils/validators.py - Input Validation Utilities

Provides helper functions for validating user input
across different API endpoints.
"""

import re


def validate_email(email):
    """
    Validate email format using regex.

    Args:
        email (str): Email address to validate.

    Returns:
        bool: True if valid email format, False otherwise.
    """
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_registration(data):
    """
    Validate user registration payload.

    Args:
        data (dict): Registration data with name, email, password.

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not data:
        return False, "Request body is required"

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not name or len(name) < 2:
        return False, "Name must be at least 2 characters long"

    if not email or not validate_email(email):
        return False, "A valid email address is required"

    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters long"

    return True, None


def validate_login(data):
    """
    Validate user login payload.

    Args:
        data (dict): Login data with email and password.

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not data:
        return False, "Request body is required"

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email:
        return False, "Email is required"

    if not password:
        return False, "Password is required"

    return True, None


def validate_question(data):
    """
    Validate question creation/update payload.

    Args:
        data (dict): Question data.

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not data:
        return False, "Request body is required"

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    q_type = data.get("type", "").strip()
    difficulty = data.get("difficulty", "").strip()
    topic = data.get("topic", "").strip()
    correct_answer = data.get("correct_answer", "").strip()

    if not title:
        return False, "Title is required"
    if not description:
        return False, "Description is required"
    if q_type not in ("MCQ", "CODING"):
        return False, "Type must be MCQ or CODING"
    if difficulty not in ("Easy", "Medium", "Hard"):
        return False, "Difficulty must be Easy, Medium, or Hard"
    if not topic:
        return False, "Topic is required"
    if not correct_answer:
        return False, "Correct answer is required"

    # MCQ must have options
    if q_type == "MCQ":
        options = data.get("options")
        if not options or not isinstance(options, list) or len(options) < 2:
            return False, "MCQ questions must have at least 2 options"

    return True, None


def validate_attempt(data):
    """
    Validate practice attempt payload.

    Args:
        data (dict): Attempt data with question_id and selected_answer.

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not data:
        return False, "Request body is required"

    question_id = data.get("question_id")
    selected_answer = data.get("selected_answer", "").strip()

    if not question_id:
        return False, "Question ID is required"

    if not selected_answer:
        return False, "Selected answer is required"

    return True, None
