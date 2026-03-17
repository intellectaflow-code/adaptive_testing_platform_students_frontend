import { useTooltip } from "../hooks/useTooltip";
import Tooltip from "./Tooltip";

export default function RadialChart({ subjects }) {
  const { tip, show, hide } = useTooltip();
  const cx = 110, cy = 110, r = 80;
  const segments = subjects.length;
            const avg =
                subjects.length > 0
                  ? Math.round(
                      subjects.reduce((sum, s) => sum + (s.score || 0), 0) / subjects.length
                    )
                  : 0;

  return (
    <>
      <Tooltip tip={tip} />
      <svg viewBox="0 0 220 220" width={220} height={220} style={{ display: "block", margin: "0 auto" }}>
        {subjects.map((s, i) => {
          const startAngle = (i / segments) * 2 * Math.PI - Math.PI / 2;
          const endAngle = ((i + 1) / segments) * 2 * Math.PI - Math.PI / 2;
          const innerR = 40, fullR = r;
          const safeScore = s.score; // if already 0–100
          const scoreR = innerR + (safeScore / 100) * (fullR - innerR);

          const x1 = cx + innerR * Math.cos(startAngle + 0.05);
          const y1 = cy + innerR * Math.sin(startAngle + 0.05);
          const x2 = cx + scoreR * Math.cos(startAngle + 0.05);
          const y2 = cy + scoreR * Math.sin(startAngle + 0.05);
          const x3 = cx + scoreR * Math.cos(endAngle - 0.05);
          const y3 = cy + scoreR * Math.sin(endAngle - 0.05);
          const x4 = cx + innerR * Math.cos(endAngle - 0.05);
          const y4 = cy + innerR * Math.sin(endAngle - 0.05);

          const bgX1 = cx + innerR * Math.cos(startAngle + 0.05);
          const bgY1 = cy + innerR * Math.sin(startAngle + 0.05);
          const bgX2 = cx + fullR * Math.cos(startAngle + 0.05);
          const bgY2 = cy + fullR * Math.sin(startAngle + 0.05);
          const bgX3 = cx + fullR * Math.cos(endAngle - 0.05);
          const bgY3 = cy + fullR * Math.sin(endAngle - 0.05);
          const bgX4 = cx + innerR * Math.cos(endAngle - 0.05);
          const bgY4 = cy + innerR * Math.sin(endAngle - 0.05);


          return (
            <g key={i} style={{ cursor: "pointer" }}
              onMouseEnter={(e) => show(e, `${s.name}: ${s.score}%`)}
              onMouseLeave={hide}
            >
              <path
                d={`M${bgX1},${bgY1} L${bgX2},${bgY2} A${fullR},${fullR} 0 0,1 ${bgX3},${bgY3} L${bgX4},${bgY4} A${innerR},${innerR} 0 0,0 ${bgX1},${bgY1} Z`}
                fill="var(--border2)" opacity="0.4"
                style={{ transition: "all 0.3s ease" }}
              />
              <path
                d={`M${x1},${y1} L${x2},${y2} A${scoreR},${scoreR} 0 0,1 ${x3},${y3} L${x4},${y4} A${innerR},${innerR} 0 0,0 ${x1},${y1} Z`}
                fill={s.color || "#f59e0b"} opacity="0.85"
                style={{ transition: "all 0.3s ease" }}
              />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={38} fill="var(--bg)" />
        <text
            x={cx}
            y={cy - 5}
            textAnchor="middle"
            fontSize="18"
            fontWeight="700"
            fill="var(--white)"
          >
            {avg}%
          </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">avg score</text>
      </svg>
    </>
  );
}
