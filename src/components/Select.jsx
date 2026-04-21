import { useState, useEffect, useRef } from "react";
import Icon from "./Icon";

export default function Select({ value, onChange, options, placeholder, styleOverrides = {}, searchable = false, disabled = false }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const ref               = useRef();

  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (!open || !searchable) return;
    const fn = (e) => {
      if (e.key === "Backspace") {
        setQuery((q) => q.slice(0, -1));
      } else if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      } else if (e.key.length === 1) {
        setQuery((q) => q + e.key);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, searchable]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const sel = options.find((o) => (o.value || o) === value);

  const filtered = searchable && query.trim()
    ? options.filter((o) => {
        const label = o.label || o;
        return label.toLowerCase().includes(query.toLowerCase());
      })
    : options;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        userSelect: "none",
        minWidth: 0,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <button
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        style={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          padding: "9px 32px 9px 12px",
          background: "var(--bg)",
          border: "1px solid var(--border2)",
          borderRadius: "var(--radius)",
          color: value ? "var(--white)" : "var(--muted)",
          fontSize: 13,
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "border-color .2s",
          outline: "none",
          ...styleOverrides.button,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--amber)")}
        onBlur={(e)  => (e.currentTarget.style.borderColor = styleOverrides.button?.borderColor || "var(--border2)")}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
          {sel
            ? sel.label || sel
            : <span style={{ color: "var(--muted)" }}>{placeholder || "Select..."}</span>}
        </span>
        <span style={{
          position: "absolute", right: 10, top: "50%",
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          transition: "transform .2s", color: "var(--muted)", display: "flex",
        }}>
          <Icon n="chevD" s={14} />
        </span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          // All defaults use CSS variables — light mode gets light surface, dark gets dark
          background: "var(--surface)",
          border: "1px solid var(--border2)",
          borderRadius: "var(--radius)",
          boxShadow: "0 8px 24px rgba(0,0,0,.15)",
          overflow: "hidden",
          // styleOverrides.dropdown can still tweak sizing/radius but should NOT set background
          ...styleOverrides.dropdown,
        }}>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length > 0 ? filtered.map((opt, i) => {
              const v = opt.value || opt;
              const l = opt.label  || opt;
              const isSelected = value === v;
              return (
                <div
                  key={i}
                  onClick={() => { onChange(v); setOpen(false); setQuery(""); }}
                  style={{
                    padding: "9px 12px",
                    cursor: "pointer",
                    fontSize: 13,
                    color: isSelected ? "var(--amber)" : "var(--body)",
                    background: isSelected ? "rgba(240,165,0,0.07)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background .12s",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--surface2)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <span>{l}</span>
                  {isSelected && <span style={{ color: "var(--amber)", fontSize: 10 }}>✓</span>}
                </div>
              );
            }) : (
              <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
                No results for "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}