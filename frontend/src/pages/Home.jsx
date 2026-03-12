/**
 * pages/Home.jsx – Public Landing Page
 *
 * Sections:
 *   1. Navbar         – sticky, glassmorphism, mobile hamburger
 *   2. Hero           – headline, sub, CTAs, stats, mock illustration
 *   3. Trust Strip    – company name badges
 *   4. Features       – 6 feature cards
 *   5. How It Works   – 3-step numbered process
 *   6. Topic Coverage – pill grid of all 16 topics
 *   7. Testimonials   – 3 quote cards
 *   8. Pricing        – 3 tier cards
 *   9. FAQ            – accordion
 *  10. CTA Banner     – final call to action (gradient bg)
 *  11. Footer         – 4-column multi-link footer
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import LogoIcon from "../components/LogoIcon";

/* ══════ Mock Interview Card Illustration ══════ */
const MockIllustration = () => (
  <div className="landing-mock-wrap">
    {/* macOS-style window header */}
    <div className="landing-mock-header">
      <div className="landing-mock-dots">
        <span />
        <span />
        <span />
      </div>
      <div className="landing-mock-title-bar">Interview Session #47</div>
    </div>

    {/* Question area */}
    <div className="landing-mock-screen">
      <div className="landing-mock-question">
        <div className="landing-mock-q-label">Question 3 of 10 · DSA</div>
        <div className="landing-mock-q-text">
          Explain the difference between BFS and DFS graph traversal algorithms.
        </div>
      </div>

      <div className="landing-mock-options">
        <div className="landing-mock-option correct">A. BFS uses a queue; DFS uses a stack ✓</div>
        <div className="landing-mock-option">B. Both use the same data structure</div>
        <div className="landing-mock-option">C. BFS uses a stack; DFS uses a queue</div>
      </div>

      {/* AI Feedback */}
      <div className="landing-mock-feedback">
        <span className="landing-mock-feedback-icon">🤖</span>
        <span>
          Correct! BFS explores level by level using a <strong style={{ color: "#4c9aff" }}>queue</strong>, while DFS
          dives deep using a <strong style={{ color: "#a78bfa" }}>stack</strong> or recursion.
        </span>
      </div>
    </div>

    {/* Bottom info bar */}
    <div className="landing-mock-bar">
      <div>
        <div className="landing-mock-bar-title">AI-Powered Interview Practice</div>
        <div className="landing-mock-bar-sub">Receive real-time feedback and personalized guidance</div>
      </div>
      <button className="landing-mock-try">▶ Try Demo</button>
    </div>
  </div>
);

/* ══════ Data ══════ */
const FEATURES = [
  {
    icon: "🤖",
    title: "AI-Powered Feedback",
    desc: "Every answer you submit is evaluated instantly by AI — just like a real interviewer would assess you.",
  },
  {
    icon: "📊",
    title: "Deep Progress Analytics",
    desc: "Interactive charts track accuracy trends, topic mastery, and daily streaks so you always know where you stand.",
  },
  {
    icon: "🎯",
    title: "Adaptive Difficulty",
    desc: "Questions auto-adjust to your skill level — challenging enough to stretch you, not so hard you're stuck.",
  },
  {
    icon: "🗂️",
    title: "16 Topic Areas",
    desc: "Hundreds of curated questions across DSA, System Design, OS, DBMS, OOP, Networking, and Behavioural rounds.",
  },
  {
    icon: "⚡",
    title: "Timed Mock Sessions",
    desc: "Simulate real interview pressure with timed sessions. Build speed and confidence under realistic conditions.",
  },
  {
    icon: "📱",
    title: "Practice Anywhere",
    desc: "Fully responsive — practice on any device, any time. Your progress is always synced so you never lose a streak.",
  },
];

const STEPS = [
  {
    num: "01",
    icon: "✍️",
    title: "Create Your Account",
    desc: "Sign up in 30 seconds — no credit card required. Choose your target role and tech stack to build a personalised practice plan.",
  },
  {
    num: "02",
    icon: "🎯",
    title: "Take a Practice Session",
    desc: "Pick a topic or let AI curate one for you. Answer MCQ and coding questions in a timed, realistic interview environment.",
  },
  {
    num: "03",
    icon: "📈",
    title: "Review & Improve",
    desc: "Get instant AI feedback after every answer. Track performance over time and systematically eliminate your weak areas.",
  },
];

const TOPICS = [
  "Data Structures",
  "Algorithms",
  "System Design",
  "Operating Systems",
  "Database Management",
  "OOP Concepts",
  "Networking",
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "SQL",
  "REST APIs",
  "Git & Version Control",
  "Cloud Basics",
  "Behavioural Questions",
];

const TESTIMONIALS = [
  {
    avatar: "AS",
    name: "Aanya Sharma",
    role: "SDE at Amazon",
    quote:
      "InterviewPro completely transformed my preparation. The AI feedback helped me find my weak spots in DSA within the first week. I got my Amazon offer 3 months later — couldn't have done it without this platform.",
  },
  {
    avatar: "RM",
    name: "Rohit Meena",
    role: "Frontend Dev at Flipkart",
    quote:
      "The adaptive questions kept me challenged without being overwhelming. I practiced daily for 6 weeks and walked into my interview with real confidence. It's the most effective tool I've tried.",
  },
  {
    avatar: "PN",
    name: "Priya Nair",
    role: "Full Stack Dev at Zomato",
    quote:
      "What sets this apart is the quality of post-answer explanations. Honestly better than any paid course I've tried. The progress charts kept me motivated through the entire prep journey.",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for getting started",
    features: [
      "20 questions / day",
      "MCQ practice mode",
      "Basic accuracy stats",
      "5 topics access",
      "Community support",
    ],
    cta: "Get Started Free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹399",
    period: "/ month",
    desc: "For serious job seekers",
    features: [
      "Unlimited questions",
      "MCQ + Coding modes",
      "Advanced analytics & charts",
      "All 16 topics",
      "Timed mock sessions",
      "Detailed AI feedback",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    href: "/register",
    highlight: true,
  },
  {
    name: "Team",
    price: "₹999",
    period: "/ month",
    desc: "For bootcamps & colleges",
    features: [
      "Everything in Pro",
      "Up to 25 team members",
      "Admin dashboard",
      "Bulk progress reports",
      "Custom topic sets",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    href: "#contact",
    highlight: false,
  },
];

const FAQS = [
  {
    q: "Is InterviewPro suitable for beginners?",
    a: "Absolutely. The platform adapts to your skill level. Beginners start with foundational questions and difficulty ramps up gradually as you improve. No prior interview experience needed.",
  },
  {
    q: "What types of questions are available?",
    a: "Two formats: MCQ (Multiple Choice) for conceptual topics like DSA, OS, and DBMS; and Coding Questions for hands-on algorithm practice. More formats are on the roadmap.",
  },
  {
    q: "How does the AI feedback work?",
    a: "After each answer, our AI analyses your response and provides a concise explanation — why the correct answer is right, common misconceptions to avoid, and related concepts to explore next.",
  },
  {
    q: "Can I track my progress over time?",
    a: "Yes! Your Dashboard shows accuracy trends over the last 7 days, topic-wise breakdown, difficulty split, and your strongest and weakest areas — all in interactive visual charts.",
  },
  {
    q: "How is this different from other prep platforms?",
    a: "InterviewPro focuses on feedback quality and analytics. Instead of just marking right/wrong, we explain why — and our analytics tell you exactly what to work on next, saving you hours of guesswork.",
  },
  {
    q: "Is there a mobile app?",
    a: "Not yet, but the web app is fully responsive and works great on mobile browsers. A native iOS and Android app is actively on our roadmap.",
  },
];

/* ══════════════════════════════════════════════════════════════ */
const Home = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [openFaq, setOpenFaq] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-page">
      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          {/* Logo */}
          <Link to="/" className="landing-logo">
            <span className="landing-logo-icon">
              <LogoIcon />
            </span>
            <span className="landing-logo-text">
              InterviewPro <span className="landing-logo-ai">AI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className={`landing-nav-links${menuOpen ? " open" : ""}`}>
            <a href="#features" className="landing-nav-link" onClick={closeMenu}>
              Features
            </a>
            <a href="#how-it-works" className="landing-nav-link" onClick={closeMenu}>
              How It Works
            </a>
            <a href="#pricing" className="landing-nav-link" onClick={closeMenu}>
              Pricing
            </a>
            <a href="#faq" className="landing-nav-link" onClick={closeMenu}>
              FAQ
            </a>
            <Link to="/login" className="landing-nav-link" onClick={closeMenu}>
              Login
            </Link>
          </div>

          {/* Actions */}
          <div className="landing-nav-actions">
            <button className="landing-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <Link to="/register" className="btn landing-get-started">
              Get Started
            </Link>
            <button className="landing-hamburger" onClick={() => setMenuOpen((p) => !p)} aria-label="Toggle menu">
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="landing-hero">
        <div className="landing-blob landing-blob-1" />
        <div className="landing-blob landing-blob-2" />

        <div className="landing-hero-inner">
          {/* Left */}
          <div className="landing-hero-left">
            <div className="landing-trusted-badge">
              <span className="landing-star">✦</span>
              Trusted by 10,000+ developers &amp; graduates
            </div>

            <h1 className="landing-heading">
              Master Your
              <br />
              <span className="landing-heading-gradient">Interview Skills</span>
              <br />
              with AI
            </h1>

            <p className="landing-sub">
              InterviewPro simulates real technical interviews using AI — adaptive questions, instant feedback, and deep
              analytics to help you land your dream role faster.
            </p>

            <div className="landing-actions">
              <Link to="/register" className="btn landing-cta-btn">
                🚀 Start Practicing Free
              </Link>
              <a href="#how-it-works" className="btn landing-outline-btn">
                See How It Works
              </a>
            </div>

            <div className="landing-stats">
              <div className="landing-stat">
                <span className="landing-stat-val">10k+</span>
                <span className="landing-stat-lbl">Active Users</span>
              </div>
              <div className="landing-stat-divider" />
              <div className="landing-stat">
                <span className="landing-stat-val">95%</span>
                <span className="landing-stat-lbl">Success Rate</span>
              </div>
              <div className="landing-stat-divider" />
              <div className="landing-stat">
                <span className="landing-stat-val">500+</span>
                <span className="landing-stat-lbl">Questions</span>
              </div>
              <div className="landing-stat-divider" />
              <div className="landing-stat">
                <span className="landing-stat-val">16</span>
                <span className="landing-stat-lbl">Topics</span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="landing-hero-right">
            <MockIllustration />
          </div>
        </div>
      </section>

      {/* ══════════════════ TRUST STRIP ══════════════════ */}
      <section className="landing-trust">
        <div className="landing-trust-inner">
          <p className="landing-trust-label">Candidates from these companies practice with us</p>
          <div className="landing-trust-logos">
            {["Google", "Amazon", "Microsoft", "Flipkart", "Zomato", "Swiggy", "Infosys", "TCS"].map((c) => (
              <span key={c} className="landing-trust-logo">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="landing-features" id="features">
        <div className="landing-section-inner">
          <div className="landing-section-tag">Everything You Need</div>
          <h2 className="landing-section-title">Built for candidates who take preparation seriously</h2>
          <p className="landing-section-sub">
            Every feature is designed to mirror the real interview experience and accelerate your growth.
          </p>
          <div className="landing-features-grid">
            {FEATURES.map(({ icon, title, desc }) => (
              <div className="landing-feature-card" key={title}>
                <div className="landing-feature-icon">{icon}</div>
                <h3 className="landing-feature-title">{title}</h3>
                <p className="landing-feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section className="landing-hiw" id="how-it-works">
        <div className="landing-section-inner">
          <div className="landing-section-tag">Simple Process</div>
          <h2 className="landing-section-title">From signup to job offer in 3 steps</h2>
          <p className="landing-section-sub">
            Get up and running in minutes — no setup, no complexity, just focused practice.
          </p>
          <div className="landing-hiw-grid">
            {STEPS.map((s, i) => (
              <div className="landing-hiw-card" key={i}>
                <div className="landing-hiw-num">{s.num}</div>
                <div className="landing-hiw-icon">{s.icon}</div>
                <h3 className="landing-hiw-title">{s.title}</h3>
                <p className="landing-hiw-desc">{s.desc}</p>
                {i < STEPS.length - 1 && <div className="landing-hiw-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TOPICS ══════════════════ */}
      <section className="landing-topics">
        <div className="landing-section-inner">
          <div className="landing-section-tag">Topic Coverage</div>
          <h2 className="landing-section-title">16 topics. Hundreds of curated questions.</h2>
          <p className="landing-section-sub">
            From core CS fundamentals to modern web development frameworks — every important interview topic covered.
          </p>
          <div className="landing-topics-grid">
            {TOPICS.map((t) => (
              <span key={t} className="landing-topic-pill">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="landing-testimonials">
        <div className="landing-section-inner">
          <div className="landing-section-tag">Success Stories</div>
          <h2 className="landing-section-title">Real people, real results</h2>
          <p className="landing-section-sub">
            Thousands of candidates have used InterviewPro to land roles at top companies. Here's what some of them say.
          </p>
          <div className="landing-testi-grid">
            {TESTIMONIALS.map((t) => (
              <div className="landing-testi-card" key={t.name}>
                <div className="landing-testi-quote">"</div>
                <p className="landing-testi-text">{t.quote}</p>
                <div className="landing-testi-author">
                  <div className="landing-testi-avatar">{t.avatar}</div>
                  <div>
                    <div className="landing-testi-name">{t.name}</div>
                    <div className="landing-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ PRICING ══════════════════ */}
      <section className="landing-pricing" id="pricing">
        <div className="landing-section-inner">
          <div className="landing-section-tag">Pricing Plans</div>
          <h2 className="landing-section-title">Invest in your career. Start free.</h2>
          <p className="landing-section-sub">
            No credit card needed to get started. Upgrade anytime as your preparation gets more serious.
          </p>
          <div className="landing-pricing-grid">
            {PRICING.map((plan) => (
              <div key={plan.name} className={`landing-price-card${plan.highlight ? " highlight" : ""}`}>
                {plan.highlight && <div className="landing-price-badge">Most Popular</div>}
                <div className="landing-price-name">{plan.name}</div>
                <div className="landing-price-row">
                  <span className="landing-price-val">{plan.price}</span>
                  <span className="landing-price-period">{plan.period}</span>
                </div>
                <p className="landing-price-desc">{plan.desc}</p>
                <ul className="landing-price-features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="landing-check">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.href} className={`landing-price-cta${plan.highlight ? " highlight" : ""}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FAQ ══════════════════ */}
      <section className="landing-faq" id="faq">
        <div className="landing-faq-inner">
          <div className="landing-section-tag">FAQ</div>
          <h2 className="landing-section-title">Frequently Asked Questions</h2>
          <p className="landing-section-sub">
            Everything you need to know about InterviewPro. Can't find your answer?{" "}
            <a href="mailto:support@interviewpro.ai" style={{ color: "#4c9aff" }}>
              Reach out to us.
            </a>
          </p>
          <div className="landing-faq-list">
            {FAQS.map((item, i) => (
              <div key={i} className={`landing-faq-item${openFaq === i ? " open" : ""}`}>
                <button className="landing-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{item.q}</span>
                  <span className="landing-faq-chevron">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <div className="landing-faq-a">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA BANNER ══════════════════ */}
      <section className="landing-cta-banner" id="contact">
        <div className="landing-cta-glow landing-cta-glow-1" />
        <div className="landing-cta-glow landing-cta-glow-2" />
        <div className="landing-cta-inner">
          <h2 className="landing-cta-title">Ready to ace your next interview?</h2>
          <p className="landing-cta-sub">
            Join 10,000+ candidates who prepared smarter with InterviewPro AI. Start for free — no credit card required.
          </p>
          <div className="landing-cta-actions">
            <button className="btn landing-cta-btn" onClick={() => navigate("/register")}>
              🚀 Get Started — It's Free
            </button>
            <Link to="/login" className="btn landing-outline-btn">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          {/* Brand */}
          <div className="landing-footer-brand">
            <Link to="/" className="landing-logo" style={{ marginBottom: "0.875rem" }}>
              <span className="landing-logo-icon">
                <LogoIcon />
              </span>
              <span className="landing-logo-text">
                InterviewPro <span className="landing-logo-ai">AI</span>
              </span>
            </Link>
            <p className="landing-footer-tagline">Prepare smarter. Interview better. Land faster.</p>
          </div>

          {/* Product */}
          <div className="landing-footer-col">
            <div className="landing-footer-col-title">Product</div>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <Link to="/register">Get Started</Link>
          </div>

          {/* Practice */}
          <div className="landing-footer-col">
            <div className="landing-footer-col-title">Practice</div>
            <Link to="/login">Dashboard</Link>
            <Link to="/login">Mock Sessions</Link>
            <Link to="/login">Topic Practice</Link>
            <Link to="/login">Progress Reports</Link>
          </div>

          {/* Support */}
          <div className="landing-footer-col">
            <div className="landing-footer-col-title">Support</div>
            <a href="#faq">FAQ</a>
            <a href="mailto:support@interviewpro.ai">Contact Us</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} InterviewPro AI. All rights reserved.</span>
          <div className="landing-footer-bottom-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
