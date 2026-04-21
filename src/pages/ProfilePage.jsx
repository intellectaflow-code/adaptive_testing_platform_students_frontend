import { useState, useEffect, useMemo } from "react";
import Icon from "../components/Icon";
import { card, initials } from "../utils/styles";
import Loader from "../components/loader";
import API from "../api/api";
 
 
export default function ProfilePage({ student, setPage }) {
  const [courses, setCourses]               = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [attempts, setAttempts]             = useState([]);
  const [loadingStats, setLoadingStats]     = useState(true);
  const [photoExpanded, setPhotoExpanded] = useState(false);
 
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await API.get("/courses");
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoadingCourses(false);
      }
    };
 
    const fetchStats = async () => {
      try {
        const res = await API.get("/analytics/student/dashboard");
        const attemptsData = res.data.attempts.map(a => ({
          ...a,
          id:           a.attempt_id,
          title:        a.test_title,
          attempt_date: a.attempt_date,
          score:        a.accuracy,
          subject:      a.subject,
        }));
        setAttempts(attemptsData);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoadingStats(false);
      }
    };
 
    fetchCourses();
    fetchStats();
  }, []);
 
  const computedStats = useMemo(() => {
    if (!attempts.length) {
      return { tests_taken: 0, avg_score: "0.00", best_score: 0, streak: 0 };
    }
 
    const scores = attempts.map(a => a.score || 0);
 
    const uniqueDays = [...new Set(
      attempts.map(a => new Date(a.attempt_date).toLocaleDateString("en-CA"))
    )].sort((a, b) => b.localeCompare(a));
 
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
          } else break;
        } else break;
      }
    }
 
    return {
      tests_taken: attempts.length,
      avg_score:   (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
      best_score:  Math.max(...scores),
      streak,
    };
  }, [attempts]);
 
  const statCards = loadingStats
    ? [["…", "Tests"], ["…", "Avg Score"], ["…", "Best Score"], ["…", "Streak"]]
    : [
        [computedStats.tests_taken,           "Tests"     ],
        [`${computedStats.avg_score}%`,        "Avg Score" ],
        [`${computedStats.best_score}%`,       "Best Score"],
        [`${computedStats.streak}d`,           "Streak"    ],
      ];
 
  // ── Full-page loader while both fetches are still in-flight ──
  if (loadingStats && loadingCourses) return <Loader variant="profile" />;
 
  return (
    <div style={{ padding: "24px 28px", maxWidth: 760, margin: "0 auto" }}>
      {/* ── Profile header ── */}
      <div style={card({ padding: "24px 26px", marginBottom: 12 })}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div
          style={{
            width: 62, height: 62, borderRadius: "50%",
            background: "var(--amber)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: "#0C0E14",
            flexShrink: 0, overflow: "hidden", padding: 0,
            cursor: student?.profile_photo ? "pointer" : "default",
          }}
          onClick={() => student?.profile_photo && setPhotoExpanded(true)}
        >
          {student?.profile_photo
            ? <img src={student.profile_photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : initials(student.full_name)
          }
        </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--white)", marginBottom: 2 }}>{student.full_name}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 9 }}>{student.email}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[student.usn, student.branch, `Sem ${student.sem}`, `Sec ${student.section}`].map((v, i) => (
                <span key={i} style={{ padding: "3px 9px", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 20, fontSize: 11, color: "var(--body)" }}>{v}</span>
              ))}
            </div>
          </div>
          <button onClick={() => setPage("editprofile")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
            <Icon n="edit" s={13} /> Edit
          </button>
        </div>
      </div>
 
      {/* ── Dynamic stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginBottom: 12 }}>
        {statCards.map(([v, l], i) => (
          <div key={i} style={card({ padding: "13px 15px", textAlign: "center" })}>
            <div style={{ fontSize: 19, fontWeight: 700, color: "var(--amber)", marginBottom: 2 }}>{v}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{l}</div>
          </div>
        ))}
      </div>
 
      {/* ── Enrolled courses ── */}
      <div style={card({ padding: 18, marginBottom: 12 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 10 }}>
          Enrolled Courses
        </div>
        {loadingCourses ? (
          // Skeleton rows — avoids a jarring full-page overlay for a small section
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 52, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", opacity: 0.5 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {courses.length > 0 ? (
              courses.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0C0E14", flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon n="user" s={11} />
                        {c.teacher_name || c.instructor_name || c.faculty_name || "—"}
                      </div>
                    </div>
                  </div>
                  {c.code && (
                    <span style={{ padding: "3px 8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, fontSize: 10, color: "var(--blue)", flexShrink: 0 }}>
                      {c.code}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>No courses enrolled</span>
            )}
          </div>
        )}
      </div>
          {photoExpanded && (
      <div
        onClick={() => setPhotoExpanded(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "zoom-out",
        }}
      >
        <img
          src={student.profile_photo}
          alt="Profile"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "90vw", maxHeight: "90vh",
            borderRadius: 12,
            boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
            objectFit: "contain",
            cursor: "default",
          }}
        />
        <button
          onClick={() => setPhotoExpanded(false)}
          style={{
            position: "absolute", top: 20, right: 24,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "50%", width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--white)",
          }}
        >
          <Icon n="x" s={16} />
        </button>
      </div>
    )}
    </div>
  );
}