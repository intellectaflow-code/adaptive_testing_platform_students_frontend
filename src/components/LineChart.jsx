import { useTooltip } from "../hooks/useTooltip";
import Tooltip from "./Tooltip";

export default function LineChart({ data, h = 160 }) {
  const { tip, show, hide } = useTooltip();
  const W = 420, H = h, PAD = { t: 16, r: 16, b: 28, l: 32 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;
  const maxV = Math.max(...data.map((d) => Math.max(d.score, d.avg))) + 5;
  const minV = Math.min(...data.map((d) => Math.min(d.score, d.avg))) - 5;
  const x = (i) => PAD.l + i * (iW / (data.length - 1));
  const y = (v) => PAD.t + iH - ((v - minV) / (maxV - minV)) * iH;
  const pts1 = data.map((_, i) => `${x(i)},${y(data[i].score)}`).join(" ");
  const pts2 = data.map((_, i) => `${x(i)},${y(data[i].avg)}`).join(" ");
  const area1 =
    `M${x(0)},${y(data[0].score)} ` +
    data.map((_, i) => `L${x(i)},${y(data[i].score)}`).join(" ") +
    ` L${x(data.length - 1)},${H - PAD.b} L${x(0)},${H - PAD.b} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(minV + (maxV - minV) * p));

  return (
    <>
      <Tooltip tip={tip} />
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {gridLines.map((v, i) => (
            <g key={i}>
              <line x1={PAD.l} y1={y(v)} x2={W - PAD.r} y2={y(v)} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PAD.l - 6} y={y(v) + 4} fontSize="9" fill="var(--muted)" textAnchor="end">{v}</text>
            </g>
          ))}
          {data.map((d, i) => (
            <text key={i} x={x(i)} y={H - PAD.b + 14} fontSize="9" fill="var(--muted)" textAnchor="middle">{d.month}</text>
          ))}
          <path d={area1} fill="url(#lg1)" />
          <polyline points={pts2} fill="none" stroke="var(--border2)" strokeWidth="2" strokeDasharray="5 3" />
          <polyline points={pts1} fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.score)} r="4" fill="var(--amber)" stroke="var(--bg)" strokeWidth="2"
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => show(e, `${d.month}: You ${d.score}% · Avg ${d.avg}%`)}
              onMouseLeave={hide}
            />
          ))}
          {data.map((d, i) => (
            <circle key={i + "a"} cx={x(i)} cy={y(d.avg)} r="3" fill="var(--border2)" stroke="var(--bg)" strokeWidth="1.5"
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => show(e, `Class Avg ${d.month}: ${d.avg}%`)}
              onMouseLeave={hide}
            />
          ))}
        </svg>
      </div>
    </>
  );
}
