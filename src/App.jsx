import { useState } from "react";

// Layout
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

// Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import DashboardPage from "./pages/DashboardPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import SettingsPage from "./pages/SettingsPage";
import API from "./api/api";

// Data + utils

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

// App.jsx
const handleLoginSuccess = async (basicData) => {
  setLoggedIn(true);
  try {
    const res = await API.get("/auth/me");
    const fullProfile = res.data;
    setStudent(fullProfile);
    localStorage.setItem("user_data", JSON.stringify(fullProfile)); // ← consistent key
  } catch (err) {
    console.error("Failed to fetch profile", err);
    setStudent(basicData);
    localStorage.setItem("user_data", JSON.stringify(basicData));   // ← also write on fallback
  }
};


const [readIds, setReadIds] = useState(() => {
  const saved = localStorage.getItem("read_announcements");
  return saved ? JSON.parse(saved) : [];
});

const markAllRead = (ids) => {
  localStorage.setItem("read_announcements", JSON.stringify(ids));
  setReadIds(ids);
};

const [announcements, setAnnouncements] = useState([]);
const unreadCount = announcements.filter(a => !readIds.includes(a.id)).length;

const [student, setStudent] = useState(() => {
  const saved = localStorage.getItem("user_data");  // ← matches what login writes
  return saved ? JSON.parse(saved) : null;
});

const handleLogout = () => {
  localStorage.clear(); // Clears tokens and user_data
  setStudent(null);     // Resets state to null (no demo info)
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
        {/* ── Auth screens ── */}
        {isAuth ? (
          <div style={{ flex: 1 }}>
            {authPage === "login"
              ? <LoginPage setAuthPage={setAuthPage} onLogin={handleLoginSuccess} />
              : <SignupPage setAuthPage={setAuthPage} onLogin={handleLoginSuccess} />}
          </div>

        ) : isQuiz ? (
          <div style={{ flex: 1 }}>
            <QuizPage config={quizConfig} setPage={setPage} setResults={setResults} />
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
                marginLeft: col ? 52 : 220,   // 🔥 THIS IS THE FIX
                transition: "margin-left .25s ease",
              }}
            >
             <Topbar page={page} theme={theme} setTheme={setTheme} setPage={setPage} unreadCount={unreadCount} />
              <main style={{ flex: 1, overflowY: "auto" }}>
                {/* ... existing page logic (page === "home", etc) ... */}
                {page === "profile" && <ProfilePage student={student} setPage={setPage} />}
                {page === "editprofile" && (<EditProfilePage key="edit-profile"student={student}setStudent={setStudent}setPage={setPage}/>)}
                {page === "home"           && <HomePage setPage={setPage} setQuizConfig={setQuizConfig} />}
                {page === "results"        && results && <ResultsPage results={results} setPage={setPage} />}
                {page === "attempt-result" && attemptResult && <ResultsPage results={attemptResult} setPage={setPage} fromDashboard />}
                {page === "dashboard"      && <DashboardPage setPage={setPage} setAttemptResult={setAttemptResult} />}
                {page === "announcements" && (<AnnouncementsPage announcements={announcements} setAnnouncements={setAnnouncements} readIds={readIds} markAllRead={markAllRead}/>)}
                {page === "settings"       && <SettingsPage theme={theme} setTheme={setTheme} />}
              </main>
            </div>
          </>
        )}
      </div>
    </>
  );
}
