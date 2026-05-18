import { useState, useEffect, useCallback } from "react";

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
import AssignmentsResultsPage from "./pages/AssignmentsResultsPage";

import API from "./api/api";
import { getThemeTokens } from "./utils/theme";

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [authPage, setAuthPage] = useState("login");
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("access_token"));

  const [page, setPage] = useState("home");
  const [quizConfig, setQuizConfig] = useState(null);

  const [results, setResults] = useState(null);
  const [attemptResult, setAttemptResult] = useState(null);

  const [col, setCol] = useState(false);

  // ── MOBILE STATE ──
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const tokens = getThemeTokens(theme);

  const isAuth = !loggedIn;
  const isQuiz = page === "quiz";
  const isAssignment = page === "assignment_quiz";

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


  useEffect(() => {
  localStorage.setItem("theme", theme);
}, [theme]);


  // ── TRACK WINDOW RESIZE ──
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close drawer if switching to desktop
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── LOCK BODY SCROLL WHEN MOBILE SIDEBAR IS OPEN ──
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, sidebarOpen]);

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
    const savedTheme = localStorage.getItem("theme");
    localStorage.clear();
    setStudent(null);
    setLoggedIn(false);
    setAuthPage("login");
    setPage("home");
  };

  // Navigate and close mobile sidebar simultaneously
  const handleNavigate = useCallback((p) => {
    setPage(p);
    setSidebarOpen(false);
  }, []);

  // Sidebar margin: on mobile always 0; on desktop respect col state
  const sidebarWidth = isMobile ? 0 : (col ? 52 : 220);

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

        /* ── MOBILE SIDEBAR OVERLAY ── */
        .mob-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          z-index: 199;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          animation: fadeIn .2s ease;
        }
        .mob-overlay.open { display: block; }

        /* ── MOBILE SIDEBAR DRAWER ── */
        .sidebar-drawer {
          position: fixed !important;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 200;
          width: 220px !important;
          transform: translateX(-100%);
          transition: transform .25s cubic-bezier(.4,0,.2,1);
          will-change: transform;
        }
        .sidebar-drawer.open {
          transform: translateX(0);
          box-shadow: 4px 0 24px rgba(0,0,0,0.4);
        }

        /* ── HAMBURGER BUTTON (hidden on desktop) ── */
        .mob-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--white);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          margin-right: 8px;
          transition: background .15s;
          flex-shrink: 0;
        }
        .mob-menu-btn:hover { background: var(--border); }

        @media (max-width: 767px) {
          .mob-menu-btn { display: flex; }

          /* Main content always full width on mobile */
          .main-shell {
            margin-left: 0 !important;
          }

          /* Prevent wide fixed-width children from overflowing */
          main * { max-width: 100%; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div
        style={{
          ...tokens,
          background: "var(--bg)",
          color: "var(--white)",
          minHeight: "100vh",
          display: "flex",
        }}
      >

        {/* ── AUTH ── */}
        {isAuth ? (
          <div style={{ flex: 1 }}>
            <LoginPage onLogin={handleLoginSuccess} />
          </div>

        ) : isQuiz ? (
          /* ── QUIZ PAGE ── */
          <div style={{ flex: 1 }}>
            <QuizPage
              config={quizConfig}
              setPage={setPage}
              setResults={setResults}
            />
          </div>

        ) : isAssignment ? (
          /* ── ASSIGNMENT PAGE ── */
          <div style={{ flex: 1 }}>
            <AssignmentQuizPage
              config={quizConfig}
              setPage={setPage}
            />
          </div>

        ) : (
          <>
            {/* ── MOBILE OVERLAY (tap to close sidebar) ── */}
            {isMobile && (
              <div
                className={`mob-overlay ${sidebarOpen ? "open" : ""}`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* ── SIDEBAR ──
                On desktop: rendered normally in flow (static/sticky).
                On mobile:  wrapped in a fixed drawer that slides in/out. */}
            <div className={isMobile ? `sidebar-drawer ${sidebarOpen ? "open" : ""}` : undefined}>
              <Sidebar
                page={page}
                setPage={handleNavigate}
                student={student || {}}
                onLogout={handleLogout}
                col={col}
                setCol={setCol}
              />
            </div>

            {/* ── MAIN CONTENT SHELL ── */}
            <div
              className="main-shell"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                marginLeft: sidebarWidth, 
                minHeight: "100vh",
                overflow: "hidden",
                transition: "margin-left .25s ease",
              }}
            >
              <Topbar
                page={page}
                theme={theme}
                setTheme={setTheme}
                setPage={setPage}
                unreadCount={unreadCount}
                // Pass hamburger handler; Topbar should render a button when this is provided
                onMenuClick={isMobile ? () => setSidebarOpen(o => !o) : undefined}
                isMobile={isMobile}
              />

              <main style={{ flex: 1, overflowY: "auto" }}>
                {page === "home" && (
                  <HomePage setPage={setPage} setQuizConfig={setQuizConfig} />
                )}

                {page === "profile" && (
                  <ProfilePage student={student} setPage={setPage} />
                )}

                {page === "editprofile" && (
                  <EditProfilePage
                    student={student}
                    setStudent={setStudent}
                    setPage={setPage}
                  />
                )}

                {page === "dashboard" && (
                  <DashboardPage
                    setPage={setPage}
                    setAttemptResult={setAttemptResult}
                    user={student}
                  />
                )}

                {page === "results" && results && (
                  <ResultsPage results={results} setPage={setPage} student={student} />
                )}

                {page === "attempt-result" && attemptResult && (
                  <ResultsPage
                    results={attemptResult}
                    setPage={setPage}
                    fromDashboard
                    student={student}
                  />
                )}

                {page === "announcements" && (
                  <AnnouncementsPage
                    announcements={announcements}
                    setAnnouncements={setAnnouncements}
                    readIds={readIds}
                    markAllRead={markAllRead}
                  />
                )}

                {page === "settings" && (
                  <SettingsPage
                    theme={theme}
                    setTheme={setTheme}
                    setPage={setPage}
                  />
                )}

                {page === "assignments" && (
                  <AssignmentsPage
                    setPage={setPage}
                    setQuizConfig={setQuizConfig}
                  />
                )}

                {page === "assignment_results" && (
                  <AssignmentsResultsPage
                    config={quizConfig}
                    setPage={setPage}
                  />
                )}
              </main>
            </div>
          </>
        )}
      </div>
    </>
  );
}