-- ============================================================
-- InterviewPro – AI-based Interview Practice & Tracking System
-- Database Schema
-- ============================================================

-- Create the database
CREATE DATABASE IF NOT EXISTS InterviewPro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE InterviewPro;

-- ============================================================
-- Users Table
-- Stores registered users and admins
-- ============================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- Questions Table
-- Stores MCQ and Coding questions created by admins
-- ============================================================
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('MCQ', 'CODING') NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
    topic VARCHAR(100) NOT NULL,
    options JSON,
    correct_answer TEXT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- Attempts Table
-- Stores user practice attempts and results
-- ============================================================
CREATE TABLE attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Bookmarks Table
-- Stores user-saved / bookmarked questions
-- ============================================================
CREATE TABLE bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_question (user_id, question_id)
) ENGINE=InnoDB;

-- ============================================================
-- Streak fields on users table
-- ============================================================
ALTER TABLE users ADD COLUMN streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN longest_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN last_practice_date DATE DEFAULT NULL;

-- ============================================================
-- AI-generated flag on questions
-- ============================================================
ALTER TABLE questions ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE;

-- ============================================================
-- Subscription / Plan fields on users table
-- ============================================================
ALTER TABLE users ADD COLUMN plan ENUM('free', 'pro', 'team') DEFAULT 'free';
ALTER TABLE users ADD COLUMN plan_expires_at DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN razorpay_customer_id VARCHAR(255) DEFAULT NULL;

-- ============================================================
-- Payments Table
-- Stores Razorpay payment records for plan upgrades
-- ============================================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    razorpay_order_id VARCHAR(255) NOT NULL,
    razorpay_payment_id VARCHAR(255) DEFAULT NULL,
    razorpay_signature VARCHAR(255) DEFAULT NULL,
    plan ENUM('pro', 'team') NOT NULL,
    amount INT NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status ENUM('created', 'paid', 'failed', 'refunded') DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_order ON payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================
-- AI Usage Tracking Table
-- Limits AI question generation to 5 per user per day
-- ============================================================
CREATE TABLE ai_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    usage_date DATE NOT NULL,
    count INT NOT NULL DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_date (user_id, usage_date)
) ENGINE=InnoDB;

-- ============================================================
-- Full-text search support on questions
-- ============================================================
ALTER TABLE questions ADD FULLTEXT INDEX ft_questions_search (title, description);

-- ============================================================
-- Indexes for performance optimization
-- ============================================================
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_question ON attempts(question_id);
CREATE INDEX idx_attempts_date ON attempts(attempted_at);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_question ON bookmarks(question_id);

-- ============================================================
-- Seed: Default admin user (password: Admin@123)
-- BCrypt hash generated for "Admin@123"
-- ============================================================
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@interviewpro.com', '$2b$12$LJ3m4ys3Lk0TSwMBfWJ8fuYz0XFBNI0cGi1G5jJHKnNqFp.Oi9XGi', 'admin');

-- ============================================================
-- Seed: Sample questions
-- ============================================================
INSERT INTO questions (title, description, type, difficulty, topic, options, correct_answer, created_by) VALUES
('What is a closure in JavaScript?',
 'Select the correct definition of a JavaScript closure.',
 'MCQ', 'Medium', 'JavaScript',
 '["A function bundled with its lexical scope", "A function without parameters", "A class-based pattern", "A loop construct"]',
 'A function bundled with its lexical scope', 1),

('What does useState return in React?',
 'Choose the correct answer about the useState hook in React.',
 'MCQ', 'Easy', 'React',
 '["A state variable and a setter function", "Only a state variable", "A reducer", "A context object"]',
 'A state variable and a setter function', 1),

('What is normalization in databases?',
 'Select the best description of database normalization.',
 'MCQ', 'Medium', 'Database',
 '["Organizing data to reduce redundancy", "Adding indexes to tables", "Creating backups", "Encrypting data"]',
 'Organizing data to reduce redundancy', 1),

('What is the time complexity of binary search?',
 'Choose the correct time complexity for binary search on a sorted array.',
 'MCQ', 'Easy', 'DSA',
 '["O(log n)", "O(n)", "O(n log n)", "O(1)"]',
 'O(log n)', 1),

('Explain the difference between == and === in JavaScript.',
 'Write a detailed explanation of the difference between loose equality and strict equality in JavaScript, including type coercion behavior.',
 'CODING', 'Easy', 'JavaScript',
 NULL,
 '== performs type coercion before comparison while === checks both value and type without coercion.', 1),

('What is a Python decorator?',
 'Select the correct definition of a decorator in Python.',
 'MCQ', 'Medium', 'Python',
 '["A function that wraps another function to extend its behavior", "A class constructor", "A type hint", "A loop modifier"]',
 'A function that wraps another function to extend its behavior', 1),

('What is the virtual DOM in React?',
 'Select the correct answer about React virtual DOM.',
 'MCQ', 'Easy', 'React',
 '["A lightweight copy of the real DOM for efficient updates", "The actual browser DOM", "A database abstraction", "A CSS framework"]',
 'A lightweight copy of the real DOM for efficient updates', 1),

('Implement a function to reverse a linked list.',
 'Write a Python function that takes the head of a singly linked list and returns the head of the reversed list. Include time and space complexity analysis.',
 'CODING', 'Hard', 'DSA',
 NULL,
 'Iteratively reverse pointers: prev=None, while curr: next=curr.next, curr.next=prev, prev=curr, curr=next. Return prev. O(n) time, O(1) space.', 1),

('What is SQL injection?',
 'Select the correct description of SQL injection.',
 'MCQ', 'Medium', 'Database',
 '["A code injection technique that exploits security vulnerabilities in SQL queries", "A method to optimize SQL queries", "A database backup technique", "A type of database index"]',
 'A code injection technique that exploits security vulnerabilities in SQL queries', 1),

('What is the difference between let, const, and var?',
 'Explain the differences between let, const, and var in JavaScript regarding scope, hoisting, and reassignment.',
 'CODING', 'Easy', 'JavaScript',
 NULL,
 'var is function-scoped and hoisted; let is block-scoped, hoisted but not initialized; const is block-scoped and cannot be reassigned.', 1);
