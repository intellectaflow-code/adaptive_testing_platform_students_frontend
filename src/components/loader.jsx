import { useEffect, useState } from "react";
 
const VARIANTS = {
  test: {
    lines: [
      "Crafting your questions…",
      "Balancing difficulty levels…",
      "Almost ready to challenge you…",
      "Your test is being generated…",
    ],
    icon: "✦",
    accent: "var(--amber, #f59e0b)",
  },
  results: {
    lines: [
      "Tallying your answers…",
      "Crunching the numbers…",
      "Preparing your scorecard…",
      "Loading your results…",
    ],
    icon: "◈",
    accent: "var(--amber, #f59e0b)",
  },
  dashboard: {
    lines: [
      "Fetching your progress…",
      "Syncing your stats…",
      "Building your dashboard…",
      "Loading your overview…",
    ],
    icon: "⬡",
    accent: "var(--amber, #f59e0b)",
  },
  profile: {
    lines: [
      "Loading your profile…",
      "Gathering your history…",
      "Pulling up your account…",
    ],
    icon: "◎",
    accent: "var(--amber, #f59e0b)",
  },
  quiz: {
    lines: [
      "Fetching your questions…",
      "Setting up the test…",
      "Preparing the question set…",
      "Almost ready to begin…",
    ],
    icon: "◧",
    accent: "var(--amber, #f59e0b)",
  },
  submit: {
    lines: [
      "Submitting your answers…",
      "Evaluating your responses…",
      "Checking correct answers…",
      "Calculating your score…",
    ],
    icon: "◉",
    accent: "var(--amber, #f59e0b)",
  },
  announcements: {
    lines: [
      "Fetching your announcements…",
      "Checking for new updates…",
      "Loading messages from your teachers…",
    ],
    icon: "◈",
    accent: "var(--amber, #f59e0b)",
  },
  default: {
    lines: [
      "Hang on a second…",
      "Just a moment…",
      "Loading…",
    ],
    icon: "◌",
    accent: "var(--amber, #f59e0b)",
  },
};
 
export default function Loader({ variant = "default" }) {
  const config = VARIANTS[variant] ?? VARIANTS.default;
  const [lineIndex, setLineIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [dotCount, setDotCount] = useState(0);
 
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setLineIndex((i) => (i + 1) % config.lines.length);
        setFade(true);
      }, 350);
    }, 2200);
    return () => clearInterval(interval);
  }, [config.lines.length]);
 
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((d) => (d + 1) % 4);
    }, 420);
    return () => clearInterval(interval);
  }, []);
 
  const dots = ".".repeat(dotCount);
 
  return (
    <>
      <style>{`
        @keyframes loader-bg-pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.72; }
        }
        @keyframes loader-ring-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes loader-ring2-spin {
          to { transform: rotate(-360deg); }
        }
        @keyframes loader-icon-breathe {
          0%, 100% { transform: scale(1);    opacity: 0.9; }
          50%       { transform: scale(1.18); opacity: 1;   }
        }
        @keyframes loader-orb1 {
          0%   { transform: translate(0px,   0px);  }
          33%  { transform: translate(14px, -10px); }
          66%  { transform: translate(-8px,  16px); }
          100% { transform: translate(0px,   0px);  }
        }
        @keyframes loader-orb2 {
          0%   { transform: translate(0px,  0px);  }
          33%  { transform: translate(-16px, 8px); }
          66%  { transform: translate(10px, -14px);}
          100% { transform: translate(0px,  0px);  }
        }
        @keyframes loader-orb3 {
          0%   { transform: translate(0px,  0px);  }
          50%  { transform: translate(12px, 12px); }
          100% { transform: translate(0px,  0px);  }
        }
        @keyframes loader-bar-fill {
          0%   { width: 0%;  opacity: 1;   }
          70%  { width: 85%; opacity: 1;   }
          90%  { width: 92%; opacity: 0.7; }
          100% { width: 92%; opacity: 0.7; }
        }
        @keyframes loader-bar-shimmer {
          0%   { left: -40%; }
          100% { left: 130%; }
        }
        .loader-text-fade { transition: opacity 0.35s ease, transform 0.35s ease; }
        .loader-text-in   { opacity: 1; transform: translateY(0);   }
        .loader-text-out  { opacity: 0; transform: translateY(6px); }
      `}</style>
 
      <div style={{ position: "fixed", inset: 0, background: "rgba(10,12,18,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, animation: "loader-bg-pulse 3s ease-in-out infinite" }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 28, padding: "44px 52px 36px", background: "rgba(18,20,28,0.92)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px -12px ${config.accent}55`, minWidth: 260, overflow: "hidden" }}>
 
          {/* Ambient orbs */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 20 }}>
            {[
              { color: config.accent, size: 110, top: "-30%", left: "-20%", anim: "loader-orb1 7s ease-in-out infinite" },
              { color: config.accent, size: 90,  top: "60%",  left: "70%",  anim: "loader-orb2 9s ease-in-out infinite" },
              { color: "#6366f1",     size: 70,  top: "20%",  left: "80%",  anim: "loader-orb3 11s ease-in-out infinite" },
            ].map((orb, i) => (
              <div key={i} style={{ position: "absolute", width: orb.size, height: orb.size, borderRadius: "50%", background: `radial-gradient(circle, ${orb.color}28 0%, transparent 70%)`, top: orb.top, left: orb.left, animation: orb.anim, filter: "blur(12px)" }} />
            ))}
          </div>
 
          {/* Spinner rings + icon */}
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <div style={{ position: "absolute", inset: 0,  borderRadius: "50%", border: "2px solid transparent",   borderTopColor: config.accent,         borderRightColor: `${config.accent}55`,  animation: "loader-ring-spin 1.1s cubic-bezier(0.4,0,0.6,1) infinite" }} />
            <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "1.5px solid transparent", borderBottomColor: `${config.accent}90`, borderLeftColor: `${config.accent}33`,  animation: "loader-ring2-spin 1.7s cubic-bezier(0.4,0,0.6,1) infinite" }} />
            <div style={{ position: "absolute", inset: 20, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)", borderTopColor: "rgba(255,255,255,0.22)", animation: "loader-ring-spin 2.5s linear infinite" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: config.accent, animation: "loader-icon-breathe 2.2s ease-in-out infinite", textShadow: `0 0 16px ${config.accent}` }}>
              {config.icon}
            </div>
          </div>
 
          {/* Message */}
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <p className={`loader-text-fade ${fade ? "loader-text-in" : "loader-text-out"}`} style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.82)", letterSpacing: "0.02em", fontFamily: "inherit", minHeight: "1.5em", whiteSpace: "nowrap" }}>
              {config.lines[lineIndex]}
              <span style={{ opacity: 0.5, minWidth: "1.2em", display: "inline-block" }}>{dots}</span>
            </p>
          </div>
 
          {/* Progress bar */}
          <div style={{ position: "relative", width: "100%", height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", background: `linear-gradient(90deg, ${config.accent}aa, ${config.accent})`, borderRadius: 99, animation: "loader-bar-fill 3.5s cubic-bezier(0.4,0,0.2,1) forwards" }} />
            <div style={{ position: "absolute", top: 0, width: "40%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)", animation: "loader-bar-shimmer 1.6s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    </>
  );
}