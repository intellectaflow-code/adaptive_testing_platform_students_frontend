import Icon from "../components/Icon";
import { card, initials } from "../utils/styles";

const BADGES = [
  { e: "⚡", label: "Speed Demon",  desc: "5 tests under 10 min",  earned: true  },
  { e: "🎯", label: "Sharpshooter", desc: "90%+ accuracy × 3",    earned: true  },
  { e: "🔥", label: "On Fire",      desc: "7-day streak",          earned: true  },
  { e: "🧠", label: "AI Master",    desc: "10 AI tests done",      earned: false },
  { e: "📚", label: "Bookworm",     desc: "All subjects tried",    earned: false },
  { e: "🏆", label: "Champion",     desc: "Rank #1 in class",      earned: false },
];

export default function ProfilePage({ student, setPage }) {
  return (
    <div style={{ padding: "24px 28px", maxWidth: 760, margin: "0 auto" }}>
      <div style={card({ padding: "24px 26px", marginBottom: 12 })}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 62, height: 62, borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#0C0E14", flexShrink: 0 }}>
            {initials(student.full_name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--white)", marginBottom: 2 }}>{student.full_name}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 9 }}>{student.email}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[student.usn, student.branch, `Sem ${student.semester}`, `Sec ${student.section}`].map((v, i) => (
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginBottom: 12 }}>
        {[["23", "Tests"], ["81%", "Avg Score"], ["#3", "Rank"], ["7d", "Streak"]].map(([v, l], i) => (
          <div key={i} style={card({ padding: "13px 15px", textAlign: "center" })}>
            <div style={{ fontSize: 19, fontWeight: 700, color: "var(--amber)", marginBottom: 2 }}>{v}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={card({ padding: 20 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 12 }}>Achievements</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {BADGES.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", opacity: b.earned ? 1 : 0.38 }}>
              <span style={{ fontSize: 20 }}>{b.e}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--white)" }}>{b.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{b.desc}</div>
                {b.earned && <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 600 }}>✓ Earned</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
