import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";
import Loader from "../components/Loader";

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
  const [qs, setQs] = useState([]); // Initialize as empty array
  const [cur, setCur] = useState(0);
  const [ans, setAns] = useState({});
  const [mrk, setMrk] = useState({});
  const [tLeft, setTLeft] = useState((config.time || config.duration || 15) * 60);
  const [fs, setFs] = useState(false);
  const [tabs, setTabs] = useState(0);
  const [quitM, setQuitM] = useState(false);
  const [subM, setSubM] = useState(false);
  const [loading, setLoading] = useState(true); // Start as true to trigger loader
  const timer = useRef();

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setLoading(true);
        let questionsData = [];

        if (config.type === "teacher") {
          const res = await API.get(`/quizzes/${config.quiz_id}/questions`);
          questionsData = res.data.map(q => ({
            question_id: q.id,
            question_text: q.question_text,
            options: q.options // Contains [{id, option_text}, ...]
          }));
        } else {
          // For AI quizzes, questions are passed via config.questions
          questionsData = config.questions || [];
        }

        setQs(questionsData);
      } catch (err) {
        console.error("Failed to load quiz", err);
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [config]);

  useEffect(() => {
    const fn = () => { if (document.hidden) setTabs((t) => t + 1); };
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
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
  setLoading(true);
  clearInterval(timer.current);

  // Calculate total seconds spent on the quiz
  const totalDuration = (config.time || config.duration || 15) * 60;
  const spent = totalDuration - tLeft;
  
  // 1. Map the answers to the backend format: { question_id, selected_answer (ID) }
  const formattedAnswers = qs.map((q, i) => {
    const selectedIdx = ans[i];
    return {
      question_id: q.question_id,
      // We look up the actual database ID of the chosen option
      selected_answer: selectedIdx !== undefined ? q.options[selectedIdx].id : null
    };
  });

  // 2. Prepare the payload matching your FastAPI "QuizSubmission" model
  const payload = {
    answers: formattedAnswers,
    tab_switches: tabs, // Tracking proctoring violations
    time_spent: spent
  };

  try {
    // 3. Determine endpoint (AI vs Teacher quiz)
    const endpoint = config.type === "ai" 
      ? "/ai-quiz/submit" 
      : `/quizzes/${config.quiz_id}/submit`;
    
    // 4. Submit to backend
    const res = await API.post(endpoint, payload);
    const submissionData = res.data;

    // 5. Post-submission data retrieval (Review mode)
    let finalQuestions = [];

    if (config.type === "ai") {
      const aiRes = await API.get(`/ai-quiz/${config.attempt_id}/answers`);
      finalQuestions = aiRes.data;
    } else {
      const attemptId = submissionData.attempt_id;

      const res = await API.get(`/attempts/${attemptId}/answers`);
      finalQuestions = res.data;
    }

    // 6. Set results for the ResultsPage
    setResults({
      questions: finalQuestions,
      correct: submissionData.score, // Verified score from FastAPI logic
      total: qs.length,
      score: Math.round((submissionData.score / (submissionData.total_possible || qs.length)) * 100),
      timeSpent: spent,
      tabs: tabs,
      config: config
    });

    // Clean up fullscreen proctoring
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    
    setLoading(false);
    setPage("results");

  } catch (err) {
    console.error("Quiz submit error:", err);
    alert(err.response?.data?.detail || "Submission failed. Please try again.");
    setLoading(false);
  }
}, [ans, qs, tLeft, tabs, config, setPage, setResults]);

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

  // DATA LOADING GUARD (Crucial to prevent "undefined" error)
  if (loading || qs.length === 0) return <Loader />;

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
      </div>

      <ConfirmModal show={quitM} title="Quit test?" body="Your progress will be lost." onCancel={() => setQuitM(false)} onConfirm={() => { if (document.fullscreenElement) document.exitFullscreen(); setPage("home"); }} cancelTxt="Cancel" confirmTxt="Quit" danger />
      <ConfirmModal show={subM} title="Submit test?" body={`${answered}/${qs.length} answered · ${Object.keys(mrk).length} marked`} onCancel={() => setSubM(false)} onConfirm={doSubmit} cancelTxt="Review" confirmTxt="Submit" />
    </div>
  );
}