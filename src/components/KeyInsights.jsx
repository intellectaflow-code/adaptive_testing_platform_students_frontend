import { useState, useEffect, useRef } from "react";
import Icon from "../components/Icon";
import API from "../api/api";

const CATEGORY_STYLES = {
  strength:    { color: "#10B981", bg: "rgba(16,185,129,0.10)",  label: "Strength"    },
  weakness:    { color: "#EF4444", bg: "rgba(239,68,68,0.10)",   label: "Weakness"    },
  trend:       { color: "#3B82F6", bg: "rgba(59,130,246,0.10)",  label: "Trend"       },
  tip:         { color: "#F59E0B", bg: "rgba(245,158,11,0.10)",  label: "Tip"         },
  achievement: { color: "#8B5CF6", bg: "rgba(139,92,246,0.10)",  label: "Achievement" },
};

async function fetchInsights({ computedStats, subjects, attempts }) {
  const payload = {
    stats: {
      tests_taken:     computedStats.tests_taken,
      avg_score:       parseFloat(computedStats.avg_score) || 0,
      best_score:      computedStats.best_score || 0,
      streak:          computedStats.streak || 0,
      tests_this_week: computedStats.tests_this_week || 0,
    },
    subjects: subjects.map((s) => ({ name: s.name, score: s.score, tests: s.tests })),
    attempts: attempts.slice(0, 10).map((a) => ({
      title:        a.title,
      subject:      a.subject,
      score:        a.score,
      attempt_date: a.attempt_date ? new Date(a.attempt_date).toLocaleDateString() : null,
    })),
  };

  const res = await API.post("/analytics/student/insights", payload);
  return res.data;
}

function shimmerStyle(style) {
  return {
    background:
      "linear-gradient(90deg, var(--border2,#2a2d3a) 25%, rgba(255,255,255,0.04) 50%, var(--border2,#2a2d3a) 75%)",
    backgroundSize: "200% 100%",
    animation: "kshimmer 1.4s infinite",
    ...style,
  };
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--bg, #111318)",
        border: "1px solid var(--border2, #2a2d3a)",
        borderRadius: "var(--radius, 10px)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={shimmerStyle({ width: 64, height: 18, borderRadius: 20 })} />
        <div style={shimmerStyle({ width: 44, height: 14, borderRadius: 4, marginLeft: "auto" })} />
      </div>
      <div style={shimmerStyle({ width: "85%", height: 12, borderRadius: 4 })} />
      <div style={shimmerStyle({ width: "65%", height: 12, borderRadius: 4 })} />
    </div>
  );
}

function InsightCard({ item, index }) {
  const cat = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.tip;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      style={{
        background: "var(--bg, #111318)",
        border: "1px solid var(--border2, #2a2d3a)",
        borderRadius: "var(--radius, 10px)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 9px",
            borderRadius: 20,
            background: cat.bg,
            color: cat.color,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {cat.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: cat.color, flexShrink: 0 }}>
          {item.metric}
        </span>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--white, #f1f5f9)", lineHeight: 1.3 }}>
        {item.title}
      </div>

      <div style={{ fontSize: 11, color: "var(--muted, #94a3b8)", lineHeight: 1.55 }}>
        {item.insight}
      </div>
    </div>
  );
}

export default function KeyInsights({ computedStats, subjects, attempts }) {
  const [insights, setInsights] = useState([]);
  const [status, setStatus]     = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fetched = useRef(false);

  const load = async () => {
    if (status === "loading") return;
    setStatus("loading");
    setInsights([]);
    setErrorMsg("");

    try {
      const result = await fetchInsights({ computedStats, subjects, attempts });
      if (!Array.isArray(result) || result.length === 0)
        throw new Error("No insights returned");
      setInsights(result.slice(0, 5));
      setStatus("done");
    } catch (err) {
      console.error("KeyInsights:", err);
      setErrorMsg(err?.response?.data?.detail || err.message || "Failed to load insights");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (fetched.current) return;
    if (computedStats.tests_taken > 0 || attempts.length > 0) {
      fetched.current = true;
      load();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedStats.tests_taken, attempts.length]);

  return (
    <>
      <style>{`
        @keyframes kshimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes kspin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          background: "var(--surface, #1a1d27)",
          border: "1px solid var(--border2, #2a2d3a)",
          borderRadius: "var(--radius, 12px)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ color: "var(--amber, #f59e0b)", display: "flex" }}>
              <Icon n="bolt" s={14} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white, #f1f5f9)" }}>
              Key Insights
            </span>
          </div>

          {(status === "done" || status === "error") && (
            <button
              onClick={load}
              title="Refresh insights"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px",
                background: "none",
                border: "1px solid var(--border2, #2a2d3a)",
                borderRadius: "var(--radius, 8px)",
                color: "var(--white, #f1f5f9)",
                cursor: "pointer", fontSize: 11, fontWeight: 500,
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--amber,#f59e0b)";
                e.currentTarget.style.color = "var(--amber,#f59e0b)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border2,#2a2d3a)";
                e.currentTarget.style.color = "var(--white,#f1f5f9)";
              }}
            >
              <Icon n="refresh" s={11} /> Refresh
            </button>
          )}
        </div>

        {status === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 2, color: "var(--muted,#94a3b8)", fontSize: 11 }}>
              <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid var(--amber,#f59e0b)", borderTopColor: "transparent", borderRadius: "50%", animation: "kspin 0.7s linear infinite" }} />
              Analyzing your performance…
            </div>
          </div>
        )}

        {status === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, flex: 1, padding: "20px 0" }}>
            <div style={{ fontSize: 22 }}>⚠️</div>
            <div style={{ fontSize: 11, color: "var(--muted,#94a3b8)", textAlign: "center", maxWidth: 190 }}>
              {errorMsg}
            </div>
          </div>
        )}

        {status === "idle" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, padding: "20px 0" }}>
            <div style={{ fontSize: 11, color: "var(--muted,#94a3b8)", textAlign: "center" }}>
              Complete a test to unlock AI insights.
            </div>
            <button
              onClick={load}
              style={{ padding: "6px 14px", background: "rgba(245,158,11,0.1)", border: "1px solid var(--amber,#f59e0b)", borderRadius: "var(--radius,8px)", color: "var(--amber,#f59e0b)", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
            >
              Generate Anyway
            </button>
          </div>
        )}

        {status === "done" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insights.map((item, i) => (
              <InsightCard key={i} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── ResultInsight ─────────────────────────────────────────────────────────────
// Short AI insight shown inside the score card on the Results page.
// Usage: <ResultInsight correct={correct} total={total} timeSpent={timeSpent} config={config} questions={questions} />

async function fetchResultInsight({ correct, total, timeSpent, config, questions }) {
  const accuracy  = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrong     = total - correct;
  const notDone   = questions.filter((q) => q.selected_answer === null || q.selected_answer === undefined).length;

  const weakAreas = questions
    .filter((q) => !q.is_correct && q.selected_answer !== null && q.selected_answer !== undefined)
    .slice(0, 3)
    .map((q) => q.question_text?.slice(0, 60))
    .filter(Boolean);

  const payload = {
    stats: {
      tests_taken:     1,
      avg_score:       accuracy,
      best_score:      accuracy,
      streak:          0,
      tests_this_week: 1,
    },
    subjects: [
      {
        name:  config.subject || config.title || "General",
        score: accuracy,
        tests: 1,
      },
    ],
    attempts: [
      {
        title:        config.title || `${config.subject || ""} · ${config.topic || ""}`.trim() || "Test",
        subject:      config.subject || "General",
        score:        accuracy,
        attempt_date: new Date().toLocaleDateString(),
        extra: {
          correct, wrong, total,
          not_attempted: notDone,
          time_seconds:  timeSpent,
          weak_areas:    weakAreas,
          topic:         config.topic || null,
        },
      },
    ],
  };

  const res = await API.post("/analytics/student/insights", payload);
  // Return only first insight — used as a short summary
  return Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
}

export function ResultInsight({ correct, total, timeSpent, config, questions }) {
  const [insight, setInsight] = useState(null);
  const [status,  setStatus]  = useState("loading");
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current || !total) return;
    fetched.current = true;

    fetchResultInsight({ correct, total, timeSpent, config, questions })
      .then((data) => {
        setInsight(data);
        setStatus("done");
      })
      .catch((err) => {
        console.error("ResultInsight:", err);
        setStatus("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // ── Loading state: subtle shimmer bar ──
  if (status === "loading") {
    return (
      <>
        <style>{`
          @keyframes kshimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        `}</style>
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            marginBottom: 7,
          }}>
            <span style={{
              display: "inline-block", width: 10, height: 10,
              border: "1.5px solid var(--amber,#f59e0b)", borderTopColor: "transparent",
              borderRadius: "50%", animation: "kspin 0.7s linear infinite", flexShrink: 0,
            }} />
            <span style={{ fontSize: 10, color: "var(--muted,#94a3b8)" }}>Generating insight…</span>
          </div>
          <div style={{
            background: "linear-gradient(90deg, var(--border2,#2a2d3a) 25%, rgba(255,255,255,0.04) 50%, var(--border2,#2a2d3a) 75%)",
            backgroundSize: "200% 100%",
            animation: "kshimmer 1.4s infinite",
            height: 10, borderRadius: 4, width: "80%",
          }} />
          <div style={{
            background: "linear-gradient(90deg, var(--border2,#2a2d3a) 25%, rgba(255,255,255,0.04) 50%, var(--border2,#2a2d3a) 75%)",
            backgroundSize: "200% 100%",
            animation: "kshimmer 1.4s infinite",
            height: 10, borderRadius: 4, width: "55%", marginTop: 6,
          }} />
        </div>
      </>
    );
  }

  // ── Error / no data: silent — don't clutter the score card ──
  if (status === "error" || !insight) return null;

  const cat = CATEGORY_STYLES[insight.category] || CATEGORY_STYLES.tip;

  return (
    <div style={{
      marginTop: 12,
      borderTop: "1px solid rgba(255,255,255,0.06)",
      paddingTop: 12,
      display: "flex",
      flexDirection: "column",
      gap: 5,
    }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ color: "var(--amber,#f59e0b)", display: "flex" }}>
          <Icon n="bolt" s={11} />
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center",
          padding: "1px 7px", borderRadius: 20,
          background: cat.bg, color: cat.color,
          fontSize: 9, fontWeight: 700,
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          {cat.label}
        </span>
        {insight.metric && (
          <span style={{ fontSize: 11, fontWeight: 800, color: cat.color, marginLeft: "auto" }}>
            {insight.metric}
          </span>
        )}
      </div>

      {/* Title */}
      {insight.title && (
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--white,#f1f5f9)", lineHeight: 1.35 }}>
          {insight.title}
        </div>
      )}

      {/* Insight text */}
      <div style={{ fontSize: 11, color: "var(--muted,#94a3b8)", lineHeight: 1.55 }}>
        {insight.insight}
      </div>
    </div>
  );
}