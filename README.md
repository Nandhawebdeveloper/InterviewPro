# InterviewPro – AI-based Interview Practice & Tracking System

A full-stack web application for practicing interview questions with real-time scoring, analytics dashboards, and an admin panel for question management.

---

## Tech Stack

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | React 18 (Vite), React Router, Chart.js, Axios |
| Backend  | Python Flask, Flask-JWT-Extended, Flask-CORS   |
| Database | MySQL 8.0+ with SQLAlchemy ORM                 |
| Auth     | JWT tokens + bcrypt password hashing           |

---

## Features

- **Authentication** – Register, login, JWT-based sessions, role-based access (User/Admin)
- **Question Bank** – Admin CRUD for MCQ & Coding questions with topics & difficulty levels
- **Practice Mode** – Attempt MCQs with instant scoring and answer feedback
- **Dashboard Analytics** – Accuracy, topic-wise & difficulty-wise performance, 7-day activity chart
- **Admin Panel** – System analytics, user management, question management

---

## Project Structure

```
InterviewPro/
├── backend/
│   ├── app.py              # Flask app factory & entry point
│   ├── config.py           # Configuration classes
│   ├── extensions.py       # Flask extension instances
│   ├── .env                # Environment variables
│   ├── requirements.txt    # Python dependencies
│   ├── models/
│   │   ├── user_model.py
│   │   ├── question_model.py
│   │   └── attempt_model.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── question_routes.py
│   │   └── attempt_routes.py
│   ├── services/
│   │   ├── auth_service.py
│   │   └── dashboard_service.py
│   └── utils/
│       ├── validators.py
│       └── decorators.py
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── services/
│       │   └── api.js
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Practice.jsx
│       │   └── AdminPanel.jsx
│       └── components/
│           ├── Navbar.jsx
│           ├── ProtectedRoute.jsx
│           └── QuestionCard.jsx
└── database/
    └── schema.sql
```

---

## Setup Guide

### Prerequisites

- Python 3.9+
- Node.js 18+
- MySQL 8.0+
- Git

### Step 1: Clone & Setup Database

```bash
# Create the database
mysql -u root -p < database/schema.sql
```

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS/Linux)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (edit .env as needed)
# Update DATABASE_URL with your MySQL credentials

# Run the server
python app.py
```

The backend runs at: `http://localhost:5000`

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs at: `http://localhost:5173`

### Default Admin Credentials

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | admin@interviewpro.com |
| Password | Admin@123              |

---

## .env Configuration

```env
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-super-secret-key-here
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/InterviewPro
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=http://localhost:5173
```

---

## API Reference

### Authentication

| Method | Endpoint      | Description           | Auth Required |
| ------ | ------------- | --------------------- | ------------- |
| POST   | /api/register | Register new user     | No            |
| POST   | /api/login    | Login & get JWT token | No            |
| GET    | /api/me       | Get current user      | Yes           |

### Questions

| Method | Endpoint              | Description         | Auth Required |
| ------ | --------------------- | ------------------- | ------------- |
| GET    | /api/questions        | List all questions  | Yes           |
| GET    | /api/questions/:id    | Get single question | Yes           |
| POST   | /api/questions        | Create question     | Admin         |
| PUT    | /api/questions/:id    | Update question     | Admin         |
| DELETE | /api/questions/:id    | Delete question     | Admin         |
| GET    | /api/questions/topics | Get all topics      | Yes           |

### Practice & Analytics

| Method | Endpoint               | Description             | Auth Required |
| ------ | ---------------------- | ----------------------- | ------------- |
| POST   | /api/attempt           | Submit practice attempt | Yes           |
| GET    | /api/attempts/user/:id | Get user attempts       | Yes           |
| GET    | /api/dashboard/summary | User dashboard data     | Yes           |

### Admin

| Method | Endpoint             | Description      | Auth Required |
| ------ | -------------------- | ---------------- | ------------- |
| GET    | /api/admin/analytics | System analytics | Admin         |
| GET    | /api/admin/users     | List all users   | Admin         |
| DELETE | /api/admin/users/:id | Delete a user    | Admin         |

---

## API Testing Guide (Postman)

### 1. Register a User

```
POST http://localhost:5000/api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Login

```
POST http://localhost:5000/api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

> Copy the `token` from the response.

### 3. Get Questions (Authenticated)

```
GET http://localhost:5000/api/questions
Authorization: Bearer <your_token>
```

### 4. Submit an Attempt

```
POST http://localhost:5000/api/attempt
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "question_id": 1,
  "selected_answer": "A function bundled with its lexical scope"
}
```

### 5. Get Dashboard Summary

```
GET http://localhost:5000/api/dashboard/summary
Authorization: Bearer <your_token>
```

### 6. Admin: Create Question

```
POST http://localhost:5000/api/questions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "What is REST?",
  "description": "Select the best description of REST architecture.",
  "type": "MCQ",
  "difficulty": "Easy",
  "topic": "Web Development",
  "options": ["Representational State Transfer", "Remote Execution Service Technology", "Rapid Enterprise Software Testing", "None of the above"],
  "correct_answer": "Representational State Transfer"
}
```

---

## Deployment Guide

### Backend (Production)

1. Use **Gunicorn** as the WSGI server:

   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app('production')"
   ```

2. Use **Nginx** as a reverse proxy in front of Gunicorn.

3. Set environment variables:

   ```bash
   export FLASK_ENV=production
   export SECRET_KEY=<strong-random-key>
   export DATABASE_URL=mysql+pymysql://user:pass@db-host:3306/InterviewPro
   ```

4. Use a managed MySQL service (AWS RDS, Azure Database, PlanetScale).

### Frontend (Production)

1. Build the production bundle:

   ```bash
   cd frontend
   npm run build
   ```

2. Serve the `dist/` folder with **Nginx** or deploy to:
   - **Vercel** (recommended for React)
   - **Netlify**
   - **AWS S3 + CloudFront**

3. Update the API base URL in `src/services/api.js` to point to the production backend URL.

### Docker (Optional)

Create Dockerfiles for both backend and frontend, and use `docker-compose` for orchestration.

---

## Resume Bullet Points

- Developed **InterviewPro**, a full-stack interview practice platform using **React**, **Flask**, and **MySQL** supporting MCQ/coding questions with real-time scoring
- Implemented **JWT-based authentication** with role-based access control (RBAC) for user and admin workflows, securing 10+ REST API endpoints
- Built an **analytics dashboard** with Chart.js displaying accuracy metrics, topic-wise performance breakdown, and 7-day activity trends
- Designed a normalized **MySQL database schema** with foreign keys, indexes, and JSON columns; used SQLAlchemy ORM for type-safe database operations
- Created an **admin panel** for question bank CRUD management, user administration, and system-wide analytics monitoring
- Followed **MVC architecture** with service layers, input validation, error handling, and environment-based configuration for production readiness

---

## Scalability Improvements

1. **Caching** – Add Redis caching for dashboard analytics and question listings to reduce DB load
2. **Pagination** – Already implemented; extend with cursor-based pagination for large datasets
3. **Rate Limiting** – Add Flask-Limiter to prevent API abuse
4. **File Uploads** – Add support for question images/code snippets with S3 storage
5. **WebSockets** – Real-time leaderboards using Flask-SocketIO
6. **Microservices** – Split analytics into a separate service for independent scaling
7. **CI/CD** – Add GitHub Actions for automated testing, linting, and deployment
8. **Testing** – Add pytest for backend + React Testing Library for frontend
9. **Docker** – Containerize the app with docker-compose for consistent environments
10. **Search** – Add Elasticsearch for full-text question search
11. **AI Integration** – Add OpenAI API for generating coding question hints and explanations
12. **Mobile** – Create a React Native mobile app reusing the same API

---

## License

MIT License – Free for educational and commercial use.
