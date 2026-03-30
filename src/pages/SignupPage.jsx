import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import Select from "../components/Select";
import { card } from "../utils/styles";
import API from "../api/api";

const FALLBACK_BRANCHES = [
  "Computer Science",
  "Information Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Chemical",
];

const LETTERS_ONLY = { name: /^[a-zA-Z\s]*$/, section: /^[a-zA-Z]*$/ };

const Field = ({ label, k, type = "text", ph, req = true, form, setForm, inputStyle }) => (
  <div>
    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
      {label}
      {req && <span style={{ color: "var(--red)" }}> *</span>}
    </label>
    <input
      value={form[k]}
      onChange={(e) => {
        const val = e.target.value;
        if (LETTERS_ONLY[k] && !LETTERS_ONLY[k].test(val)) return;
        setForm((prev) => ({ ...prev, [k]: val }));
      }}
      type={type}
      placeholder={ph}
      style={inputStyle}
    />
  </div>
);

export default function SignupPage({ setAuthPage, onLogin }) {
  const [form, setForm] = useState({
    name: "", usn: "", email: "", branch: "",
    semester: "", section: "", password: "", confirm: "",
  });

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  const [step, setStep] = useState("form");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await API.get("/profiles/departments");
        const data = res.data;
        // Accepts either [{ name, code }] or a flat string array
        const names = Array.isArray(data)
          ? data.map((d) => (typeof d === "string" ? d : d.name))
          : [];
        setBranches(names.length > 0 ? names : FALLBACK_BRANCHES);
      } catch {
        setBranches(FALLBACK_BRANCHES);
      } finally {
        setBranchesLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const inputStyle = {
    width: "100%",
    padding: "9px 38px 9px 12px",
    background: "var(--bg)",
    border: "1px solid var(--border2)",
    borderRadius: "var(--radius)",
    color: "var(--white)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const strongPassword = (pw) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\,.\?\":{}|<>]).{8,}$/.test(pw);

  const submit = async () => {
    if (!form.name || !form.usn || !form.email || !form.branch || !form.semester || !form.password) {
      setErr("Please fill all required fields");
      return;
    }
    if (form.password !== form.confirm) {
      setErr("Passwords do not match");
      return;
    }
    if (!strongPassword(form.password)) {
      setErr("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      await API.post("/auth/send-otp", { email: form.email });
      setStep("otp");
    } catch (error) {
      setErr(error.response?.data?.detail || "Failed to send OTP. Try again.");
    }
    setLoading(false);
  };

  const submitOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErr("Please enter the 6-digit OTP");
      return;
    }
    setErr("");
    setOtpLoading(true);
    try {
      await API.post("/auth/verify-otp", { email: form.email, otp });
      const res = await API.post("/auth/register", {
        email: form.email,
        password: form.password,
        full_name: form.name,
        role: "student",
        branch: form.branch,
        usn: form.usn,
        semester: Number(form.semester),
        section: form.section,
      });
      const data = res.data;
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_id", data.user_id);
      onLogin({
        full_name: form.name,
        usn: form.usn,
        email: form.email,
        branch: form.branch,
        semester: form.semester,
      });
    } catch (error) {
      const detail = error.response?.data?.detail;
      setErr(Array.isArray(detail) ? detail.map((d) => d.msg).join(" ") : detail || "Verification failed");
    }
    setOtpLoading(false);
  };

  const resendOtp = async () => {
    setErr("");
    setOtp("");
    try {
      await API.post("/auth/send-otp", { email: form.email });
    } catch {
      setErr("Failed to resend OTP. Try again.");
    }
  };

  // ── OTP Screen ──────────────────────────────────────────────
if (step === "otp") {
    const otpArr = Array.from({ length: 6 }, (_, i) => otp[i] || "");

    const handleOtpChange = (val, idx) => {
      const digit = val.replace(/\D/g, "").slice(-1);
      const newOtp = otpArr.map((d, i) => (i === idx ? digit : d)).join("");
      setOtp(newOtp);
      if (digit && idx < 5) {
        document.getElementById(`otp-${idx + 1}`)?.focus();
      }
    };

    const handleOtpKeyDown = (e, idx) => {
      if (e.key === "Backspace") {
        if (otpArr[idx]) {
          const newOtp = otpArr.map((d, i) => (i === idx ? "" : d)).join("");
          setOtp(newOtp);
        } else if (idx > 0) {
          document.getElementById(`otp-${idx - 1}`)?.focus();
        }
      } else if (e.key === "ArrowLeft" && idx > 0) {
        document.getElementById(`otp-${idx - 1}`)?.focus();
      } else if (e.key === "ArrowRight" && idx < 5) {
        document.getElementById(`otp-${idx + 1}`)?.focus();
      }
    };

    const handleOtpPaste = (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      setOtp(pasted);
      const nextIdx = Math.min(pasted.length, 5);
      document.getElementById(`otp-${nextIdx}`)?.focus();
    };

    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#0C0E14" }}>
              <Icon n="mail" s={22} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Verify your email</h1>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>We sent a 6-digit code to</p>
            <p style={{ color: "var(--white)", fontSize: 13, fontWeight: 600 }}>{form.email}</p>
          </div>
          <div style={card({ padding: 28 })}>
            {err && (
              <div style={{ padding: "10px 13px", background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
                {err}
              </div>
            )}
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 12, textAlign: "center" }}>
              Enter OTP <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
              {otpArr.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  onPaste={handleOtpPaste}
                  onFocus={(e) => {
                    e.target.select();
                    e.target.style.borderColor = "var(--amber)";
                    e.target.style.boxShadow = "0 0 0 2px rgba(245,176,56,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = digit ? "var(--amber)" : "var(--border2)";
                    e.target.style.boxShadow = "none";
                  }}
                  style={{
                    width: 44,
                    height: 52,
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--white)",
                    background: "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${digit ? "var(--amber)" : "var(--border2)"}`,
                    borderRadius: "var(--radius)",
                    outline: "none",
                    caretColor: "var(--amber)",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                />
              ))}
            </div>
            <button onClick={submitOtp} disabled={otpLoading} style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: otpLoading ? 0.7 : 1 }}>
              {otpLoading ? "Verifying..." : "Verify & Create Account"}
            </button>
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
              Didn't receive it?{" "}
              <span onClick={resendOtp} style={{ color: "var(--amber)", cursor: "pointer", fontWeight: 600 }}>Resend OTP</span>
            </p>
            <p style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
              <span onClick={() => { setStep("form"); setErr(""); }} style={{ color: "var(--muted)", cursor: "pointer", textDecoration: "underline" }}>← Back to form</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  // ── Registration Form ────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#0C0E14" }}>
            <Icon n="brain" s={22} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Create Account</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Register as a student on IntellectaFlow</p>
        </div>
        <div style={card({ padding: 28 })}>
          {err && (
            <div style={{ padding: "10px 13px", background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
              {err}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Full Name" k="name" ph="Your full name" form={form} setForm={setForm} inputStyle={inputStyle} />
            </div>
            <Field label="USN" k="usn" ph="4MT21CS045" form={form} setForm={setForm} inputStyle={inputStyle} />
            <Field label="Email" k="email" type="email" ph="you@mite.ac.in" form={form} setForm={setForm} inputStyle={inputStyle} />

            {/* ── Dynamic Branch dropdown ── */}
            <div style={{ minWidth: 0 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
                Branch <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <Select
                value={form.branch}
                onChange={(v) => setForm((prev) => ({ ...prev, branch: v }))}
                options={branches}
                placeholder={branchesLoading ? "Loading..." : "Select branch"}
                disabled={branchesLoading}
                searchable
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
                Semester <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <Select
                value={form.semester}
                onChange={(v) => setForm((prev) => ({ ...prev, semester: v }))}
                options={["1","2","3","4","5","6","7","8"].map((n) => ({ value: n, label: `Semester ${n}` }))}
                placeholder="Select semester"
              />
            </div>

            <Field label="Section" k="section" ph="A" req={false} form={form} setForm={setForm} inputStyle={inputStyle} />

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
                Password <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Min 8 characters" style={inputStyle} />
                <span onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--muted)" }}>
                  <Icon n={showPw ? "eyeOff" : "eye"} s={16} />
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
                Confirm Password <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input type={showConfirmPw ? "text" : "password"} value={form.confirm} onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))} placeholder="Repeat password" style={inputStyle} />
                <span onClick={() => setShowConfirmPw(!showConfirmPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--muted)" }}>
                  <Icon n={showConfirmPw ? "eyeOff" : "eye"} s={16} />
                </span>
              </div>
            </div>
          </div>

          <button onClick={submit} disabled={loading || branchesLoading} style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: (loading || branchesLoading) ? 0.7 : 1 }}>
            {loading ? "Sending OTP..." : "Create Account"}
          </button>

          <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
            Already have an account{" "}
            <span onClick={() => setAuthPage("login")} style={{ color: "var(--amber)", cursor: "pointer", fontWeight: 600 }}>Sign In</span>
          </p>
        </div>
      </div>
    </div>
  );
}