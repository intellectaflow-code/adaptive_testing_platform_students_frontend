export default function Tooltip({ tip }) {
  if (!tip) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: tip.x + 12,
        top: tip.y - 36,
        zIndex: 9999,
        background: "var(--surface2)",
        border: "1px solid var(--border2)",
        borderRadius: 8,
        padding: "5px 10px",
        fontSize: 12,
        color: "var(--white)",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 12px rgba(0,0,0,.4)",
      }}
    >
      {tip.text}
    </div>
  );
}
