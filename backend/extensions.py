"""
extensions.py - Flask Extension Instances

Centralizes extension initialization to avoid circular imports.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

# Database ORM instance
db = SQLAlchemy()

# JWT authentication manager
jwt = JWTManager()
