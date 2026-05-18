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
import DownloadReport from "../components/DownloadReport";
import KeyInsights from "../components/KeyInsights";

const COLORS = [
  "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
  "#06B6D4", "#A855F7", "#F43F5E", "#22C55E", "#FACC15"
];

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
  const [loading, setLoading] = useState(false);
  const [lbLoading, setLbLoading] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [showAllLB, setShowAllLB] = useState(false);
  const [showAllAttempts, setShowAllAttempts] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [trendColor, setTrendColor] = useState("#22c55e");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    API.get("/profiles/me")
      .then((res) => setProfile(res.data))
      .catch((err) => console.error("Profile fetch failed:", err));
  }, []);

  // ── RESPONSIVE ──
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        if (filter === "teacher") {
          const normalizeDate = (d, end = false) => {
            if (!d) return null;
            const date = new Date(d);
            if (end) date.setHours(23, 59, 59, 999);
            else date.setHours(0, 0, 0, 0);
            return date.toLocaleDateString("en-CA");
          };

          const params = {};
          if (dateRange?.s) {
            params.start_date = normalizeDate(dateRange.s, false);
            params.end_date = normalizeDate(dateRange.e || dateRange.s, true);
          }

          const res = await API.get("/analytics/student/dashboard", { params });

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

          const subjectMap = {};
          attemptsData.forEach((a) => {
            if (!subjectMap[a.subject]) subjectMap[a.subject] = { total: 0, count: 0 };
            subjectMap[a.subject].total += a.score || 0;
            subjectMap[a.subject].count += 1;
          });

          const subjectNames = Object.keys(subjectMap);
          const colorMap = buildSubjectColors(subjectNames);
          setSubjects(subjectNames.map((name) => ({
            name, subject: name,
            score: Math.round(subjectMap[name].total / subjectMap[name].count),
            tests: subjectMap[name].count,
            color: colorMap[name],
          })));

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

          setTrend(trendData.map((t) => ({
            score: t.total_score,
            avg: t.total_score,
            month: new Date(t.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          })));
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
        setCourses(res.data);
        if (res.data.length > 0) setSelectedCourse(res.data[0].id);
      })
      .catch((err) => console.error("Courses error:", err));
  }, []);

  const computedStats = useMemo(() => {
    if (!attempts.length) return { tests_taken: 0, avg_score: 0, best_score: 0, streak: 0, tests_this_week: 0 };
    const scores = attempts.map((a) => a.score || 0);
    const uniqueDays = [...new Set(attempts.map((a) => new Date(a.attempt_date).toLocaleDateString("en-CA")))].sort((a, b) => b.localeCompare(a));

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (const day of uniqueDays) {
      const cursorStr = cursor.toLocaleDateString("en-CA");
      if (day === cursorStr) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else if (day < cursorStr) {
        if (streak === 0) {
          cursor.setDate(cursor.getDate() - 1);
          if (day === cursor.toLocaleDateString("en-CA")) { streak++; cursor.setDate(cursor.getDate() - 1); }
          else break;
        } else break;
      }
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    const testsThisWeek = attempts.filter((a) => new Date(a.attempt_date).getTime() >= oneWeekAgo.getTime()).length;

    return {
      tests_taken: attempts.length,
      avg_score: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
      best_score: Math.max(...scores),
      streak,
      tests_this_week: testsThisWeek,
    };
  }, [attempts]);

  const statCards = [
    { l: "Tests Taken", v: computedStats.tests_taken, n: "book", note: computedStats.tests_this_week > 0 ? `+${computedStats.tests_this_week} this week` : "None this week" },
    { l: "Avg Score", v: `${computedStats.avg_score}%`, n: "target", note: "Filtered Result" },
    { l: "Best Score", v: `${computedStats.best_score}%`, n: "trophy", note: "Top Performance" },
    { l: "Streak", v: `${computedStats.streak} day${computedStats.streak !== 1 ? "s" : ""}`, n: "bolt", note: computedStats.streak > 0 ? "Keep going!" : "Start today!" },
  ];

  const courseOptions = courses.map((c) => ({ label: c.name, value: c.id }));
  const sortedLB = [...leaderboard].sort((a, b) => a.rank - b.rank);
  const lbShow = showAllLB ? sortedLB : sortedLB.slice(0, 5);
  const attShow = showAllAttempts ? attempts : attempts.slice(0, 5);
// DashboardPage.jsx — openAttempt function
  const openAttempt = async (a) => {
    try {
      setLoading(true);
      const res = await API.get(`/analytics/attempt/${a.id}`);
      setAttemptResult({ ...res.data, attempt_id: a.id }); // ← inject attempt_id
      setPage("attempt-result");
    } catch (err) {
      console.error("Error fetching attempt:", err);
    }
    setLoading(false);
  };

  const viewMoreBtn = (expanded, toggle) => (
    <button
      onClick={toggle}
      style={{ width: "100%", marginTop: 10, padding: "7px", background: "none", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--white)", cursor: "pointer", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.color = "var(--amber)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--white)"; }}
    >
      {expanded ? <><Icon n="chevU" s={12} /> Show Less</> : <>View More <Icon n="chevD" s={12} /></>}
    </button>
  );

  if (loading || !stats) return <Loader variant="dashboard" />;

  return (
    <div style={{ padding: isMobile ? "16px" : "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--white)" }}>Dashboard</h1>
        <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowCal(!showCal)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "var(--surface)", border: `1px solid ${dateRange ? "var(--amber)" : "var(--border2)"}`, borderRadius: "var(--radius)", color: dateRange ? "var(--amber)" : "var(--muted)", cursor: "pointer", fontSize: 12, fontWeight: 500 }}
            >
              <Icon n="cal" s={13} />
              {dateRange
                ? isMobile
                  ? `${dateRange.s.toLocaleDateString()}`
                  : `${dateRange.s.toLocaleDateString()} – ${dateRange.e?.toLocaleDateString() || "..."}`
                : "Filter by date"}
            </button>
            {showCal && (
              <CalDrop
                currentRange={dateRange}
                onSelect={(r) => { setDateRange(r); setShowCal(false); }}
                onClose={() => setShowCal(false)}
              />
            )}
          </div>

          {/* ✅ Dashboard aggregate report only — no `a` reference here */}
          <DownloadReport
            mode="dashboard"
            user={profile}
            computedStats={computedStats}
            subjects={subjects}
            attempts={attempts}
          />
        </div>
      </div>

      {/* ── Stat cards: 2×2 on mobile, 4×1 on desktop ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 11, marginBottom: 16 }}>
        {statCards.map((s, i) => (
          <div key={i} style={card({ padding: "15px 17px" })}>
            <span style={{ color: "var(--muted)", display: "block", marginBottom: 9 }}><Icon n={s.n} s={14} /></span>
            <div style={{ fontSize: isMobile ? 17 : 21, fontWeight: 700, color: "var(--white)", marginBottom: 1 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.l}</div>
            <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 3 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* ── Score Trend + Radial Chart: side by side ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Score Trend */}
        <div style={card({ paddingTop: 28, paddingRight: 20, paddingBottom: 12, paddingLeft: 20 })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>Score Trend</span>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: trendColor }} /> You
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--border2)" }} /> Class Avg
              </span>
            </div>
          </div>
          <LineChart data={trend} attempts={attempts} onTrendColor={setTrendColor} />
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
      </div>

      {/* ── Subject Score Cards: 2-col on mobile, 5-col on desktop ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 10 }}>Subject Scores</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 9 }}>
          {subjects.map((s, i) => (
            <div key={i} style={{ ...card({ padding: "14px 14px" }), borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--white)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: s.color }}>{s.score}%</div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8 }}>{s.tests} tests</div>
              <div style={{ height: 3, background: "var(--border2)", borderRadius: 2 }}>
                <div style={{ width: `${s.score}%`, height: "100%", background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Leaderboard + Attempts: stacked on mobile ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.7fr", gap: 14, marginBottom: 14 }}>

        {/* Leaderboard */}
        <div style={card({ padding: 20 })}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>Leaderboard</span>
            <div style={{ minWidth: 0, flex: isMobile ? "1 1 100%" : "0 0 160px" }}>
              <Select
                value={selectedCourse}
                onChange={setSelectedCourse}
                options={courseOptions}
                placeholder="Select course"
                styleOverrides={{
                  button: { padding: "5px 26px 5px 10px", fontSize: 12, borderRadius: 10, width: "100%" },
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
                  <span style={{ flex: 1, fontSize: 12, color: s.isMe ? "var(--amber)" : "var(--body)", fontWeight: s.isMe ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--white)", flexShrink: 0 }}>{s.score}</span>
                </div>
              ))
            )}
          </div>
          {viewMoreBtn(showAllLB, () => setShowAllLB(!showAllLB))}
        </div>

        {/* Attempts */}
        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 12 }}>
            Attempts <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>({attempts.length})</span>
          </div>

          {/* ── Mobile: card list ── */}
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {attShow.map((a, i) => (
                <div
                  key={i}
                  style={{ background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", padding: "11px 13px" }}
                >
                  {/* Top row: title + score — clicking navigates to attempt */}
                  <div
                    onClick={() => openAttempt(a)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6, cursor: "pointer" }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "var(--white)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{a.subject}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor(a.score), flexShrink: 0 }}>{a.score}%</div>
                  </div>

                  {/* Bottom row: pill + date + time + download icon */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={
                      a.type === "ai"
                        ? pill("var(--amber)", "rgba(240,165,0,0.1)")
                        : a.type === "hod"
                        ? pill("var(--purple)", "rgba(168,85,247,0.1)")
                        : pill("var(--blue)", "rgba(96,165,250,0.1)")
                    }>
                      {a.type === "ai" ? "AI" : a.type === "hod" ? "HOD" : "Teacher"}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>
                      {a.attempt_date ? new Date(a.attempt_date).toLocaleDateString() : "—"}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>
                      {Math.floor((a.time_spent_seconds || 0) / 60)}m {(a.time_spent_seconds || 0) % 60}s
                    </span>
                    {/* ✅ Per-attempt compact download button */}
                    <div style={{ marginLeft: "auto" }}>
                      <DownloadReport
                        mode="result"
                        compact
                        attemptId={a.id}
                        studentName={profile?.full_name || user?.full_name}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Desktop: table ── */
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  {/* ✅ Single header row with "Report" column — duplicate row removed */}
                  <tr>
                    {["Test", "Type", "Date", "Score", "Time", "Report"].map((h) => (
                      <th key={h} style={{ padding: "5px 9px", textAlign: "left", fontSize: 11, color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border)", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attShow.map((a, i) => (
                    // ✅ Row click navigates; download td stops propagation via DownloadReport's internal handler
                    <tr
                      key={i}
                      onClick={() => openAttempt(a)}
                      style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                    >
                      <td style={{ padding: "9px 9px" }}>
                        <div style={{ fontSize: 12, color: "var(--white)", fontWeight: 500 }}>{a.title}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)" }}>{a.subject}</div>
                      </td>
                      <td style={{ padding: "9px 9px" }}>
                        <span style={
                          a.type === "ai"
                            ? pill("var(--amber)", "rgba(240,165,0,0.1)")
                            : a.type === "hod"
                            ? pill("var(--purple)", "rgba(168,85,247,0.1)")
                            : pill("var(--blue)", "rgba(96,165,250,0.1)")
                        }>
                          {a.type === "ai" ? "AI" : a.type === "hod" ? "HOD" : "Teacher"}
                        </span>
                      </td>
                      <td style={{ padding: "9px 9px", fontSize: 11, color: "var(--muted)" }}>
                        {a.attempt_date ? new Date(a.attempt_date).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "9px 9px", fontSize: 12, fontWeight: 700, color: scoreColor(a.score) }}>
                        {a.score}%
                      </td>
                      <td style={{ padding: "9px 9px", fontSize: 11, color: "var(--muted)" }}>
                        {Math.floor((a.time_spent_seconds || 0) / 60)}m {(a.time_spent_seconds || 0) % 60}s
                      </td>
                      {/* ✅ stopPropagation handled inside DownloadReport via e.stopPropagation() */}
                      <td style={{ padding: "9px 9px" }} onClick={e => e.stopPropagation()}>
                        <DownloadReport
                          mode="result"
                          compact
                          attemptId={a.id}
                          studentName={profile?.full_name || user?.full_name}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMoreBtn(showAllAttempts, () => setShowAllAttempts(!showAllAttempts))}
        </div>
      </div>

      {/* ── Key Insights: full width horizontal strip at bottom ── */}
      <div style={card({ padding: "18px 22px" })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 14 }}>Key Insights</div>
        <KeyInsights
          computedStats={computedStats}
          subjects={subjects}
          attempts={attempts}
          horizontal
        />
      </div>

    </div>
  );
}