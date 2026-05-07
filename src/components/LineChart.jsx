import { useState, useMemo, useEffect } from "react";
import { useTooltip } from "../hooks/useTooltip";
import Tooltip from "./Tooltip";
import Select from "./Select";

export default function LineChart({ data: rawData, attempts = [], h = 160, onTrendColor }) {
  const { tip, show, hide } = useTooltip();
  const [selectedSubject, setSelectedSubject] = useState("all");

  // ── Build subject list from attempts ──────────────────────────────
  const subjects = useMemo(() => {
    const seen = new Set();
    attempts.forEach((a) => { if (a.subject) seen.add(a.subject); });
    return ["all", ...Array.from(seen)];
  }, [attempts]);

  // ── Filter trend data by subject ──────────────────────────────────
  const filteredData = useMemo(() => {
    let source;

    if (selectedSubject === "all") {
      source = rawData;
    } else {
      const subAttempts = attempts
        .filter((a) => a.subject === selectedSubject)
        .sort((a, b) => new Date(b.attempt_date) - new Date(a.attempt_date));

      source = subAttempts.map((a) => ({
        score: a.score ?? 0,
        avg: a.score ?? 0,
        month: new Date(a.attempt_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }));
    }

    if (!source || source.length === 0) return [];
    return [...source].reverse();
  }, [rawData, attempts, selectedSubject]);

  // ── Trend color ───────────────────────────────────────────────────
const trendColor = useMemo(() => {
  let color = "#22c55e";

  if (filteredData.length >= 2) {
    const first = filteredData[0]?.score ?? 0;
    const last  = filteredData[filteredData.length - 1]?.score ?? 0;
    const diff  = last - first;
    if (diff > 1)        color = "#22c55e";
    else if (diff < -10) color = "#ef4444";
    else if (diff < -1)  color = "#eab308";
    else                 color = "#22c55e";
  } else {
    color = "#f59e0b";
  }

  return color; // ← no longer calls onTrendColor here
}, [filteredData]);

// Notify parent AFTER render, not during
useEffect(() => {
  onTrendColor?.(trendColor);
}, [trendColor, onTrendColor]);

  if (!filteredData || filteredData.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>
        No data for this subject
      </div>
    );
  }

  const W = 420, H = h;
  const PAD = { t: 16, r: 16, b: 28, l: 32 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const values = filteredData.flatMap((d) => [d?.score ?? 0, d?.avg ?? 0]);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const padding = (rawMax - rawMin) * 0.1 || 5;
  const maxV = rawMax + padding;
  const minV = rawMin - padding;
  const range = maxV - minV || 1;

  const x = (i) =>
    filteredData.length === 1
      ? PAD.l + iW / 2
      : PAD.l + i * (iW / (filteredData.length - 1));

  const y = (v) => PAD.t + iH - ((v - minV) / range) * iH;

  const steps = 4;
  const stepSize = range / steps;
  const gridLines = Array.from({ length: steps + 1 }, (_, i) =>
    Math.round(minV + i * stepSize)
  );

  const pts1 = filteredData.map((d, i) => `${x(i)},${y(d?.score ?? 0)}`).join(" ");
  const pts2 = filteredData.map((d, i) => `${x(i)},${y(d?.avg ?? 0)}`).join(" ");
  const area1 =
    `M${x(0)},${y(filteredData[0]?.score ?? 0)} ` +
    filteredData.map((d, i) => `L${x(i)},${y(d?.score ?? 0)}`).join(" ") +
    ` L${x(filteredData.length - 1)},${H - PAD.b} L${x(0)},${H - PAD.b} Z`;

  return (
    <>
      <Tooltip tip={tip} />

      {/* ── Subject dropdown ── */}
      {subjects.length > 1 && (
        <div style={{ marginBottom: 10, maxWidth: 150, height: 20 }}>
          <Select
            value={selectedSubject}
            onChange={setSelectedSubject}
            options={subjects.map((s) => ({
              value: s,
              label: s === "all" ? "All Subjects" : s,
            }))}
            placeholder="Select subject..."
            searchable={subjects.length > 6}
            styleOverrides={{
              button: { padding: "5px 26px 5px 10px", fontSize: 12, borderRadius: 10, minWidth: 150 },
              dropdown: { borderRadius: 12, marginTop: 6 },
            }}
          />
        </div>
      )}

      {/* ── Chart ── */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {gridLines.map((v, i) => (
            <g key={i}>
              <line x1={PAD.l} y1={y(v)} x2={W - PAD.r} y2={y(v)}
                stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PAD.l - 6} y={y(v) + 4} fontSize="9"
                fill="var(--muted)" textAnchor="end">{v}</text>
            </g>
          ))}

          {/* X labels */}
          {filteredData.map((d, i) => {
            const step = Math.ceil(filteredData.length / 5);
            if (i % step !== 0 && i !== filteredData.length - 1) return null;
            return (
              <text key={i} x={x(i)} y={H - PAD.b + 14} fontSize="9"
                fill="var(--muted)" textAnchor="middle">{d.month}</text>
            );
          })}

          {/* Area fill */}
          <path d={area1} fill="url(#lg1)" />

          {/* Avg dashed line — only show for "all" since subject has no class avg */}
          {selectedSubject === "all" && (
            <polyline points={pts2} fill="none"
              stroke="var(--border2)" strokeWidth="2" strokeDasharray="5 3" />
          )}

          {/* Score line */}
          <polyline
            points={pts1}
            fill="none"
            stroke={trendColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: "draw 1s ease forwards",
            }}
          />

          {/* Score dots */}
          {filteredData.map((d, i) => {
            const score = Math.round(d?.score ?? 0);
            const avg   = Math.round(d?.avg ?? 0);
            return (
              <g key={i}>
                <circle cx={x(i)} cy={y(score)} r="10" fill="transparent"
                  onMouseEnter={(e) =>
                    show(e, selectedSubject === "all"
                      ? `${d.month}: You ${score}% · Avg ${avg}%`
                      : `${d.month}: ${score}%`)
                  }
                  onMouseLeave={hide}
                />
                <circle cx={x(i)} cy={y(score)} r="4"
                  fill={trendColor} stroke="var(--bg)" strokeWidth="2" />
              </g>
            );
          })}

          {/* Avg dots — only for "all" */}
          {selectedSubject === "all" && filteredData.map((d, i) => {
            const avg = Math.round(d?.avg ?? 0);
            return (
              <circle key={`avg-${i}`} cx={x(i)} cy={y(avg)} r="3"
                fill="var(--border2)" stroke="var(--bg)" strokeWidth="1.5"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => show(e, `Class Avg ${d.month}: ${avg}%`)}
                onMouseLeave={hide}
              />
            );
          })}
        </svg>
      </div>

      <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
    </>
  );
}