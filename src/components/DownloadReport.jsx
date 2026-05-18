import { useState } from "react";
import API from "../api/api";

/**
 * DownloadReport — unified PDF download button.
 *
 * mode="result"    → GET /quizzes/student/report/result/:attemptId
 *   Required props: attemptId (string | number)
 *   Optional props: studentName (string)  — used in the saved filename
 *
 * mode="dashboard" → POST /analytics/student/report  (with JSON payload)
 *   Required props: user, computedStats, subjects, attempts
 *
 * compact=true → icon-only button, fits inside table cells / card rows
 */

// ── Internal helpers ─────────────────────────────────────────────────────────

async function fetchResultPDF(attemptId) {
  const res = await API.get(
    `/quizzes/student/report/result/${attemptId}`,
    { responseType: "blob" }
  );
  return new Blob([res.data], { type: "application/pdf" });
}

async function fetchDashboardPDF({ user, computedStats, subjects, attempts }) {
  const payload = {
    student: {
      name:    user?.full_name || "N/A",
      usn:     user?.usn       || "N/A",
      branch:  user?.branch    || "N/A",
      section: user?.section   || "N/A",
    },
    stats: {
      tests_taken: computedStats.tests_taken,
      avg_score:   parseFloat(computedStats.avg_score)  || 0,
      best_score:  parseFloat(computedStats.best_score) || 0,
    },
    subjects: subjects.map((s) => ({
      name:  s.name,
      score: s.score,
      tests: s.tests,
    })),
    attempts: attempts
      .filter((a) => a.attempt_date !== null)
      .slice(0, 8)
      .map((a) => ({
        title:              a.title,
        subject:            a.subject,
        attempt_date:       String(a.attempt_date).slice(0, 10),
        score:              a.score              || 0,
        time_spent_seconds: a.time_spent_seconds || 0,
      })),
  };

  const res = await API.post("/analytics/student/report", payload, {
    responseType: "blob",
  });
  return new Blob([res.data], { type: "application/pdf" });
}

async function downloadBlob(blob, filename) {
  const header = await blob.slice(0, 20).text();
  if (!header.includes("%PDF")) {
    throw new Error("Server did not return a valid PDF.");
  }

  const url = window.URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1_000);
}

function safeFilename(name = "student") {
  return name.replace(/\s+/g, "_");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DownloadReport({
  // shared
  mode = "dashboard",   // "result" | "dashboard"

  // mode="result"
  attemptId    = null,
  studentName  = "",

  // mode="dashboard"
  user          = {},
  computedStats = {},
  subjects      = [],
  attempts      = [],

  // compact=true → icon-only, no label; fits in table rows / card rows
  compact = false,
}) {
  const [loading, setLoading] = useState(false);

  const disabled =
    loading ||
    (mode === "result"    && !attemptId) ||
    (mode === "dashboard" && attempts.length === 0);

  const handleDownload = async (e) => {
    // Always stop propagation so clicking inside a <tr onClick> row
    // doesn't also trigger row navigation
    e?.stopPropagation();
    if (disabled) return;
    setLoading(true);

    try {
      let blob;
      let filename;

      if (mode === "result") {
        blob     = await fetchResultPDF(attemptId);
        filename = `result_${safeFilename(studentName || "student")}.pdf`;
      } else {
        blob     = await fetchDashboardPDF({ user, computedStats, subjects, attempts });
        filename = `${safeFilename(user?.full_name || "student")}_report.pdf`;
      }

      await downloadBlob(blob, filename);
    } catch (err) {
      console.error("PDF download error:", err);
      if (err.response) console.error("Server response:", err.response);

      alert(
        err?.response?.data?.detail ||
        err.message                 ||
        "Failed to generate PDF."
      );
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "result" && !attemptId
      ? "No attempt ID available"
      : mode === "dashboard" && attempts.length === 0
      ? "No attempts to report on yet"
      : "Download your result as a PDF report";

  // ── Compact (icon-only) style — for table cells and card rows ──
  if (compact) {
    return (
      <button
        onClick={handleDownload}
        disabled={disabled}
        title={title}
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          28,
          height:         28,
          padding:        0,
          background:     disabled ? "var(--surface2)" : "rgba(240,165,0,0.1)",
          border:         `1px solid ${disabled ? "var(--border2)" : "rgba(240,165,0,0.3)"}`,
          borderRadius:   "var(--radius)",
          color:          disabled ? "var(--muted)" : "var(--amber)",
          cursor:         disabled ? "not-allowed" : "pointer",
          opacity:        disabled ? 0.5 : 1,
          flexShrink:     0,
          transition:     "opacity 0.15s, background 0.15s",
        }}
      >
        {loading ? <Spinner size={11} /> : <DownloadIcon size={13} />}
      </button>
    );
  }

  // ── Full (label) style — for header / results page ──
  return (
    <button
      onClick={handleDownload}
      disabled={disabled}
      title={title}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            6,
        padding:        "8px 18px",
        background:     "var(--amber)",
        border:         "1px solid var(--border2)",
        borderRadius:   "var(--radius)",
        color:          "black",
        cursor:         disabled ? "not-allowed" : "pointer",
        fontSize:       12,
        fontWeight:     600,
        opacity:        disabled ? 0.5 : 1,
        transition:     "opacity 0.15s",
        whiteSpace:     "nowrap",
      }}
    >
      {loading ? (
        <>
          <Spinner size={12} />
          Generating…
        </>
      ) : (
        <>
          <DownloadIcon size={13} />
          Download PDF
        </>
      )}
    </button>
  );
}

// ── Tiny sub-components ──────────────────────────────────────────────────────

function Spinner({ size = 12 }) {
  return (
    <span
      style={{
        width:          size,
        height:         size,
        border:         "2px solid var(--border2)",
        borderTopColor: "var(--body)",
        borderRadius:   "50%",
        flexShrink:     0,
        display:        "inline-block",
        animation:      "rp-spin 0.7s linear infinite",
      }}
    />
  );
}

function DownloadIcon({ size = 13 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}