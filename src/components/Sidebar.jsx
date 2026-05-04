import { useState } from "react";
import Icon from "./Icon";
import { initials } from "../utils/styles";
import logo from "../utils/logo.png";

const NAV_ITEMS = [
  { id: "home",          n: "home",      label: "Home" },
  { id: "dashboard",     n: "chart",     label: "Dashboard" },
  { id: "assignments",   n: "file-text", label: "Assignments" },
  { id: "announcements", n: "megaphone", label: "Announcements" },
];

export default function Sidebar({ page, setPage, student, onLogout, col, setCol }) {
  return (
    <aside
      style={{
        width: col ? 52 : 220,
        height: "100%",         
        minHeight: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width .25s ease",
        zIndex: "inherit",
        overflow: "hidden",
      }}
    >
      {/* Logo — click to expand/collapse */}
      <div
        style={{
          padding: "16px 12px 14px",
          borderBottom: "1.5px solid var(--border2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 54,
        }}
      >
        <button
          onClick={() => setCol(!col)}
          title={col ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "#0C0E14",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "opacity .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <img src={logo} alt="logo" style={{ width: 20, height: 20, objectFit: "contain" }} />
        </button>
        {!col && (
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--white)",
                letterSpacing: "-0.2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              IntellectaFlow
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                letterSpacing: "0.3px",
              }}
            >
              Student Portal
            </span>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav
        style={{
          flex: 1,
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          overflowY: "auto",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              title={col ? item.label : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: col ? "10px 12px" : "9px 10px",
                borderRadius: "var(--radius)",
                border: "none",
                cursor: "pointer",
                background: active ? "rgba(240,165,0,0.1)" : "none",
                color: active ? "var(--amber)" : "var(--muted)",
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                justifyContent: col ? "center" : "flex-start",
                transition: "all .15s",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <Icon n={item.n} s={16} />
              {!col && (
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div style={{ borderTop: "1.5px solid var(--border2)", padding: "10px 8px" }}>
        {/* Profile button */}
        <button
          onClick={() => setPage("profile")}
          title={col ? (student?.full_name || "Profile") : ""}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: col ? "10px 12px" : "9px 10px",
            marginBottom: 4,
            background: page === "profile" ? "rgba(240,165,0,0.08)" : "var(--surface2)",
            borderRadius: "var(--radius)",
            border: page === "profile" ? "1px solid var(--amber)" : "1px solid var(--border)",
            cursor: "pointer",
            width: "100%",
            justifyContent: col ? "center" : "flex-start",
            transition: "all .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "#0C0E14",
              flexShrink: 0,
              overflow: "hidden",
              padding: 0,
            }}
          >
            {student?.profile_photo ? (
              <img
                src={student.profile_photo}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              initials(student?.full_name || "")
            )}
          </div>
          {!col && student && (
            <div style={{ overflow: "hidden", textAlign: "left" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--white)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {student?.full_name}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>{student?.usn}</div>
            </div>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          title={col ? "Log Out" : ""}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: col ? "10px 12px" : "9px 10px",
            borderRadius: "var(--radius)",
            border: "none",
            cursor: "pointer",
            background: "none",
            color: "var(--red)",
            fontSize: 13,
            justifyContent: col ? "center" : "flex-start",
            width: "100%",
            opacity: 0.8,
            transition: "opacity .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
        >
          <Icon n="logout" s={16} />
          {!col && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}