import { useState, useEffect, useMemo } from "react";
import Icon from "../components/Icon";
import Select from "../components/Select";
import LineChart from "../components/LineChart";
import AttendanceBar from "../components/AttendanceBar";
import RadialChart from "../components/RadialChart";
import CalDrop from "../components/CalDrop";
import { card, scoreColor, pill } from "../utils/styles";
import Loader from "../components/loader";
import API from "../api/api";

const COLORS = [
  "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
  "#06B6D4", "#A855F7", "#F43F5E", "#22C55E", "#FACC15"
];

/**
 * Given an ordered list of subject names, returns a map of
 * name → color where no two names share the same color.
 * Uses the name's hash as a preferred index, then linear-probes
 * if that slot is already taken.
 */
function buildSubjectColors(names) {
  const map = {};
  const used = new Set();

  names.forEach((name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    let idx = Math.abs(hash) % COLORS.length;
    while (used.has(COLORS[idx])) {
      idx = (idx + 1) % COLORS.length;
    }
    map[name] = COLORS[idx];
    used.add(COLORS[idx]);
  });

  return map;
}

export default function DashboardPage({ setPage, setAttemptResult, user }) {
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [trend, setTrend] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState("teacher");
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lbLoading, setLbLoading] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [showAllLB, setShowAllLB] = useState(false);
  const [showAllAttempts, setShowAllAttempts] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [trendColor, setTrendColor] = useState("#22c55e");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        if (filter === "teacher") {
          const normalizeDate = (d, end = false) => {
            if (!d) return null;
            const date = new Date(d);
            if (end) {
              date.setHours(23, 59, 59, 999);
            } else {
              date.setHours(0, 0, 0, 0);
            }
            return date.toLocaleDateString("en-CA");
          };

          const params = {};
          if (dateRange?.s) {
            params.start_date = normalizeDate(dateRange.s, false);
            params.end_date = normalizeDate(dateRange.e || dateRange.s, true);
          }

          const res = await API.get("/analytics/student/dashboard", { params });
          console.log("ATTEMPT RAW:", res.data.attempts[0]);

          setStats(res.data.stats);

          let attemptsData = res.data.attempts.map((a) => ({
            ...a,
            id: a.attempt_id,
            title: a.test_title,
            attempt_date: a.attempt_date,
            score: a.accuracy,
            subject: a.subject,
          }));

          if (dateRange?.s) {
            const startDate = new Date(dateRange.s).setHours(0, 0, 0, 0);
            const endDate = dateRange.e
              ? new Date(dateRange.e).setHours(23, 59, 59, 999)
              : new Date(dateRange.s).setHours(23, 59, 59, 999);

            attemptsData = attemptsData.filter((a) => {
              const attemptDate = new Date(a.attempt_date).getTime();
              return attemptDate >= startDate && attemptDate <= endDate;
            });
          }

          setAttempts(attemptsData);

          // ── Build subject map ──────────────────────────────────────────
          const subjectMap = {};
          attemptsData.forEach((a) => {
            if (!subjectMap[a.subject]) {
              subjectMap[a.subject] = { total: 0, count: 0 };
            }
            subjectMap[a.subject].total += a.score || 0;
            subjectMap[a.subject].count += 1;
          });

          // Build no-repeat color map from the subject names we actually have
          const subjectNames = Object.keys(subjectMap);
          const colorMap = buildSubjectColors(subjectNames);

          const computedSubjects = subjectNames.map((name) => ({
            name,
            subject: name,
            score: Math.round(subjectMap[name].total / subjectMap[name].count),
            tests: subjectMap[name].count,
            color: colorMap[name], // always unique, never falls back to hash
          }));

          setSubjects(computedSubjects);

          // ── Trend ──────────────────────────────────────────────────────
          let trendData = res.data.trend || [];

          if (dateRange?.s) {
            const sTime = new Date(dateRange.s).setHours(0, 0, 0, 0);
            const eTime = dateRange.e
              ? new Date(dateRange.e).setHours(23, 59, 59, 999)
              : new Date(dateRange.s).setHours(23, 59, 59, 999);

            trendData = trendData.filter((t) => {
              const d = new Date(t.submitted_at).getTime();
              return d >= sTime && d <= eTime;
            });
          }

          setTrend(
            trendData.map((t) => ({
              score: t.total_score,
              avg: t.total_score,
              month: new Date(t.submitted_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
            }))
          );
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    };

    loadDashboard();
  }, [filter, dateRange]);

  useEffect(() => {
    if (!selectedCourse) return;

    setLbLoading(true);

    API.get("/analytics/leaderboard", { params: { course_id: selectedCourse } })
      .then((res) => setLeaderboard(res.data))
      .catch((err) => console.error("Leaderboard error:", err))
      .finally(() => setLbLoading(false));
  }, [selectedCourse]);

  useEffect(() => {
    API.get("/courses")
      .then((res) => {
        console.log("COURSES:", res.data);
        setCourses(res.data);
        if (res.data.length > 0) {
          setSelectedCourse(res.data[0].id);
        }
      })
      .catch((err) => console.error("Courses error:", err));
  }, []);

  const avgScore = useMemo(() => {
    if (!attempts.length) return 0;
    const total = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
    return (total / attempts.length).toFixed(2);
  }, [attempts]);

  const courseOptions = courses.map((c) => ({ label: c.name, value: c.id }));

  const computedStats = useMemo(() => {
    if (!attempts.length) {
      return { tests_taken: 0, avg_score: 0, best_score: 0, streak: 0 };
    }

    const scores = attempts.map((a) => a.score || 0);

    const uniqueDays = [
      ...new Set(
        attempts.map((a) => new Date(a.attempt_date).toLocaleDateString("en-CA"))
      ),
    ].sort((a, b) => b.localeCompare(a));

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const day of uniqueDays) {
      const cursorStr = cursor.toLocaleDateString("en-CA");
      if (day === cursorStr) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (day < cursorStr) {
        if (streak === 0) {
          cursor.setDate(cursor.getDate() - 1);
          if (day === cursor.toLocaleDateString("en-CA")) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const testsThisWeek = attempts.filter(
      (a) => new Date(a.attempt_date).getTime() >= oneWeekAgo.getTime()
    ).length;

    return {
      tests_taken: attempts.length,
      avg_score: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
      best_score: Math.max(...scores),
      streak,
      tests_this_week: testsThisWeek,
    };
  }, [attempts]);

  const statCards = [
    { l: "Tests Taken",  v: computedStats.tests_taken,  n: "book",  note: computedStats.tests_this_week > 0 ? `+${computedStats.tests_this_week} this week` : "None this week" },
    { l: "Avg Score",    v: `${computedStats.avg_score}%`,  n: "target", note: "Filtered Result" },
    { l: "Best Score",   v: `${computedStats.best_score}%`, n: "trophy", note: "Top Performance" },
    { l: "Streak",       v: `${computedStats.streak} day${computedStats.streak !== 1 ? "s" : ""}`, n: "bolt", note: computedStats.streak > 0 ? "Keep going!" : "Start today!" },
  ];

  const formattedTrend = trend;
  const sortedLB = [...leaderboard].sort((a, b) => a.rank - b.rank);
  const lbShow = showAllLB ? sortedLB : sortedLB.slice(0, 5);
  const attShow = showAllAttempts ? attempts : attempts.slice(0, 5);

  const openAttempt = async (a) => {
    try {
      setLoading(true);
      const res = await API.get(`/analytics/attempt/${a.id}`);
      setAttemptResult(res.data);
      setPage("attempt-result");
    } catch (err) {
      console.error("Error fetching attempt:", err);
    }
    setLoading(false);
  };

  const viewMoreBtn = (expanded, toggle) => (
    <button
      onClick={toggle}
      style={{ width: "100%", marginTop: 10, padding: "7px", background: "none", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--muted)", cursor: "pointer", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.color = "var(--amber)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--muted)"; }}
    >
      {expanded ? <><Icon n="chevU" s={12} /> Show Less</> : <>View More <Icon n="chevD" s={12} /></>}
    </button>
  );

  if (loading || !stats) return <Loader variant="dashboard" />;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Dashboard</h1>
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowCal(!showCal)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "var(--surface)", border: `1px solid ${dateRange ? "var(--amber)" : "var(--border2)"}`, borderRadius: "var(--radius)", color: dateRange ? "var(--amber)" : "var(--muted)", cursor: "pointer", fontSize: 12, fontWeight: 500 }}
            >
              <Icon n="cal" s={13} />
              {dateRange ? `${dateRange.s.toLocaleDateString()} – ${dateRange.e?.toLocaleDateString() || "..."}` : "Filter by date"}
            </button>
            {showCal && (
              <CalDrop
                currentRange={dateRange}
                onSelect={(r) => { setDateRange(r); setShowCal(false); }}
                onClose={() => setShowCal(false)}
              />
            )}
          </div>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            {[["teacher", "Enrolled"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setFilter(id)}
                style={{ padding: "6px 13px", border: "none", cursor: "pointer", background: filter === id ? "var(--amber)" : "transparent", color: filter === id ? "#0C0E14" : "var(--muted)", fontWeight: filter === id ? 700 : 400, fontSize: 12 }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
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

      {/* Subject Overview (radial) */}
      <div style={card({ padding: 16 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 8, textAlign: "center" }}>Subject Overview</div>
        <RadialChart subjects={subjects} avgScore={computedStats.avg_score} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
          {subjects.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: s.color }} />
              <span style={{ flex: 1, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
              <span style={{ color: s.color, fontWeight: 600 }}>{s.score}%</span>
            </div>
          ))}
        </div>
      </div>
      <br />

      {/* Score Trend + Attendance */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 13 }}>
        <div style={card({ padding: 20 })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>Score Trend</span>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: trendColor }} /> You</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--border2)" }} /> Class Avg</span>
            </div>
          </div>
          <LineChart data={formattedTrend} attempts={attempts} onTrendColor={setTrendColor}/>
        </div>
        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 12 }}>Attendance</div>
          <AttendanceBar attempts={attempts} />
        </div>
      </div>

      {/* Subject Score Cards */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", letterSpacing: 0.3 }}>Leaderboard</span>
            <div style={{ width: 160 }}>
              <Select
                value={selectedCourse}
                onChange={setSelectedCourse}
                options={courseOptions}
                placeholder="Select course"
                styleOverrides={{
                  button: { padding: "5px 26px 5px 10px", fontSize: 12, borderRadius: 10, minWidth: 150 },
                  dropdown: { borderRadius: 12, marginTop: 6 },
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
            {lbLoading ? (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Loading...</div>
            ) : lbShow.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>No data</div>
            ) : (
              lbShow.map((s, i) => (
                <div key={s.student_id || i}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: s.isMe ? "rgba(240,165,0,0.06)" : "var(--bg)", border: `1px solid ${s.isMe ? "rgba(240,165,0,0.18)" : "transparent"}`, borderRadius: "var(--radius)" }}
                >
                  <span style={{ width: 17, fontSize: 11, fontWeight: 700, color: s.rank <= 3 ? "var(--amber)" : "var(--muted)", textAlign: "center" }}>{s.rank}</span>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: s.isMe ? "var(--amber)" : "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: s.isMe ? "#0C0E14" : "var(--muted)", flexShrink: 0 }}>{s.initials}</div>
                  <span style={{ flex: 1, fontSize: 12, color: s.isMe ? "var(--amber)" : "var(--body)", fontWeight: s.isMe ? 600 : 400 }}>{s.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--white)" }}>{s.score}</span>
                </div>
              ))
            )}
          </div>
          {viewMoreBtn(showAllLB, () => setShowAllLB(!showAllLB))}
        </div>

        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 12 }}>
            Attempts <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>({attempts.length})</span>
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
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
                      <span style={a.type === "ai" ? pill("var(--amber)", "rgba(240,165,0,0.1)") : a.type === "hod" ? pill("var(--purple)", "rgba(168,85,247,0.1)") : pill("var(--blue)", "rgba(96,165,250,0.1)")}>
                        {a.type === "ai" ? "AI" : a.type === "hod" ? "HOD" : "Teacher"}
                      </span>
                    </td>
                    <td style={{ padding: "9px 9px", fontSize: 11, color: "var(--muted)" }}>
                      {a.attempt_date ? new Date(a.attempt_date).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "9px 9px", fontSize: 12, fontWeight: 700, color: scoreColor(a.score) }}>{a.score}%</td>
                    <td style={{ padding: "9px 9px", fontSize: 11, color: "var(--muted)" }}>
                      {Math.floor((a.time_spent_seconds || 0) / 60)}m {(a.time_spent_seconds || 0) % 60}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {viewMoreBtn(showAllAttempts, () => setShowAllAttempts(!showAllAttempts))}
        </div>
      </div>
    </div>
  );
}