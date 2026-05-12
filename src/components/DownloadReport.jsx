import { useState } from "react";
import Icon from "../components/Icon";
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
 * Both modes share the same loading / error / blob-download flow.
 */

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Fetches the PDF blob from the API.
 * Returns a Blob on success; throws on network error or non-PDF response.
 */
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

/**
 * Validates that the blob starts with the %PDF magic bytes,
 * then triggers a browser download with the given filename.
 */
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
}) {
  const [loading, setLoading] = useState(false);

  // result  → needs a valid attemptId
  // dashboard → needs at least one attempt to report on
  const disabled =
    loading ||
    (mode === "result"    && !attemptId) ||
    (mode === "dashboard" && attempts.length === 0);

  const handleDownload = async () => {
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
      }}
    >
      {loading ? (
        <>
          <Spinner />
          Generating…
        </>
      ) : (
        <>
          <DownloadIcon />
          Download PDF
        </>
      )}
    </button>
  );
}

// ── Tiny sub-components ──────────────────────────────────────────────────────

function Spinner() {
  return (
    <span
      style={{
        width:          12,
        height:         12,
        border:         "2px solid var(--border2)",
        borderTopColor: "var(--body)",
        borderRadius:   "50%",
        flexShrink:     0,
        animation:      "rp-spin 0.7s linear infinite",
      }}
    />
  );
}

function DownloadIcon() {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}