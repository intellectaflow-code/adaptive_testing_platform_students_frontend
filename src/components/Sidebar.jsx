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
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          transition: "width .25s ease",
          zIndex: 100,
          overflow: "hidden",
        }}
    >
      {/* Logo — click to expand/collapse */}
      <div
        style={{
          padding: col ? "20px 0" : "20px 16px",
          borderBottom: "1.5px solid var(--border2)",
          display: "flex",
          alignItems: "center",
          justifyContent: col ? "center" : "flex-start",
          gap: 12,
          minHeight: 68,
        }}
      >
        <button
          onClick={() => setCol(!col)}
          title={col ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "#0C0E14",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "opacity .15s, transform .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = ".85";
            e.currentTarget.style.transform = "scale(0.95)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <img src={logo} alt="logo" style={{ width: 20, height: 20, objectFit: "contain" }} />
        </button>
        {!col && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
            <span
              style={{
                fontSize: 15,
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
                letterSpacing: "0.4px",
                textTransform: "uppercase",
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
          padding: col ? "14px 8px" : "14px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          overflowY: "auto",
        }}
      >
        {/* Optional section label */}
        {!col && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--muted)",
              letterSpacing: "0.7px",
              textTransform: "uppercase",
              padding: "2px 10px 8px",
              opacity: 0.6,
            }}
          >
            Menu
          </span>
        )}

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
                padding: col ? "12px 0" : "11px 12px",
                borderRadius: "var(--radius)",
                border: "none",
                cursor: "pointer",
                background: active ? "rgba(240,165,0,0.12)" : "transparent",
                color: active ? "var(--amber)" : "var(--muted)",
                fontWeight: active ? 600 : 400,
                fontSize: 13.5,
                justifyContent: col ? "center" : "flex-start",
                transition: "background .15s, color .15s",
                whiteSpace: "nowrap",
                overflow: "hidden",
                position: "relative",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "var(--white)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--muted)";
                }
              }}
            >
              {/* Active indicator bar */}
              {active && !col && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "18%",
                    height: "64%",
                    width: 3,
                    borderRadius: "0 3px 3px 0",
                    background: "var(--amber)",
                  }}
                />
              )}
              <Icon n={item.n} s={17} />
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
      <div
        style={{
          borderTop: "1.5px solid var(--border2)",
          padding: col ? "12px 8px" : "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Profile button */}
        <button
          onClick={() => setPage("profile")}
          title={col ? (student?.full_name || "Profile") : ""}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: col ? "12px 0" : "10px 12px",
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
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#0C0E14",
              flexShrink: 0,
              overflow: "hidden",
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
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--white)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {student?.full_name}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                {student?.usn}
              </div>
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
            padding: col ? "11px 0" : "10px 12px",
            borderRadius: "var(--radius)",
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: "var(--red)",
            fontSize: 13.5,
            fontWeight: 500,
            justifyContent: col ? "center" : "flex-start",
            width: "100%",
            opacity: 0.75,
            transition: "opacity .15s, background .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.background = "rgba(255,80,80,0.07)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.75";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Icon n="logout" s={17} />
          {!col && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}