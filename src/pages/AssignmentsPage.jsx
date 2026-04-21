import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";

// ── Descriptive quiz types ──
const DESCRIPTIVE_TYPES = new Set(["short", "descriptive"]);

function AttemptsModal({ show, onClose, usedAttempts, maxAttempts }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px 28px 22px", maxWidth: 340, width: "90%", textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(240,96,96,0.1)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)" }}>
          <Icon n="lock" s={20} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>No Attempts Remaining</div>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
          You have used <strong style={{ color: "var(--white)" }}>{usedAttempts}</strong> of{" "}
          <strong style={{ color: "var(--white)" }}>{maxAttempts}</strong> allowed attempt{maxAttempts !== 1 ? "s" : ""} for this assignment. Contact your teacher for an additional attempt.
        </p>
        <button onClick={onClose} style={{ width: "100%", padding: "9px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>OK</button>
      </div>
    </div>
  );
}

function ErrorModal({ show, message, onClose }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px 28px 22px", maxWidth: 340, width: "90%", textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(240,96,96,0.1)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)" }}>
          <Icon n="alert-triangle" s={20} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>Something went wrong</div>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>{message}</p>
        <button onClick={onClose} style={{ width: "100%", padding: "9px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>OK</button>
      </div>
    </div>
  );
}

// ── Status badge helper ──
function StatusBadge({ status }) {
  const cfg = {
    live:     { label: "Live",     bg: "rgba(74,222,128,0.12)",  color: "var(--green)" },
    upcoming: { label: "Upcoming", bg: "rgba(240,165,0,0.12)",   color: "var(--amber)" },
    ended:    { label: "Ended",    bg: "rgba(240,96,96,0.10)",    color: "var(--red)"   },
  }[status] || { label: status, bg: "var(--surface2)", color: "var(--muted)" };

  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, fontWeight: 500, color: cfg.color, background: cfg.bg, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export default function AssignmentsPage({ setPage, setQuizConfig }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null); // quiz id being started
  const [attemptsModal, setAttemptsModal] = useState({ show: false, used: 0, max: 0 });
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });

  useEffect(() => {
    const fetchDescriptiveQuizzes = async () => {
      try {
        setLoading(true);
        // Fetch all published quizzes the student can see
        const res = await API.get("/quizzes?published_only=true");
        const allQuizzes = res.data;

        // For each quiz, peek at its questions to check if any are descriptive
        // We batch-check using Promise.allSettled to avoid failing on one bad request
        const checked = await Promise.allSettled(
          allQuizzes.map(async (quiz) => {
            try {
              const qRes = await API.get(`/quizzes/${quiz.id}/questions`);
              const questions = qRes.data || [];
              const hasDescriptive = questions.some(
                (q) => DESCRIPTIVE_TYPES.has(q.question_type)
              );
              return hasDescriptive ? { ...quiz, _questions: questions } : null;
            } catch {
              return null;
            }
          })
        );

        const descriptiveOnly = checked
          .filter((r) => r.status === "fulfilled" && r.value !== null)
          .map((r) => r.value);

        setAssignments(descriptiveOnly);
      } catch (err) {
        console.error("Failed to load assignments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDescriptiveQuizzes();
  }, []);

  const getStatus = (quiz) => {
    const now = new Date();
    const start = quiz.start_time ? new Date(quiz.start_time) : null;
    const end = quiz.end_time ? new Date(quiz.end_time) : null;
    if (start && end) {
      if (now >= start && now <= end) return "live";
      if (now < start) return "upcoming";
      return "ended";
    }
    return "upcoming";
  };

  const startAssignment = async (quiz) => {
    try {
      setStarting(quiz.id);

      // 1. Check eligibility
      const eligRes = await API.get(`/quizzes/${quiz.id}/my-attempts`);
      const { can_attempt, used_attempts, max_attempts } = eligRes.data;

      if (!can_attempt) {
        setAttemptsModal({ show: true, used: used_attempts, max: max_attempts });
        setStarting(null);
        return;
      }

      // 2. Start the attempt
      let attempt_id, duration_minutes;
      try {
        const startRes = await API.post(`/attempts/start/${quiz.id}`);
        attempt_id = startRes.data.attempt_id;
        duration_minutes = startRes.data.duration_minutes;
      } catch (startErr) {
        const status = startErr.response?.status;
        const detail = startErr.response?.data?.detail;

        if (status === 409 && detail?.includes("in-progress")) {
          const histRes = await API.get(`/attempts/my/history`, { params: { quiz_id: quiz.id } });
          const inProgress = histRes.data.find((a) => a.status === "in_progress");
          if (inProgress) {
            attempt_id = inProgress.id;
            duration_minutes = quiz.duration_minutes;
          } else {
            throw startErr;
          }
        } else {
          setErrorModal({ show: true, message: detail || `Failed to start attempt (${status}). Please try again.` });
          setStarting(null);
          return;
        }
      }

      // 3. Launch quiz in descriptive mode
      setQuizConfig({
        type: "teacher",
        quiz_id: quiz.id,
        title: quiz.title,
        duration: duration_minutes ?? quiz.duration_minutes,
        attempt_id,
        show_results_immediately: false, // descriptive always hides results
        quiz_mode: "descriptive",        // ← signal to QuizPage to use textarea
      });
      setPage("quiz");

    } catch (err) {
      console.error("startAssignment failed:", err);
      const detail = err.response?.data?.detail;
      setErrorModal({ show: true, message: detail || "Could not start the assignment. Please try again." });
    } finally {
      setStarting(null);
    }
  };

  const formatDate = (dt) => {
    if (!dt) return null;
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  return (
    <>
      <AttemptsModal
        show={attemptsModal.show}
        onClose={() => setAttemptsModal({ show: false, used: 0, max: 0 })}
        usedAttempts={attemptsModal.used}
        maxAttempts={attemptsModal.max}
      />
      <ErrorModal
        show={errorModal.show}
        message={errorModal.message}
        onClose={() => setErrorModal({ show: false, message: "" })}
      />

      <div style={{ padding: "24px 28px", maxWidth: 860, margin: "0 auto" }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(96,165,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)" }}>
              <Icon n="file-text" s={16} />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--white)", margin: 0 }}>Assignments</h1>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13, marginLeft: 42 }}>
            Written descriptive tests assigned by your teachers
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={card({ padding: 20, opacity: 0.5 })}>
                <div style={{ height: 14, width: "40%", background: "var(--border2)", borderRadius: 4, marginBottom: 10 }} />
                <div style={{ height: 10, width: "60%", background: "var(--border)", borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div style={card({ padding: 48, textAlign: "center" })}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(96,165,250,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--blue)" }}>
              <Icon n="file-text" s={22} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--white)", marginBottom: 6 }}>No assignments yet</div>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Descriptive assignments from your teachers will appear here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {assignments.map((quiz) => {
              const status = getStatus(quiz);
              const isStartable = status === "live";
              const isStarting_ = starting === quiz.id;

              return (
                <div key={quiz.id} style={card({ padding: "18px 20px" })}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    {/* Left: info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Course + teacher */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--white)" }}>{quiz.course_name}</span>
                        {quiz.course_code && (
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, fontWeight: 500, color: "var(--blue)", background: "rgba(96,165,250,0.1)" }}>
                            {quiz.course_code}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Icon n="book-open" s={13} style={{ color: "var(--muted)" }} />
                        <span style={{ fontSize: 13, color: "var(--body)" }}>{quiz.title}</span>
                      </div>

                      {/* Meta row */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 11, color: "var(--muted)" }}>
                        {quiz.duration_minutes && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon n="clock" s={11} /> {quiz.duration_minutes} min
                          </span>
                        )}
                        {quiz.question_count !== undefined && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon n="list" s={11} /> {quiz.question_count} question{quiz.question_count !== 1 ? "s" : ""}
                          </span>
                        )}
                        {quiz.teacher_name && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon n="user" s={11} /> {quiz.teacher_name}
                          </span>
                        )}
                        {quiz.start_time && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon n="calendar" s={11} /> Starts {formatDate(quiz.start_time)}
                          </span>
                        )}
                        {quiz.end_time && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon n="clock" s={11} /> Due {formatDate(quiz.end_time)}
                          </span>
                        )}
                      </div>

                      {/* Descriptive type tags */}
                      <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                        {(quiz._questions || [])
                          .filter((q) => DESCRIPTIVE_TYPES.has(q.question_type))
                          .reduce((acc, q) => {
                            if (!acc.includes(q.question_type)) acc.push(q.question_type);
                            return acc;
                          }, [])
                          .map((type) => (
                            <span key={type} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(96,165,250,0.08)", color: "var(--blue)", fontWeight: 600, textTransform: "capitalize" }}>
                              {type === "short" ? "Short Answer" : "Descriptive"}
                            </span>
                          ))}
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(240,165,0,0.08)", color: "var(--amber)", fontWeight: 600 }}>
                          Results after review
                        </span>
                      </div>
                    </div>

                    {/* Right: status + action */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
                      <StatusBadge status={status} />

                      {isStartable && (
                        <button
                          onClick={() => startAssignment(quiz)}
                          disabled={isStarting_}
                          style={{
                            padding: "8px 18px",
                            background: isStarting_ ? "var(--surface2)" : "var(--amber)",
                            border: "none",
                            borderRadius: "var(--radius)",
                            color: isStarting_ ? "var(--muted)" : "#0C0E14",
                            fontSize: 13, fontWeight: 700,
                            cursor: isStarting_ ? "default" : "pointer",
                            opacity: isStarting_ ? 0.7 : 1,
                            transition: "opacity .15s",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => { if (!isStarting_) e.currentTarget.style.opacity = ".85"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = isStarting_ ? "0.7" : "1"; }}
                        >
                          {isStarting_ ? "Starting…" : "▶ Start Assignment"}
                        </button>
                      )}

                      {status === "upcoming" && (
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>Not yet open</span>
                      )}
                      {status === "ended" && (
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>Closed</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}