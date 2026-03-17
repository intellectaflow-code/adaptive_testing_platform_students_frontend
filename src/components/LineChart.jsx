import { useMemo } from "react";
import { useTooltip } from "../hooks/useTooltip";
import Tooltip from "./Tooltip";

export default function LineChart({ data, h = 160 }) {
  const { tip, show, hide } = useTooltip();

  if (!data || data.length === 0) return null;

  const W = 420,
    H = h,
    PAD = { t: 16, r: 16, b: 28, l: 32 };

  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  // 🔥 Normalize & extract values safely
  const values = data.flatMap((d) => [
    d?.score ?? 0,
    d?.avg ?? 0,
  ]);

  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);

  const padding = (rawMax - rawMin) * 0.1 || 5;

  const maxV = rawMax + padding;
  const minV = rawMin - padding;

  const range = maxV - minV || 1;

  // 📐 Scaling functions
  const x = (i) =>
    data.length === 1
      ? PAD.l + iW / 2
      : PAD.l + i * (iW / (data.length - 1));

  const y = (v) =>
    PAD.t + iH - ((v - minV) / range) * iH;

  // ⚡ Memoized paths
  const { pts1, pts2, area1 } = useMemo(() => {
    const p1 = data
      .map((d, i) => `${x(i)},${y(d?.score ?? 0)}`)
      .join(" ");

    const p2 = data
      .map((d, i) => `${x(i)},${y(d?.avg ?? 0)}`)
      .join(" ");

    const area =
      `M${x(0)},${y(data[0]?.score ?? 0)} ` +
      data
        .map((d, i) => `L${x(i)},${y(d?.score ?? 0)}`)
        .join(" ") +
      ` L${x(data.length - 1)},${H - PAD.b} ` +
      `L${x(0)},${H - PAD.b} Z`;

    return { pts1: p1, pts2: p2, area1: area };
  }, [data]);

  // 📊 Clean grid steps
  const steps = 4;
  const stepSize = range / steps;

  const gridLines = Array.from({ length: steps + 1 }, (_, i) =>
    Math.round(minV + i * stepSize)
  );

  return (
    <>
      <Tooltip tip={tip} />

      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: H }}
        >
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--amber)"
                stopOpacity="0.18"
              />
              <stop
                offset="100%"
                stopColor="var(--amber)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {/* Grid */}
          {gridLines.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD.l}
                y1={y(v)}
                x2={W - PAD.r}
                y2={y(v)}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <text
                x={PAD.l - 6}
                y={y(v) + 4}
                fontSize="9"
                fill="var(--muted)"
                textAnchor="end"
              >
                {v}
              </text>
            </g>
          ))}

          {/* X labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={x(i)}
              y={H - PAD.b + 14}
              fontSize="9"
              fill="var(--muted)"
              textAnchor="middle"
            >
              {d.month}
            </text>
          ))}

          {/* Area */}
          <path d={area1} fill="url(#lg1)" />

          {/* Avg line */}
          <polyline
            points={pts2}
            fill="none"
            stroke="var(--border2)"
            strokeWidth="2"
            strokeDasharray="5 3"
          />

          {/* Score line (animated) */}
          <polyline
            points={pts1}
            fill="none"
            stroke="var(--amber)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: "draw 1s ease forwards",
            }}
          />

          {/* Score points */}
          {data.map((d, i) => {
            const score = Math.round(d?.score ?? 0);
            const avg = Math.round(d?.avg ?? 0);

            return (
              <g key={i}>
                {/* Invisible hover area */}
                <circle
                  cx={x(i)}
                  cy={y(score)}
                  r="10"
                  fill="transparent"
                  onMouseEnter={(e) =>
                    show(
                      e,
                      `${d.month}: You ${score}% · Avg ${avg}%`
                    )
                  }
                  onMouseLeave={hide}
                />

                {/* Visible point */}
                <circle
                  cx={x(i)}
                  cy={y(score)}
                  r="4"
                  fill="var(--amber)"
                  stroke="var(--bg)"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Avg points */}
          {data.map((d, i) => {
            const avg = Math.round(d?.avg ?? 0);

            return (
              <circle
                key={`avg-${i}`}
                cx={x(i)}
                cy={y(avg)}
                r="3"
                fill="var(--border2)"
                stroke="var(--bg)"
                strokeWidth="1.5"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) =>
                  show(e, `Class Avg ${d.month}: ${avg}%`)
                }
                onMouseLeave={hide}
              />
            );
          })}
        </svg>
      </div>

      {/* Animation */}
      <style>
        {`
          @keyframes draw {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>
    </>
  );
}