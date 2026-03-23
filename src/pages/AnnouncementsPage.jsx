import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { card, pill } from "../utils/styles";
import API from "../api/api";
import Loader from "../components/loader";
 
const prCol = (p) => p === "high" ? "var(--red)" : p === "medium" ? "var(--amber)" : "var(--muted)";
const prBg  = (p) => p === "high" ? "rgba(240,96,96,0.08)" : p === "medium" ? "rgba(240,165,0,0.08)" : "rgba(90,95,122,0.1)";
 
export default function AnnouncementsPage({ announcements, setAnnouncements, readIds, markAllRead }) {
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(!announcements.length);
 
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
 
  const filtered = filter === "new"
    ? announcements.filter(a => new Date(a.created_at) >= oneWeekAgo)
    : announcements;
 
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await API.get("/announcements");
        setAnnouncements(res.data);
        markAllRead(res.data.map(a => a.id));
      } catch (err) {
        console.error("Failed to fetch announcements", err);
      } finally {
        setLoading(false);
      }
    };
 
    fetchAnnouncements();
  }, []);
 
  if (loading) return <Loader variant="announcements" />;
 
  return (
    <div style={{ padding: "24px 28px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Announcements</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Latest updates from your teachers</p>
        </div>
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {[["all", "All"], ["new", "New"]].map(([id, lbl]) => (
            <button key={id} onClick={() => setFilter(id)}
              style={{ padding: "6px 13px", border: "none", cursor: "pointer", background: filter === id ? "var(--amber)" : "transparent", color: filter === id ? "#0C0E14" : "var(--muted)", fontWeight: filter === id ? 700 : 400, fontSize: 12, transition: "all .15s" }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
 
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((a) => (
          <div key={a.id}
            style={{ ...card({ padding: 0 }), overflow: "hidden", cursor: "pointer", transition: "border-color .15s" }}
            onClick={() => setOpen(open === a.id ? null : a.id)}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border2)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(240,165,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--amber)", flexShrink: 0 }}>
                <Icon n="megaphone" s={16} />
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--white)" }}>{a.title}</span>
                  {a.isNew && <span style={pill("var(--amber)", "rgba(240,165,0,0.12)")}>New</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 6 }}>
                  <span>{a.course_name || "General"}</span>
                  <span>•</span>
                  <span>{a.teacher_name}</span>
                  <span>•</span>
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                {open !== a.id && (
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.message}</p>
                )}
              </div>
              <span style={{ color: "var(--muted)", transform: `rotate(${open === a.id ? 180 : 0}deg)`, transition: "transform .2s", flexShrink: 0 }}>
                <Icon n="chevD" s={15} />
              </span>
            </div>
            {open === a.id && (
              <div style={{ padding: "0 18px 16px 66px" }}>
                <div style={{ padding: "12px 14px", background: "var(--bg)", borderRadius: "var(--radius)", border: "1px solid var(--border2)" }}>
                  <p style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.7, margin: 0 }}>{a.message}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>No announcements found</div>
        )}
      </div>
    </div>
  );
}