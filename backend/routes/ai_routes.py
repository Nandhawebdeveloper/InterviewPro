"""
routes/ai_routes.py - AI Question Generation Routes

Provides endpoints for:
  - AI-powered question generation using OpenAI
  - Daily usage tracking and limits (5/day)
  - Fallback to database questions when AI fails or limit reached
  - Usage status endpoint
"""

import os
import json
import logging
import random
from datetime import date

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.question_model import Question
from models.ai_usage_model import AIUsage
from utils.response import success_response, error_response

logger = logging.getLogger(__name__)

ai_bp = Blueprint("ai", __name__)

DAILY_LIMIT = 5

VALID_TOPICS = [
    "JavaScript", "React", "Python", "SQL", "DSA",
    "Database", "Node.js", "TypeScript", "HTML/CSS", "System Design",
]
VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"]
VALID_TYPES = ["MCQ", "CODING"]


def _get_today_usage(user_id):
    """Get or create today's usage record for a user."""
    today = date.today()
    usage = AIUsage.query.filter_by(user_id=user_id, usage_date=today).first()
    if not usage:
        usage = AIUsage(user_id=user_id, usage_date=today, count=0)
        db.session.add(usage)
        db.session.flush()
    return usage


def _get_fallback_question(topic, difficulty, q_type, user_id):
    """Fetch a random question from DB as fallback."""
    query = Question.query.filter_by(difficulty=difficulty)

    if topic:
        query = query.filter(Question.topic.ilike(f"%{topic}%"))
    if q_type:
        query = query.filter_by(type=q_type)

    questions = query.all()
    if not questions:
        # Broaden: any question with matching difficulty
        questions = Question.query.filter_by(difficulty=difficulty).all()
    if not questions:
        questions = Question.query.all()

    if not questions:
        return None

    q = random.choice(questions)
    result = q.to_dict()
    result["is_fallback"] = True
    return result


def _generate_with_openai(topic, difficulty, q_type):
    """
    Call OpenAI API to generate a question.
    Returns dict with question data or None on failure.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set, skipping AI generation")
        return None

    try:
        import openai
        client = openai.OpenAI(api_key=api_key)

        if q_type == "MCQ":
            prompt = f"""Generate a unique {difficulty} difficulty {topic} multiple-choice interview question.

Return a valid JSON object with exactly these fields:
{{
  "title": "the question text",
  "description": "a brief description or context for the question",
  "options": ["option A", "option B", "option C", "option D"],
  "correct_answer": "the correct option (must match one of the options exactly)",
  "explanation": "why the correct answer is right"
}}

Requirements:
- The question should test practical knowledge for software engineering interviews
- All 4 options should be plausible
- The explanation should be educational
- Return ONLY the JSON object, no markdown or extra text"""
        else:
            prompt = f"""Generate a unique {difficulty} difficulty {topic} coding interview question.

Return a valid JSON object with exactly these fields:
{{
  "title": "the coding challenge title",
  "description": "detailed description of the coding challenge with examples and constraints",
  "correct_answer": "a clean, well-commented solution in the most appropriate language for {topic}",
  "explanation": "explanation of the approach, time and space complexity"
}}

Requirements:
- Include sample input/output in the description
- The solution should follow best practices
- Return ONLY the JSON object, no markdown or extra text"""

        response = client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "You are a senior software engineer creating interview questions. Return only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=1000,
        )

        content = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

        data = json.loads(content)

        # Validate required fields
        required = ["title", "description", "correct_answer"]
        if not all(data.get(f) for f in required):
            logger.warning("OpenAI response missing required fields")
            return None

        if q_type == "MCQ":
            if not data.get("options") or len(data["options"]) < 2:
                logger.warning("OpenAI MCQ response missing valid options")
                return None
            if data["correct_answer"] not in data["options"]:
                # Try to fix by adding correct answer to options
                data["options"][-1] = data["correct_answer"]

        return data

    except ImportError:
        logger.error("openai package not installed. Install with: pip install openai")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response as JSON: {e}")
        return None
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return None


# ─────────────────────────────────────────────
# AI Question Generation
# ─────────────────────────────────────────────
@ai_bp.route("/ai/generate", methods=["POST"])
@jwt_required()
def ai_generate_question():
    """
    Generate a question using OpenAI API with daily limits and fallback.

    POST /api/ai/generate
    Body: { "topic": str, "difficulty": str, "type": str }
    """
    data = request.get_json()
    if not data:
        return error_response("Request body is required", 400)

    topic = data.get("topic", "").strip()
    difficulty = data.get("difficulty", "").strip()
    q_type = data.get("type", "MCQ").strip().upper()

    # Input validation
    if not topic:
        return error_response("Topic is required", 400)
    if len(topic) > 100:
        return error_response("Topic too long", 400)
    if difficulty not in VALID_DIFFICULTIES:
        return error_response("Difficulty must be Easy, Medium, or Hard", 400)
    if q_type not in VALID_TYPES:
        return error_response("Type must be MCQ or CODING", 400)

    user_id = int(get_jwt_identity())
    usage = _get_today_usage(user_id)

    # Check daily limit
    if usage.count >= DAILY_LIMIT:
        # Fallback: return a DB question instead
        fallback = _get_fallback_question(topic, difficulty, q_type, user_id)
        if fallback:
            fallback["fallback_reason"] = "daily_limit"
            return success_response(
                {**fallback, "usage": {"used": usage.count, "limit": DAILY_LIMIT, "remaining": 0}},
                "Daily AI limit reached. Showing a question from the bank.",
            )
        return error_response("Daily AI limit reached and no fallback questions available", 429)

    # Try OpenAI generation
    ai_data = _generate_with_openai(topic, difficulty, q_type)

    if ai_data is None:
        # Fallback: return a DB question
        fallback = _get_fallback_question(topic, difficulty, q_type, user_id)
        if fallback:
            fallback["fallback_reason"] = "ai_error"
            return success_response(
                {**fallback, "usage": {"used": usage.count, "limit": DAILY_LIMIT, "remaining": DAILY_LIMIT - usage.count}},
                "AI service unavailable. Showing a question from the bank.",
            )
        return error_response("AI generation failed and no fallback questions available", 503)

    # Check if this question already exists (by title similarity)
    existing = Question.query.filter_by(title=ai_data["title"]).first()
    if existing:
        result = existing.to_dict()
        result["explanation"] = ai_data.get("explanation", "")
        result["already_existed"] = True
        result["is_ai_generated"] = True
        result["usage"] = {"used": usage.count, "limit": DAILY_LIMIT, "remaining": DAILY_LIMIT - usage.count}
        return success_response(result, "Similar question already exists in bank")

    # Save the AI-generated question to DB
    question = Question(
        title=ai_data["title"],
        description=ai_data["description"],
        type=q_type,
        difficulty=difficulty,
        topic=topic,
        options=ai_data.get("options"),
        correct_answer=ai_data["correct_answer"],
        is_ai_generated=True,
        created_by=user_id,
    )
    db.session.add(question)

    # Increment usage count
    usage.count += 1
    db.session.commit()

    result = question.to_dict()
    result["explanation"] = ai_data.get("explanation", "")
    result["usage"] = {"used": usage.count, "limit": DAILY_LIMIT, "remaining": DAILY_LIMIT - usage.count}

    return success_response(result, "AI question generated successfully", 201)


# ─────────────────────────────────────────────
# AI Usage Status
# ─────────────────────────────────────────────
@ai_bp.route("/ai/usage", methods=["GET"])
@jwt_required()
def get_ai_usage():
    """
    Get the current user's AI generation usage for today.

    GET /api/ai/usage
    Returns: { "used": int, "limit": int, "remaining": int, "date": str }
    """
    user_id = int(get_jwt_identity())
    today = date.today()
    usage = AIUsage.query.filter_by(user_id=user_id, usage_date=today).first()

    used = usage.count if usage else 0
    return success_response(
        {
            "used": used,
            "limit": DAILY_LIMIT,
            "remaining": max(0, DAILY_LIMIT - used),
            "date": today.isoformat(),
        },
        "AI usage retrieved",
    )
