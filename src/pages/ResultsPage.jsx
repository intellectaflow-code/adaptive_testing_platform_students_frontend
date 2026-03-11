import Icon from "../components/Icon";
import { card, scoreColor } from "../utils/styles";
import API from "../api/api";

export default function ResultsPage({ results, setPage, fromDashboard }) {
  const { questions, correct, total, score, timeSpent, tabs, config } = results;
  const mins = Math.floor(timeSpent / 60), secs = timeSpent % 60;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 800, margin: "0 auto" }}>
      {fromDashboard && (
        <button onClick={() => setPage("dashboard")} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, marginBottom: 16 }}>
          <Icon n="chevL" s={13} /> Back to Dashboard
        </button>
      )}

      {/* Score summary */}
      <div style={card({ padding: "24px 28px", marginBottom: 16 })}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center", minWidth: 82 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor(score), lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Score</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{config?.type === "ai" ? `${config.subject} · ${config.topic}` : config?.title || "Test"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--white)", marginBottom: 12 }}>{score >= 80 ? "Well done!" : score >= 60 ? "Good effort" : "Keep practising"}</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[["Correct", `${correct}/${total}`, "var(--green)"], ["Wrong", `${total - correct}/${total}`, "var(--red)"], ["Time", `${mins}m ${secs}s`, "var(--blue)"], ["Accuracy", `${score}%`, "var(--amber)"]].map(([l, v, c]) => (
                <div key={l}><div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>{l}</div></div>
              ))}
              {tabs > 0 && <div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)" }}>{tabs}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>Tab switches</div></div>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <button onClick={() => setPage("home")} style={{ padding: "8px 18px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>New Test</button>
            <button onClick={() => setPage("dashboard")} style={{ padding: "8px 18px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>Dashboard</button>
          </div>
        </div>
      </div>

      {/* Question review */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 11 }}>Question Review</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {questions.map((q, qi) => {
        const ua = q.selected_answer;
        const isC = q.is_correct;
        const na = ua === null || ua === undefined;
        return (
          <div
            key={qi}
            style={{
              ...card({ padding: 16 }),
              borderLeft: `3px solid ${
                isC ? "var(--green)" : na ? "var(--border2)" : "var(--red)"
              }`
            }}
          >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 11 }}>
                <span style={{ width: 21, height: 21, borderRadius: 5, flexShrink: 0, background: isC ? "rgba(74,222,128,0.1)" : na ? "var(--bg)" : "rgba(240,96,96,0.1)", border: `1px solid ${isC ? "var(--green)" : na ? "var(--border2)" : "var(--red)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: isC ? "var(--green)" : na ? "var(--muted)" : "var(--red)", fontSize: 11, fontWeight: 700 }}>
                  {isC ? <Icon n="check" s={11} /> : na ? "–" : <Icon n="x" s={11} />}
                </span>
                <p style={{ fontSize: 14, color: "var(--white)", margin: 0, lineHeight: 1.6 }}>
                  <span style={{ color: "var(--muted)", marginRight: 5 }}>Q{qi + 1}.</span>{q.question_text}
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {q.options.map((opt, oi) => {
                const isCO = oi === q.correct_answer, isW = oi === ua && !isC;

                return (
                  <div key={oi} style={{
                    padding: "7px 11px",
                    borderRadius: "var(--radius)",
                    background: isCO ? "rgba(74,222,128,0.06)" : isW ? "rgba(240,96,96,0.06)" : "var(--bg)",
                    border: `1px solid ${isCO ? "rgba(74,222,128,0.3)" : isW ? "rgba(240,96,96,0.3)" : "transparent"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 7
                  }}>
                    <span style={{
                      width: 19,
                      height: 19,
                      borderRadius: 4,
                      flexShrink: 0,
                      background: isCO ? "var(--green)" : isW ? "var(--red)" : "var(--surface2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isCO || isW ? "#0C0E14" : "var(--muted)",
                      fontSize: 10,
                      fontWeight: 700
                    }}>
                      {isCO ? <Icon n="check" s={10} /> : isW ? <Icon n="x" s={10} /> : String.fromCharCode(65 + oi)}
                    </span>

                    <span style={{
                      fontSize: 12,
                      color: isCO ? "var(--green)" : isW ? "var(--red)" : "var(--body)",
                      fontWeight: isCO || isW ? 600 : 400
                    }}>
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ADD THIS EXACTLY HERE */}

            {q.explanation && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: "var(--radius)",
                  background: "var(--surface2)",
                  border: "1px solid var(--border2)"
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--amber)",
                    marginBottom: 4
                  }}
                >
                  Explanation
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "var(--body)",
                    lineHeight: 1.5
                  }}
                >
                  {q.explanation}
                </div>
              </div>
            )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
