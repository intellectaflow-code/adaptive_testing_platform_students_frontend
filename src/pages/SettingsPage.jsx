import { useState, useEffect, useCallback } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";

// ── Settings API (inlined) ──────────────────────────────────────────────────
const getSettings = () => API.get("/settings/me").then((r) => r.data);
const updateSetting = (updates) => API.put("/settings/me", updates).then((r) => r.data);
// ───────────────────────────────────────────────────────────────────────────

function Toggle({ v, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!v)}
      style={{
        width: 38, height: 21, borderRadius: 11, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: v ? "var(--amber)" : "var(--border2)",
        position: "relative", transition: "background .2s", flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        position: "absolute", top: 2.5, left: v ? 19 : 2.5,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
      }} />
    </button>
  );
}

function Row({ label, desc, v, onChange, disabled }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "11px 0", borderBottom: "1px solid var(--border)",
    }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--white)", marginBottom: desc ? 2 : 0 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "var(--muted)" }}>{desc}</div>}
      </div>
      <Toggle v={v} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function SettingsPage({ theme, setTheme }) {
  const [settings, setSettings] = useState({
    email_notifications: true,
    quiz_alerts: true,
    auto_fullscreen: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    getSettings()
      .then((data) => setSettings(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback(async (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value })); // optimistic
    setSaving(field);
    try {
      const updated = await updateSetting({ [field]: value });
      setSettings(updated); // sync with server
    } catch (err) {
      console.error("Failed to save setting:", err);
      setSettings((prev) => ({ ...prev, [field]: !value })); // rollback
    } finally {
      setSaving(null);
    }
  }, []);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 540, margin: "0 auto" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--white)", marginBottom: 20 }}>
        Settings
      </h1>

      {/* Appearance */}
      <div style={card({ padding: 20, marginBottom: 11 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 11 }}>
          Appearance
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          {[["dark", "moon", "Dark"], ["light", "sun", "Light"]].map(([id, ico, lbl]) => (
            <button key={id} onClick={() => setTheme(id)}
              style={{
                flex: 1, padding: "13px 0", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 7,
                background: theme === id ? "rgba(240,165,0,0.07)" : "var(--bg)",
                border: `1px solid ${theme === id ? "var(--amber)" : "var(--border2)"}`,
                borderRadius: "var(--radius)", cursor: "pointer",
                color: theme === id ? "var(--amber)" : "var(--muted)",
                transition: "all .15s",
              }}>
              <Icon n={ico} s={17} />
              <span style={{ fontSize: 12, fontWeight: theme === id ? 600 : 400 }}>{lbl}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div style={card({ padding: 20, marginBottom: 11 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 4 }}>
          Notifications
        </div>
        <Row
          label="Email Notifications"
          desc="Updates via email"
          v={settings.email_notifications}
          onChange={(v) => handleToggle("email_notifications", v)}
          disabled={loading || saving === "email_notifications"}
        />
        <Row
          label="New Quiz Alerts"
          desc="When a teacher assigns a test"
          v={settings.quiz_alerts}
          onChange={(v) => handleToggle("quiz_alerts", v)}
          disabled={loading || saving === "quiz_alerts"}
        />
      </div>


      {/* Account */}
      <div style={card({ padding: 20 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 11 }}>
          Account
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 12px",
            background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", cursor: "pointer", color: "var(--body)", fontSize: 13,
          }}>
            <Icon n="shield" s={14} /> Privacy &amp; Security
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 12px",
            background: "rgba(240,96,96,0.05)", border: "1px solid rgba(240,96,96,0.15)",
            borderRadius: "var(--radius)", cursor: "pointer", color: "var(--red)", fontSize: 13,
          }}>
            <Icon n="logout" s={14} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
