import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";
import Loader from "../components/loader";

// ─────────────────────────────────────────────
// Utility: word count
// ─────────────────────────────────────────────
function wordCount(text = "") {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatDate(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─────────────────────────────────────────────
// ConfirmModal
// ─────────────────────────────────────────────
function ConfirmModal({ show, title, body, onCancel, onConfirm, cancelTxt, confirmTxt, danger }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
    }}>
      <div style={card({ padding: 26, maxWidth: 320, width: "90%", textAlign: "center" })}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--white)", marginBottom: 7 }}>{title}</div>
        <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 18, lineHeight: 1.6 }}>{body}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "8px",
            background: "var(--surface2)", border: "1px solid var(--border2)",
            borderRadius: "var(--radius)", color: "var(--body)",
            cursor: "pointer", fontWeight: 500, fontSize: 13,
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
// SuccessModal — shown after submission
// ─────────────────────────────────────────────
function SuccessModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.8)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
    }}>
      <div style={card({ padding: 36, maxWidth: 380, width: "90%", textAlign: "center" })}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "rgba(74,222,128,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px", color: "var(--green)",
        }}>
          <Icon n="check" s={26} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>
          Assignment Submitted!
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
          Your answers have been recorded. Results will be available once your teacher reviews and releases them.
        </p>
        <button onClick={onClose} style={{
          width: "100%", padding: "11px",
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
// DueTimer — compact countdown to due_time
// ─────────────────────────────────────────────
function DueTimer({ dueTime }) {
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    if (!dueTime) return;
    const due = new Date(dueTime);
    const tick = () => {
      const ms = due - new Date();
      setDiff(ms > 0 ? ms : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dueTime]);

  if (diff === null || !dueTime) return null;

  const totalSec = Math.floor(diff / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;

  const color = diff === 0
    ? "var(--red)"
    : diff < 5 * 60 * 1000
      ? "var(--red)"
      : diff < 30 * 60 * 1000
        ? "var(--amber)"
        : "var(--green)";

  if (diff === 0) {
    return (
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--red)" }}>
        ⏰ Due time passed
      </span>
    );
  }

  return (
    <span style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
      {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")} left
    </span>
  );
}

// ─────────────────────────────────────────────
// AnswerTextarea — per-question descriptive answer
// ─────────────────────────────────────────────
function AnswerTextarea({ value, onChange, questionType }) {
  const rows = questionType === "descriptive" ? 12 : 6;
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here…"
        rows={rows}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "var(--surface2)",
          border: `1px solid ${focused ? "var(--amber)" : "var(--border)"}`,
          borderRadius: "var(--radius)",
          color: "var(--white)",
          fontSize: 14,
          lineHeight: 1.75,
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
          fontFamily: "inherit",
          transition: "border-color .15s",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          {wordCount(value)} word{wordCount(value) !== 1 ? "s" : ""}
          {questionType === "descriptive" && " · Aim for detailed responses"}
        </span>
        {(value || "").trim().length > 0 && (
          <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>✓ Answered</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main: AssignmentQuizPage
// ─────────────────────────────────────────────
export default function AssignmentQuizPage({ config, setPage }) {

  const [qs, setQs]               = useState([]);
  const [cur, setCur]              = useState(0);
  const [textAns, setTextAns]      = useState({});   // { [idx]: "text" }
  const [loadingQs, setLoadingQs]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState(config.submission_id || null);
  const [quitModal, setQuitModal]       = useState(false);
  const [submitModal, setSubmitModal]   = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const submittedRef = useRef(false);



  useEffect(() => {
  const startSubmission = async () => {
    try {
      if (submissionId) return;

      const res = await API.post(`/assignments/${config.assignment_id}/start`);
      setSubmissionId(res.data.submission_id);
    } catch (err) {
      console.error("Failed to start submission", err);
    }
  };

  startSubmission();
}, [config.assignment_id, submissionId]);
  // ── Auto-save draft to sessionStorage ──
  useEffect(() => {
    const saved = sessionStorage.getItem(`assign_draft_${config.assignment_id}`);
    if (saved) {
      try { setTextAns(JSON.parse(saved)); } catch (_) {}
    }
  }, [config.assignment_id]);

  useEffect(() => {
    sessionStorage.setItem(
      `assign_draft_${config.assignment_id}`,
      JSON.stringify(textAns)
    );
  }, [textAns, config.assignment_id]);

  // ── Load questions ──
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingQs(true);

        let questionsData = [];

        if (config.questions && config.questions.length > 0) {
          // questions already provided via config (from AssignmentsPage)
          questionsData = config.questions.map((q, qi) => ({
            question_id:   q.question_id || q.id || qi,
            question_text: q.question_text || q.question || "",
            question_type: q.question_type || "short",
            marks:         q.marks || null,
          }));
        } else {
          // Fallback: fetch from API
          const res = await API.get(`/assignments/${config.assignment_id}`);
          questionsData = (res.data.questions || []).map((q, qi) => ({
            question_id:   q.id || qi,
            question_text: q.question_text || "",
            question_type: q.question_type || "short",
            marks:         q.marks || null,
          }));
        }

        setQs(questionsData);
      } catch (err) {
        console.error("Failed to load assignment questions", err);
      } finally {
        setLoadingQs(false);
      }
    };

    load();
  }, [config]);

  // ── Tab-switch detection ──
  const [tabs, setTabs] = useState(0);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) setTabs((t) => t + 1); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // ── Submit ──
const doSubmit = useCallback(async () => {
  if (submittedRef.current) return;

  if (!submissionId) {
    console.error("No submission_id found");
    return;
  }

  submittedRef.current = true;
  setSubmitting(true);

  try {
    // ✅ STEP 1: SAVE ALL ANSWERS (BULK - BEST WAY)
    await API.post(`/assignments/answers/bulk`, {
      answers: qs.map((q, i) => ({
        submission_id: submissionId,
        question_id: q.question_id,
        answer_text: textAns[i] || ""
      }))
    });

    // ✅ STEP 2: SUBMIT
    await API.post(
      `/assignments/submissions/${submissionId}/submit`
    );

    // ✅ Clear draft
    sessionStorage.removeItem(`assign_draft_${config.assignment_id}`);

  } catch (err) {
    console.error("Assignment submit failed:", err.response?.data || err);
  } finally {
    setSubmitting(false);
    setSuccessModal(true);
  }
}, [qs, textAns, submissionId, config.assignment_id]);

  // ─── Guard states ───
  if (submitting) return <Loader variant="results" />;
  if (loadingQs || qs.length === 0 || !submissionId) {
  return <Loader variant="test" />;
}

  const q = qs[cur];
  const answered = Object.values(textAns).filter((v) => v && v.trim().length > 0).length;
  const totalMarks = qs.reduce((acc, qx) => acc + (qx.marks || 0), 0) || config.total_marks;

  // Progress pct across all questions
  const progressPct = ((cur + 1) / qs.length) * 100;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* ── Modals ── */}
      <SuccessModal show={successModal} onClose={() => { setSuccessModal(false); setPage("home"); }} />

      <ConfirmModal
        show={quitModal}
        title="Quit assignment?"
        body="Your draft has been auto-saved. You can resume later if the assignment is still open."
        onCancel={() => setQuitModal(false)}
        onConfirm={() => { setPage("home"); }}
        cancelTxt="Keep Writing"
        confirmTxt="Quit"
        danger
      />

      <ConfirmModal
        show={submitModal}
        title="Submit assignment?"
        body={`${answered} of ${qs.length} question${qs.length !== 1 ? "s" : ""} answered. This cannot be undone.`}
        onCancel={() => setSubmitModal(false)}
        onConfirm={() => { setSubmitModal(false); doSubmit(); }}
        cancelTxt="Review"
        confirmTxt="Submit"
      />

      {/* ── Header ── */}
      <div style={{
        padding: "10px 22px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Left: title + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "rgba(96,165,250,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--blue)", flexShrink: 0,
          }}>
            <Icon n="file-text" s={15} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--white)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 280 }}>
              {config.title}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(96,165,250,0.1)", color: "var(--blue)", fontWeight: 600 }}>
                Assignment
              </span>
              {totalMarks > 0 && (
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{totalMarks} marks</span>
              )}
              {config.due_time && (
                <span style={{ fontSize: 10, color: "var(--muted)" }}>
                  Due {formatDate(config.due_time)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: due timer + progress + quit */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          {tabs > 0 && (
            <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 600 }}>
              ⚠ {tabs} tab switch{tabs > 1 ? "es" : ""}
            </span>
          )}
          <DueTimer dueTime={config.due_time} />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{answered}/{qs.length} answered</span>
          <button
            onClick={() => setQuitModal(true)}
            style={{
              padding: "5px 13px",
              background: "rgba(240,96,96,0.08)",
              border: "1px solid rgba(240,96,96,0.2)",
              borderRadius: "var(--radius)",
              color: "var(--red)", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Quit
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Main question area ── */}
        <div style={{ flex: 1, padding: "28px 38px", overflowY: "auto" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>

            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                Q {cur + 1} / {qs.length}
              </span>
              <div style={{ flex: 1, height: 3, background: "var(--border2)", borderRadius: 2 }}>
                <div style={{
                  width: `${progressPct}%`, height: "100%",
                  background: "var(--blue)", borderRadius: 2,
                  transition: "width .3s",
                }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                {Math.round(progressPct)}%
              </span>
            </div>

            {/* Question card */}
            <div style={card({ padding: 22, marginBottom: 18 })}>
              {/* Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 5,
                  background: q.question_type === "descriptive"
                    ? "rgba(96,165,250,0.1)"
                    : "rgba(167,139,250,0.1)",
                  color: q.question_type === "descriptive"
                    ? "var(--blue)"
                    : "#a78bfa",
                  fontWeight: 600,
                }}>
                  {q.question_type === "descriptive" ? "Long Answer" : "Short Answer"}
                </span>
                {q.marks && (
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 5,
                    background: "rgba(240,165,0,0.08)", color: "var(--amber)", fontWeight: 600,
                  }}>
                    {q.marks} {q.marks === 1 ? "mark" : "marks"}
                  </span>
                )}
              </div>

              <p style={{ fontSize: 15, color: "var(--white)", lineHeight: 1.75, margin: 0, fontWeight: 500 }}>
                {q.question_text}
              </p>
            </div>

            {/* Answer textarea */}
            <AnswerTextarea
              value={textAns[cur]}
              onChange={(val) => setTextAns((prev) => ({ ...prev, [cur]: val }))}
              questionType={q.question_type}
            />

            {/* Navigation */}
            <div style={{ display: "flex", gap: 9, marginTop: 4 }}>
              <button
                onClick={() => cur > 0 && setCur(cur - 1)}
                disabled={cur === 0}
                style={{
                  padding: "7px 16px",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", color: "var(--body)",
                  cursor: cur === 0 ? "default" : "pointer",
                  fontSize: 13, opacity: cur === 0 ? 0.4 : 1,
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <Icon n="chevL" s={13} /> Prev
              </button>

              {/* Auto-save indicator */}
              <span style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, color: "var(--muted)", padding: "0 8px",
              }}>
                <Icon n="save" s={11} />
                Draft auto-saved
              </span>

              <div style={{ flex: 1 }} />

              {cur < qs.length - 1 ? (
                <button
                  onClick={() => setCur(cur + 1)}
                  style={{
                    padding: "7px 18px",
                    background: "var(--amber)", border: "none",
                    borderRadius: "var(--radius)", color: "#0C0E14",
                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  Next <Icon n="chevR" s={13} />
                </button>
              ) : (
                <button
                  onClick={() => setSubmitModal(true)}
                  style={{
                    padding: "7px 18px",
                    background: "var(--green)", border: "none",
                    borderRadius: "var(--radius)", color: "#0C0E14",
                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <Icon n="check" s={13} /> Submit Assignment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Side nav panel ── */}
        <div style={{
          width: 210, background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          padding: 16, display: "flex", flexDirection: "column", gap: 14,
          overflowY: "auto",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".8px" }}>
            Questions
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {qs.map((qx, i) => {
              const isAnswered = (textAns[i] || "").trim().length > 0;
              const isCurrent  = cur === i;
              return (
                <button
                  key={i}
                  onClick={() => setCur(i)}
                  title={`Q${i + 1}${qx.marks ? ` · ${qx.marks}m` : ""}`}
                  style={{
                    width: 32, height: 32, borderRadius: 7,
                    border: "1px solid",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                    borderColor: isCurrent ? "var(--blue)"
                      : isAnswered ? "var(--green)"
                        : "var(--border2)",
                    background: isCurrent ? "rgba(96,165,250,0.12)"
                      : isAnswered ? "rgba(74,222,128,0.08)"
                        : "var(--bg)",
                    color: isCurrent ? "var(--blue)"
                      : isAnswered ? "var(--green)"
                        : "var(--muted)",
                    transition: "all .15s",
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(74,222,128,0.15)", border: "1px solid var(--green)", display: "inline-block" }} />
              Answered
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(96,165,250,0.12)", border: "1px solid var(--blue)", display: "inline-block" }} />
              Current
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--bg)", border: "1px solid var(--border2)", display: "inline-block" }} />
              Unanswered
            </span>
          </div>

          {/* Summary */}
          <div style={card({ padding: "12px 14px", marginTop: 4 })}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>
              SUMMARY
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: "var(--muted)" }}>Answered</span>
              <span style={{ color: "var(--green)", fontWeight: 600 }}>{answered}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: "var(--muted)" }}>Remaining</span>
              <span style={{ color: qs.length - answered > 0 ? "var(--amber)" : "var(--green)", fontWeight: 600 }}>
                {qs.length - answered}
              </span>
            </div>
            {totalMarks > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--muted)" }}>Total Marks</span>
                <span style={{ color: "var(--white)", fontWeight: 600 }}>{totalMarks}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setSubmitModal(true)}
            style={{
              marginTop: "auto", width: "100%", padding: "9px",
              background: answered === qs.length ? "var(--green)" : "var(--surface2)",
              border: `1px solid ${answered === qs.length ? "var(--green)" : "var(--border2)"}`,
              borderRadius: "var(--radius)",
              color: answered === qs.length ? "#0C0E14" : "var(--body)",
              cursor: "pointer", fontSize: 13, fontWeight: 700,
              transition: "all .2s",
            }}
          >
            {answered === qs.length ? "✓ Submit Assignment" : "Submit Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}