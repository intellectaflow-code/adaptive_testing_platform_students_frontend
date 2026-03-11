import { useTooltip } from "../hooks/useTooltip";
import Tooltip from "./Tooltip";

export default function AttendanceBar({ data, h = 160 }) {
  const { tip, show, hide } = useTooltip();

  return (
    <>
      <Tooltip tip={tip} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: h, paddingBottom: 24, position: "relative" }}>
        {data.map((d, i) => {
          const barH = (d.pct / 100) * (h - 28);
          const col = d.pct >= 85 ? "var(--green)" : d.pct >= 70 ? "var(--amber)" : "var(--red)";
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 10, color: col, fontWeight: 600 }}>{d.pct}%</span>
              <div style={{ width: "100%", position: "relative", cursor: "pointer" }}
                onMouseEnter={(e) => show(e, `${d.month}: ${d.pct}% attendance`)}
                onMouseLeave={hide}
              >
                <div
                  style={{ width: "100%", height: barH, background: col, borderRadius: "4px 4px 0 0", opacity: 0.85, transition: "opacity .15s", minHeight: 4 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
                />
              </div>
              <span style={{ fontSize: 10, color: "var(--muted)", position: "absolute", bottom: 0 }}>{d.month}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
