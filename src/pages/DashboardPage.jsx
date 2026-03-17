import { useState, useEffect, useMemo } from "react";
import Icon from "../components/Icon";
import LineChart from "../components/LineChart";
import AttendanceBar from "../components/AttendanceBar";
import RadialChart from "../components/RadialChart";
import CalDrop from "../components/CalDrop";
import { PERF, MOCK_QUESTIONS } from "../data/mockData";
import { card, scoreColor, pill } from "../utils/styles";
import Loader from "../components/Loader";
import API from "../api/api";

export default function DashboardPage({ setPage, setAttemptResult, user }) {
const [stats, setStats] = useState(null);
const [subjects, setSubjects] = useState([]);
const [attempts, setAttempts] = useState([]);
const [trend, setTrend] = useState([]);
const [leaderboard, setLeaderboard] = useState([]);
const [filter, setFilter] = useState("teacher");
const [teacherCourses, setTeacherCourses] = useState([]);
const [loading, setLoading] = useState(false);
const [showCal, setShowCal] = useState(false);
const [dateRange, setDateRange] = useState(null);
const [showAllLB, setShowAllLB] = useState(false);
const [showAllAttempts, setShowAllAttempts] = useState(false);
const COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6"];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

  // 1. Fetch teacher courses from FastAPI
useEffect(() => {
  const loadDashboard = async () => {
    setLoading(true);

    try {
      if (filter === "teacher") {
  const res = await API.get("/analytics/student/dashboard");
  console.log("ATTEMPTS RAW:", res.data.attempts);

  setStats(res.data.stats);

  // 🔥 transform to match UI
  setSubjects(res.data.subjects.map(s => ({
    name: s.subject,
    subject: s.subject,
    score: s.avg_score,
    tests: s.tests_taken,
    color: getColor(s.subject)
  })));

setTrend(res.data.trend.map(t => ({
  score: t.total_score,
  avg: t.total_score, // fallback (since no class_avg)
  month: new Date(t.submitted_at).toLocaleDateString("en-US", { month: "short" })
})));

setAttempts(res.data.attempts.map(a => ({
  ...a,
  id: a.attempt_id,
  title: a.test_title,
  attempt_date: a.attempt_date // keep same naming
})));
}
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  loadDashboard();
}, [filter]);

useEffect(() => {
  if (!user?.course_id) return;

  API.get(`/analytics/student/course/${user.course_id}/leaderboard`)
    .then(res => setLeaderboard(res.data))
    .catch(console.error);

}, [user]);


  // 3. Dynamic Stats Calculation
const statCards = useMemo(() => {
  if (!stats) return [];

  return [
    { l: "Tests Taken", v: stats.tests_taken || 0, n: "book", note: "+3 this week" },
    { l: "Avg Score", v: `${stats.avg_score || 0}%`, n: "target", note: "Filtered Result" },
    { l: "Best Score", v: `${stats.best_score || 0}%`, n: "trophy", note: "Top Performance" },
    { l: "Streak", v: "7 days", n: "bolt", note: "Keep going!" }
  ];
}, [stats]);
    
  const formattedTrend = trend;

  const lbShow = showAllLB ? leaderboard : leaderboard.slice(0, 5);
  const attShow = showAllAttempts ? attempts : attempts.slice(0, 5);

const openAttempt = async (a) => {
  try {
    setLoading(true);
    const res = await API.get(`/analytics/attempt/${a.id}`);

    setAttemptResult(res.data);   // ✅ real backend data
    setPage("attempt-result");
  } catch (err) {
    console.error("Error fetching attempt:", err);
  }setLoading(false);
};

  const viewMoreBtn = (expanded, toggle) => (
    <button onClick={toggle}
      style={{ width: "100%", marginTop: 10, padding: "7px", background: "none", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--muted)", cursor: "pointer", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.color = "var(--amber)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--muted)"; }}>
      {expanded ? <><Icon n="chevL" s={12} /> Show Less</> : <>View More <Icon n="chevD" s={12} /></>}
    </button>
  )

  if (loading || !stats) return <Loader />

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Dashboard</h1>
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
          {[
            ["teacher", "Enrolled"]]
          .map(([id, lbl]) => (
            <button key={id} onClick={() => setFilter(id)}
              style={{
                padding: "6px 13px",
                border: "none",
                cursor: "pointer",
                background: filter === id ? "var(--amber)" : "transparent",
                color: filter === id ? "#0C0E14" : "var(--muted)",
                fontWeight: filter === id ? 700 : 400,
                fontSize: 12
              }}>
              {lbl}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Stat cards - Now Dynamic */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11, marginBottom: 16 }}>
        {statCards.map((s, i) => (
          <div key={i} style={card({ padding: "15px 17px" })}>
            <span style={{ color: "var(--muted)", display: "block", marginBottom: 9 }}><Icon n={s.n} s={14} /></span>
            <div style={{ fontSize: 21, fontWeight: 700, color: "var(--white)", marginBottom: 1 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.l}</div>
            <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 3 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Overview - Now Dynamic */}
      <div style={card({ padding: 16 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 8, textAlign: "center" }}>Subject Overview</div>
        <RadialChart subjects={subjects} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
          {subjects.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: s.color }} />
              <span style={{ flex: 1, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
              <span style={{ color: s.color, fontWeight: 600 }}>{s.score}%</span>
            </div>
          ))}
        </div>
      </div><br />

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
          <LineChart data={formattedTrend} />
        </div>
        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 12 }}>Attendance</div>
          <AttendanceBar attempts={attempts} />
        </div>
      </div>

      {/* Subject Cards - Now Dynamic */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 10 }}>Subject Scores</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 9 }}>
          {subjects.map((s, i) => (
            <div key={i} style={{ ...card({ padding: "14px 14px" }), borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--white)", marginBottom: 6 }}>{s.name}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.score}%</div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8 }}>{s.tests} tests</div>
              <div style={{ height: 3, background: "var(--border2)", borderRadius: 2 }}>
                <div style={{ width: `${s.score}%`, height: "100%", background: s.color }} />
              </div>
            </div>
          ))}
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
            Attempts <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>({attempts.length})</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Test", "Type", "Date", "Score", "Time"].map((h) => <th key={h} style={{ padding: "5px 9px", textAlign: "left", fontSize: 11, color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {attShow.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }} onClick={() => openAttempt(a)}>
                  <td style={{ padding: "9px 9px" }}>
                    <div style={{ fontSize: 12, color: "var(--white)", fontWeight: 500 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{a.subject}</div>
                  </td>
                  <td style={{ padding: "9px 9px" }}>
                    <span style={a.type === "ai" ? pill("var(--amber)", "rgba(240,165,0,0.1)") : pill("var(--blue)", "rgba(96,165,250,0.1)")}>
                      {a.type === "ai" ? "AI" : "Teacher"}
                    </span>
                  </td>
                  <td style={{ padding: "9px 9px", fontSize: 11, color: "var(--muted)" }}>
                    {a.attempt_date
                      ? new Date(a.attempt_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td style={{ padding: "9px 9px", fontSize: 12, fontWeight: 700, color: scoreColor(a.score) }}>{a.score}%</td>
                  <td style={{ padding: "9px 9px", fontSize: 11, color: "var(--muted)" }}>
                    {Math.round((a.time_spent_seconds || 0) / 60)}m
                  </td>
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