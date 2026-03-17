import { useMemo } from "react";
import { useTooltip } from "../hooks/useTooltip";
import Tooltip from "./Tooltip";

export default function AttendanceBar({ attempts = [], h = 160 }) {
  const { tip, show, hide } = useTooltip();

  const data = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const map = days.map((d) => ({
      day: d,
      count: 0,
      pct: 0,
    }));

    // 🔥 Count tests per day
    attempts.forEach((a) => {
      if (!a?.attempt_date) return;

      const d = new Date(a.attempt_date).getDay();
      map[d].count += 1;
    });

    const total = map.reduce((sum, d) => sum + d.count, 0) || 1;

    // 🔥 Convert to % of total activity
    return map.map((d) => ({
      ...d,
      pct: Math.round((d.count / total) * 100),
    }));
  }, [attempts]);

  return (
    <>
      <Tooltip tip={tip} />

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          height: h
        }}
      >
        {data.map((d, i) => {
          const barH = (d.pct / 100) * (h - 28);

          const col =
            d.pct >= 25
              ? "var(--green)"
              : d.pct >= 10
              ? "var(--amber)"
              : "var(--red)";

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 4,
              }}
            >
              {/* % */}
              <span
                style={{
                  fontSize: 10,
                  color: col,
                  fontWeight: 600,
                }}
              >
                {d.pct}%
              </span>

              {/* Bar */}
              <div
                style={{ width: "100%", cursor: "pointer" }}
                onMouseEnter={(e) =>
                  show(
                    e,
                    `${d.day}: ${d.count} test${
                      d.count !== 1 ? "s" : ""
                    } (${d.pct}%)`
                  )
                }
                onMouseLeave={hide}
              >
                <div
                  style={{
                    width: "100%",
                    height: barH,
                    background: col,
                    borderRadius: "4px 4px 0 0",
                    opacity: 0.85,
                    minHeight: d.count ? 6 : 2,
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.opacity = "1")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.opacity = "0.85")
                  }
                />
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                }}
              >
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}