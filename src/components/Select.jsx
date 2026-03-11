import { useState, useEffect, useRef } from "react";
import Icon from "./Icon";

export default function Select({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const sel = options.find((o) => (o.value || o) === value);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "9px 32px 9px 12px",
          background: "var(--bg)",
          border: "1px solid var(--border2)",
          borderRadius: "var(--radius)",
          color: value ? "var(--white)" : "var(--muted)",
          fontSize: 13,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "border-color .2s",
          outline: "none",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--amber)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border2)")}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {sel ? sel.label || sel : <span style={{ color: "var(--muted)" }}>{placeholder || "Select..."}</span>}
        </span>
        <span
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: "transform .2s",
            color: "var(--muted)",
            display: "flex",
          }}
        >
          <Icon n="chevD" s={14} />
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: "var(--radius)",
            boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            overflow: "hidden",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {options.map((opt, i) => {
            const v = opt.value || opt;
            const l = opt.label || opt;
            return (
              <div
                key={i}
                onClick={() => { onChange(v); setOpen(false); }}
                style={{
                  padding: "9px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: value === v ? "var(--amber)" : "var(--body)",
                  background: value === v ? "rgba(240,165,0,0.07)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "background .12s",
                }}
                onMouseEnter={(e) => { if (value !== v) e.currentTarget.style.background = "var(--surface2)"; }}
                onMouseLeave={(e) => { if (value !== v) e.currentTarget.style.background = "transparent"; }}
              >
                <span>{l}</span>
                {value === v && <span style={{ color: "var(--amber)", fontSize: 10 }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
