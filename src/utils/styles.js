/** Card base style — surface bg + border + radius */
export const card = (extra = {}) => ({
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  ...extra,
});

/** Score colour based on value */
export const scoreColor = (s) =>
  s >= 80 ? "var(--green)" : s >= 60 ? "var(--amber)" : "var(--red)";

/** Inline pill / badge style */
export const pill = (color, bg) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 9px",
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  color,
  background: bg,
});

/** Two-letter initials from a full name */
export const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
