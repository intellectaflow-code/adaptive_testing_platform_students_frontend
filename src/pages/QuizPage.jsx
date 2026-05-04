import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";
import Loader from "../components/loader";

// ─────────────────────────────────────────────
// ConfirmModal
// ─────────────────────────────────────────────
function ConfirmModal({ show, title, body, onCancel, onConfirm, cancelTxt, confirmTxt, danger }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
      padding: "0 16px",
    }}>
      <div style={card({ padding: 26, maxWidth: 320, width: "100%", textAlign: "center" })}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--white)", marginBottom: 7 }}>{title}</div>
        <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 18 }}>{body}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "8px", background: "var(--surface2)",
            border: "1px solid var(--border2)", borderRadius: "var(--radius)",
            color: "var(--body)", cursor: "pointer", fontWeight: 500, fontSize: 13,
          }}>{cancelTxt}</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "8px",
            background: danger ? "var(--red)" : "var(--amber)",
            border: "none", borderRadius: "var(--radius)",
            color: danger ? "#fff" : "#0C0E14",
            cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>{confirmTxt}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SuccessModal
// ─────────────────────────────────────────────
function SuccessModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
      padding: "0 16px",
    }}>
      <div style={card({ padding: 32, maxWidth: 360, width: "100%", textAlign: "center" })}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "rgba(74,222,128,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", color: "var(--green)",
        }}>
          <Icon n="check" s={24} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>
          Response Recorded!
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.65, marginBottom: 22 }}>
          Your answers have been submitted successfully. Results will be available once your teacher releases them.
        </p>
        <button onClick={onClose} style={{
          width: "100%", padding: "10px",
          background: "var(--amber)", border: "none",
          borderRadius: "var(--radius)", color: "#0C0E14",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>
          Go to Home
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mobile Question Nav Drawer
// ─────────────────────────────────────────────
function QuestionNavDrawer({ show, onClose, qs, ans, mrk, cur, setCur }) {
  if (!show) return null;
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
          zIndex: 250,
        }}
      />
      {/* Drawer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        borderRadius: "16px 16px 0 0",
        padding: "20px 16px 32px",
        zIndex: 260,
        maxHeight: "60vh",
        overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: "var(--border2)", margin: "0 auto 16px",
        }} />
        <div style={{
          fontSize: 11, fontWeight: 600, color: "var(--muted)",
          textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 12,
        }}>
          Questions
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {qs.map((_, i) => {
            const isAnswered = ans[i] !== undefined;
            return (
              <button
                key={i}
                onClick={() => { setCur(i); onClose(); }}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: "1px solid", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  borderColor: cur === i ? "var(--amber)"
                    : isAnswered ? "var(--green)"
                      : mrk[i] ? "var(--amber)"
                        : "var(--border2)",
                  background: cur === i ? "rgba(240,165,0,0.1)"
                    : isAnswered ? "rgba(74,222,128,0.08)"
                      : mrk[i] ? "rgba(240,165,0,0.06)"
                        : "var(--bg)",
                  color: cur === i ? "var(--amber)"
                    : isAnswered ? "var(--green)"
                      : mrk[i] ? "var(--amber)"
                        : "var(--muted)",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { color: "var(--amber)", label: "Current / Marked" },
            { color: "var(--green)", label: "Answered" },
            { color: "var(--muted)", label: "Unanswered" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Main: QuizPage
// ─────────────────────────────────────────────
export default function QuizPage({ config, setPage, setResults }) {
  const [qs, setQs]           = useState([]);
  const [cur, setCur]         = useState(0);
  const [ans, setAns]         = useState({});
  const [mrk, setMrk]        = useState({});
  const [tLeft, setTLeft]     = useState((config.time || config.duration || 15) * 60);
  const [fs, setFs]           = useState(false);
  const [tabs, setTabs]       = useState(0);

  const [quitM, setQuitM]             = useState(false);
  const [subM, setSubM]               = useState(false);
  const [submitSuccessModal, setSubmitSuccessModal] = useState(false);
  const [navDrawer, setNavDrawer]     = useState(false);

  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [submitting, setSubmitting]             = useState(false);

  // Detect mobile
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const PROCTOR_URL = "http://localhost:8000";
  const [violations, setViolations] = useState([]);
  const [showCam, setShowCam]       = useState(true);

  const timer        = useRef();
  const submittedRef = useRef(false);

  // ── Load questions ──
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setLoadingQuestions(true);
        let questionsData = [];

        if (config.type === "teacher") {
          const res = await API.get(`/quizzes/${config.quiz_id}/questions`);
          questionsData = res.data.map((q) => ({
            question_id:   q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options:       q.options || [],
            marks:         q.marks,
          }));
        } else {
          questionsData = (config.questions || []).map((q, qi) => {
            const rawOptions = q.options || q.choices || [];
            return {
              question_id:   q.question_id || q.id || qi,
              question_text: q.question_text || q.question || "",
              question_type: q.question_type || "mcq_single",
              options: rawOptions.map((opt, oi) => {
                if (typeof opt === "string") return { id: oi, option_text: opt };
                return { id: opt.id ?? oi, option_text: opt.option_text || opt.text || "" };
              }),
            };
          });
        }

        setQs(questionsData);
      } catch (err) {
        console.error("Failed to load quiz", err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuizData();
  }, [config]);

  // ── Proctor polling ──
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res  = await fetch(`${PROCTOR_URL}/status`);
        const data = await res.json();
        setViolations(data.violations || []);
      } catch (_) {}
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  // ── Browser event reporting ──
  useEffect(() => {
    const reportEvent = (name) =>
      fetch(`${PROCTOR_URL}/log_browser_event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: name }),
      }).catch(() => {});

    const onVisibility = () => {
      if (document.hidden) { setTabs((t) => t + 1); reportEvent("tab_switch"); }
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) reportEvent("fullscreen_exit");
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  // ── Countdown timer ──
  useEffect(() => {
    timer.current = setInterval(() => {
      setTLeft((t) => {
        if (t <= 1) { clearInterval(timer.current); doSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, []);

  // ── Submit ──
  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    clearInterval(timer.current);

    const totalDuration = (config.time || config.duration || 15) * 60;
    const spent         = totalDuration - tLeft;

    const formattedAnswers = qs.map((q, i) => {
      const selectedIdx     = ans[i];
      let   selected_answer = null;
      if (selectedIdx !== undefined) {
        selected_answer = config.type === "ai"
          ? q.options[selectedIdx].option_text
          : String(q.options[selectedIdx].id);
      }
      return { question_id: q.question_id, selected_answer };
    });

    const payload = config.type === "ai"
      ? { attempt_id: config.attempt_id, answers: formattedAnswers, tab_switches: tabs }
      : { attempt_id: config.attempt_id, answers: formattedAnswers, tab_switches: tabs, time_spent: spent };

    try {
      const endpoint = config.type === "ai"
        ? "/ai-quiz/submit"
        : `/quizzes/${config.quiz_id}/submit`;

      const res            = await API.post(endpoint, payload);
      const submissionData = res.data;

      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});

      if (config.type === "teacher" && !config.show_results_immediately) {
        setSubmitting(false);
        setSubmitSuccessModal(true);
        return;
      }

      let finalQuestions = [];
      if (config.type === "ai") {
        const aiRes    = await API.get(`/ai-quiz/${config.attempt_id}/answers`);
        finalQuestions = aiRes.data;
      } else {
        const attemptRes = await API.get(`/attempts/${submissionData.attempt_id}/answers`);
        finalQuestions   = attemptRes.data;
      }

      const correctCount = config.type === "ai" ? submissionData.correct_answers : submissionData.score;
      const totalCount   = config.type === "ai" ? submissionData.total_questions : submissionData.total_possible || qs.length;

      setResults({
        questions:  finalQuestions,
        correct:    correctCount,
        total:      totalCount,
        score:      Math.round((correctCount / totalCount) * 100),
        timeSpent:  spent,
        tabs,
        config,
      });

      setSubmitting(false);
      setPage("results");

    } catch (err) {
      console.error("Submit failed:", err.response?.data || err);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      setResults({ questions: [], correct: 0, total: qs.length, timeSpent: 0, tabs, config });
      setSubmitting(false);
      setPage("results");
    }
  }, [ans, qs, tLeft, tabs, config, setPage, setResults]);

  // ─── Guard states ───
  if (submitting)                          return <Loader variant="results" />;
  if (loadingQuestions || qs.length === 0) return <Loader variant="test" />;

  // ── Fullscreen guard — skip on mobile (fullscreen API unreliable on phones) ──
  if (!fs && !isMobile) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 16px" }}>
      <div style={card({ padding: 34, maxWidth: 380, width: "100%", textAlign: "center" })}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "rgba(240,165,0,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px", color: "var(--amber)",
        }}>
          <Icon n="expand" s={20} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>
          Fullscreen Required
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 22, lineHeight: 1.6 }}>
          This test must be taken in fullscreen mode. Tab switches will be recorded.
        </p>
        <button
          onClick={() => { document.documentElement.requestFullscreen?.(); setFs(true); }}
          style={{
            width: "100%", padding: "10px",
            background: "var(--amber)", border: "none",
            borderRadius: "var(--radius)", color: "#0C0E14",
            fontWeight: 700, cursor: "pointer", fontSize: 13,
          }}
        >
          Enter Fullscreen & Begin
        </button>
      </div>
    </div>
  );

  // On mobile, skip fullscreen gate but still mark fs=true if not done
  if (!fs && isMobile && !submittedRef.current) {
    // Auto-set fs on mobile so the quiz renders
    setTimeout(() => setFs(true), 0);
    return <Loader variant="test" />;
  }

  const q        = qs[cur];
  const m        = Math.floor(tLeft / 60);
  const s        = tLeft % 60;
  const timerCol = tLeft < 60 ? "var(--red)" : tLeft < 180 ? "var(--amber)" : "var(--green)";
  const answered = Object.keys(ans).length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      <SuccessModal
        show={submitSuccessModal}
        onClose={() => { setSubmitSuccessModal(false); setPage("home"); }}
      />

      {/* Mobile Question Nav Drawer */}
      <QuestionNavDrawer
        show={navDrawer}
        onClose={() => setNavDrawer(false)}
        qs={qs} ans={ans} mrk={mrk} cur={cur} setCur={setCur}
      />

      {/* ── Header ── */}
      <div style={{
        padding: isMobile ? "10px 14px" : "11px 22px",
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        flexWrap: "nowrap",
        position: isMobile ? "sticky" : "relative",
        top: 0, zIndex: 100,
      }}>
        {/* Title — truncate on mobile */}
        <span style={{
          fontSize: isMobile ? 12 : 13,
          fontWeight: 600, color: "var(--white)",
          overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1, minWidth: 0,
        }}>
          {config.type === "ai" ? `${config.subject} · ${config.topic}` : config.title}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, flexShrink: 0 }}>
          {tabs > 0 && !isMobile && (
            <span style={{ fontSize: 12, color: "var(--red)", fontWeight: 600 }}>
              ⚠ {tabs} tab switch{tabs > 1 ? "es" : ""}
            </span>
          )}

          {/* Timer */}
          <span style={{
            fontSize: isMobile ? 14 : 16,
            fontWeight: 700, color: timerCol,
            fontVariantNumeric: "tabular-nums",
          }}>
            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </span>

          {/* Progress — hide label on mobile, show count */}
          <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {answered}/{qs.length}
          </span>

          {/* Nav grid button — mobile only */}
          {isMobile && (
            <button
              onClick={() => setNavDrawer(true)}
              style={{
                width: 30, height: 30,
                background: "var(--surface2)",
                border: "1px solid var(--border2)",
                borderRadius: "var(--radius)",
                color: "var(--body)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 14,
              }}
              title="Questions"
            >
              ⊞
            </button>
          )}

          <button
            onClick={() => setQuitM(true)}
            style={{
              padding: isMobile ? "5px 9px" : "5px 13px",
              background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)",
              borderRadius: "var(--radius)", color: "var(--red)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Quit
          </button>
        </div>
      </div>

      {/* Tab-switch warning — mobile inline banner */}
      {isMobile && tabs > 0 && (
        <div style={{
          background: "rgba(220,38,38,0.12)",
          borderBottom: "1px solid rgba(220,38,38,0.2)",
          padding: "6px 14px",
          fontSize: 12, color: "var(--red)", fontWeight: 600,
          textAlign: "center",
        }}>
          ⚠ {tabs} tab switch{tabs > 1 ? "es" : ""} recorded
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Question area */}
        <div style={{
          flex: 1,
          padding: isMobile ? "18px 14px 100px" : "26px 38px",
          overflowY: "auto",
        }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>

            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isMobile ? 14 : 20 }}>
              <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                Q {cur + 1} / {qs.length}
              </span>
              <div style={{ flex: 1, height: 3, background: "var(--border2)", borderRadius: 2 }}>
                <div style={{
                  width: `${((cur + 1) / qs.length) * 100}%`, height: "100%",
                  background: "var(--amber)", borderRadius: 2, transition: "width .3s",
                }} />
              </div>
            </div>

            {/* Question card */}
            <div style={card({ padding: isMobile ? 16 : 20, marginBottom: isMobile ? 12 : 16 })}>
              {q.marks && (
                <span style={{
                  display: "inline-block", marginBottom: 10,
                  fontSize: 10, padding: "2px 7px", borderRadius: 5,
                  background: "rgba(240,165,0,0.08)", color: "var(--amber)", fontWeight: 600,
                }}>
                  {q.marks} marks
                </span>
              )}
              <p style={{ fontSize: isMobile ? 14 : 15, color: "var(--white)", lineHeight: 1.7, margin: 0 }}>
                {q.question_text}
              </p>
            </div>

            {/* MCQ options */}
            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 8, marginBottom: isMobile ? 16 : 20 }}>
              {q.options.map((opt, oi) => {
                const sel = ans[cur] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setAns({ ...ans, [cur]: oi })}
                    style={{
                      display: "flex", alignItems: "center", gap: 13,
                      padding: isMobile ? "13px 14px" : "11px 15px",
                      background: sel ? "rgba(240,165,0,0.06)" : "var(--surface)",
                      border: `1px solid ${sel ? "var(--amber)" : "var(--border)"}`,
                      borderRadius: "var(--radius)", cursor: "pointer",
                      textAlign: "left", transition: "all .15s",
                      width: "100%",
                    }}
                  >
                    <span style={{
                      width: isMobile ? 30 : 26,
                      height: isMobile ? 30 : 26,
                      borderRadius: 6, flexShrink: 0,
                      background: sel ? "var(--amber)" : "var(--bg)",
                      border: `1px solid ${sel ? "var(--amber)" : "var(--border2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: sel ? "#0C0E14" : "var(--muted)",
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {sel ? <Icon n="check" s={12} /> : String.fromCharCode(65 + oi)}
                    </span>
                    <span style={{
                      fontSize: isMobile ? 14 : 14,
                      color: sel ? "var(--amber)" : "var(--body)",
                      fontWeight: sel ? 600 : 400,
                      lineHeight: 1.5,
                    }}>
                      {opt.option_text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation — desktop */}
            {!isMobile && (
              <div style={{ display: "flex", gap: 9 }}>
                <button
                  onClick={() => cur > 0 && setCur(cur - 1)}
                  disabled={cur === 0}
                  style={{
                    padding: "7px 15px", background: "var(--surface)",
                    border: "1px solid var(--border)", borderRadius: "var(--radius)",
                    color: "var(--body)", cursor: "pointer", fontSize: 13,
                    opacity: cur === 0 ? 0.5 : 1,
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <Icon n="chevL" s={13} /> Prev
                </button>
                <button
                  onClick={() => setMrk({ ...mrk, [cur]: !mrk[cur] })}
                  style={{
                    padding: "7px 15px",
                    background: mrk[cur] ? "rgba(240,165,0,0.07)" : "var(--surface)",
                    border: `1px solid ${mrk[cur] ? "var(--amber)" : "var(--border)"}`,
                    borderRadius: "var(--radius)",
                    color: mrk[cur] ? "var(--amber)" : "var(--muted)",
                    fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <Icon n="flag" s={13} /> {mrk[cur] ? "Unmark" : "Mark"}
                </button>
                <div style={{ flex: 1 }} />
                {cur < qs.length - 1 ? (
                  <button
                    onClick={() => setCur(cur + 1)}
                    style={{
                      padding: "7px 17px", background: "var(--amber)",
                      border: "none", borderRadius: "var(--radius)",
                      color: "#0C0E14", cursor: "pointer", fontSize: 13, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    Next <Icon n="chevR" s={13} />
                  </button>
                ) : (
                  <button
                    onClick={() => setSubM(true)}
                    style={{
                      padding: "7px 17px", background: "var(--green)",
                      border: "none", borderRadius: "var(--radius)",
                      color: "#0C0E14", cursor: "pointer", fontSize: 13, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <Icon n="check" s={13} /> Submit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop side nav panel */}
        {!isMobile && (
          <div style={{
            width: 206, background: "var(--surface)",
            borderLeft: "1px solid var(--border)",
            padding: 16, display: "flex", flexDirection: "column", gap: 13,
            overflowY: "auto",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".8px" }}>
              Questions
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {qs.map((_, i) => {
                const isAnswered = ans[i] !== undefined;
                return (
                  <button
                    key={i}
                    onClick={() => setCur(i)}
                    style={{
                      width: 30, height: 30, borderRadius: 6,
                      border: "1px solid", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      borderColor: cur === i ? "var(--amber)"
                        : isAnswered ? "var(--green)"
                          : mrk[i] ? "var(--amber)"
                            : "var(--border2)",
                      background: cur === i ? "rgba(240,165,0,0.1)"
                        : isAnswered ? "rgba(74,222,128,0.08)"
                          : mrk[i] ? "rgba(240,165,0,0.06)"
                            : "var(--bg)",
                      color: cur === i ? "var(--amber)"
                        : isAnswered ? "var(--green)"
                          : mrk[i] ? "var(--amber)"
                            : "var(--muted)",
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setSubM(true)}
              style={{
                marginTop: "auto", width: "100%", padding: "8px",
                background: "var(--surface2)", border: "1px solid var(--border2)",
                borderRadius: "var(--radius)", color: "var(--body)",
                cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}
            >
              Submit Test
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile bottom navigation bar ── */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "10px 14px",
          display: "flex", gap: 8, alignItems: "center",
          zIndex: 100,
          paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        }}>
          <button
            onClick={() => cur > 0 && setCur(cur - 1)}
            disabled={cur === 0}
            style={{
              flex: 1, padding: "10px 0",
              background: "var(--surface2)",
              border: "1px solid var(--border2)",
              borderRadius: "var(--radius)",
              color: "var(--body)", cursor: "pointer", fontSize: 13,
              opacity: cur === 0 ? 0.4 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}
          >
            <Icon n="chevL" s={14} /> Prev
          </button>

          <button
            onClick={() => setMrk({ ...mrk, [cur]: !mrk[cur] })}
            style={{
              padding: "10px 14px",
              background: mrk[cur] ? "rgba(240,165,0,0.07)" : "var(--surface2)",
              border: `1px solid ${mrk[cur] ? "var(--amber)" : "var(--border2)"}`,
              borderRadius: "var(--radius)",
              color: mrk[cur] ? "var(--amber)" : "var(--muted)",
              fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            <Icon n="flag" s={13} /> {mrk[cur] ? "Marked" : "Mark"}
          </button>

          {cur < qs.length - 1 ? (
            <button
              onClick={() => setCur(cur + 1)}
              style={{
                flex: 1, padding: "10px 0",
                background: "var(--amber)",
                border: "none", borderRadius: "var(--radius)",
                color: "#0C0E14", cursor: "pointer", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            >
              Next <Icon n="chevR" s={14} />
            </button>
          ) : (
            <button
              onClick={() => setSubM(true)}
              style={{
                flex: 1, padding: "10px 0",
                background: "var(--green)",
                border: "none", borderRadius: "var(--radius)",
                color: "#0C0E14", cursor: "pointer", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            >
              <Icon n="check" s={14} /> Submit
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        show={quitM}
        title="Quit test?"
        body="Your progress will be lost."
        onCancel={() => setQuitM(false)}
        onConfirm={() => { if (document.fullscreenElement) document.exitFullscreen(); setPage("home"); }}
        cancelTxt="Cancel" confirmTxt="Quit" danger
      />
      <ConfirmModal
        show={subM}
        title="Submit test?"
        body={`${answered}/${qs.length} answered${Object.keys(mrk).length ? ` · ${Object.keys(mrk).length} marked` : ""}`}
        onCancel={() => setSubM(false)}
        onConfirm={() => { setSubM(false); doSubmit(); }}
        cancelTxt="Review" confirmTxt="Submit"
      />

      {/* Proctoring webcam — smaller on mobile, hidden by default on very small screens */}
      {showCam && !isMobile && (
        <div style={{
          position: "fixed", bottom: 18, right: 18, zIndex: 200,
          border: "2px solid var(--border2)", borderRadius: "var(--radius)",
          overflow: "hidden", width: 180, boxShadow: "0 4px 18px rgba(0,0,0,.5)",
        }}>
          <img src={`${PROCTOR_URL}/video_feed`} alt="proctor-cam" style={{ width: "100%", display: "block" }} />
          <button
            onClick={() => setShowCam(false)}
            style={{
              position: "absolute", top: 4, right: 4,
              width: 20, height: 20, background: "rgba(0,0,0,.6)",
              border: "none", borderRadius: 4, color: "#fff",
              fontSize: 11, cursor: "pointer", lineHeight: 1,
            }}
          >✕</button>
        </div>
      )}

      {/* Mobile cam — compact */}
      {/* {showCam && isMobile && (
        <div style={{
          position: "fixed", bottom: 72, right: 12, zIndex: 200,
          border: "2px solid var(--border2)", borderRadius: 8,
          overflow: "hidden", width: 90, boxShadow: "0 4px 18px rgba(0,0,0,.5)",
        }}>
          <img src={`${PROCTOR_URL}/video_feed`} alt="proctor-cam" style={{ width: "100%", display: "block" }} />
          <button
            onClick={() => setShowCam(false)}
            style={{
              position: "absolute", top: 2, right: 2,
              width: 16, height: 16, background: "rgba(0,0,0,.7)",
              border: "none", borderRadius: 3, color: "#fff",
              fontSize: 9, cursor: "pointer", lineHeight: 1,
            }}
          >✕</button>
        </div>
      )} */}

      {/* Violation banner */}
      {/* {violations.length > 0 && (
        <div style={{
          position: "fixed", top: isMobile ? 56 : 52, left: "50%", transform: "translateX(-50%)",
          zIndex: 200, background: "rgba(220,38,38,0.92)", color: "#fff",
          padding: isMobile ? "6px 14px" : "7px 18px",
          borderRadius: "var(--radius)",
          fontSize: isMobile ? 11 : 12, fontWeight: 600,
          display: "flex", gap: 8, alignItems: "center",
          maxWidth: "90vw", flexWrap: "wrap",
          boxShadow: "0 4px 14px rgba(0,0,0,.4)",
        }}>
          <span>⚠</span>
          {violations.map((v, i) => (
            <span key={i}>{v}{i < violations.length - 1 ? " · " : ""}</span>
          ))}
        </div>
      )} */}
    </div>
  );
}