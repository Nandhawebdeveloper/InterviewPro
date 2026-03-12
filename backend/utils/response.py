"""
utils/response.py - Standard API Response Helpers

Every API response follows the format:
{
    "success": true | false,
    "message": "Human-readable description",
    "data": { ... }          # payload on success, {} on error
}

Optional field on error:
    "code": "TOKEN_EXPIRED"  # machine-readable error code
"""

from flask import jsonify


def success_response(data=None, message="Success", status_code=200):
    """
    Build a standardized success response.

    Args:
        data     (dict | list | None): Payload to return in the 'data' key.
        message  (str): Human-readable success message.
        status_code (int): HTTP status code (default 200).

    Returns:
        tuple: (Flask Response, HTTP status code)

    Example:
        return success_response({"user": user.to_dict()}, "Login successful")
        # → {"success": true, "message": "Login successful", "data": {"user": {...}}}
    """
    return jsonify({
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }), status_code


def error_response(message="An error occurred", status_code=400, code=None):
    """
    Build a standardized error response.

    Args:
        message     (str): Human-readable error description.
        status_code (int): HTTP status code (default 400).
        code        (str | None): Optional machine-readable error code
                                  e.g. "TOKEN_EXPIRED", "INVALID_TOKEN".

    Returns:
        tuple: (Flask Response, HTTP status code)

    Example:
        return error_response("Email already registered", 409)
        # → {"success": false, "message": "Email already registered", "data": {}}
    """
    body = {
        "success": False,
        "message": message,
        "data": {},
    }
    if code:
        body["code"] = code

    return jsonify(body), status_code
