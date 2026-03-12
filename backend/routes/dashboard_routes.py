"""
routes/dashboard_routes.py - Dashboard Enhancement Routes

Provides separate endpoints for:
  - Topic-wise performance
  - Difficulty-wise performance
  - 7-day activity timeline
  - Practice streak
  - Weak topic recommendations
  - AI question generation
"""

import random
from datetime import datetime, date, timedelta
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user_model import User
from models.attempt_model import Attempt
from models.question_model import Question
from utils.response import success_response, error_response
from sqlalchemy import func, case

dashboard_bp = Blueprint("dashboard_extra", __name__)


# ─────────────────────────────────────────────
# Topic-wise Performance
# ─────────────────────────────────────────────
@dashboard_bp.route("/dashboard/topic-performance", methods=["GET"])
@jwt_required()
def topic_performance():
    """GET /api/dashboard/topic-performance"""
    user_id = int(get_jwt_identity())

    stats = (
        db.session.query(
            Question.topic,
            func.count(Attempt.id).label("total"),
            func.sum(case((Attempt.is_correct == True, 1), else_=0)).label("correct"),
        )
        .join(Question, Attempt.question_id == Question.id)
        .filter(Attempt.user_id == user_id)
        .group_by(Question.topic)
        .all()
    )

    performance = []
    for topic, total, correct in stats:
        acc = round((correct / total * 100), 2) if total > 0 else 0
        performance.append({
            "topic": topic,
            "total": total,
            "correct": int(correct),
            "accuracy": acc,
        })

    return success_response({"topic_performance": performance}, "Topic performance retrieved")


# ─────────────────────────────────────────────
# Difficulty-wise Performance
# ─────────────────────────────────────────────
@dashboard_bp.route("/dashboard/difficulty-performance", methods=["GET"])
@jwt_required()
def difficulty_performance():
    """GET /api/dashboard/difficulty-performance"""
    user_id = int(get_jwt_identity())

    stats = (
        db.session.query(
            Question.difficulty,
            func.count(Attempt.id).label("total"),
            func.sum(case((Attempt.is_correct == True, 1), else_=0)).label("correct"),
        )
        .join(Question, Attempt.question_id == Question.id)
        .filter(Attempt.user_id == user_id)
        .group_by(Question.difficulty)
        .all()
    )

    performance = []
    for difficulty, total, correct in stats:
        acc = round((correct / total * 100), 2) if total > 0 else 0
        performance.append({
            "difficulty": difficulty,
            "total": total,
            "correct": int(correct),
            "accuracy": acc,
        })

    return success_response({"difficulty_performance": performance}, "Difficulty performance retrieved")


# ─────────────────────────────────────────────
# 7-Day Activity Timeline
# ─────────────────────────────────────────────
@dashboard_bp.route("/dashboard/activity", methods=["GET"])
@jwt_required()
def activity_timeline():
    """GET /api/dashboard/activity"""
    user_id = int(get_jwt_identity())
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    daily = (
        db.session.query(
            func.date(Attempt.attempted_at).label("date"),
            func.count(Attempt.id).label("total"),
            func.sum(case((Attempt.is_correct == True, 1), else_=0)).label("correct"),
        )
        .filter(Attempt.user_id == user_id, Attempt.attempted_at >= seven_days_ago)
        .group_by(func.date(Attempt.attempted_at))
        .order_by(func.date(Attempt.attempted_at))
        .all()
    )

    activity = []
    for i in range(7):
        d = (datetime.utcnow() - timedelta(days=6 - i)).strftime("%Y-%m-%d")
        day_data = {"date": d, "total": 0, "correct": 0}
        for stat_date, total, correct in daily:
            if str(stat_date) == d:
                day_data["total"] = total
                day_data["correct"] = int(correct)
                break
        activity.append(day_data)

    return success_response({"activity": activity}, "Activity timeline retrieved")


# ─────────────────────────────────────────────
# Practice Streak
# ─────────────────────────────────────────────
@dashboard_bp.route("/dashboard/streak", methods=["GET"])
@jwt_required()
def get_streak():
    """GET /api/dashboard/streak"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return error_response("User not found", 404)

    return success_response({
        "current_streak": user.streak or 0,
        "longest_streak": user.longest_streak or 0,
        "last_practice_date": str(user.last_practice_date) if user.last_practice_date else None,
    }, "Streak info retrieved")


# ─────────────────────────────────────────────
# Weak Topic Recommendations
# ─────────────────────────────────────────────
@dashboard_bp.route("/dashboard/recommendations", methods=["GET"])
@jwt_required()
def recommendations():
    """GET /api/dashboard/recommendations"""
    user_id = int(get_jwt_identity())

    stats = (
        db.session.query(
            Question.topic,
            func.count(Attempt.id).label("total"),
            func.sum(case((Attempt.is_correct == True, 1), else_=0)).label("correct"),
        )
        .join(Question, Attempt.question_id == Question.id)
        .filter(Attempt.user_id == user_id)
        .group_by(Question.topic)
        .all()
    )

    weak_topics = []
    for topic, total, correct in stats:
        acc = round((correct / total * 100), 2) if total > 0 else 0
        if acc < 60:
            weak_topics.append({"topic": topic, "accuracy": acc, "total": total})

    # Sort by accuracy ascending (weakest first)
    weak_topics.sort(key=lambda x: x["accuracy"])

    suggestion = ""
    if weak_topics:
        topic_names = [t["topic"] for t in weak_topics[:3]]
        suggestion = f"Focus more on {', '.join(topic_names)}. Practice these topics to improve your accuracy."
    else:
        suggestion = "Great job! You're performing well across all topics."

    return success_response({
        "weak_topics": weak_topics,
        "suggestion": suggestion,
    }, "Recommendations retrieved")


# ─────────────────────────────────────────────
# AI Question Generator
# ─────────────────────────────────────────────

# Question templates for different topics and difficulties
_TEMPLATES = {
    "JavaScript": {
        "Easy": [
            {
                "title": "What is the typeof operator in JavaScript?",
                "description": "Select the correct answer about the typeof operator.",
                "options": ["Returns the type of a variable as a string", "Returns the value of a variable", "Creates a new type", "Converts types"],
                "correct_answer": "Returns the type of a variable as a string",
                "explanation": "typeof returns a string indicating the type of the operand."
            },
            {
                "title": "What does Array.push() do?",
                "description": "Select what the push method does on an array.",
                "options": ["Adds elements to the end of an array", "Removes the first element", "Sorts the array", "Returns array length"],
                "correct_answer": "Adds elements to the end of an array",
                "explanation": "push() adds one or more elements to the end of an array and returns the new length."
            },
        ],
        "Medium": [
            {
                "title": "What is event delegation in JavaScript?",
                "description": "Select the best description of event delegation.",
                "options": ["Attaching a single event listener to a parent element", "Creating events dynamically", "Preventing event bubbling", "Using setTimeout for events"],
                "correct_answer": "Attaching a single event listener to a parent element",
                "explanation": "Event delegation leverages event bubbling to handle events at a higher level in the DOM."
            },
            {
                "title": "What is the difference between null and undefined?",
                "description": "Select the most accurate description.",
                "options": ["undefined means declared but not assigned; null is an intentional empty value", "They are exactly the same", "null is for numbers, undefined is for strings", "undefined is an error state"],
                "correct_answer": "undefined means declared but not assigned; null is an intentional empty value",
                "explanation": "undefined is the default value for uninitialized variables; null is explicitly assigned."
            },
        ],
        "Hard": [
            {
                "title": "What is the event loop in JavaScript?",
                "description": "Select the correct explanation of the event loop mechanism.",
                "options": ["A mechanism that handles asynchronous callbacks by checking the call stack and task queue", "A loop that runs events in sequence", "A DOM rendering cycle", "A memory management system"],
                "correct_answer": "A mechanism that handles asynchronous callbacks by checking the call stack and task queue",
                "explanation": "The event loop continuously checks if the call stack is empty and pushes callbacks from the task queue."
            },
        ],
    },
    "React": {
        "Easy": [
            {
                "title": "What is JSX in React?",
                "description": "Select the correct definition of JSX.",
                "options": ["A syntax extension that allows writing HTML-like code in JavaScript", "A database query language", "A CSS preprocessor", "A testing framework"],
                "correct_answer": "A syntax extension that allows writing HTML-like code in JavaScript",
                "explanation": "JSX is syntactic sugar for React.createElement() calls."
            },
            {
                "title": "What is the purpose of useEffect hook?",
                "description": "Select the correct answer about useEffect.",
                "options": ["To perform side effects in functional components", "To create state variables", "To define component styles", "To handle routing"],
                "correct_answer": "To perform side effects in functional components",
                "explanation": "useEffect lets you synchronize a component with an external system."
            },
        ],
        "Medium": [
            {
                "title": "What is the purpose of React.memo()?",
                "description": "Select the correct answer about React.memo.",
                "options": ["To memoize a component and skip re-renders if props haven't changed", "To store data in memory", "To create memos/notes in React", "To optimize database queries"],
                "correct_answer": "To memoize a component and skip re-renders if props haven't changed",
                "explanation": "React.memo is a higher-order component that memoizes the rendered output."
            },
            {
                "title": "What is the Context API used for?",
                "description": "Select the best use case for React Context.",
                "options": ["Sharing state across components without prop drilling", "Making API calls", "Styling components", "Handling form validation"],
                "correct_answer": "Sharing state across components without prop drilling",
                "explanation": "Context provides a way to pass data through the component tree without passing props manually."
            },
        ],
        "Hard": [
            {
                "title": "What are React Fiber's key improvements?",
                "description": "Select the correct answer about React Fiber architecture.",
                "options": ["Incremental rendering, ability to pause and resume work, priority-based updates", "Faster DOM manipulation only", "Better CSS handling", "Improved routing"],
                "correct_answer": "Incremental rendering, ability to pause and resume work, priority-based updates",
                "explanation": "Fiber is a reimplementation of React's core algorithm for incremental rendering."
            },
        ],
    },
    "Python": {
        "Easy": [
            {
                "title": "What is a list comprehension in Python?",
                "description": "Select the correct answer about list comprehensions.",
                "options": ["A concise way to create lists using a single line of code", "A way to delete list elements", "A sorting algorithm", "A type of loop"],
                "correct_answer": "A concise way to create lists using a single line of code",
                "explanation": "List comprehensions provide a concise way to create lists: [x for x in iterable]."
            },
        ],
        "Medium": [
            {
                "title": "What is the GIL in Python?",
                "description": "Select the correct answer about the Global Interpreter Lock.",
                "options": ["A mutex that allows only one thread to execute Python bytecode at a time", "A security feature", "A garbage collector", "A package manager"],
                "correct_answer": "A mutex that allows only one thread to execute Python bytecode at a time",
                "explanation": "The GIL prevents multiple threads from executing Python bytecodes simultaneously."
            },
        ],
        "Hard": [
            {
                "title": "What are metaclasses in Python?",
                "description": "Select the correct answer about Python metaclasses.",
                "options": ["Classes that define how other classes behave — the class of a class", "Classes that cannot be instantiated", "Classes with only static methods", "Abstract base classes"],
                "correct_answer": "Classes that define how other classes behave — the class of a class",
                "explanation": "Metaclasses define the behavior of classes themselves, with type being the default metaclass."
            },
        ],
    },
    "SQL": {
        "Easy": [
            {
                "title": "What does SELECT DISTINCT do?",
                "description": "Select the correct answer about SELECT DISTINCT.",
                "options": ["Returns only unique rows from a query", "Selects all rows", "Deletes duplicate rows", "Creates a new table"],
                "correct_answer": "Returns only unique rows from a query",
                "explanation": "DISTINCT eliminates duplicate rows from the result set."
            },
        ],
        "Medium": [
            {
                "title": "What is the difference between INNER JOIN and LEFT JOIN?",
                "description": "Select the correct comparison.",
                "options": ["INNER JOIN returns matching rows from both tables; LEFT JOIN returns all rows from the left table", "They are identical", "LEFT JOIN is faster", "INNER JOIN returns all rows from both tables"],
                "correct_answer": "INNER JOIN returns matching rows from both tables; LEFT JOIN returns all rows from the left table",
                "explanation": "LEFT JOIN preserves all rows from the left table, filling NULLs for non-matching right table rows."
            },
        ],
        "Hard": [
            {
                "title": "What is a window function in SQL?",
                "description": "Select the correct answer about window functions.",
                "options": ["A function that performs calculations across a set of rows related to the current row", "A function that opens new database connections", "A GUI feature in database tools", "A function that creates views"],
                "correct_answer": "A function that performs calculations across a set of rows related to the current row",
                "explanation": "Window functions compute values over a partition of rows defined by OVER() clause."
            },
        ],
    },
    "DSA": {
        "Easy": [
            {
                "title": "What is the time complexity of accessing an element in an array by index?",
                "description": "Select the correct time complexity.",
                "options": ["O(1)", "O(n)", "O(log n)", "O(n²)"],
                "correct_answer": "O(1)",
                "explanation": "Array elements can be accessed directly by index in constant time."
            },
        ],
        "Medium": [
            {
                "title": "What data structure uses LIFO (Last In First Out)?",
                "description": "Select the correct data structure.",
                "options": ["Stack", "Queue", "Linked List", "Tree"],
                "correct_answer": "Stack",
                "explanation": "A stack follows LIFO — the last element pushed is the first one popped."
            },
        ],
        "Hard": [
            {
                "title": "What is the time complexity of Dijkstra's algorithm with a min-heap?",
                "description": "Select the correct time complexity.",
                "options": ["O((V + E) log V)", "O(V²)", "O(V * E)", "O(E log E)"],
                "correct_answer": "O((V + E) log V)",
                "explanation": "With a min-heap (priority queue), Dijkstra's achieves O((V + E) log V)."
            },
        ],
    },
    "Database": {
        "Easy": [
            {
                "title": "What is a primary key?",
                "description": "Select the correct definition of a primary key.",
                "options": ["A column that uniquely identifies each row in a table", "The first column in any table", "A foreign key reference", "An index on all columns"],
                "correct_answer": "A column that uniquely identifies each row in a table",
                "explanation": "A primary key constraint ensures uniqueness and non-null values for a column or set of columns."
            },
        ],
        "Medium": [
            {
                "title": "What is database indexing?",
                "description": "Select the correct answer about database indexes.",
                "options": ["A data structure that improves query speed by reducing the amount of data to scan", "A backup mechanism", "A way to encrypt data", "A type of join operation"],
                "correct_answer": "A data structure that improves query speed by reducing the amount of data to scan",
                "explanation": "Indexes create a sorted reference to data, allowing faster lookups."
            },
        ],
        "Hard": [
            {
                "title": "What is ACID in database transactions?",
                "description": "Select the correct expansion and meaning of ACID.",
                "options": ["Atomicity, Consistency, Isolation, Durability — properties ensuring reliable transactions", "Access, Control, Index, Data", "Automated, Concurrent, Integrated, Distributed", "Aggregate, Cluster, Index, Distribute"],
                "correct_answer": "Atomicity, Consistency, Isolation, Durability — properties ensuring reliable transactions",
                "explanation": "ACID properties guarantee database transactions are processed reliably."
            },
        ],
    },
}

# Coding question templates
_CODING_TEMPLATES = {
    "JavaScript": {
        "Easy": [
            {
                "title": "Write a function to check if a string is a palindrome",
                "description": "Write a JavaScript function isPalindrome(str) that returns true if the string reads the same forwards and backwards (case-insensitive).",
                "correct_answer": "function isPalindrome(str) { const clean = str.toLowerCase().replace(/[^a-z0-9]/g, ''); return clean === clean.split('').reverse().join(''); }",
            },
        ],
        "Medium": [
            {
                "title": "Implement debounce function in JavaScript",
                "description": "Write a debounce function that delays invoking a function until after a specified wait time has elapsed since the last invocation.",
                "correct_answer": "function debounce(fn, delay) { let timer; return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); }; }",
            },
        ],
        "Hard": [
            {
                "title": "Implement a deep clone function",
                "description": "Write a function deepClone(obj) that creates a deep copy of a JavaScript object, handling nested objects, arrays, dates, and circular references.",
                "correct_answer": "Use recursion with a WeakMap for circular reference tracking. Handle Date, Array, and plain objects separately. Base case: return primitives as-is.",
            },
        ],
    },
    "React": {
        "Easy": [
            {
                "title": "Create a counter component using useState",
                "description": "Write a React functional component that displays a count value and has increment/decrement buttons using the useState hook.",
                "correct_answer": "const Counter = () => { const [count, setCount] = useState(0); return (<div><p>{count}</p><button onClick={() => setCount(c => c + 1)}>+</button><button onClick={() => setCount(c => c - 1)}>-</button></div>); };",
            },
        ],
        "Medium": [
            {
                "title": "Build a custom useLocalStorage hook",
                "description": "Create a custom React hook useLocalStorage(key, initialValue) that syncs state with localStorage and handles errors gracefully.",
                "correct_answer": "function useLocalStorage(key, init) { const [val, setVal] = useState(() => { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : init; } catch { return init; }}); useEffect(() => { localStorage.setItem(key, JSON.stringify(val)); }, [key, val]); return [val, setVal]; }",
            },
        ],
    },
    "Python": {
        "Easy": [
            {
                "title": "Write a function to find the factorial of a number",
                "description": "Write a Python function factorial(n) that returns the factorial of a non-negative integer n. Handle edge cases.",
                "correct_answer": "def factorial(n): if n < 0: raise ValueError; if n <= 1: return 1; return n * factorial(n-1). Iterative: result=1; for i in range(2,n+1): result*=i; return result",
            },
        ],
        "Medium": [
            {
                "title": "Implement a decorator that caches function results",
                "description": "Write a Python decorator @memoize that caches the results of function calls based on their arguments.",
                "correct_answer": "def memoize(func): cache = {}; @wraps(func) def wrapper(*args): if args not in cache: cache[args] = func(*args); return cache[args]; return wrapper",
            },
        ],
    },
    "DSA": {
        "Easy": [
            {
                "title": "Implement binary search",
                "description": "Write a function that performs binary search on a sorted array and returns the index of the target element, or -1 if not found.",
                "correct_answer": "def binary_search(arr, target): left, right = 0, len(arr)-1; while left <= right: mid = (left+right)//2; if arr[mid] == target: return mid; elif arr[mid] < target: left = mid+1; else: right = mid-1; return -1",
            },
        ],
        "Medium": [
            {
                "title": "Implement a function to detect cycle in a linked list",
                "description": "Write a function that detects if a singly linked list has a cycle using Floyd's tortoise and hare algorithm.",
                "correct_answer": "def has_cycle(head): slow = fast = head; while fast and fast.next: slow = slow.next; fast = fast.next.next; if slow == fast: return True; return False. O(n) time, O(1) space.",
            },
        ],
    },
}


@dashboard_bp.route("/questions/generate", methods=["POST"])
@jwt_required()
def generate_question():
    """
    Generate a new interview question based on topic, difficulty, and type.

    POST /api/questions/generate
    Body: { "topic": str, "difficulty": str, "type": str }
    """
    data = request.get_json()
    if not data:
        return error_response("Request body is required", 400)

    topic = data.get("topic", "").strip()
    difficulty = data.get("difficulty", "").strip()
    q_type = data.get("type", "MCQ").strip()

    if not topic:
        return error_response("Topic is required", 400)
    if difficulty not in ("Easy", "Medium", "Hard"):
        return error_response("Difficulty must be Easy, Medium, or Hard", 400)
    if q_type not in ("MCQ", "CODING"):
        return error_response("Type must be MCQ or CODING", 400)

    user_id = int(get_jwt_identity())

    if q_type == "MCQ":
        templates = _TEMPLATES.get(topic, {}).get(difficulty, [])
    else:
        templates = _CODING_TEMPLATES.get(topic, {}).get(difficulty, [])

    if not templates:
        # Fallback: generate a generic question
        if q_type == "MCQ":
            templates = [{
                "title": f"What is an important concept in {topic}?",
                "description": f"Select the correct answer about a key {difficulty.lower()}-level {topic} concept.",
                "options": [
                    f"Core principle of {topic}",
                    f"An unrelated concept",
                    f"A common misconception",
                    f"None of the above"
                ],
                "correct_answer": f"Core principle of {topic}",
                "explanation": f"This tests fundamental {topic} knowledge at the {difficulty.lower()} level."
            }]
        else:
            templates = [{
                "title": f"Write a {difficulty.lower()}-level {topic} solution",
                "description": f"Demonstrate your understanding of {topic} by solving this {difficulty.lower()}-level coding challenge.",
                "correct_answer": f"Implement a well-structured solution demonstrating {topic} concepts.",
            }]

    template = random.choice(templates)

    # Check for duplicate titles — if exists, try another or return existing
    existing = Question.query.filter_by(title=template["title"]).first()
    if existing:
        result = existing.to_dict()
        result["explanation"] = template.get("explanation", "")
        result["already_existed"] = True
        return success_response(result, "Question already exists in bank")

    # Create and save the question
    question = Question(
        title=template["title"],
        description=template["description"],
        type=q_type,
        difficulty=difficulty,
        topic=topic,
        options=template.get("options"),
        correct_answer=template["correct_answer"],
        created_by=user_id,
    )

    db.session.add(question)
    db.session.commit()

    result = question.to_dict()
    result["explanation"] = template.get("explanation", "")

    return success_response(result, "Question generated successfully", 201)
