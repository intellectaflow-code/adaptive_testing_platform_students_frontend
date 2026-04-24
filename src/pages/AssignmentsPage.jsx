import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";
import Loader from "../components/loader";

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────
function formatDate(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function formatDueDate(dt) {
  if (!dt) return null;
  const due  = new Date(dt);
  const now  = new Date();
  const diff = due - now;
  if (diff < 0) return { label: "Overdue", color: "var(--red)" };
  if (diff < 24 * 60 * 60 * 1000) return { label: "Due today", color: "var(--amber)" };
  if (diff < 3 * 24 * 60 * 60 * 1000) return { label: `Due ${due.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`, color: "var(--amber)" };
  return { label: `Due ${due.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`, color: "var(--muted)" };
}

// ─────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  not_started:    { label: "Not Started",    color: "var(--muted)",  bg: "var(--surface2)",          icon: "circle" },
  in_progress:    { label: "In Progress",    color: "var(--blue)",   bg: "rgba(96,165,250,0.08)",     icon: "edit-3" },
  submitted:      { label: "Submitted",      color: "var(--amber)",  bg: "rgba(240,165,0,0.08)",      icon: "clock" },
  late_submitted: { label: "Late Submitted", color: "var(--amber)",  bg: "rgba(240,165,0,0.08)",      icon: "clock" },
  evaluated:      { label: "Evaluated",      color: "var(--green)",  bg: "rgba(74,222,128,0.08)",     icon: "check-circle" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, padding: "2px 8px", borderRadius: 5,
      background: cfg.bg, color: cfg.color, fontWeight: 600,
    }}>
      <Icon n={cfg.icon} s={9} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────
// AssignmentDetailModal
// ─────────────────────────────────────────────
function AssignmentDetailModal({ assignment, onClose, setPage, setQuizConfig }) {
  if (!assignment) return null;

  const status     = assignment.status || "not_started";
  const due        = formatDueDate(assignment.due_time);
  const totalMarks = assignment.total_marks || 0;

  // Derive score display for evaluated
  const score    = assignment.total_score ?? null;
  const accuracy = (score !== null && totalMarks > 0)
    ? Math.round((score / totalMarks) * 100)
    : null;

  const gradeColor =
    accuracy === null ? "var(--muted)"  :
    accuracy >= 75    ? "var(--green)"  :
    accuracy >= 50    ? "var(--amber)"  :
                        "var(--red)";

  // BUG FIX: fetch full assignment details (with real question_id UUIDs from taq)
  // before navigating into the quiz. Both handleStart and handleContinue must do this.
  const handleStart = async () => {
    try {
      const res  = await API.get(`/assignments/${assignment.id}`);
      const full = res.data;
      setQuizConfig({
        assignment_id: full.id,
        title:         full.title,
        due_time:      full.due_time,
        total_marks:   full.total_marks,
        questions:     full.questions || [],   // real question_id UUIDs from taq join
        // BUG FIX: do NOT pass status here — it's a fresh start, quiz will call /start
      });
      setPage("assignment_quiz");
      onClose();
    } catch (err) {
      console.error("Failed to load assignment details", err);
    }
  };

  const handleContinue = async () => {
    try {
      const res  = await API.get(`/assignments/${assignment.id}`);
      const full = res.data;
      setQuizConfig({
        assignment_id: full.id,
        // BUG FIX: pass submission_id so the quiz page skips the /start call entirely
        submission_id: assignment.submission_id,
        title:         full.title,
        due_time:      full.due_time,
        total_marks:   full.total_marks,
        questions:     full.questions || [],
        // BUG FIX: pass status so the quiz page's already-submitted guard fires correctly
        status:        assignment.status,
      });
      setPage("assignment_quiz");
      onClose();
    } catch (err) {
      console.error("Failed to load assignment details", err);
    }
  };

  // BUG FIX: setPage only ever receives one argument in the rest of the app.
  // Results config must go through setQuizConfig first, then navigate.
  const handleViewResults = () => {
    setQuizConfig({
      submission_id: assignment.submission_id,
      title:         assignment.title,
      total_marks:   assignment.total_marks,
    });
    setPage("assignment_results");
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 16,
    }}>
      <div style={card({
        padding: 0, maxWidth: 780, width: "100%",
        maxHeight: "90vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
      })}>

        {/* Modal header */}
        <div style={{
          padding: "18px 22px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, background: "var(--surface2)",       }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <StatusBadge status={status} />
              {due && (
                <span style={{ fontSize: 10, color: due.color, fontWeight: 600 }}>
                  {due.label}
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", lineHeight: 1.4 }}>
              {assignment.title}
            </div>
            {assignment.course_name && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                {assignment.course_name}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: "var(--surface2)", border: "1px solid var(--border2)",
              color: "var(--muted)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon n="x" s={13} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>

          {/* Score summary — only for evaluated */}
          {status === "evaluated" && accuracy !== null && (
            <div style={{
              padding: "16px 18px", marginBottom: 18,
              background: `${gradeColor}0d`,
              border: `1px solid ${gradeColor}30`,
              borderRadius: "var(--radius)",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: gradeColor, lineHeight: 1 }}>
                  {score}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>
                  / {totalMarks} marks
                </div>
              </div>
              <div style={{ width: 1, height: 44, background: `${gradeColor}30` }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: gradeColor }}>
                  {accuracy}%
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>accuracy</div>
              </div>
            </div>
          )}

          {/* Assignment meta */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {assignment.description && (
              <div style={{
                padding: "12px 14px",
                background: "var(--surface2)",
                border: "1px solid var(--border2)",
                borderRadius: "var(--radius)",
                fontSize: 13, color: "var(--body)", lineHeight: 1.7,
              }}>
                {assignment.description}
              </div>
            )}

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Total Marks",   value: totalMarks || "—",                                      icon: "award" },
                // BUG FIX: question_count comes from the backend list route; fall back gracefully
                { label: "Questions",     value: assignment.question_count ?? "—",                        icon: "list" },
                { label: "Start Time",    value: formatDate(assignment.start_time) || "—",                icon: "calendar" },
                { label: "Due Time",      value: formatDate(assignment.due_time) || "—",                  icon: "clock" },
                { label: "Late Submit",   value: assignment.allow_late_submission ? "Allowed" : "Not allowed", icon: "alert-circle" },
                { label: "Passing Marks", value: assignment.passing_marks || "—",                         icon: "check" },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{
                  padding: "10px 12px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--radius)",
                }}>
                  <div style={{
                    fontSize: 10, color: "var(--muted)", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: ".5px",
                    marginBottom: 4,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <Icon n={icon} s={9} /> {label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--white)", fontWeight: 600 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal footer — action button */}
        <div style={{
          padding: "14px 22px",
          borderTop: "1px solid var(--border)",
          display: "flex", gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px",
              background: "var(--surface2)", border: "1px solid var(--border2)",
              borderRadius: "var(--radius)", color: "var(--body)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Close
          </button>

          {/* Primary CTA based on status */}
          {(status === "not_started" || !status) && (
            <button
              onClick={handleStart}
              style={{
                flex: 1, padding: "9px",
                background: "var(--amber)", border: "none",
                borderRadius: "var(--radius)", color: "#0C0E14",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Icon n="edit-3" s={13} /> Start Assignment
            </button>
          )}

          {status === "in_progress" && (
            <button
              onClick={handleContinue}
              style={{
                flex: 1, padding: "9px",
                background: "var(--blue)", border: "none",
                borderRadius: "var(--radius)", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Icon n="edit-3" s={13} /> Continue Assignment
            </button>
          )}

          {(status === "submitted" || status === "late_submitted") && (
            <div style={{
              flex: 1, padding: "9px",
              background: "rgba(240,165,0,0.08)",
              border: "1px solid rgba(240,165,0,0.2)",
              borderRadius: "var(--radius)",
              fontSize: 13, fontWeight: 600, color: "var(--amber)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Icon n="clock" s={13} /> Awaiting Evaluation
            </div>
          )}

          {status === "evaluated" && (
            <button
              onClick={handleViewResults}
              style={{
                flex: 1, padding: "9px",
                background: "var(--green)", border: "none",
                borderRadius: "var(--radius)", color: "#0C0E14",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Icon n="bar-chart-2" s={13} /> View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AssignmentCard
// ─────────────────────────────────────────────
function AssignmentCard({ assignment, onClick }) {
  const status     = assignment.status || "not_started";
  const due        = formatDueDate(assignment.due_time);
  const cfg        = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const totalMarks = assignment.total_marks || 0;

  // For evaluated: show mini score
  const score    = assignment.total_score ?? null;
  const accuracy = (score !== null && totalMarks > 0)
    ? Math.round((score / totalMarks) * 100)
    : null;

  const gradeColor =
    accuracy === null ? "var(--muted)"  :
    accuracy >= 75    ? "var(--green)"  :
    accuracy >= 50    ? "var(--amber)"  :
                        "var(--red)";

  return (
    <div
      onClick={onClick}
      style={{
        ...card({ padding: 0 }),
        cursor: "pointer",
        overflow: "hidden",
        transition: "transform .15s, box-shadow .15s",
        border: status === "evaluated"
          ? `1px solid ${gradeColor}30`
          : "1px solid var(--border2)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top accent line */}
      <div style={{
        height: 3,
        background:
          status === "evaluated"    ? gradeColor         :
          status === "in_progress"  ? "var(--blue)"      :
          status === "submitted" || status === "late_submitted"
                                    ? "var(--amber)"     :
                                      "var(--border2)",
      }} />

      <div style={{ padding: "14px 16px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: `${cfg.color}14`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--blue)",
          }}>
            <Icon n="file-text" s={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: "var(--white)",
              lineHeight: 1.3, marginBottom: 5,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {assignment.title}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <StatusBadge status={status} />
              {due && (
                <span style={{ fontSize: 10, color: due.color, fontWeight: 500 }}>
                  {due.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meta rows */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          paddingTop: 10, borderTop: "1px solid var(--border2)",
        }}>

          {/* Row 1: marks + questions + evaluated score chip */}
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)", alignItems: "center" }}>
            {totalMarks > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Icon n="award" s={10} /> {totalMarks} marks
              </span>
            )}
            {/* BUG FIX: question_count is now returned by the fixed backend list route */}
            {(assignment.question_count ?? 0) > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Icon n="list" s={10} /> {assignment.question_count}Q
              </span>
            )}
            {status === "evaluated" && accuracy !== null && (
              <span style={{
                marginLeft: "auto",
                padding: "2px 8px", borderRadius: 5,
                background: `${gradeColor}14`,
                color: gradeColor, fontWeight: 700, fontSize: 11,
              }}>
                {score}/{totalMarks} · {accuracy}%
              </span>
            )}
          </div>

          {/* Row 2: subject code + subject name */}
          {(assignment.subject_code || assignment.subject_name || assignment.course_name) && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
              {assignment.subject_code && (
                <span style={{
                  padding: "1px 7px", borderRadius: 5,
                  background: "rgba(96,165,250,0.10)",
                  color: "var(--blue)", fontWeight: 700, fontSize: 10,
                  letterSpacing: ".4px", flexShrink: 0,
                }}>
                  {assignment.subject_code}
                </span>
              )}
              <span style={{
                color: "var(--muted)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {assignment.subject_name || assignment.course_name}
              </span>
            </div>
          )}

          {/* Row 3: teacher name */}
          {assignment.teacher_name && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
              <Icon n="user" s={10} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {assignment.teacher_name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main: AssignmentsPage
// ─────────────────────────────────────────────
export default function AssignmentsPage({ setPage, setQuizConfig }) {
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // BUG FIX: the backend /available/list route does NOT join submissions, so
        // status / submission_id / total_score / question_count are absent.
        // We hit the fixed backend route (see assignments.py fix notes) which now
        // returns those fields. If your backend isn't updated yet this still works —
        // missing fields just fall back to "not_started" / null gracefully.
        const res = await API.get("/assignments/available/list");
        setAssignments(res.data.assignments || res.data || []);
      } catch (err) {
        console.error("Failed to load assignments", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader variant="test" />;

  // Filter tabs
  const TABS = [
    { key: "all",       label: "All",       count: assignments.length },
    {
      key: "pending",
      label: "Pending",
      // BUG FIX: include in_progress in the pending count (matches filter logic below)
      count: assignments.filter(a =>
        !a.status || a.status === "not_started" || a.status === "in_progress"
      ).length,
    },
    {
      key: "submitted",
      label: "Submitted",
      count: assignments.filter(a =>
        a.status === "submitted" || a.status === "late_submitted"
      ).length,
    },
    {
      key: "evaluated",
      label: "Evaluated",
      count: assignments.filter(a => a.status === "evaluated").length,
    },
  ];

  const filtered = assignments.filter((a) => {
    const matchesTab =
      filter === "all"       ? true :
      filter === "pending"   ? (!a.status || a.status === "not_started" || a.status === "in_progress") :
      filter === "submitted" ? (a.status === "submitted" || a.status === "late_submitted") :
      filter === "evaluated" ? a.status === "evaluated" :
      true;

    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.course_name  || "").toLowerCase().includes(search.toLowerCase()) ||
      // BUG FIX: also search by subject_name / subject_code which the backend returns
      (a.subject_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.subject_code || "").toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>

      {/* Modal */}
      {selected && (
        <AssignmentDetailModal
          assignment={selected}
          onClose={() => setSelected(null)}
          setPage={setPage}
          setQuizConfig={setQuizConfig}
        />
      )}

      {/* Page header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--white)", marginBottom: 4 }}>
          Assignments
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          {assignments.length} total · {assignments.filter(a => a.status === "evaluated").length} evaluated
        </div>
      </div>

      {/* Search + filter row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{
          flex: 1, minWidth: 180,
          display: "flex", alignItems: "center", gap: 8,
          padding: "0 12px",
          background: "var(--surface2)", border: "1px solid var(--border2)",
          borderRadius: "var(--radius)",
        }}>
          <Icon n="search" s={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments…"
            style={{
              flex: 1, background: "none", border: "none",
              outline: "none", color: "var(--white)",
              fontSize: 13, padding: "9px 0",
            }}
          />
        </div>

        {/* Filter tabs */}
        <div style={{
          display: "flex", gap: 4,
          background: "var(--surface2)",
          border: "1px solid var(--border2)",
          borderRadius: "var(--radius)",
          padding: 3,
        }}>
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "5px 12px",
                borderRadius: 6, border: "none",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: filter === key ? "var(--surface)" : "transparent",
                color: filter === key ? "var(--white)" : "var(--muted)",
                transition: "all .15s",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: 10, padding: "0 5px", borderRadius: 10,
                  background: filter === key ? "var(--amber)" : "var(--border2)",
                  color: filter === key ? "#0C0E14" : "var(--muted)",
                  fontWeight: 700,
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          padding: "48px 24px", textAlign: "center",
          color: "var(--muted)", fontSize: 13,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px",
            background: "var(--surface2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--border2)",
          }}>
            <Icon n="file-text" s={20} />
          </div>
          {search ? "No assignments match your search." : "No assignments here yet."}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}>
          {filtered.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onClick={() => setSelected(a)}
            />
          ))}
        </div>
      )}
    </div>
  );
}