import { useState, useEffect } from "react";

// Layout
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

// Pages
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import AssignmentQuizPage from "./pages/AssignmentQuizPage";
import ResultsPage from "./pages/ResultsPage";
import DashboardPage from "./pages/DashboardPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AssignmentsPage from "./pages/AssignmentsPage";

import API from "./api/api";
import { getThemeTokens } from "./utils/theme";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [authPage, setAuthPage] = useState("login");
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("access_token"));
  const [page, setPage] = useState("home");
  const [quizConfig, setQuizConfig] = useState(null);
  const [results, setResults] = useState(null);
  const [attemptResult, setAttemptResult] = useState(null);
  const [col, setCol] = useState(false);

  const tokens = getThemeTokens(theme);
  const isAuth = !loggedIn;
  const isQuiz = page === "quiz";

  // ── USER STATE ──
  const [student, setStudent] = useState(() => {
    const saved = localStorage.getItem("user_data");
    return saved ? JSON.parse(saved) : null;
  });

  const [announcements, setAnnouncements] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem("read_announcements");
    return saved ? JSON.parse(saved) : [];
  });

  // ── LOGIN ──
  const handleLoginSuccess = async (basicData) => {
    setLoggedIn(true);
    try {
      const res = await API.get("/profiles/me");
      const fullProfile = res.data;
      setStudent(fullProfile);
      localStorage.setItem("user_data", JSON.stringify(fullProfile));
    } catch (err) {
      console.error("Failed to fetch profile", err);
      setStudent(basicData);
      localStorage.setItem("user_data", JSON.stringify(basicData));
    }
  };

  // ── PREFETCH ANNOUNCEMENTS ──
  useEffect(() => {
    if (!loggedIn) return;
    API.get("/announcements")
      .then(res => setAnnouncements(res.data))
      .catch(err => console.error("Failed to prefetch announcements", err));
  }, [loggedIn]);

  const unreadCount = announcements.filter(a => !readIds.includes(a.id)).length;

  const markAllRead = (ids) => {
    const merged = [...new Set([...readIds, ...ids])];
    localStorage.setItem("read_announcements", JSON.stringify(merged));
    setReadIds(merged);
  };

  const handleLogout = () => {
    localStorage.clear();
    setStudent(null);
    setLoggedIn(false);
    setAuthPage("login");
    setPage("home");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; font-size: 14px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--muted); }
        input:focus, select:focus { border-color: var(--amber) !important; box-shadow: 0 0 0 3px rgba(240,165,0,0.08); }
        ::selection { background: rgba(240,165,0,0.2); }
      `}</style>

      <div style={{ ...tokens, background: "var(--bg)", color: "var(--white)", minHeight: "100vh", display: "flex" }}>
        
        {/* ── AUTH ── */}
        {isAuth ? (
          <div style={{ flex: 1 }}>
            <LoginPage onLogin={handleLoginSuccess} />
          </div>

        ) : isQuiz ? (
          /* ── QUIZ / ASSIGNMENT SWITCH ── */
          <div style={{ flex: 1 }}>
            {quizConfig?.type === "teacher_assignment" ? (
              <AssignmentQuizPage
                config={quizConfig}
                setPage={setPage}
              />
            ) : (
              <QuizPage
                config={quizConfig}
                setPage={setPage}
                setResults={setResults}
              />
            )}
          </div>

        ) : (
          <>
            <Sidebar
              page={page}
              setPage={setPage}
              student={student || {}}
              onLogout={handleLogout}
              col={col}
              setCol={setCol}
            />

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                overflow: "hidden",
                marginLeft: col ? 52 : 220,
                transition: "margin-left .25s ease",
              }}
            >
              <Topbar
                page={page}
                theme={theme}
                setTheme={setTheme}
                setPage={setPage}
                unreadCount={unreadCount}
              />

              <main style={{ flex: 1, overflowY: "auto" }}>
                {page === "profile" && <ProfilePage student={student} setPage={setPage} />}
                {page === "editprofile" && (<EditProfilePage key="edit-profile"student={student}setStudent={setStudent}setPage={setPage}/>)}
                {page === "home" && (<HomePage setPage={setPage} setQuizConfig={setQuizConfig} />)}
                {page === "results" && results && (<ResultsPage results={results} setPage={setPage} />)}
                {page === "attempt-result" && attemptResult && (<ResultsPage results={attemptResult}setPage={setPage}fromDashboard/>)}
                {page === "dashboard" && (<DashboardPage setPage={setPage} setAttemptResult={setAttemptResult} />)}
                {page === "announcements" && (<AnnouncementsPage announcements={announcements} setAnnouncements={setAnnouncements} readIds={readIds} markAllRead={markAllRead} />)}
                {page === "settings" && (<SettingsPage theme={theme} setTheme={setTheme} />)}
                {page === "assignments" && (<AssignmentsPage setPage={setPage}setQuizConfig={setQuizConfig} />)}
              </main>
            </div>
          </>
        )}
      </div>
    </>
  );
}

