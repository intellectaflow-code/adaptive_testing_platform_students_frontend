import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import Select from "../components/Select";
import { card, scoreColor, pill } from "../utils/styles";
import API from "../api/api";
import Loader from "../components/loader";

const SUBJECTS = ["Computer Science", "Data Science", "Mathematics", "Physics", "Chemistry", "Electronics", "Others"];
const DESCRIPTIVE_TYPES = new Set(["short", "descriptive"]);

function AttemptsModal({ show, onClose, usedAttempts, maxAttempts }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.65)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "28px 28px 22px",
        maxWidth: 340, width: "90%", textAlign: "center"
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "rgba(240,96,96,0.1)", margin: "0 auto 14px",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--red)"
        }}>
          <Icon n="lock" s={20} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>
          No Attempts Remaining
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
          You have used{" "}
          <strong style={{ color: "var(--white)" }}>{usedAttempts}</strong> of{" "}
          <strong style={{ color: "var(--white)" }}>{maxAttempts}</strong>{" "}
          allowed attempt{maxAttempts !== 1 ? "s" : ""} for this quiz.
          Contact your teacher if you need an additional attempt.
        </p>
        <button onClick={onClose} style={{ width: "100%", padding: "9px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          OK
        </button>
      </div>
    </div>
  );
}

function ErrorModal({ show, message, onClose }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.65)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "28px 28px 22px",
        maxWidth: 340, width: "90%", textAlign: "center"
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "rgba(240,96,96,0.1)", margin: "0 auto 14px",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--red)"
        }}>
          <Icon n="alert-triangle" s={20} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>
          Something went wrong
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
          {message}
        </p>
        <button onClick={onClose} style={{ width: "100%", padding: "9px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          OK
        </button>
      </div>
    </div>
  );
}

export default function HomePage({ setPage, setQuizConfig }) {
  const [aiForm, setAiForm] = useState({ subject: "", topic: "", questions: 10, time: 15, difficulty: "medium" });
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [teacherTests, setTeacherTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [attemptsModal, setAttemptsModal] = useState({ show: false, used: 0, max: 0 });
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/profiles/me");
        setUser(res.data);
      } catch (err) {
        console.error("User fetch failed", err);
      }
    };

    const fetchQuizzes = async () => {
      try {
        const res = await API.get("/quizzes?published_only=true");
        const allQuizzes = res.data;

        // ── Filter out descriptive/short-answer quizzes ──
        // Those belong in the Assignments page, not here.
        const checked = await Promise.allSettled(
          allQuizzes.map(async (quiz) => {
            try {
              const qRes = await API.get(`/quizzes/${quiz.id}/questions`);
              const questions = qRes.data || [];
              const isDescriptive = questions.some((q) => DESCRIPTIVE_TYPES.has(q.question_type));
              return isDescriptive ? null : quiz; // null = exclude
            } catch {
              return quiz; // if check fails, keep it to be safe
            }
          })
        );

        const mcqOnly = checked
          .filter((r) => r.status === "fulfilled" && r.value !== null)
          .map((r) => r.value);

        setTeacherTests(mcqOnly);
      } catch (err) {
        console.error("Quiz fetch failed", err);
      } finally {
        setTestsLoading(false);
      }
    };

    fetchUser();
    fetchQuizzes();
  }, []);

  const startAI = async () => {
    const e = {};
    if (!aiForm.subject) e.subject = "Required";
    if (!aiForm.topic.trim()) e.topic = "Required";
    if (Object.keys(e).length) { setErrs(e); return; }

    try {
      setLoading(true);
      const res = await API.post("/ai-quiz/start", {
        topic: aiForm.topic,
        difficulty: aiForm.difficulty,
        total_questions: aiForm.questions
      });
      const { attempt_id, questions } = res.data;
      setQuizConfig({
        type: "ai",
        attempt_id,
        title: aiForm.topic,
        subject: aiForm.subject,
        duration: aiForm.time,
        questions,
      });
      setPage("quiz");
    } catch (err) {
      console.error("AI Quiz error:", err);
      setErrorModal({ show: true, message: "Failed to generate AI quiz. Please try again." });
      setLoading(false);
    }
  };

  const startTeacher = async (t) => {
    try {
      const res = await API.get(`/quizzes/${t.id}/my-attempts`);
      const { can_attempt, used_attempts, max_attempts } = res.data;

      if (!can_attempt) {
        setAttemptsModal({ show: true, used: used_attempts, max: max_attempts });
        return;
      }

      let attempt_id, duration_minutes;
      try {
        const startRes = await API.post(`/attempts/start/${t.id}`);
        attempt_id = startRes.data.attempt_id;
        duration_minutes = startRes.data.duration_minutes;
      } catch (startErr) {
        const status = startErr.response?.status;
        const detail = startErr.response?.data?.detail;
        if (status === 409 && detail?.includes("in-progress")) {
          const histRes = await API.get(`/attempts/my/history`, { params: { quiz_id: t.id } });
          const inProgress = histRes.data.find(a => a.status === "in_progress");
          if (inProgress) {
            attempt_id = inProgress.id;
            duration_minutes = t.duration_minutes;
          } else {
            throw startErr;
          }
        } else {
          setErrorModal({ show: true, message: detail || `Failed to start attempt (${status}). Please try again.` });
          return;
        }
      }

      setQuizConfig({
        type: "teacher",
        quiz_id: t.id,
        title: t.title,
        duration: duration_minutes ?? t.duration_minutes,
        attempt_id,
        show_results_immediately: t.show_results_immediately,
      });
      setPage("quiz");

    } catch (err) {
      console.error("startTeacher failed:", err);
      const detail = err.response?.data?.detail;
      setErrorModal({ show: true, message: detail || "Could not start the quiz. Please try again." });
    }
  };

  return (
    <>
      {loading && <Loader variant="test" />}

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

      <div style={{ padding: "24px 28px", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Tests</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Take an AI-generated test or join a live teacher test</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

          {/* AI Test Card */}
          <div style={card({ padding: 22 })}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(240,165,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--amber)", flexShrink: 0 }}>
                <Icon n="brain" s={15} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--white)" }}>Smart Test</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>Personalised question set</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>Subject</label>
                <Select value={aiForm.subject} onChange={(v) => { setAiForm({ ...aiForm, subject: v }); setErrs({}); }} options={SUBJECTS} placeholder="Select subject" />
                {errs.subject && <span style={{ fontSize: 11, color: "var(--red)", marginTop: 3, display: "block" }}>{errs.subject}</span>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>Topic</label>
                <input
                  value={aiForm.topic}
                  onChange={(e) => { setAiForm({ ...aiForm, topic: e.target.value }); setErrs({}); }}
                  placeholder="e.g. Binary Search Trees"
                  style={{ width: "100%", padding: "9px 12px", background: "var(--bg)", border: `1px solid ${errs.topic ? "var(--red)" : "var(--border2)"}`, borderRadius: "var(--radius)", color: "var(--white)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                {errs.topic && <span style={{ fontSize: 11, color: "var(--red)", marginTop: 3, display: "block" }}>{errs.topic}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>Questions</label>
                  <Select value={String(aiForm.questions)} onChange={(v) => setAiForm({ ...aiForm, questions: +v })} options={[5, 10, 15, 20, 25, 30].map((n) => ({ value: String(n), label: `${n} ` }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>Time Limit</label>
                  <Select value={String(aiForm.time)} onChange={(v) => setAiForm({ ...aiForm, time: +v })} options={[5, 10, 15, 20, 30, 45, 60].map((n) => ({ value: String(n), label: `${n} min` }))} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 7 }}>Difficulty</label>
                <div style={{ display: "flex", gap: 7 }}>
                  {[["easy", "var(--green)"], ["medium", "var(--amber)"], ["hard", "var(--red)"]].map(([d, c]) => (
                    <button key={d} onClick={() => setAiForm({ ...aiForm, difficulty: d })}
                      style={{ flex: 1, padding: "7px 0", borderRadius: "var(--radius)", cursor: "pointer", border: `1px solid ${aiForm.difficulty === d ? c : "var(--border2)"}`, background: aiForm.difficulty === d ? `rgba(${d === "easy" ? "74,222,128" : d === "medium" ? "240,165,0" : "240,96,96"},0.08)` : "var(--bg)", color: aiForm.difficulty === d ? c : "var(--muted)", fontSize: 12, fontWeight: aiForm.difficulty === d ? 600 : 400, textTransform: "capitalize", transition: "all .15s" }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={startAI}
                style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 2 }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                Start Test
              </button>
            </div>
          </div>

          {/* Teacher Tests — MCQ only */}
          <div style={card({ padding: 22, height: 420, display: "flex", flexDirection: "column" })}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(96,165,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", flexShrink: 0 }}>
                <Icon n="book" s={15} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--white)" }}>Scheduled Tests</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>Live & upcoming scheduled tests</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 9, paddingRight: 4 }}>
              {testsLoading ? (
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Loading tests...</div>
              ) : teacherTests.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 8, opacity: 0.6 }}>
                  <Icon n="book" s={22} />
                  <span style={{ color: "var(--muted)", fontSize: 12, textAlign: "center" }}>
                    No MCQ tests available.<br />Descriptive assignments are in the Assignments page.
                  </span>
                </div>
              ) : (
                teacherTests.map((t) => {
                  const now = new Date();
                  const start = t.start_time ? new Date(t.start_time) : null;
                  const end = t.end_time ? new Date(t.end_time) : null;
                  const status =
                    start && end
                      ? now >= start && now <= end ? "live"
                        : now < start ? "upcoming" : "ended"
                      : "upcoming";

                  return (
                    <div key={t.id} style={{ background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", padding: "13px 15px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>
                            {t.course_name}
                            {t.teacher_name && (
                              <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)", marginLeft: 8 }}>{t.teacher_name}</span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5, marginLeft: 1 }}>
                              <Icon n="book-open" s={15} /> {t.title}
                            </span>
                            <span style={{ padding: "2px 7px", fontSize: 10, borderRadius: 999, fontWeight: 500, color: "var(--blue)", background: "rgba(96,165,250,0.1)" }}>
                              {t.course_code}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, fontWeight: 500, color: status === "live" ? "var(--green)" : "var(--amber)", background: status === "live" ? "rgba(74,222,128,0.12)" : "rgba(240,165,0,0.12)", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: status === "live" ? "var(--green)" : "var(--amber)" }} />
                          {status === "live" ? "Live" : "Upcoming"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
                        <span><Icon n="clock" s={10} /> {t.duration_minutes} min</span>
                        <span><Icon n="book" s={10} /> {t.question_count} Qs</span>
                      </div>
                      {status === "live" && (
                        <button
                          onClick={() => startTeacher(t)}
                          style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 2 }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                          ▶ Start Test
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}