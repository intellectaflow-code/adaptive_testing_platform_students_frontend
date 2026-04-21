import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";

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
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "9px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

// ── Status badge helper ──
function StatusBadge({ status }) {
  const cfg = {
    live:     { label: "Live",     bg: "rgba(74,222,128,0.12)",  color: "var(--green)" },
    upcoming: { label: "Upcoming", bg: "rgba(240,165,0,0.12)",   color: "var(--amber)" },
    ended:    { label: "Ended",    bg: "rgba(240,96,96,0.10)",   color: "var(--red)"   },
  }[status] || { label: status, bg: "var(--surface2)", color: "var(--muted)" };

  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, fontWeight: 500, color: cfg.color, background: cfg.bg, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ── Derive live/upcoming/ended from assignment start_time / due_time ──
function getStatus(assignment) {
  const now = new Date();
  const start = assignment.start_time ? new Date(assignment.start_time) : null;
  const due   = assignment.due_time   ? new Date(assignment.due_time)   : null;

  if (start && due) {
    if (now >= start && now <= due) return "live";
    if (now < start)               return "upcoming";
    return "ended";
  }
  // No window set — treat as always live if published
  return "live";
}

function formatDate(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function AssignmentsPage({ setPage, setQuizConfig }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [starting, setStarting]       = useState(null); // assignment id being started
  const [errorModal, setErrorModal]   = useState({ show: false, message: "" });

  // ── Fetch all published assignments from the new router ──
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        // GET /assignments/available/list  →  returns published teacher_assignments
        const res = await API.get("/assignments/available/list");
        setAssignments(res.data || []);
      } catch (err) {
        console.error("Failed to load assignments", err);
        setErrorModal({ show: true, message: "Could not load assignments. Please try again." });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  // ── Start / resume a submission ──
  const startAssignment = async (assignment) => {
    try {
      setStarting(assignment.id);

      // POST /assignments/{id}/start
      // → returns { submission_id } (idempotent — resumes if already in_progress)
      const startRes = await API.post(`/assignments/${assignment.id}/start`);
      const { submission_id } = startRes.data;

      // Fetch full assignment detail to get questions
      // GET /assignments/{id}  →  { ...assignment, questions: [...] }
      const detailRes = await API.get(`/assignments/${assignment.id}`);
      const detail    = detailRes.data;

      setQuizConfig({
        type:                   "teacher_assignment",
        assignment_id:          assignment.id,
        submission_id,
        title:                  assignment.title,
        total_marks:            assignment.total_marks,
        passing_marks:          assignment.passing_marks,
        due_time:               assignment.due_time,
        allow_late_submission:  assignment.allow_late_submission,
        questions:              detail.questions || [],
        quiz_mode:              "descriptive",
        show_results_immediately: false,
      });

      setPage("quiz");
    } catch (err) {
      console.error("startAssignment failed:", err);
      const detail = err.response?.data?.detail;
      const status = err.response?.status;
      setErrorModal({
        show: true,
        message: detail || `Could not start the assignment (${status ?? "unknown error"}). Please try again.`,
      });
    } finally {
      setStarting(null);
    }
  };

  return (
    <>
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
            Written descriptive assignments assigned by your teachers
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
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Assignments from your teachers will appear here once published.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {assignments.map((assignment) => {
              const status     = getStatus(assignment);
              const isStartable = status === "live";
              const isStarting_ = starting === assignment.id;

              return (
                <div key={assignment.id} style={card({ padding: "18px 20px" })}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>

                    {/* Left: info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Icon n="book-open" s={13} style={{ color: "var(--muted)" }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--white)" }}>
                          {assignment.title}
                        </span>
                      </div>

                      {/* Description */}
                      {assignment.description && (
                        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
                          {assignment.description}
                        </p>
                      )}

                      {/* Meta row */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 11, color: "var(--muted)" }}>
                        {assignment.total_marks != null && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon n="award" s={14} /> {assignment.total_marks} marks
                          </span>
                        )}
                        {assignment.passing_marks != null && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon n="check-circle" s={11} /> Pass: {assignment.passing_marks}
                          </span>
                        )}
                        {assignment.start_time && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon n="calendar" s={11} /> Starts {formatDate(assignment.start_time)}
                          </span>
                        )}
                        {assignment.due_time && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon n="clock" s={11} /> Due {formatDate(assignment.due_time)}
                          </span>
                        )}
                        {assignment.allow_late_submission && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--amber)" }}>
                            <Icon n="clock" s={11} /> Late submissions allowed
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(96,165,250,0.08)", color: "var(--blue)", fontWeight: 600 }}>
                          Descriptive
                        </span>
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
                          onClick={() => startAssignment(assignment)}
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