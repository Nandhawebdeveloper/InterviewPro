/**
 * components/QuestionCard.jsx – Question Display Card
 *
 * Renders MCQ or Coding questions.
 * Uses .option-letter circles + full-width option rows.
 * Shows result banner with correct / incorrect feedback.
 */

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const QuestionCard = ({ question, selectedAnswer, onSelectAnswer, submitted, result, showAnswer }) => {
  const isMCQ = question.type === "MCQ";

  const getOptionClass = (option) => {
    let cls = "option-item";
    if (submitted && result) {
      if (option === result.correct_answer) cls += " correct";
      else if (option === selectedAnswer && !result.is_correct) cls += " incorrect";
    } else if (showAnswer && option === question.correct_answer) {
      cls += " correct";
    } else if (option === selectedAnswer) {
      cls += " selected";
    }
    return cls;
  };

  return (
    <div className="card">
      {/* ── Badges ── */}
      <div className="question-meta">
        <span className={`badge badge-${question.type.toLowerCase()}`}>{question.type}</span>
        <span className={`badge badge-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
        <span
          className="badge"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
          }}
        >
          {question.topic}
        </span>
      </div>

      {/* ── Title ── */}
      <h2
        style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.625rem",
          lineHeight: 1.5,
        }}
      >
        {question.title}
      </h2>

      {/* ── Description ── */}
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
          lineHeight: 1.75,
          marginBottom: "1.5rem",
        }}
      >
        {question.description}
      </p>

      {/* ── MCQ Options ── */}
      {isMCQ && question.options && (
        <ul className="option-list">
          {question.options.map((option, idx) => {
            const display = option.length > 120 ? option.slice(0, 120) + "…" : option;
            return (
              <li
                key={idx}
                className={getOptionClass(option)}
                onClick={() => !submitted && onSelectAnswer(option)}
                style={{ cursor: submitted ? "default" : "pointer" }}
                title={option.length > 120 ? option : undefined}
              >
                <span className="option-letter">{LETTERS[idx]}</span>
                {display}
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Coding Textarea ── */}
      {!isMCQ && (
        <div className="form-group">
          <label>Your Answer</label>
          <textarea
            className="form-control"
            rows={5}
            placeholder="Type your answer or explanation here…"
            value={selectedAnswer}
            onChange={(e) => !submitted && onSelectAnswer(e.target.value)}
            disabled={submitted}
            style={{ fontFamily: "Consolas, 'Fira Code', monospace", fontSize: "0.875rem" }}
          />
        </div>
      )}

      {/* ── Result Banner ── */}
      {submitted && result && (
        <div className={`result-banner ${result.is_correct ? "correct" : "incorrect"}`}>
          {result.is_correct ? (
            <>✅ Correct! Well done.</>
          ) : (
            <>
              ❌ Incorrect.{" "}
              <span title={result.correct_answer.length > 100 ? result.correct_answer : undefined}>
                Correct answer:{" "}
                <strong>
                  {result.correct_answer.length > 100
                    ? result.correct_answer.slice(0, 100) + "…"
                    : result.correct_answer}
                </strong>
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Previously Solved Answer ── */}
      {showAnswer && !submitted && (
        <div className="result-banner correct" style={{ opacity: 0.85 }}>
          ✅ Previously solved — Correct answer:{" "}
          <strong title={question.correct_answer.length > 100 ? question.correct_answer : undefined}>
            {question.correct_answer.length > 100
              ? question.correct_answer.slice(0, 100) + "…"
              : question.correct_answer}
          </strong>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
