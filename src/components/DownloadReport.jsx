import { useState } from "react";
import Icon from "../components/Icon";
import API from "../api/api";

/**
 * Props:
 *  - user          : { name, usn, branch, section }  (from parent)
 *  - computedStats : { tests_taken, avg_score, best_score }
 *  - subjects      : [{ name, score, tests }]
 *  - attempts      : [{ title, subject, attempt_date, score, time_spent_seconds }]
 */
export default function DownloadReport({ user, computedStats, subjects, attempts }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const payload = {
        student: {
          name:    user?.full_name || "N/A",
          usn:     user?.usn       || "N/A",
          branch:  user?.branch    || "N/A",
          section: user?.section   || "N/A",
        },
        stats: {
          tests_taken: computedStats.tests_taken,
          avg_score: parseFloat(computedStats.avg_score) || 0,   // ← was string
          best_score: parseFloat(computedStats.best_score) || 0, // ← safety
        },
        subjects: subjects.map((s) => ({
          name: s.name,
          score: s.score,
          tests: s.tests,
        })),
        attempts: attempts
          .filter((a) => a.attempt_date !== null)  // ← drop null-date attempts
          .slice(0, 8)
          .map((a) => ({
            title: a.title,
            subject: a.subject,
            attempt_date: String(a.attempt_date).slice(0, 10), // "2026-05-04"
            score: a.score || 0,
            time_spent_seconds: a.time_spent_seconds || 0,
          })),
      };

      // Option A: Your backend exposes a PDF generation endpoint
      const res = await API.post("/analytics/student/report", payload, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${user?.name?.replace(/\s+/g, "_") || "student"}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report download failed:", err);
      alert("Failed to download report. Please try again.");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        background: loading ? "var(--surface)" : "var(--amber)",
        border: "none",
        borderRadius: "var(--radius)",
        color: loading ? "var(--muted)" : "#0C0E14",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: 12,
        fontWeight: 600,
        transition: "all .15s",
        opacity: loading ? 0.7 : 1,
      }}
    >
      <Icon n={loading ? "loader" : "download"} s={13} />
      {loading ? "Generating..." : "Download Report"}
    </button>
  );
}   