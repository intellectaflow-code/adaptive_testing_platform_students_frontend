import { useState } from "react";
import API from "../api/api";


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

async function fetchProfileReport(student) {
  const res = await API.get("/profiles/report/download", {
    responseType: "blob",
  });

  const disposition = res.headers["content-disposition"] || "";
  const match       = disposition.match(/filename="?([^"]+)"?/);
  const filename    = match
    ? match[1]
    : `Assessment_Report_${(student?.full_name || "student").replace(/\s+/g, "_")}.pdf`;

  return {
    blob: new Blob([res.data], { type: "application/pdf" }),
    filename,
  };
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

async function downloadBlobDirect(blob, filename) {
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
  mode = "dashboard",   // "result" | "dashboard" | "profile"

  // mode="result"
  attemptId    = null,
  studentName  = "",

  // mode="dashboard"
  user          = {},
  computedStats = {},
  subjects      = [],
  attempts      = [],

  // mode="profile"
  student = {},

  // compact=true → icon-only, no label; fits in table rows / card rows
  compact   = false,
  fullWidth = false,
  isMobile  = false,
}) {
  const [loading, setLoading] = useState(false);

  const disabled =
    loading ||
    (mode === "result"    && !attemptId) ||
    (mode === "dashboard" && attempts.length === 0);

  const handleDownload = async (e) => {
    e?.stopPropagation();
    if (disabled) return;
    setLoading(true);

    try {
      if (mode === "result") {
        const blob     = await fetchResultPDF(attemptId);
        const filename = `result_${safeFilename(studentName || "student")}.pdf`;
        await downloadBlob(blob, filename);

      } else if (mode === "dashboard") {
        const blob     = await fetchDashboardPDF({ user, computedStats, subjects, attempts });
        const filename = `${safeFilename(user?.full_name || "student")}_report.pdf`;
        await downloadBlob(blob, filename);

      } else if (mode === "profile") {
        const { blob, filename } = await fetchProfileReport(student);
        await downloadBlobDirect(blob, filename);
      }

    } catch (err) {
      console.error("Download error:", err);
      if (err.response) console.error("Server response:", err.response);
      alert(
        err?.response?.data?.detail ||
        err.message                 ||
        "Failed to generate report."
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

  // ── Profile style — full-width amber button matching ProfilePage ──
  if (mode === "profile") {
    return (
      <>
        <style>{`@keyframes rp-spin { to { transform: rotate(360deg); } }`}</style>
        <button
          onClick={handleDownload}
          disabled={loading}
          title={title}
          style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            gap:             7,
            width:           "100%",
            marginTop:       14,
            padding:         isMobile ? "9px 14px" : "10px 16px",
            background:      loading ? "var(--surface2)" : "var(--amber)",
            border:          "none",
            borderRadius:    "var(--radius)",
            color:           loading ? "var(--muted)" : "#0C0E14",
            cursor:          loading ? "not-allowed" : "pointer",
            fontSize:        isMobile ? 12 : 13,
            fontWeight:      600,
            transition:      "background 0.2s, opacity 0.2s",
            opacity:         loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <Spinner size={13} />
              Generating report…
            </>
          ) : (
            <>
              <DownloadIcon size={14} />
              Download Detailed Report
            </>
          )}
        </button>
      </>
    );
  }

  // ── Full (label) style — for dashboard / results page ──
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