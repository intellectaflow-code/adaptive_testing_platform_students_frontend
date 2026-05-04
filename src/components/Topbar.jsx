import Icon from "./Icon";

const PAGE_TITLES = {
  home: "Home",
  dashboard: "Dashboard",
  announcements: "Announcements",
  profile: "Profile",
  settings: "Settings",
  editprofile: "Edit Profile",
  assignments: "Assignments",
  results: "Quiz Results",
  "attempt-result": "Attempt Result",
  assignment_results: "Assignment Results",
};

export default function Topbar({ page, theme, setTheme, setPage, unreadCount = 0, onMenuClick, isMobile }) {
  return (
    <div
      style={{
        padding: isMobile ? "12px 16px" : "14px 28px",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left side: hamburger (mobile) + page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* ✅ Hamburger button — only rendered on mobile */}
        {isMobile && onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "border-color .15s, color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--amber)";
              e.currentTarget.style.color = "var(--amber)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            {/* Hamburger icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <line x1="2" y1="4" x2="14" y2="4" />
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="2" y1="12" x2="14" y2="12" />
            </svg>
          </button>
        )}

        {/* Page title */}
        <span
          style={{
            fontSize: isMobile ? 14 : 15,
            fontWeight: 700,
            color: "var(--white)",
            textDecoration: "underline",
            textUnderlineOffset: 5,
            textDecorationColor: "var(--border2)",
            textDecorationThickness: 1,
          }}
        >
          {PAGE_TITLES[page] || ""}
        </span>
      </div>

      {/* Right side: Bell + Theme toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Bell */}
        <button
          onClick={() => setPage("announcements")}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            transition: "border-color .15s, color .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--amber)";
            e.currentTarget.style.color = "var(--amber)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          <Icon n="bell" s={15} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--amber)",
                border: "1.5px solid var(--surface)",
              }}
            />
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color .15s, color .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--amber)";
            e.currentTarget.style.color = "var(--amber)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          <Icon n={theme === "dark" ? "sun" : "moon"} s={15} />
        </button>
      </div>
    </div>
  );
}