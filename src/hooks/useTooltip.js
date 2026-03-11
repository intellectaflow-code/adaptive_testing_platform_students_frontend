import { useState } from "react";

/**
 * Lightweight tooltip hook.
 * Returns { tip, show, hide } — pass tip to <Tooltip />.
 */
export function useTooltip() {
  const [tip, setTip] = useState(null);
  return {
    tip,
    show: (e, text) => setTip({ x: e.clientX, y: e.clientY, text }),
    hide: () => setTip(null),
  };
}
