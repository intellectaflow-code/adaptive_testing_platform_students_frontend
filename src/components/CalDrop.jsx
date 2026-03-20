import { useState, useEffect } from "react";
import Icon from "./Icon";
import { card } from "../utils/styles";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CalDrop({ onSelect, onClose, currentRange }) {
  const [mo, setMo] = useState(currentRange?.s ? new Date(currentRange.s) : new Date());
  const [rng, setRng] = useState({ s: currentRange?.s || null, e: currentRange?.e || null });

  useEffect(() => {
    setRng({ s: currentRange?.s || null, e: currentRange?.e || null });
    if (currentRange?.s) setMo(new Date(currentRange.s));
  }, [currentRange]);

  const fd = new Date(mo.getFullYear(), mo.getMonth(), 1).getDay();
  const ld = new Date(mo.getFullYear(), mo.getMonth() + 1, 0).getDate();
  const cells = [...Array(fd).fill(null), ...Array.from({ length: ld }, (_, i) => i + 1)];

const pick = (d) => {
  if (!d) return;
  const dt = new Date(mo.getFullYear(), mo.getMonth(), d);

  let newRng;
  if (!rng.s || (rng.s && rng.e)) {
    newRng = { s: dt, e: null };
  } else {
    const s = dt < rng.s ? dt : rng.s;
    const e = dt < rng.s ? rng.s : dt;
    newRng = { s, e };
  }

  setRng(newRng); // ✅ ONLY this
};

  const inR = (d) => {
    if (!d || !rng.s) return false;
    const dt = new Date(mo.getFullYear(), mo.getMonth(), d);
    return rng.e ? dt >= rng.s && dt <= rng.e : dt.toDateString() === rng.s.toDateString();
  };

  return (
    <div style={{ position: "absolute", top: "110%", right: 0, zIndex: 300, ...card({ padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,.5)", minWidth: 252 }) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setMo(new Date(mo.getFullYear(), mo.getMonth() - 1))} style={{ background: "none", color: "var(--muted)", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <Icon n="chevL" s={13} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>
          {MONTHS[mo.getMonth()]} {mo.getFullYear()}
        </span>
        <button onClick={() => setMo(new Date(mo.getFullYear(), mo.getMonth() + 1))} style={{ background: "none", color: "var(--muted)", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <Icon n="chevR" s={13} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} style={{ textAlign: "center", fontSize: 10, color: "var(--muted)", padding: "2px 0" }}>{d}</span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => (
          <button
            key={i}
            onClick={() => pick(d)}
            style={{
              background: inR(d) ? "var(--amber)" : "none",
              border: "none",
              borderRadius: 6,
              padding: "5px 0",
              cursor: d ? "pointer" : "default",
              color: inR(d) ? "#0C0E14" : d ? "var(--body)" : "transparent",
              fontSize: 12,
              fontWeight: inR(d) ? 700 : 400,
            }}
          >
            {d || "·"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={() => {
            const cleared = { s: null, e: null };
            setRng(cleared);
            onSelect(null);
          }}
          style={{ flex: 1, padding: "7px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
        >
          Clear
        </button>

        <button
          onClick={() => {
            onSelect(rng);
            onClose();
          }}
          style={{
            flex: 1,
            padding: "7px",
            background: "var(--amber)",
            border: "none",
            borderRadius: 8,
            color: "#0C0E14",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}