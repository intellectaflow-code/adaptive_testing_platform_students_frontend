import Icon from "../components/Icon";
import { card, scoreColor } from "../utils/styles";
import Loader from "../components/loader";
import { ResultInsight } from "../components/KeyInsights";
import DownloadReport from "../components/DownloadReport";   // ← import

export default function ResultsPage({ results, setPage, fromDashboard, student }) {
  if (!results) return <Loader variant="results" />;

  const resultConfig = results.config || {};

  const questions = results.questions || [];
  const correct   = results.correct   ?? 0;
  const total     = results.total     ?? 0;
  const timeSpent = results.timeSpent || results.time_spent_seconds || 0;
  const tabs      = results.tabs      || 0;
  const config    = {
    title:   resultConfig.title   || results.test_title,
    subject: resultConfig.subject || results.subject,
    topic:   resultConfig.topic   || results.topic,
    type:    resultConfig.type    || results.type,
  };

  // Resolve attempt_id from all possible field names across quiz types
  const attemptId = (() => {
    const direct =
      results.attempt_id      ||
      results.attemptId       ||
      results.quiz_attempt_id ||
      results.id              ||
      null;
    if (direct) return direct;

    const nested = results.result || results.data || {};
    return (
      nested.attempt_id      ||
      nested.attemptId       ||
      nested.quiz_attempt_id ||
      nested.id              ||
      null
    );
  })();

  const wrong            = total - correct;
  const accuracyScore    = total > 0 ? Math.round((correct / total) * 100) : 0;
  const scoreDisplayColor = scoreColor(accuracyScore);
  const mins = Math.floor(timeSpent / 60);
  const secs = Math.floor(timeSpent % 60);
console.log("attemptId resolved:", attemptId, "from results:", results);
  return (
    <>
      <style>{`
        /* ── RESULTS PAGE RESPONSIVE ── */
        .rp-wrap {
          padding: 20px 16px;
          max-width: 800px;
          margin: 0 auto;
        }

        .rp-summary-inner {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .rp-score-num {
          font-size: 48px;
          font-weight: 800;
          line-height: 1;
        }
        .rp-score-label {
          font-size: 11px;
          color: var(--muted);
          margin-top: 3px;
        }

        .rp-stats {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .rp-actions {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-left: auto;
        }

        .rp-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        /* Spinner keyframes used by DownloadReport when rendered here */
        @keyframes rp-spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .rp-wrap { padding: 14px 12px; }

          .rp-summary-inner {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }

          .rp-score-block {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .rp-score-num { font-size: 40px; }

          .rp-stats { gap: 14px; }

          .rp-actions {
            flex-direction: row;
            margin-left: 0;
            gap: 8px;
          }
          .rp-actions button { flex: 1; }

          .rp-options-grid { grid-template-columns: 1fr; }

          .rp-q-text { font-size: 13px !important; }
        }
      `}</style>

      <div className="rp-wrap">
        {fromDashboard && (
          <button
            onClick={() => setPage("dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--muted)", fontSize: 12, marginBottom: 16,
            }}
          >
            <Icon n="chevL" s={13} /> Back to Dashboard
          </button>
        )}

        {/* ── Score Summary Card ── */}
        <div style={card({ padding: "20px 20px", marginBottom: 16 })}>
          <div className="rp-summary-inner">
            {/* Score circle */}
            <div className="rp-score-block" style={{ textAlign: "center", minWidth: 72, flexShrink: 0 }}>
              <div>
                <div className="rp-score-num" style={{ color: scoreDisplayColor }}>
                  {accuracyScore}%
                </div>
                <div className="rp-score-label">Score</div>
              </div>
            </div>

            {/* Info + stats */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>
                {config.type === "ai"
                  ? `${config.subject || ""} · ${config.topic || ""}`
                  : config.title || "Test"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 10 }}>
                {accuracyScore >= 75
                  ? "Well done!"
                  : accuracyScore >= 60
                  ? "Good effort"
                  : "Keep practising"}
              </div>
              <div className="rp-stats">
                {[
                  ["Correct", `${correct}/${total}`, "var(--green)"],
                  ["Wrong",   `${wrong}/${total}`,   "var(--red)"],
                  ["Time",    `${mins}m ${secs}s`,   "var(--blue)"],
                ].map(([l, v, c]) => (
                  <div key={l}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{l}</div>
                  </div>
                ))}
                {tabs > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)" }}>{tabs}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Tab switches</div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="rp-actions">
              <button
                onClick={() => setPage("home")}
                style={{
                  padding: "8px 18px", background: "var(--amber)", border: "none",
                  borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700,
                  cursor: "pointer", fontSize: 12,
                }}
              >
                New Test
              </button>
              <button
                onClick={() => setPage("dashboard")}
                style={{
                  padding: "8px 18px", background: "var(--surface2)",
                  border: "1px solid var(--border2)", borderRadius: "var(--radius)",
                  color: "var(--body)", cursor: "pointer", fontSize: 12,
                }}
              >
                Dashboard
              </button>

              {/* ↓ All download logic lives in DownloadReport */}
              <DownloadReport
                mode="result"
                attemptId={attemptId}
                studentName={student?.name}
              />
            </div>
          </div>

          {/* ── AI Insight strip ── */}
          <ResultInsight
            correct={correct}
            total={total}
            timeSpent={timeSpent}
            config={config}
            questions={questions}
          />
        </div>

        {/* ── Question Review ── */}
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 11 }}>
          Question Review
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {questions.map((q, qi) => {
            const userAnsId    = q.selected_answer ?? null;
            const notAttempted = userAnsId === null;
            const isCorrect    = q.is_correct;

            return (
              <div
                key={qi}
                style={{
                  ...card({ padding: 14 }),
                  borderLeft: `3px solid ${
                    notAttempted ? "var(--amber)" : isCorrect ? "var(--green)" : "var(--red)"
                  }`,
                }}
              >
                {/* Question header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    width: 21, height: 21, borderRadius: 5, flexShrink: 0,
                    background: isCorrect
                      ? "rgba(74,222,128,0.1)"
                      : notAttempted ? "var(--bg)" : "rgba(240,96,96,0.1)",
                    border: `1px solid ${
                      isCorrect ? "var(--green)" : notAttempted ? "var(--border2)" : "var(--red)"
                    }`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isCorrect ? "var(--green)" : notAttempted ? "var(--muted)" : "var(--red)",
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {isCorrect ? <Icon n="check" s={11} /> : notAttempted ? "?" : <Icon n="x" s={11} />}
                  </span>
                  <p className="rp-q-text" style={{ fontSize: 14, color: "var(--white)", margin: 0, lineHeight: 1.6 }}>
                    <span style={{ color: "var(--muted)", marginRight: 5 }}>Q{qi + 1}.</span>
                    {q.question_text}
                    {notAttempted && (
                      <span style={{ color: "var(--amber)", fontSize: 11, marginLeft: 8 }}>
                        Not Attempted
                      </span>
                    )}
                  </p>
                </div>

                {/* Options */}
                <div className="rp-options-grid">
                  {(q.options || []).map((opt, oi) => {
                    const optText = typeof opt === "string" ? opt : opt.option_text;
                    const optId   = typeof opt === "string" ? opt : String(opt.id);

                    const isUserChoice    = String(userAnsId) === optId;
                    const isCorrectOption = String(q.correct_answer) === optId;

                    const bg = isCorrectOption
                      ? "rgba(74,222,128,0.06)"
                      : isUserChoice && !isCorrect
                      ? "rgba(240,96,96,0.06)"
                      : "var(--bg)";

                    const border = isCorrectOption
                      ? "rgba(74,222,128,0.3)"
                      : isUserChoice && !isCorrect
                      ? "rgba(240,96,96,0.3)"
                      : "transparent";

                    return (
                      <div
                        key={oi}
                        style={{
                          padding: "7px 10px", borderRadius: "var(--radius)",
                          background: bg, border: `1px solid ${border}`,
                          display: "flex", alignItems: "center", gap: 7,
                        }}
                      >
                        <span style={{
                          width: 19, height: 19, borderRadius: 4, flexShrink: 0,
                          background: isCorrectOption
                            ? "var(--green)" : isUserChoice ? "var(--red)" : "var(--surface2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#0C0E14", fontSize: 10, fontWeight: 700,
                        }}>
                          {isCorrectOption
                            ? <Icon n="check" s={10} />
                            : isUserChoice
                            ? <Icon n="x" s={10} />
                            : String.fromCharCode(65 + oi)}
                        </span>
                        <span style={{
                          fontSize: 12,
                          color: isCorrectOption
                            ? "var(--green)" : isUserChoice ? "var(--red)" : "var(--body)",
                        }}>
                          {optText.replace(/^[A-D][).]\s*/, "")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div style={{
                    marginTop: 10, padding: "10px 12px", borderRadius: "var(--radius)",
                    background: "var(--surface2)", border: "1px solid var(--border2)",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", marginBottom: 4 }}>
                      Explanation
                    </div>
                    <div style={{ fontSize: 12, color: "var(--body)", lineHeight: 1.5 }}>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}