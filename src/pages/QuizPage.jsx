import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";
import Loader from "../components/loader";
 
function ConfirmModal({ show, title, body, onCancel, onConfirm, cancelTxt, confirmTxt, danger }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={card({ padding: 26, maxWidth: 320, width: "90%", textAlign: "center" })}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--white)", marginBottom: 7 }}>{title}</div>
        <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 18 }}>{body}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", cursor: "pointer", fontWeight: 500, fontSize: 13 }}>{cancelTxt}</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "8px", background: danger ? "var(--red)" : "var(--amber)", border: "none", borderRadius: "var(--radius)", color: danger ? "#fff" : "#0C0E14", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{confirmTxt}</button>
        </div>
      </div>
    </div>
  );
}
 
export default function QuizPage({ config, setPage, setResults }) {
  const [qs, setQs] = useState([]);
  const [cur, setCur] = useState(0);
  const [ans, setAns] = useState({});
  const [mrk, setMrk] = useState({});
  const [tLeft, setTLeft] = useState((config.time || config.duration || 15) * 60);
  const [fs, setFs] = useState(false);
  const [tabs, setTabs] = useState(0);
  const [quitM, setQuitM] = useState(false);
  const [subM, setSubM] = useState(false);
  const [submitSuccessModal, setSubmitSuccessModal] = useState(false);
  const PROCTOR_URL = "http://localhost:8000"; 
  const [violations, setViolations] = useState([]);
  const [showCam, setShowCam] = useState(true);
 
  // ── Two distinct loading states for the right contextual message ──
  const [loadingQuestions, setLoadingQuestions] = useState(true); // fetching Qs  → variant="test"
  const [submitting, setSubmitting] = useState(false);            // grading + saving → variant="results"
 
  const timer = useRef();
  const submittedRef = useRef(false);
 
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setLoadingQuestions(true);
        let questionsData = [];
 
        if (config.type === "teacher") {
          const res = await API.get(`/quizzes/${config.quiz_id}/questions`);
          questionsData = res.data.map(q => ({
            question_id: q.id,
            question_text: q.question_text,
            options: q.options
          }));
        } else {
          questionsData = (config.questions || []).map((q, qi) => {
            const rawOptions = q.options || q.choices || [];
            return {
              question_id: q.question_id || q.id || qi,
              question_text: q.question_text || q.question || "",
              options: rawOptions.map((opt, oi) => {
                if (typeof opt === "string") return { id: oi, option_text: opt };
                return { id: opt.id ?? oi, option_text: opt.option_text || opt.text || "" };
              })
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
 
useEffect(() => {
  const poll = setInterval(async () => {
    try {
      const res = await fetch(`${PROCTOR_URL}/status`);
      const data = await res.json();
      setViolations(data.violations || []);
    } catch (_) {}
  }, 5000);
  return () => clearInterval(poll);
}, []);

useEffect(() => {
  const reportEvent = (name) =>
    fetch(`${PROCTOR_URL}/log_browser_event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: name }),
    }).catch(() => {});

  const onVisibility = () => {
    if (document.hidden) {
      setTabs((t) => t + 1);
      reportEvent("tab_switch");
    }
  };

  const onFullscreenChange = () => {
    if (!document.fullscreenElement) {
      reportEvent("fullscreen_exit");
    }
  };

  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("fullscreenchange", onFullscreenChange);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    document.removeEventListener("fullscreenchange", onFullscreenChange);
  };
}, []);
 
  useEffect(() => {
    timer.current = setInterval(() => {
      setTLeft((t) => {
        if (t <= 1) { clearInterval(timer.current); doSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, []);
 
const doSubmit = useCallback(async () => {
  if (submittedRef.current) return; // ← prevent double submission
  submittedRef.current = true;    
  setSubmitting(true);
  clearInterval(timer.current);

  const totalDuration = (config.time || config.duration || 15) * 60;
  const spent = totalDuration - tLeft;

  const formattedAnswers = qs.map((q, i) => {
    const selectedIdx = ans[i];
    let selected_answer = null;
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

    const res = await API.post(endpoint, payload);
    const submissionData = res.data;

    // ── Exit fullscreen regardless of result visibility ──
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});

    // ── For teacher quizzes, respect show_results_immediately ──
    if (config.type === "teacher" && !config.show_results_immediately) {
      setSubmitting(false);
      setSubmitSuccessModal(true);  // ← show modal ONLY, don't redirect yet
      return;                        // ← redirect happens when user clicks OK/Go Home
    }


    // ── Fetch detailed answers (only if results are visible) ──
    let finalQuestions = [];
    if (config.type === "ai") {
      const aiRes = await API.get(`/ai-quiz/${config.attempt_id}/answers`);
      finalQuestions = aiRes.data;
    } else {
      const attemptRes = await API.get(`/attempts/${submissionData.attempt_id}/answers`);
      finalQuestions = attemptRes.data;
    }

    const correctCount = config.type === "ai" ? submissionData.correct_answers : submissionData.score;
    const totalCount   = config.type === "ai" ? submissionData.total_questions : submissionData.total_possible || qs.length;

    setResults({
      questions: finalQuestions,
      correct: correctCount,
      total: totalCount,
      score: Math.round((correctCount / totalCount) * 100),
      timeSpent: spent,
      tabs,
      config,
    });

    setSubmitting(false);
    setPage("results");

  } catch (err) {
    console.error("Submit failed:", err.response?.data || err);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    setResults({ questions: [], correct: 0, total: qs.length, timeSpent: spent, tabs, config });
    setSubmitting(false);
    setPage("results");
  }
}, [ans, qs, tLeft, tabs, config, setPage, setResults]);
 
  // ── Loader guards — correct variant for each phase ──
  if (submitting)                        return <Loader variant="results" />;
  if (loadingQuestions || qs.length === 0) return <Loader variant="test" />;
 
  // FULLSCREEN GUARD
  if (!fs) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={card({ padding: 34, maxWidth: 380, width: "90%", textAlign: "center" })}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(240,165,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--amber)" }}>
          <Icon n="expand" s={20} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>Fullscreen Required</div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 22, lineHeight: 1.6 }}>This test must be taken in fullscreen mode. Tab switches will be recorded.</p>
        <button onClick={() => { document.documentElement.requestFullscreen?.(); setFs(true); }} style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
          Enter Fullscreen & Begin
        </button>
      </div>
    </div>
  );
 
  const q = qs[cur];
  const m = Math.floor(tLeft / 60), s = tLeft % 60;
  const timerCol = tLeft < 60 ? "var(--red)" : tLeft < 180 ? "var(--amber)" : "var(--green)";
  const answered = Object.keys(ans).length;
 
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ padding: "11px 22px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>{config.type === "ai" ? `${config.subject} · ${config.topic}` : config.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {tabs > 0 && <span style={{ fontSize: 12, color: "var(--red)", fontWeight: 600 }}>⚠ {tabs} tab switch{tabs > 1 ? "es" : ""}</span>}
          <span style={{ fontSize: 16, fontWeight: 700, color: timerCol, fontVariantNumeric: "tabular-nums" }}>{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{answered}/{qs.length}</span>
          <button onClick={() => setQuitM(true)} style={{ padding: "5px 13px", background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Quit</button>
        </div>
      </div>
 
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Question area */}
        <div style={{ flex: 1, padding: "26px 38px", overflowY: "auto" }}>
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Q {cur + 1} / {qs.length}</span>
              <div style={{ flex: 1, height: 3, background: "var(--border2)", borderRadius: 2 }}>
                <div style={{ width: `${((cur + 1) / qs.length) * 100}%`, height: "100%", background: "var(--amber)", borderRadius: 2, transition: "width .3s" }} />
              </div>
            </div>
 
            <div style={card({ padding: 20, marginBottom: 16 })}>
              <p style={{ fontSize: 15, color: "var(--white)", lineHeight: 1.7, margin: 0 }}>{q.question_text}</p>
            </div>
 
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {q.options.map((opt, oi) => {
                const sel = ans[cur] === oi;
                return (
                  <button key={oi} onClick={() => setAns({ ...ans, [cur]: oi })}
                    style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 15px", background: sel ? "rgba(240,165,0,0.06)" : "var(--surface)", border: `1px solid ${sel ? "var(--amber)" : "var(--border)"}`, borderRadius: "var(--radius)", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                    <span style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: sel ? "var(--amber)" : "var(--bg)", border: `1px solid ${sel ? "var(--amber)" : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: sel ? "#0C0E14" : "var(--muted)", fontSize: 11, fontWeight: 700 }}>
                      {sel ? <Icon n="check" s={12} /> : String.fromCharCode(65 + oi)}
                    </span>
                    <span style={{ fontSize: 14, color: sel ? "var(--amber)" : "var(--body)", fontWeight: sel ? 600 : 400 }}>{opt.option_text}</span>
                  </button>
                );
              })}
            </div>
 
            <div style={{ display: "flex", gap: 9 }}>
              <button onClick={() => cur > 0 && setCur(cur - 1)} disabled={cur === 0} style={{ padding: "7px 15px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--body)", cursor: "pointer", fontSize: 13, opacity: cur === 0 ? 0.5 : 1 }}>
                <Icon n="chevL" s={13} /> Prev
              </button>
              <button onClick={() => setMrk({ ...mrk, [cur]: !mrk[cur] })} style={{ padding: "7px 15px", background: mrk[cur] ? "rgba(240,165,0,0.07)" : "var(--surface)", border: `1px solid ${mrk[cur] ? "var(--amber)" : "var(--border)"}`, borderRadius: "var(--radius)", color: mrk[cur] ? "var(--amber)" : "var(--muted)", fontSize: 13, cursor: "pointer" }}>
                <Icon n="flag" s={13} /> {mrk[cur] ? "Unmark" : "Mark"}
              </button>
              <div style={{ flex: 1 }} />
              {cur < qs.length - 1
                ? <button onClick={() => setCur(cur + 1)} style={{ padding: "7px 17px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Next <Icon n="chevR" s={13} /></button>
                : <button onClick={() => setSubM(true)} style={{ padding: "7px 17px", background: "var(--green)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", cursor: "pointer", fontSize: 13, fontWeight: 700 }}><Icon n="check" s={13} /> Submit</button>
              }
            </div>
          </div>
        </div>
 
        {/* Nav panel */}
        <div style={{ width: 206, background: "var(--surface)", borderLeft: "1px solid var(--border)", padding: 16, display: "flex", flexDirection: "column", gap: 13 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".8px" }}>Questions</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {qs.map((_, i) => (
              <button key={i} onClick={() => setCur(i)}
                style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid", cursor: "pointer", fontSize: 12, fontWeight: 600, borderColor: cur === i ? "var(--amber)" : ans[i] !== undefined ? "var(--green)" : mrk[i] ? "var(--amber)" : "var(--border2)", background: cur === i ? "rgba(240,165,0,0.1)" : ans[i] !== undefined ? "rgba(74,222,128,0.08)" : mrk[i] ? "rgba(240,165,0,0.06)" : "var(--bg)", color: cur === i ? "var(--amber)" : ans[i] !== undefined ? "var(--green)" : mrk[i] ? "var(--amber)" : "var(--muted)" }}>
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={() => setSubM(true)} style={{ marginTop: "auto", width: "100%", padding: "8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Submit Test</button>
        </div>
      </div>00

      <ConfirmModal
          show={submitSuccessModal}
          title="Test Submitted!"
          body="Your responses have been recorded. Results will be available once your teacher releases them."
          onCancel={() => { setSubmitSuccessModal(false); setPage("home"); }}
          onConfirm={() => { setSubmitSuccessModal(false); setPage("home"); }}
          cancelTxt="OK"
          confirmTxt="Go Home"
        />
      <ConfirmModal show={quitM} title="Quit test?" body="Your progress will be lost." onCancel={() => setQuitM(false)} onConfirm={() => { if (document.fullscreenElement) document.exitFullscreen(); setPage("home"); }} cancelTxt="Cancel" confirmTxt="Quit" danger />
      <ConfirmModal show={subM} title="Submit test?" body={`${answered}/${qs.length} answered · ${Object.keys(mrk).length} marked`} onCancel={() => setSubM(false)} onConfirm={() => { setSubM(false); doSubmit(); }}  cancelTxt="Review" confirmTxt="Submit" />
      {/* ── Proctoring: webcam thumbnail ── */}
      {showCam && (
        <div style={{
          position: "fixed", bottom: 18, right: 18, zIndex: 200,
          border: "2px solid var(--border2)", borderRadius: "var(--radius)",
          overflow: "hidden", width: 180, boxShadow: "0 4px 18px rgba(0,0,0,.5)"
        }}>
          <img
            src={`${PROCTOR_URL}/video_feed`}
            alt="proctor-cam"
            style={{ width: "100%", display: "block" }}
          />
          <button
            onClick={() => setShowCam(false)}
            style={{
              position: "absolute", top: 4, right: 4, width: 20, height: 20,
              background: "rgba(0,0,0,.6)", border: "none", borderRadius: 4,
              color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: 1
            }}>✕</button>
        </div>
      )}

      {/* ── Proctoring: violation banner ── */}
      {violations.length > 0 && (
        <div style={{
          position: "fixed", top: 52, left: "50%", transform: "translateX(-50%)",
          zIndex: 200, background: "rgba(220,38,38,0.92)", color: "#fff",
          padding: "7px 18px", borderRadius: "var(--radius)", fontSize: 12,
          fontWeight: 600, display: "flex", gap: 8, alignItems: "center",
          maxWidth: "80vw", flexWrap: "wrap", boxShadow: "0 4px 14px rgba(0,0,0,.4)"
        }}>
          <span>⚠</span>
          {violations.map((v, i) => <span key={i}>{v}{i < violations.length - 1 ? " · " : ""}</span>)}
        </div>
      )}
          </div>
  );
}