"""
routes/roadmap_routes.py - Study Roadmap Generator API

Returns structured study roadmaps for different career goals.
"""

from flask import Blueprint
from flask_jwt_extended import jwt_required
from utils.response import success_response, error_response

roadmap_bp = Blueprint("roadmap", __name__)

ROADMAPS = {
    "frontend": {
        "title": "Frontend Developer Roadmap",
        "description": "Master modern frontend development from basics to advanced",
        "steps": [
            {"order": 1, "title": "HTML & CSS Fundamentals", "description": "Learn semantic HTML5, CSS3, Flexbox, Grid, responsive design", "duration": "2-3 weeks", "topics": ["HTML", "CSS"]},
            {"order": 2, "title": "JavaScript Core", "description": "Variables, functions, DOM manipulation, ES6+, async/await, promises", "duration": "3-4 weeks", "topics": ["JavaScript"]},
            {"order": 3, "title": "Version Control", "description": "Git basics, branching, merging, GitHub workflow", "duration": "1 week", "topics": ["Git"]},
            {"order": 4, "title": "React.js", "description": "Components, hooks, state management, React Router, Context API", "duration": "4-5 weeks", "topics": ["React"]},
            {"order": 5, "title": "CSS Frameworks & Tools", "description": "Tailwind CSS, Bootstrap, SASS/SCSS, CSS-in-JS", "duration": "2 weeks", "topics": ["CSS", "Design"]},
            {"order": 6, "title": "State Management", "description": "Redux Toolkit, Zustand, React Query for server state", "duration": "2 weeks", "topics": ["React", "JavaScript"]},
            {"order": 7, "title": "TypeScript", "description": "Types, interfaces, generics, TypeScript with React", "duration": "2-3 weeks", "topics": ["TypeScript"]},
            {"order": 8, "title": "Testing", "description": "Jest, React Testing Library, Cypress for E2E testing", "duration": "2 weeks", "topics": ["Testing"]},
            {"order": 9, "title": "Build & Deploy", "description": "Webpack, Vite, CI/CD, Vercel, Netlify deployment", "duration": "1-2 weeks", "topics": ["DevOps"]},
            {"order": 10, "title": "Portfolio & Interview Prep", "description": "Build 3-5 projects, prepare for frontend interviews", "duration": "3-4 weeks", "topics": ["Career"]},
        ],
    },
    "backend": {
        "title": "Backend Developer Roadmap",
        "description": "Build robust server-side applications and APIs",
        "steps": [
            {"order": 1, "title": "Programming Language", "description": "Python or Node.js — deep understanding of the language", "duration": "3-4 weeks", "topics": ["Python", "JavaScript"]},
            {"order": 2, "title": "Database Fundamentals", "description": "SQL (MySQL/PostgreSQL), normalization, queries, joins, indexes", "duration": "2-3 weeks", "topics": ["SQL", "Database"]},
            {"order": 3, "title": "REST API Design", "description": "HTTP methods, status codes, REST conventions, JSON APIs", "duration": "2 weeks", "topics": ["API", "REST"]},
            {"order": 4, "title": "Web Framework", "description": "Flask/Django (Python) or Express.js (Node.js)", "duration": "3-4 weeks", "topics": ["Flask", "Express"]},
            {"order": 5, "title": "Authentication & Security", "description": "JWT, OAuth2, password hashing, CORS, input validation", "duration": "2 weeks", "topics": ["Security", "Auth"]},
            {"order": 6, "title": "ORM & Database Patterns", "description": "SQLAlchemy/Sequelize, migrations, relationships, query optimization", "duration": "2 weeks", "topics": ["Database", "ORM"]},
            {"order": 7, "title": "NoSQL Databases", "description": "MongoDB, Redis for caching, when to use NoSQL vs SQL", "duration": "2 weeks", "topics": ["MongoDB", "Redis"]},
            {"order": 8, "title": "Testing & Documentation", "description": "Unit tests, integration tests, Swagger/OpenAPI docs", "duration": "2 weeks", "topics": ["Testing"]},
            {"order": 9, "title": "Docker & Deployment", "description": "Containerization, Docker Compose, cloud deployment (AWS/GCP)", "duration": "2-3 weeks", "topics": ["DevOps", "Docker"]},
            {"order": 10, "title": "System Design Basics", "description": "Load balancing, caching, message queues, microservices intro", "duration": "3-4 weeks", "topics": ["System Design"]},
        ],
    },
    "fullstack": {
        "title": "Full Stack Developer Roadmap",
        "description": "End-to-end web development — frontend, backend, and deployment",
        "steps": [
            {"order": 1, "title": "HTML, CSS & JavaScript", "description": "Core web technologies: semantic HTML, CSS3, ES6+ JavaScript", "duration": "4-5 weeks", "topics": ["HTML", "CSS", "JavaScript"]},
            {"order": 2, "title": "Version Control & CLI", "description": "Git, GitHub, terminal/command line basics", "duration": "1 week", "topics": ["Git"]},
            {"order": 3, "title": "React Frontend", "description": "Components, hooks, routing, state management, API integration", "duration": "4-5 weeks", "topics": ["React"]},
            {"order": 4, "title": "Backend with Python/Flask", "description": "REST APIs, request handling, middleware, error handling", "duration": "3-4 weeks", "topics": ["Python", "Flask"]},
            {"order": 5, "title": "Database Design", "description": "MySQL/PostgreSQL, schema design, SQL queries, ORM (SQLAlchemy)", "duration": "2-3 weeks", "topics": ["SQL", "Database"]},
            {"order": 6, "title": "Authentication", "description": "JWT, session management, role-based access, OAuth", "duration": "2 weeks", "topics": ["Security", "Auth"]},
            {"order": 7, "title": "Full Stack Project", "description": "Build a complete app: planning, frontend, backend, database, deployment", "duration": "4-5 weeks", "topics": ["Project"]},
            {"order": 8, "title": "TypeScript & Testing", "description": "TypeScript basics, Jest, testing frontend + backend", "duration": "3 weeks", "topics": ["TypeScript", "Testing"]},
            {"order": 9, "title": "DevOps & Cloud", "description": "Docker, CI/CD pipelines, AWS/Vercel deployment, monitoring", "duration": "2-3 weeks", "topics": ["DevOps", "Docker"]},
            {"order": 10, "title": "Advanced Topics", "description": "WebSockets, caching (Redis), GraphQL, system design fundamentals", "duration": "3-4 weeks", "topics": ["System Design", "Advanced"]},
        ],
    },
    "data-science": {
        "title": "Data Science Roadmap",
        "description": "From statistics to machine learning and data analysis",
        "steps": [
            {"order": 1, "title": "Python Programming", "description": "Python basics, data structures, OOP, file handling", "duration": "3 weeks", "topics": ["Python"]},
            {"order": 2, "title": "Mathematics & Statistics", "description": "Linear algebra, probability, descriptive & inferential statistics", "duration": "3-4 weeks", "topics": ["Math", "Statistics"]},
            {"order": 3, "title": "Data Analysis with Pandas", "description": "DataFrames, data cleaning, transformation, aggregation", "duration": "2-3 weeks", "topics": ["Pandas", "Python"]},
            {"order": 4, "title": "Data Visualization", "description": "Matplotlib, Seaborn, Plotly — telling stories with data", "duration": "2 weeks", "topics": ["Visualization"]},
            {"order": 5, "title": "SQL for Data", "description": "Complex queries, window functions, data extraction", "duration": "2 weeks", "topics": ["SQL"]},
            {"order": 6, "title": "Machine Learning", "description": "Scikit-learn, regression, classification, clustering, model evaluation", "duration": "5-6 weeks", "topics": ["ML"]},
            {"order": 7, "title": "Deep Learning Intro", "description": "Neural networks, TensorFlow/PyTorch basics, CNNs, RNNs", "duration": "4 weeks", "topics": ["Deep Learning"]},
            {"order": 8, "title": "Projects & Portfolio", "description": "End-to-end data science projects, Kaggle competitions", "duration": "4 weeks", "topics": ["Project"]},
        ],
    },
    "devops": {
        "title": "DevOps Engineer Roadmap",
        "description": "Infrastructure, automation, and continuous delivery",
        "steps": [
            {"order": 1, "title": "Linux & Scripting", "description": "Linux administration, Bash scripting, file systems, networking", "duration": "3-4 weeks", "topics": ["Linux", "Bash"]},
            {"order": 2, "title": "Version Control", "description": "Advanced Git, branching strategies, GitFlow", "duration": "1 week", "topics": ["Git"]},
            {"order": 3, "title": "Networking Fundamentals", "description": "TCP/IP, DNS, HTTP/HTTPS, firewalls, load balancers", "duration": "2 weeks", "topics": ["Networking"]},
            {"order": 4, "title": "Containers & Docker", "description": "Docker images, containers, Dockerfile, Docker Compose", "duration": "2-3 weeks", "topics": ["Docker"]},
            {"order": 5, "title": "CI/CD Pipelines", "description": "Jenkins, GitHub Actions, automated testing, deployment pipelines", "duration": "2-3 weeks", "topics": ["CI/CD"]},
            {"order": 6, "title": "Kubernetes", "description": "Pods, services, deployments, Helm charts, cluster management", "duration": "4-5 weeks", "topics": ["Kubernetes"]},
            {"order": 7, "title": "Cloud Platforms", "description": "AWS/GCP/Azure — EC2, S3, RDS, Lambda, IAM", "duration": "4-5 weeks", "topics": ["AWS", "Cloud"]},
            {"order": 8, "title": "Monitoring & Logging", "description": "Prometheus, Grafana, ELK stack, alerting", "duration": "2 weeks", "topics": ["Monitoring"]},
            {"order": 9, "title": "Infrastructure as Code", "description": "Terraform, Ansible, automated provisioning", "duration": "3 weeks", "topics": ["IaC", "Terraform"]},
        ],
    },
}

VALID_ROLES = list(ROADMAPS.keys())


@roadmap_bp.route("/roadmap", methods=["GET"])
@jwt_required()
def list_roadmaps():
    summaries = []
    for key, roadmap in ROADMAPS.items():
        summaries.append({
            "role": key,
            "title": roadmap["title"],
            "description": roadmap["description"],
            "steps_count": len(roadmap["steps"]),
        })
    return success_response({"roadmaps": summaries})


@roadmap_bp.route("/roadmap/<string:role>", methods=["GET"])
@jwt_required()
def get_roadmap(role):
    role = role.lower().strip()
    if role not in ROADMAPS:
        return error_response(
            f"Roadmap not found. Available: {', '.join(VALID_ROLES)}", 404
        )

    return success_response({"roadmap": ROADMAPS[role], "role": role})
