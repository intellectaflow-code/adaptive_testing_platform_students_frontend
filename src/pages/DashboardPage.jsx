import { useState } from "react";
import Icon from "../components/Icon";
import LineChart from "../components/LineChart";
import AttendanceBar from "../components/AttendanceBar";
import RadialChart from "../components/RadialChart";
import CalDrop from "../components/CalDrop";
import { PERF, MOCK_QUESTIONS } from "../data/mockData";
import { card, scoreColor, pill } from "../utils/styles";
import Loader from "../components/Loader";

export default function DashboardPage({ setPage, setAttemptResult }) {
  const [filter, setFilter] = useState("overall");
  const [showCal, setShowCal] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [showAllLB, setShowAllLB] = useState(false);
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  const filtered = PERF.attempts.filter(
    (a) => filter === "overall" || (filter === "ai" && a.type === "ai") || (filter === "teacher" && a.type === "teacher")
  );
  const lbShow = showAllLB ? PERF.leaderboard : PERF.leaderboard.slice(0, 5);
  const attShow = showAllAttempts ? filtered : filtered.slice(0, 5);

  const openAttempt = (a) => {
    const mockResult = {
      qs: MOCK_QUESTIONS,
      ans: { 0: 1, 1: 2, 2: 2, 3: 0, 4: 0 },
      correct: a.correct,
      total: a.total_q,
      score: a.score,
      timeSpent: parseInt(a.time) * 60,
      tabs: a.tabs,
      config: { type: a.type, title: a.title, subject: a.subject, topic: a.subject },
    };
    setAttemptResult(mockResult);
    setPage("attempt-result");
  };

  const viewMoreBtn = (expanded, toggle) => (
    <button onClick={toggle}
      style={{ width: "100%", marginTop: 10, padding: "7px", background: "none", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--muted)", cursor: "pointer", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.color = "var(--amber)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--muted)"; }}>
      {expanded ? <><Icon n="chevL" s={12} /> Show Less</> : <>View More <Icon n="chevD" s={12} /></>}
    </button>
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Dashboard</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Your performance overview</p>
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowCal(!showCal)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "var(--surface)", border: `1px solid ${dateRange ? "var(--amber)" : "var(--border2)"}`, borderRadius: "var(--radius)", color: dateRange ? "var(--amber)" : "var(--muted)", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
              <Icon n="cal" s={13} />{dateRange ? `${dateRange.s.toLocaleDateString()} – ${dateRange.e?.toLocaleDateString() || "..."}` : "Filter by date"}
            </button>
            {showCal && <CalDrop onSelect={(r) => setDateRange(r)} onClose={() => setShowCal(false)} />}
          </div>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            {[["overall", "All"], ["ai", "AI"], ["teacher", "Teacher"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setFilter(id)}
                style={{ padding: "6px 13px", border: "none", cursor: "pointer", background: filter === id ? "var(--amber)" : "transparent", color: filter === id ? "#0C0E14" : "var(--muted)", fontWeight: filter === id ? 700 : 400, fontSize: 12, transition: "all .15s" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11, marginBottom: 16 }}>
        {[{ l: "Tests Taken", v: "23", n: "book", note: "+3 this week" }, { l: "Avg Score", v: "81%", n: "target", note: "+5% vs last month" }, { l: "Best Score", v: "96%", n: "trophy", note: "DBMS Quiz" }, { l: "Streak", v: "7 days", n: "bolt", note: "Keep going!" }].map((s, i) => (
          <div key={i} style={card({ padding: "15px 17px" })}>
            <span style={{ color: "var(--muted)", display: "block", marginBottom: 9 }}><Icon n={s.n} s={14} /></span>
            <div style={{ fontSize: 21, fontWeight: 700, color: "var(--white)", marginBottom: 1 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.l}</div>
            <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 3 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* {RadialChart} */}
        <div style={card({ padding: 16 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 8, textAlign: "center" }}>Overview</div>
          <RadialChart subjects={PERF.subjects} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
            {PERF.subjects.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: s.color }} />
                <span style={{ flex: 1, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                <span style={{ color: s.color, fontWeight: 600 }}>{s.score}%</span>
              </div>
            ))}
          </div>
        </div><br></br>

      {/* Score Trend + Attendance */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={card({ padding: 20 })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>Score Trend</span>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--amber)" }} /> You</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--border2)" }} /> Class Avg</span>
            </div>
          </div>
          <LineChart data={PERF.trend} />
        </div>
        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 12 }}>Attendance</div>
          <AttendanceBar data={PERF.attendance} />
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
            {[["var(--green)", "≥85%"], ["var(--amber)", "70–84%"], ["var(--red)", "<70%"]].map(([c, l]) => (
              <span key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Cards + Radial */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 14, marginBottom: 14, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 10 }}>Subject Scores</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 9 }}>
            {PERF.subjects.map((s, i) => (
              <div key={i} style={{ ...card({ padding: "14px 14px" }), borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--white)", marginBottom: 6, lineHeight: 1.3 }}>{s.name}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.score}%</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8 }}>{s.tests} tests</div>
                <div style={{ height: 3, background: "var(--border2)", borderRadius: 2 }}>
                  <div style={{ width: `${s.score}%`, height: "100%", background: s.color, borderRadius: 2, transition: "width 1s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>

      

      {/* Leaderboard + Attempts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr", gap: 14 }}>
        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 12 }}>Leaderboard</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lbShow.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: s.isMe ? "rgba(240,165,0,0.06)" : "var(--bg)", border: `1px solid ${s.isMe ? "rgba(240,165,0,0.18)" : "transparent"}`, borderRadius: "var(--radius)" }}>
                <span style={{ width: 17, fontSize: 11, fontWeight: 700, color: i < 3 ? "var(--amber)" : "var(--muted)", textAlign: "center" }}>{s.rank}</span>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: s.isMe ? "var(--amber)" : "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: s.isMe ? "#0C0E14" : "var(--muted)", flexShrink: 0 }}>{s.initials}</div>
                <span style={{ flex: 1, fontSize: 12, color: s.isMe ? "var(--amber)" : "var(--body)", fontWeight: s.isMe ? 600 : 400 }}>{s.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--white)" }}>{s.score}%</span>
              </div>
            ))}
          </div>
          {viewMoreBtn(showAllLB, () => setShowAllLB(!showAllLB))}
        </div>

        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 12 }}>
            Attempts <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>({filtered.length})</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Test", "Type", "Date", "Score", "Time"].map((h) => <th key={h} style={{ padding: "5px 9px", textAlign: "left", fontSize: 11, color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border)", textTransform: "uppercase", letterSpacing: ".4px" }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {attShow.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background .12s" }}
                  onClick={() => openAttempt(a)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "9px 9px" }}>
                    <div style={{ fontSize: 12, color: "var(--white)", fontWeight: 500 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{a.subject}</div>
                  </td>
                  <td style={{ padding: "9px 9px" }}>
                    <span style={a.type === "ai" ? pill("var(--amber)", "rgba(240,165,0,0.1)") : pill("var(--blue)", "rgba(96,165,250,0.1)")}>
                      {a.type === "ai" ? "AI" : "Teacher"}
                    </span>
                  </td>
                  <td style={{ padding: "9px 9px", fontSize: 11, color: "var(--muted)" }}>{a.date}</td>
                  <td style={{ padding: "9px 9px", fontSize: 12, fontWeight: 700, color: scoreColor(a.score) }}>{a.score}%</td>
                  <td style={{ padding: "9px 9px", fontSize: 11, color: "var(--muted)" }}>{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {viewMoreBtn(showAllAttempts, () => setShowAllAttempts(!showAllAttempts))}
        </div>
      </div>
    </div>
  );
}
