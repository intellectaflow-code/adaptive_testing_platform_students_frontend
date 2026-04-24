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

// ─────────────────────────────────────────────
// ScoreRing — animated SVG arc
// ─────────────────────────────────────────────
function ScoreRing({ pct, color, size = 110 }) {
  const r      = (size / 2) - 10;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--border2)" strokeWidth={8}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// StatPill
// ─────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 100,
      padding: "14px 16px",
      background: "var(--surface2)",
      border: "1px solid var(--border2)",
      borderRadius: "var(--radius)",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || "var(--white)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// QuestionResultCard
// ─────────────────────────────────────────────
function QuestionResultCard({ ans, index }) {
  const [expanded, setExpanded] = useState(true);

  const scored    = ans.score_awarded ?? 0;
  const maxQ      = ans.marks ?? 0;
  const pct       = maxQ > 0 ? Math.round((scored / maxQ) * 100) : null;
  const hasAnswer = (ans.answer_text || "").trim().length > 0;

  const scoreColor =
    pct === null ? "var(--muted)"  :
    pct >= 80    ? "var(--green)"  :
    pct >= 40    ? "var(--amber)"  :
                   "var(--red)";

  const typeBg = ans.question_type === "descriptive"
    ? { bg: "rgba(96,165,250,0.08)", color: "var(--blue)" }
    : { bg: "rgba(167,139,250,0.08)", color: "#a78bfa" };

  return (
    <div style={{
      ...card({ padding: 0 }),
      overflow: "hidden",
      border: `1px solid ${scoreColor}28`,
    }}>
      {/* Card header — always visible */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 12,
          cursor: "pointer",
          background: expanded ? "var(--surface)" : "var(--surface2)",
          transition: "background .15s",
        }}
      >
        {/* Number badge */}
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: `${scoreColor}18`,
          border: `1px solid ${scoreColor}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: scoreColor,
        }}>
          {index + 1}
        </div>

        {/* Question preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, color: "var(--white)", fontWeight: 500,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {ans.question_text}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, padding: "1px 6px", borderRadius: 4,
              background: typeBg.bg, color: typeBg.color, fontWeight: 600,
            }}>
              {ans.question_type === "descriptive" ? "Long Answer" : "Short Answer"}
            </span>
            {!hasAnswer && (
              <span style={{
                fontSize: 10, padding: "1px 6px", borderRadius: 4,
                background: "rgba(240,96,96,0.08)", color: "var(--red)", fontWeight: 600,
              }}>
                Not Attempted
              </span>
            )}
          </div>
        </div>

        {/* Score badge */}
        <div style={{
          flexShrink: 0,
          padding: "5px 14px", borderRadius: 8,
          background: `${scoreColor}14`,
          border: `1px solid ${scoreColor}35`,
          textAlign: "center",
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor }}>{scored}</span>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>/{maxQ}</span>
        </div>

        {/* Chevron */}
        <div style={{
          color: "var(--muted)", transition: "transform .2s",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          flexShrink: 0,
        }}>
          <Icon n="chevron-down" s={14} />
        </div>
      </div>

      {/* Score bar */}
      {maxQ > 0 && (
        <div style={{ height: 2, background: "var(--border2)" }}>
          <div style={{
            width: `${pct}%`, height: "100%",
            background: scoreColor,
            transition: "width .8s ease",
          }} />
        </div>
      )}

      {/* Expandable body */}
      {expanded && (
        <div style={{ padding: "16px 18px 18px", background: "var(--bg)" }}>

          {/* Full question text */}
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 7,
            }}>
              Question
            </div>
            <p style={{
              fontSize: 14, color: "var(--white)",
              lineHeight: 1.75, margin: 0, fontWeight: 500,
            }}>
              {ans.question_text}
            </p>
          </div>

          {/* Student answer */}
          <div style={{ marginBottom: ans.feedback ? 14 : 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 7,
            }}>
              Your Answer
            </div>
            <div style={{
              padding: "12px 14px",
              background: "var(--surface2)",
              border: "1px solid var(--border2)",
              borderRadius: "var(--radius)",
              fontSize: 13, lineHeight: 1.75,
              color: hasAnswer ? "var(--body)" : "var(--muted)",
              fontStyle: hasAnswer ? "normal" : "italic",
            }}>
              {hasAnswer ? ans.answer_text : "No answer was provided for this question."}
            </div>
          </div>

          {/* Teacher feedback */}
          {ans.feedback && (
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--green)",
                textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 7,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Icon n="message-square" s={11} /> Teacher Feedback
              </div>
              <div style={{
                padding: "12px 14px",
                background: "rgba(74,222,128,0.04)",
                border: "1px solid rgba(74,222,128,0.18)",
                borderRadius: "var(--radius)",
                fontSize: 13, color: "var(--body)", lineHeight: 1.75,
              }}>
                {ans.feedback}
              </div>
            </div>
          )}

          {/* Marks detail */}
          {maxQ > 0 && (
            <div style={{
              marginTop: 14,
              display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
            }}>
              <div style={{
                fontSize: 12, color: "var(--muted)",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span>Marks awarded:</span>
                <span style={{ fontWeight: 700, color: scoreColor, fontSize: 13 }}>
                  {scored}/{maxQ}
                </span>
                {pct !== null && (
                  <span style={{
                    padding: "1px 7px", borderRadius: 4,
                    background: `${scoreColor}14`,
                    color: scoreColor, fontWeight: 600, fontSize: 11,
                  }}>
                    {pct}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main: AssignmentResultsPage
// ─────────────────────────────────────────────
export default function AssignmentsResultsPage({ config, setPage }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [ringPct, setRingPct] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/assignments/submissions/${config.submission_id}/results`);
        setResults(res.data);
      } catch (err) {
        console.error("Failed to load results", err);
        setError("Could not load results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [config.submission_id]);

  // BUG FIX: derive accuracy inside the effect where results is defined,
  // rather than referencing the outer-scope variable before it exists.
  // Also use a proper cleanup to avoid the setState-after-unmount warning.
  useEffect(() => {
    if (!results) return;

    const answers      = results.answers || [];
    const marksObtained = answers.reduce((acc, a) => acc + (a.score_awarded ?? 0), 0);
    const maxMarks      = answers.reduce((acc, a) => acc + (a.marks ?? 0), 0) || config.total_marks || 0;
    const accuracy      = maxMarks > 0 ? Math.round((marksObtained / maxMarks) * 100) : 0;

    const t = setTimeout(() => setRingPct(accuracy), 100);
    return () => clearTimeout(t);
  }, [results, config.total_marks]);

  if (loading) return <Loader variant="results" />;

  if (error) return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, margin: "0 auto 14px",
          background: "rgba(240,96,96,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--red)",
        }}>
          <Icon n="alert-circle" s={22} />
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>{error}</p>
        <button
          onClick={() => setPage("home")}
          style={{
            marginTop: 16, padding: "8px 20px",
            background: "var(--surface2)", border: "1px solid var(--border2)",
            borderRadius: "var(--radius)", color: "var(--body)",
            fontSize: 13, cursor: "pointer",
          }}
        >
          Go Home
        </button>
      </div>
    </div>
  );

  const { answers = [], submission = {} } = results;

  const marksObtained = answers.reduce((acc, a) => acc + (a.score_awarded ?? 0), 0);
  const maxMarks      = answers.reduce((acc, a) => acc + (a.marks ?? 0), 0) || config.total_marks || 0;
  const accuracy      = maxMarks > 0 ? Math.round((marksObtained / maxMarks) * 100) : 0;
  const attempted     = answers.filter(a => (a.answer_text || "").trim().length > 0).length;
  const scored        = answers.filter(a => (a.score_awarded ?? 0) > 0).length;

  const gradeColor =
    accuracy >= 75 ? "var(--green)" :
    accuracy >= 50 ? "var(--amber)" :
                     "var(--red)";

  const gradeLabel =
    accuracy >= 90 ? "Excellent" :
    accuracy >= 75 ? "Good"      :
    accuracy >= 50 ? "Average"   :
                     "Needs Work";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      background: "var(--bg)",
    }}>

      {/* ── Sticky Header ── */}
      <div style={{
        padding: "11px 22px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: "rgba(74,222,128,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--green)",
          }}>
            <Icon n="bar-chart-2" s={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: "var(--white)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: 320,
            }}>
              {config.title}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
              Results · Evaluated {formatDate(submission.evaluated_at)}
            </div>
          </div>
        </div>

        <button
          onClick={() => setPage("assignments")}
          style={{
            padding: "6px 15px",
            background: "var(--surface2)", border: "1px solid var(--border2)",
            borderRadius: "var(--radius)", color: "var(--body)",
            fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <Icon n="arrow-left" s={12} /> Back
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>

          {/* ── Hero Score Card ── */}
          <div style={{
            ...card({ padding: 0 }),
            marginBottom: 20,
            overflow: "hidden",
          }}>
            {/* Top gradient strip */}
            <div style={{
              height: 4,
              background: `linear-gradient(90deg, ${gradeColor}, transparent)`,
            }} />

            <div style={{ padding: "24px 28px" }}>
              <div style={{
                display: "flex", alignItems: "center",
                gap: 28, flexWrap: "wrap",
              }}>

                {/* Ring — uses ringPct (animates from 0 → accuracy) */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <ScoreRing pct={ringPct} color={gradeColor} size={110} />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: gradeColor, lineHeight: 1 }}>
                      {accuracy}%
                    </span>
                    <span style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                      accuracy
                    </span>
                  </div>
                </div>

                {/* Score + grade */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                    Marks Obtained
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 44, fontWeight: 800, color: gradeColor, lineHeight: 1 }}>
                      {marksObtained}
                    </span>
                    <span style={{ fontSize: 16, color: "var(--muted)", fontWeight: 500 }}>
                      / {maxMarks}
                    </span>
                  </div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    marginTop: 10,
                    padding: "4px 12px", borderRadius: 20,
                    background: `${gradeColor}14`,
                    border: `1px solid ${gradeColor}30`,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: gradeColor }}>
                      {gradeLabel}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{
                  width: 1, height: 80, background: "var(--border)",
                  flexShrink: 0, alignSelf: "center",
                }} />

                {/* Mini stats */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <StatPill label="Questions" value={answers.length}          color="var(--white)" />
                  <StatPill label="Attempted"  value={attempted}              color="var(--blue)"  />
                  <StatPill label="Scored"      value={scored}                color="var(--green)" />
                  <StatPill
                    label="Skipped"
                    value={answers.length - attempted}
                    color={answers.length - attempted > 0 ? "var(--red)" : "var(--muted)"}
                  />
                </div>
              </div>
            </div>

            {/* Overall feedback */}
            {submission.overall_feedback && (
              <div style={{
                margin: "0 28px 24px",
                padding: "14px 16px",
                background: "rgba(96,165,250,0.05)",
                border: "1px solid rgba(96,165,250,0.15)",
                borderRadius: "var(--radius)",
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: "var(--blue)",
                  textTransform: "uppercase", letterSpacing: ".6px",
                  marginBottom: 7,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <Icon n="message-circle" s={11} /> Teacher's Overall Feedback
                </div>
                <p style={{
                  fontSize: 13, color: "var(--body)",
                  lineHeight: 1.75, margin: 0,
                }}>
                  {submission.overall_feedback}
                </p>
              </div>
            )}
          </div>

          {/* ── Question Breakdown heading ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: ".8px",
            }}>
              Question Breakdown
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border2)" }} />
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {answers.length} question{answers.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* ── Per-question cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {answers.map((ans, i) => (
              <QuestionResultCard key={ans.id || i} ans={ans} index={i} />
            ))}
          </div>

          {/* ── Footer ── */}
          <div style={{
            marginTop: 28, padding: "16px 0",
            borderTop: "1px solid var(--border2)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
          }}>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {submission.submitted_at && (
                <span>Submitted {formatDate(submission.submitted_at)}</span>
              )}
              {submission.evaluated_at && (
                <span style={{ marginLeft: 16 }}>
                  · Evaluated {formatDate(submission.evaluated_at)}
                </span>
              )}
            </div>
            <button
              onClick={() => setPage("home")}
              style={{
                padding: "8px 20px",
                background: "var(--amber)", border: "none",
                borderRadius: "var(--radius)", color: "#0C0E14",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <Icon n="home" s={12} /> Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}