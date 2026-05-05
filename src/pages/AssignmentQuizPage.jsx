import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";
import Loader from "../components/loader";

function wordCount(text = "") {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatDate(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ── useIsMobile hook ──
function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [breakpoint]);
  return mobile;
}

// ConfirmModal
function ConfirmModal({ show, title, body, onCancel, onConfirm, cancelTxt, confirmTxt, danger }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
      padding: "0 16px",
    }}>
      <div style={card({ padding: 26, maxWidth: 320, width: "100%", textAlign: "center" })}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--white)", marginBottom: 7 }}>{title}</div>
        <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 18, lineHeight: 1.6 }}>{body}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px",
            background: "var(--surface2)", border: "1px solid var(--border2)",
            borderRadius: "var(--radius)", color: "var(--body)",
            cursor: "pointer", fontWeight: 500, fontSize: 13,
          }}>{cancelTxt}</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px",
            background: danger ? "var(--red)" : "var(--amber)",
            border: "none", borderRadius: "var(--radius)",
            color: danger ? "#fff" : "#0C0E14",
            cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>{confirmTxt}</button>
        </div>
      </div>
    </div>
  );
}

// SuccessModal
function SuccessModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.8)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
      padding: "0 16px",
    }}>
      <div style={card({ padding: 36, maxWidth: 380, width: "100%", textAlign: "center" })}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "rgba(74,222,128,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px", color: "var(--green)",
        }}>
          <Icon n="check" s={26} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>
          Assignment Submitted!
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
          Your answers have been recorded. Results will be available once your teacher reviews and releases them.
        </p>
        <button onClick={onClose} style={{
          width: "100%", padding: "12px",
          background: "var(--amber)", border: "none",
          borderRadius: "var(--radius)", color: "#0C0E14",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>
          Go to Home
        </button>
      </div>
    </div>
  );
}

// AlreadySubmittedModal
function AlreadySubmittedModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.85)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
      padding: "0 16px",
    }}>
      <div style={card({ padding: 36, maxWidth: 380, width: "100%", textAlign: "center" })}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "rgba(240,165,0,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px", color: "var(--amber)",
        }}>
          <Icon n="alert-circle" s={26} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--white)", marginBottom: 8 }}>
          Already Submitted
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
          You have already submitted this assignment. Only one attempt is allowed per assignment.
        </p>
        <button onClick={onClose} style={{
          width: "100%", padding: "12px",
          background: "var(--surface2)", border: "1px solid var(--border2)",
          borderRadius: "var(--radius)", color: "var(--body)",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>
          Go Back
        </button>
      </div>
    </div>
  );
}

// AnswerTextarea
function AnswerTextarea({ value, onChange, questionType, fileAns, setFileAns, cur }) {
  const rows = questionType === "descriptive" ? 10 : 6;
  const [focused, setFocused] = useState(false);
  const blockClipboard = (e) => e.preventDefault();

  return (
    <div style={{ marginBottom: 20 }}>
      <FileUploadArea
        files={fileAns[cur]}
        onChange={(updater) =>
          setFileAns((prev) => ({
            ...prev,
            [cur]: typeof updater === "function" ? updater(prev[cur]) : updater,
          }))
        }
      />
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here…"
        rows={rows}
        onCopy={blockClipboard}
        onCut={blockClipboard}
        onPaste={blockClipboard}
        onContextMenu={blockClipboard}
        style={{
          width: "100%", padding: "14px 16px",
          background: "var(--surface2)",
          border: `1px solid ${focused ? "var(--amber)" : "var(--border)"}`,
          borderRadius: "var(--radius)", color: "var(--white)",
          fontSize: 14, lineHeight: 1.75, outline: "none",
          resize: "vertical", boxSizing: "border-box",
          fontFamily: "inherit", transition: "border-color .15s",
          userSelect: "none", WebkitUserSelect: "none",
          minHeight: 120,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          {wordCount(value)} word{wordCount(value) !== 1 ? "s" : ""}
          {questionType === "descriptive" && " · Aim for detailed responses"}
        </span>
        {(value || "").trim().length > 0 && (
          <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>✓ Answered</span>
        )}
      </div>
    </div>
  );
}

// FileUploadArea
function FileUploadArea({ files, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
  const MAX_MB = 10;

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter((f) => {
      if (!ACCEPTED.includes(f.type)) return false;
      if (f.size > MAX_MB * 1024 * 1024) return false;
      return true;
    });
    if (!valid.length) return;
    onChange((prev) => {
      const existing = prev || [];
      const merged = [...existing];
      valid.forEach((f) => {
        if (!merged.find((x) => x.name === f.name && x.size === f.size)) merged.push(f);
      });
      return merged;
    });
  };

  const remove = (idx) =>
    onChange((prev) => (prev || []).filter((_, i) => i !== idx));

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const fileList = files || [];

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".6px" }}>
          Attachments <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(PDF or image, max 10 MB)</span>
        </span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? "var(--amber)" : "var(--border2)"}`,
          borderRadius: "var(--radius)",
          background: dragging ? "rgba(240,165,0,0.05)" : "var(--surface2)",
          padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
          cursor: "pointer", transition: "border-color .15s, background .15s",
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: "rgba(96,165,250,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, color: "var(--white)", fontWeight: 500 }}>
            {dragging ? "Drop files here" : "Click or drag files here"}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            PDF, JPG, PNG, GIF, WEBP
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,image/*"
          style={{ display: "none" }}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {fileList.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
          {fileList.map((f, i) => {
            const isPdf = f.type === "application/pdf";
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px",
                background: "var(--bg)", border: "1px solid var(--border2)",
                borderRadius: "var(--radius)",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: isPdf ? "rgba(240,96,96,0.1)" : "rgba(74,222,128,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {isPdf ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, color: "var(--white)", fontWeight: 500,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                    {(f.size / 1024).toFixed(0)} KB · {isPdf ? "PDF" : "Image"}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(i); }}
                  style={{
                    width: 28, height: 28, borderRadius: 5,
                    background: "rgba(240,96,96,0.1)", border: "none",
                    color: "var(--red)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 16, lineHeight: 1,
                  }}
                  title="Remove"
                >×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Mobile Question Navigator Drawer ──
function QuestionNavDrawer({ show, onClose, qs, cur, setCur, textAns, answered, totalMarks, onSubmit }) {
  if (!show) return null;
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 250,
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />
      {/* Drawer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        borderRadius: "18px 18px 0 0",
        zIndex: 260,
        padding: "20px 20px 32px",
        maxHeight: "75vh",
        overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
      }}>
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: "var(--border2)",
          margin: "0 auto 18px",
        }} />

        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 14 }}>
          Questions
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {qs.map((qx, i) => {
            const isAnswered = (textAns[i] || "").trim().length > 0;
            const isCurrent = cur === i;
            return (
              <button
                key={i}
                onClick={() => { setCur(i); onClose(); }}
                title={`Q${i + 1}${qx.marks ? ` · ${qx.marks}m` : ""}`}
                style={{
                  width: 40, height: 40, borderRadius: 9, border: "1px solid",
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                  borderColor: isCurrent ? "var(--blue)" : isAnswered ? "var(--green)" : "var(--border2)",
                  background: isCurrent ? "rgba(96,165,250,0.12)" : isAnswered ? "rgba(74,222,128,0.08)" : "var(--bg)",
                  color: isCurrent ? "var(--blue)" : isAnswered ? "var(--green)" : "var(--muted)",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--muted)", marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { bg: "rgba(74,222,128,0.15)", border: "var(--green)", label: "Answered" },
            { bg: "rgba(96,165,250,0.12)", border: "var(--blue)", label: "Current" },
            { bg: "var(--bg)", border: "var(--border2)", label: "Unanswered" },
          ].map(({ bg, border, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3,
                background: bg, border: `1px solid ${border}`,
                display: "inline-block",
              }} />
              {label}
            </span>
          ))}
        </div>

        {/* Summary */}
        <div style={{
          display: "flex", gap: 10, marginBottom: 18,
          padding: "12px 14px",
          background: "var(--surface2)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
        }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{answered}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Answered</div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: qs.length - answered > 0 ? "var(--amber)" : "var(--green)" }}>
              {qs.length - answered}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Remaining</div>
          </div>
          {totalMarks > 0 && (
            <>
              <div style={{ width: 1, background: "var(--border)" }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--white)" }}>{totalMarks}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Marks</div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => { onClose(); onSubmit(); }}
          style={{
            width: "100%", padding: "12px",
            background: answered === qs.length ? "var(--green)" : "var(--amber)",
            border: "none", borderRadius: "var(--radius)",
            color: "#0C0E14", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          {answered === qs.length ? "✓ Submit Assignment" : "Submit Assignment"}
        </button>
      </div>
    </>
  );
}

// ── Main: AssignmentQuizPage ──
export default function AssignmentQuizPage({ config, setPage }) {
  const isMobile = useIsMobile(640);

  const [qs, setQs]                             = useState([]);
  const [cur, setCur]                            = useState(0);
  const [textAns, setTextAns]                    = useState({});
  const [loadingQs, setLoadingQs]                = useState(true);
  const [submitting, setSubmitting]              = useState(false);
  const [submissionId, setSubmissionId]          = useState(config?.submission_id || null);
  const [quitModal, setQuitModal]                = useState(false);
  const [submitModal, setSubmitModal]            = useState(false);
  const [successModal, setSuccessModal]          = useState(false);
  const [alreadySubmitted, setAlreadySubmitted]  = useState(false);
  const [tabs, setTabs]                          = useState(0);
  const [isFullscreen, setIsFullscreen]          = useState(false);
  const [fileAns, setFileAns]                    = useState({});
  const [navDrawerOpen, setNavDrawerOpen]        = useState(false);

  const submittedRef = useRef(false);
  const startedRef   = useRef(false);

  // ── Fullscreen helpers ──
  const enterFullscreen = useCallback(() => {
    const el  = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (req) req.call(el).then(() => setIsFullscreen(true)).catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    const ex = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    if (ex) ex.call(document).catch(() => {});
  }, []);

  useEffect(() => {
    const blockKeys    = (e) => { const k = e.key.toLowerCase(); if ((e.ctrlKey || e.metaKey) && ["c","v","x","a"].includes(k)) e.preventDefault(); };
    const blockContext = (e) => e.preventDefault();
    const blockCopy    = (e) => e.preventDefault();
    const blockCut     = (e) => e.preventDefault();
    const blockPaste   = (e) => e.preventDefault();
    document.addEventListener("keydown",     blockKeys);
    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("copy",        blockCopy);
    document.addEventListener("cut",         blockCut);
    document.addEventListener("paste",       blockPaste);
    return () => {
      document.removeEventListener("keydown",     blockKeys);
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("copy",        blockCopy);
      document.removeEventListener("cut",         blockCut);
      document.removeEventListener("paste",       blockPaste);
    };
  }, []);

  useEffect(() => {
    enterFullscreen();
    const onFsChange = () => {
      const active = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
      setIsFullscreen(!!active);
    };
    document.addEventListener("fullscreenchange",       onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange",    onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange",       onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange",    onFsChange);
      exitFullscreen();
    };
  }, [enterFullscreen, exitFullscreen]);

  useEffect(() => {
    if (config.status === "submitted" || config.status === "evaluated") setAlreadySubmitted(true);
  }, [config.status]);

  useEffect(() => {
    if (submissionId) return;
    if (startedRef.current) return;
    startedRef.current = true;
    const start = async () => {
      try {
        const res = await API.post(`/assignments/${config.assignment_id}/start`);
        if (res.data.already_submitted || res.data.status === "submitted" || res.data.status === "evaluated") {
          setAlreadySubmitted(true); return;
        }
        setSubmissionId(res.data.submission_id);
      } catch (err) {
        if (err.response?.status === 409 || err.response?.data?.already_submitted) setAlreadySubmitted(true);
        else console.error("Failed to start submission", err);
      }
    };
    start();
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(`assign_draft_${config.assignment_id}`);
    if (saved) { try { setTextAns(JSON.parse(saved)); } catch (_) {} }
  }, [config.assignment_id]);

  useEffect(() => {
    sessionStorage.setItem(`assign_draft_${config.assignment_id}`, JSON.stringify(textAns));
  }, [textAns, config.assignment_id]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingQs(true);
        let questionsData = [];
        if (config.questions && config.questions.length > 0) {
          questionsData = config.questions.map((q) => ({
            question_id:   q.question_id,
            question_text: q.question_text || q.question || "",
            question_type: q.question_type || "short",
            marks:         q.marks || null,
          }));
        } else {
          const res = await API.get(`/assignments/${config.assignment_id}`);
          questionsData = (res.data.questions || []).map((q) => ({
            question_id:   q.question_id,
            question_text: q.question_text || "",
            question_type: q.question_type || "short",
            marks:         q.marks || null,
          }));
        }
        setQs(questionsData);
      } catch (err) {
        console.error("Failed to load assignment questions", err);
      } finally {
        setLoadingQs(false);
      }
    };
    load();
  }, [config]);

  useEffect(() => {
    const onVis = () => { if (document.hidden) setTabs((t) => t + 1); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    if (!submissionId) { console.error("No submission_id — cannot submit"); return; }
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await API.post(`/assignments/answers/bulk`, {
        answers: qs.map((q, i) => ({
          submission_id: submissionId,
          question_id:   q.question_id,
          answer_text:   textAns[i] || "",
        })),
      });
      const fileEntries = Object.entries(fileAns);
      for (const [idx, files] of fileEntries) {
        if (!files || !files.length) continue;
        const q = qs[parseInt(idx)];
        if (!q) continue;
        const form = new FormData();
        form.append("submission_id", submissionId);
        form.append("question_id", q.question_id);
        files.forEach((f) => form.append("files", f));
        await API.post(`/assignments/answers/attachments`, form);
      }
      await API.post(`/assignments/submissions/${submissionId}/submit`);
      sessionStorage.removeItem(`assign_draft_${config.assignment_id}`);
      exitFullscreen();
      setSuccessModal(true);
    } catch (err) {
      console.error("Assignment submit failed:", err.response?.data || err);
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [qs, textAns, fileAns, submissionId, config.assignment_id, exitFullscreen]);

  // ── Guards ──
  if (submitting) return <Loader variant="results" />;

  if (alreadySubmitted) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <AlreadySubmittedModal show={true} onClose={() => { exitFullscreen(); setPage("home"); }} />
    </div>
  );

  if (loadingQs || qs.length === 0 || !submissionId) return <Loader variant="test" />;

  const q           = qs[cur];
  const answered    = Object.values(textAns).filter((v) => v && v.trim().length > 0).length;
  const totalMarks  = qs.reduce((acc, qx) => acc + (qx.marks || 0), 0) || config.total_marks;
  const progressPct = ((cur + 1) / qs.length) * 100;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* Fullscreen nudge */}
      {!isFullscreen && (
        <div style={{
          background: "rgba(240,165,0,0.1)",
          borderBottom: "1px solid rgba(240,165,0,0.22)",
          padding: isMobile ? "8px 14px" : "7px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, gap: 10,
        }}>
          <span style={{ color: "var(--amber)", fontWeight: 600, fontSize: isMobile ? 11 : 12 }}>
            ⚠ {isMobile ? "Fullscreen required" : "Fullscreen mode is required for this assignment"}
          </span>
          <button
            onClick={enterFullscreen}
            style={{
              padding: "4px 12px", background: "var(--amber)",
              border: "none", borderRadius: "var(--radius)",
              color: "#0C0E14", fontSize: 11, fontWeight: 700, cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {isMobile ? "Go Fullscreen" : "Re-enter Fullscreen"}
          </button>
        </div>
      )}

      {/* Modals */}
      <SuccessModal show={successModal} onClose={() => { setSuccessModal(false); setPage("home"); }} />
      <ConfirmModal
        show={quitModal}
        title="Quit assignment?"
        body="Your draft has been auto-saved. You can resume later if the assignment is still open."
        onCancel={() => setQuitModal(false)}
        onConfirm={() => { exitFullscreen(); setPage("home"); }}
        cancelTxt="Keep Writing"
        confirmTxt="Quit"
        danger
      />
      <ConfirmModal
        show={submitModal}
        title="Submit assignment?"
        body={`${answered} of ${qs.length} question${qs.length !== 1 ? "s" : ""} answered. This cannot be undone.`}
        onCancel={() => setSubmitModal(false)}
        onConfirm={() => { setSubmitModal(false); doSubmit(); }}
        cancelTxt="Review"
        confirmTxt="Submit"
      />

      {/* Mobile nav drawer */}
      {isMobile && (
        <QuestionNavDrawer
          show={navDrawerOpen}
          onClose={() => setNavDrawerOpen(false)}
          qs={qs}
          cur={cur}
          setCur={setCur}
          textAns={textAns}
          answered={answered}
          totalMarks={totalMarks}
          onSubmit={() => setSubmitModal(true)}
        />
      )}

      {/* ── HEADER ── */}
      <div style={{
        padding: isMobile ? "10px 14px" : "10px 22px",
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Left: title block */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "rgba(96,165,250,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--blue)", flexShrink: 0,
          }}>
            <Icon n="file-text" s={15} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "var(--white)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: isMobile ? 160 : 280,
            }}>
              {config.title}
            </div>
            {!isMobile && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                <span style={{
                  fontSize: 10, padding: "1px 6px", borderRadius: 4,
                  background: "rgba(96,165,250,0.1)", color: "var(--blue)", fontWeight: 600,
                }}>Assignment</span>
                {totalMarks > 0 && (
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{totalMarks} marks</span>
                )}
                {config.due_time && (
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>Due {formatDate(config.due_time)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, flexShrink: 0 }}>
          {tabs > 0 && !isMobile && (
            <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 600 }}>
              ⚠ {tabs} tab switch{tabs > 1 ? "es" : ""}
            </span>
          )}

          {!isMobile && (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{answered}/{qs.length} answered</span>
          )}

          {/* Mobile: nav drawer toggle */}
          {isMobile && (
            <button
              onClick={() => setNavDrawerOpen(true)}
              style={{
                padding: "6px 10px",
                background: "var(--surface2)", border: "1px solid var(--border2)",
                borderRadius: "var(--radius)", color: "var(--body)",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: 4,
                background: "rgba(96,165,250,0.15)",
                color: "var(--blue)", fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {cur + 1}
              </span>
              <span>/{qs.length}</span>
            </button>
          )}

          {tabs > 0 && isMobile && (
            <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 600 }}>
              ⚠{tabs}
            </span>
          )}

          <button
            onClick={() => setQuitModal(true)}
            style={{
              padding: isMobile ? "6px 10px" : "5px 13px",
              background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)",
              borderRadius: "var(--radius)", color: "var(--red)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Quit
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── MAIN QUESTION AREA ── */}
        <div style={{ flex: 1, padding: isMobile ? "18px 16px" : "28px 38px", overflowY: "auto" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>

            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isMobile ? 16 : 22 }}>
              <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                Q {cur + 1} / {qs.length}
              </span>
              <div style={{ flex: 1, height: 3, background: "var(--border2)", borderRadius: 2 }}>
                <div style={{
                  width: `${progressPct}%`, height: "100%",
                  background: "var(--blue)", borderRadius: 2, transition: "width .3s",
                }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                {Math.round(progressPct)}%
              </span>
            </div>

            {/* Question card */}
            <div style={card({ padding: isMobile ? 16 : 22, marginBottom: 16 })}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 5,
                  background: q.question_type === "descriptive" ? "rgba(96,165,250,0.1)" : "rgba(167,139,250,0.1)",
                  color: q.question_type === "descriptive" ? "var(--blue)" : "#a78bfa",
                  fontWeight: 600,
                }}>
                  {q.question_type === "descriptive" ? "Long Answer" : "Short Answer"}
                </span>
                {q.marks && (
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 5,
                    background: "rgba(240,165,0,0.08)", color: "var(--amber)", fontWeight: 600,
                  }}>
                    {q.marks} {q.marks === 1 ? "mark" : "marks"}
                  </span>
                )}
              </div>
              <p style={{ fontSize: isMobile ? 14 : 15, color: "var(--white)", lineHeight: 1.75, margin: 0, fontWeight: 500 }}>
                {q.question_text}
              </p>
            </div>

            {/* Answer box */}
            <AnswerTextarea
              value={textAns[cur]}
              onChange={(val) => setTextAns((prev) => ({ ...prev, [cur]: val }))}
              questionType={q.question_type}
              fileAns={fileAns}
              setFileAns={setFileAns}
              cur={cur}
            />

            {/* Navigation */}
            <div style={{ display: "flex", gap: 9, marginTop: 4, alignItems: "center" }}>
              <button
                onClick={() => cur > 0 && setCur(cur - 1)}
                disabled={cur === 0}
                style={{
                  padding: isMobile ? "9px 14px" : "7px 16px",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", color: "var(--body)",
                  cursor: cur === 0 ? "default" : "pointer",
                  fontSize: 13, opacity: cur === 0 ? 0.4 : 1,
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <Icon n="chevL" s={13} /> {!isMobile && "Prev"}
              </button>

              {!isMobile && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 11, color: "var(--muted)", padding: "0 4px",
                }}>
                  <Icon n="save" s={11} /> Draft auto-saved
                </span>
              )}

              <div style={{ flex: 1 }} />

              {cur < qs.length - 1 ? (
                <button
                  onClick={() => setCur(cur + 1)}
                  style={{
                    padding: isMobile ? "9px 18px" : "7px 18px",
                    background: "var(--amber)", border: "none",
                    borderRadius: "var(--radius)", color: "#0C0E14",
                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  Next <Icon n="chevR" s={13} />
                </button>
              ) : (
                <button
                  onClick={() => setSubmitModal(true)}
                  style={{
                    padding: isMobile ? "9px 14px" : "7px 18px",
                    background: "var(--green)", border: "none",
                    borderRadius: "var(--radius)", color: "#0C0E14",
                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <Icon n="check" s={13} /> {isMobile ? "Submit" : "Submit Assignment"}
                </button>
              )}
            </div>

            {/* Mobile: auto-save hint below nav */}
            {isMobile && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                fontSize: 11, color: "var(--muted)", marginTop: 14,
              }}>
                <Icon n="save" s={11} /> Draft auto-saved
              </div>
            )}
          </div>
        </div>

        {/* ── DESKTOP SIDE NAV ── */}
        {!isMobile && (
          <div style={{
            width: 210, background: "var(--surface)",
            borderLeft: "1px solid var(--border)",
            padding: 16, display: "flex", flexDirection: "column", gap: 14,
            overflowY: "auto",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: ".8px",
            }}>
              Questions
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {qs.map((qx, i) => {
                const isAnswered = (textAns[i] || "").trim().length > 0;
                const isCurrent  = cur === i;
                return (
                  <button
                    key={i}
                    onClick={() => setCur(i)}
                    title={`Q${i + 1}${qx.marks ? ` · ${qx.marks}m` : ""}`}
                    style={{
                      width: 32, height: 32, borderRadius: 7, border: "1px solid",
                      cursor: "pointer", fontSize: 12, fontWeight: 600,
                      borderColor: isCurrent ? "var(--blue)" : isAnswered ? "var(--green)" : "var(--border2)",
                      background: isCurrent ? "rgba(96,165,250,0.12)" : isAnswered ? "rgba(74,222,128,0.08)" : "var(--bg)",
                      color: isCurrent ? "var(--blue)" : isAnswered ? "var(--green)" : "var(--muted)",
                      transition: "all .15s",
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {[
                { bg: "rgba(74,222,128,0.15)", border: "var(--green)",   label: "Answered" },
                { bg: "rgba(96,165,250,0.12)", border: "var(--blue)",    label: "Current" },
                { bg: "var(--bg)",             border: "var(--border2)", label: "Unanswered" },
              ].map(({ bg, border, label }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: 3,
                    background: bg, border: `1px solid ${border}`, display: "inline-block",
                  }} />
                  {label}
                </span>
              ))}
            </div>

            {/* Summary */}
            <div style={card({ padding: "12px 14px", marginTop: 4, background: "var(--surface2)" })}>
              <div style={{ fontSize: 11, color: "var(--blue)", marginBottom: 8, fontWeight: 600 }}>SUMMARY</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: "var(--muted)" }}>Answered</span>
                <span style={{ color: "var(--green)", fontWeight: 600 }}>{answered}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: "var(--muted)" }}>Remaining</span>
                <span style={{ color: qs.length - answered > 0 ? "var(--amber)" : "var(--green)", fontWeight: 600 }}>
                  {qs.length - answered}
                </span>
              </div>
              {totalMarks > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--muted)" }}>Total Marks</span>
                  <span style={{ color: "var(--white)", fontWeight: 600 }}>{totalMarks}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSubmitModal(true)}
              style={{
                marginTop: "auto", width: "100%", padding: "9px",
                background: answered === qs.length ? "var(--green)" : "var(--surface2)",
                border: `1px solid ${answered === qs.length ? "var(--green)" : "var(--border2)"}`,
                borderRadius: "var(--radius)",
                color: answered === qs.length ? "#0C0E14" : "var(--body)",
                cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .2s",
              }}
            >
              {answered === qs.length ? "✓ Submit Assignment" : "Submit Assignment"}
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE BOTTOM BAR ── */}
      {isMobile && (
        <div style={{
          position: "sticky", bottom: 0,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "10px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 10, zIndex: 90,
        }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            <span style={{ color: "var(--green)", fontWeight: 600 }}>{answered}</span>
            <span>/{qs.length} answered</span>
          </div>

          <button
            onClick={() => setNavDrawerOpen(true)}
            style={{
              flex: 1, maxWidth: 140,
              padding: "9px 12px",
              background: "var(--surface2)", border: "1px solid var(--border2)",
              borderRadius: "var(--radius)", color: "var(--body)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            All Questions
          </button>

          <button
            onClick={() => setSubmitModal(true)}
            style={{
              flex: 1, maxWidth: 140,
              padding: "9px 12px",
              background: answered === qs.length ? "var(--green)" : "var(--amber)",
              border: "none", borderRadius: "var(--radius)",
              color: "#0C0E14", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            {answered === qs.length ? "✓ Submit" : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}