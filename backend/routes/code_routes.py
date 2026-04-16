"""
routes/code_routes.py - Code Execution API

Provides a sandboxed code execution endpoint for coding challenges.
Supports Python, JavaScript (Node.js).
"""

import subprocess
import tempfile
import os
import time
from collections import defaultdict
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.response import success_response, error_response
from utils.feature_access import check_feature_access

code_bp = Blueprint("code", __name__)

SUPPORTED_LANGUAGES = {
    "python": {"ext": ".py", "cmd": ["python"]},
    "javascript": {"ext": ".js", "cmd": ["node"]},
}

MAX_EXECUTION_TIME = 10  # seconds
MAX_OUTPUT_SIZE = 10000  # characters

# Simple in-memory rate limiter: user_id -> list of timestamps
_rate_limit_store = defaultdict(list)
RATE_LIMIT_MAX = 5        # max requests
RATE_LIMIT_WINDOW = 60    # per 60 seconds


def _is_rate_limited(user_id):
    """Check if user has exceeded code execution rate limit."""
    now = time.time()
    timestamps = _rate_limit_store[user_id]
    # Remove expired entries
    _rate_limit_store[user_id] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limit_store[user_id]) >= RATE_LIMIT_MAX:
        return True
    _rate_limit_store[user_id].append(now)
    return False


@code_bp.route("/code/run", methods=["POST"])
@jwt_required()
@check_feature_access("coding")
def run_code():
    user_id = get_jwt_identity()

    # Rate limit check
    if _is_rate_limited(user_id):
        return error_response("Rate limit exceeded. Max 5 executions per minute.", 429)

    data = request.get_json()
    if not data:
        return error_response("Request body is required", 400)

    language = data.get("language", "").lower().strip()
    code = data.get("code", "").strip()

    if not language or not code:
        return error_response("Language and code are required", 400)

    if language not in SUPPORTED_LANGUAGES:
        return error_response(f"Unsupported language. Supported: {', '.join(SUPPORTED_LANGUAGES.keys())}", 400)

    # Block dangerous imports/operations
    dangerous_patterns = [
        "import os", "import subprocess", "import shutil", "import sys",
        "import socket", "import signal", "import ctypes",
        "__import__", "exec(", "eval(", "open(", "system(",
        "globals(", "locals(", "compile(", "getattr(", "__builtins__",
        "require('fs')", "require('child_process')", "require('os')",
        "require('net')", "require('http')", "require('https')",
        "process.exit", "rm -", "del /", "format(",
    ]
    code_lower = code.lower()
    for pattern in dangerous_patterns:
        if pattern.lower() in code_lower:
            return error_response(f"Blocked: code contains restricted operation", 400)

    lang_config = SUPPORTED_LANGUAGES[language]

    try:
        # Write code to temp file
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=lang_config["ext"], delete=False, encoding="utf-8"
        ) as f:
            f.write(code)
            temp_path = f.name

        try:
            cmd = lang_config["cmd"] + [temp_path]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=MAX_EXECUTION_TIME,
                cwd=tempfile.gettempdir(),
            )

            output = result.stdout[:MAX_OUTPUT_SIZE] if result.stdout else ""
            error_out = result.stderr[:MAX_OUTPUT_SIZE] if result.stderr else ""

            if result.returncode != 0:
                return success_response({
                    "output": "",
                    "error": error_out or "Runtime error",
                    "exit_code": result.returncode,
                }, "Code executed with errors")

            return success_response({
                "output": output,
                "error": "",
                "exit_code": 0,
            }, "Code executed successfully")

        finally:
            # Always clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except subprocess.TimeoutExpired:
        return error_response("Execution timed out (10s limit)", 408)
    except Exception as e:
        return error_response("Execution failed", 500)
