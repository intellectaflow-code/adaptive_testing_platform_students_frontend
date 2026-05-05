import { useState } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";
import logo from "../utils/logo.png";

// ── Reusable OTP Box Component ──
const OtpInput = ({ otp, setOtp, idPrefix = "otp" }) => {
  const otpArr = Array.from({ length: 6 }, (_, i) => otp[i] || "");

  const handleChange = (val, idx) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = otpArr.map((d, i) => (i === idx ? digit : d)).join("");
    setOtp(newOtp);
    if (digit && idx < 5) document.getElementById(`${idPrefix}-${idx + 1}`)?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (otpArr[idx]) {
        setOtp(otpArr.map((d, i) => (i === idx ? "" : d)).join(""));
      } else if (idx > 0) {
        document.getElementById(`${idPrefix}-${idx - 1}`)?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      document.getElementById(`${idPrefix}-${idx - 1}`)?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      document.getElementById(`${idPrefix}-${idx + 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtp(pasted);
    document.getElementById(`${idPrefix}-${Math.min(pasted.length, 5)}`)?.focus();
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "4px 0 16px" }}>
      {otpArr.map((digit, idx) => (
        <input
          key={idx}
          id={`${idPrefix}-${idx}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target.value, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
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
            width: 44, height: 52,
            textAlign: "center", fontSize: 22, fontWeight: 700,
            color: "var(--white)", background: "rgba(255,255,255,0.04)",
            border: `1.5px solid ${digit ? "var(--amber)" : "var(--border2)"}`,
            borderRadius: "var(--radius)", outline: "none",
            caretColor: "var(--amber)",
            transition: "border-color 0.15s, box-shadow 0.15s",
            boxSizing: "border-box",
          }}
        />
      ))}
    </div>
  );
};

export default function LoginPage({ setAuthPage, onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // ── Forgot Password States ─────────────────
  const [step, setStep] = useState("login"); // "login" | "forgot" | "reset"
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpPassword, setFpPassword] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpErr, setFpErr] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

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

  // ── Login ──────────────────────────────────
  const submit = async () => {
    if (!form.email || !form.password) { setErr("Please fill all fields"); return; }
    setErr("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email: form.email, password: form.password });
      const data = res.data;
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_data", JSON.stringify(data.user || data));
      onLogin({
        full_name: data.full_name || data.user?.full_name || "Student",
        usn: data.usn || data.user?.usn || "N/A",
        email: form.email,
        branch: data.branch || "N/A",
      });
    } catch (error) {
      setErr(error.response?.data?.detail || "Login failed. Please try again.");
    }
    setLoading(false);
  };

  // ── Forgot Password ────────────────────────
  const sendFpOtp = async () => {
    if (!fpEmail) { setFpErr("Enter your email address"); return; }
    setFpErr("");
    setFpLoading(true);
    try {
      await API.post("/auth/send-otp", { email: fpEmail });
      setStep("reset");
      setFpOtp("");
    } catch (e) {
      setFpErr(e.response?.data?.detail || "Failed to send OTP. Try again.");
    }
    setFpLoading(false);
  };

  const resetPassword = async () => {
    if (fpOtp.length !== 6)  { setFpErr("Enter the 6-digit OTP"); return; }
    if (!fpPassword)          { setFpErr("Enter a new password"); return; }
    if (fpPassword !== fpConfirm) { setFpErr("Passwords do not match"); return; }
    setFpErr("");
    setFpLoading(true);
    try {
      await API.post("/auth/verify-otp", { email: fpEmail, otp: fpOtp });
      await API.post("/auth/reset-password", { email: fpEmail, new_password: fpPassword });
      setStep("login");
      setErr("✅ Password reset successful! Please sign in.");
    } catch (e) {
      setFpErr(e.response?.data?.detail || "Reset failed. Try again.");
    }
    setFpLoading(false);
  };

  // ── Forgot Screen ──────────────────────────
  if (step === "forgot") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#0C0E14" }}>
              <Icon n="mail" s={22} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Forgot Password</h1>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Enter your email and we'll send you an OTP</p>
          </div>
          <div style={card({ padding: 28 })}>
            {fpErr && (
              <div style={{ padding: "10px 13px", background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
                {fpErr}
              </div>
            )}
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
              Email Address
            </label>
            <input
              type="email"
              value={fpEmail}
              onChange={e => setFpEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={(e) => e.key === "Enter" && sendFpOtp()}
              style={{
                width: "100%", padding: "9px 13px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border2)",
                borderRadius: "var(--radius)",
                color: "var(--white)", fontSize: 13,
                marginBottom: 16, outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "var(--amber)"}
              onBlur={e => e.target.style.borderColor = "var(--border2)"}
            />
            <button
              onClick={sendFpOtp}
              disabled={fpLoading}
              style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: fpLoading ? "not-allowed" : "pointer", fontSize: 13, opacity: fpLoading ? 0.7 : 1 }}
            >
              {fpLoading ? "Sending OTP..." : "Send OTP"}
            </button>
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 13 }}>
              <span onClick={() => setStep("login")} style={{ color: "var(--muted)", cursor: "pointer", textDecoration: "underline" }}>
                ← Back to Login
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Reset Screen ───────────────────────────
  if (step === "reset") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#0C0E14" }}>
              <Icon n="lock" s={22} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Reset Password</h1>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              OTP sent to <strong style={{ color: "var(--white)" }}>{fpEmail}</strong>
            </p>
          </div>
          <div style={card({ padding: 28 })}>
            {fpErr && (
              <div style={{ padding: "10px 13px", background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
                {fpErr}
              </div>
            )}

            {/* OTP Boxes */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5, textAlign: "center" }}>
              Enter OTP <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <OtpInput otp={fpOtp} setOtp={setFpOtp} idPrefix="fp-otp" />

            {/* Resend */}
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginBottom: 16, marginTop: -8 }}>
              Didn't receive it?{" "}
              <span
                onClick={() => { setFpOtp(""); sendFpOtp(); }}
                style={{ color: "var(--amber)", cursor: "pointer", fontWeight: 600 }}
              >
                Resend OTP
              </span>
            </p>

            {/* New Password */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
              New Password <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <input
                value={fpPassword}
                onChange={(e) => setFpPassword(e.target.value)}
                type={showNewPass ? "text" : "password"}
                placeholder="Min 8 characters"
                style={inputStyle}
              />
              <span onClick={() => setShowNewPass(!showNewPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--muted)" }}>
                <Icon n={showNewPass ? "eyeOff" : "eye"} s={16} />
              </span>
            </div>

            {/* Confirm Password */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
              Confirm Password <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <div style={{ position: "relative", marginBottom: 20 }}>
              <input
                value={fpConfirm}
                onChange={(e) => setFpConfirm(e.target.value)}
                type={showConfirmPass ? "text" : "password"}
                placeholder="Repeat password"
                style={inputStyle}
              />
              <span onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--muted)" }}>
                <Icon n={showConfirmPass ? "eyeOff" : "eye"} s={16} />
              </span>
            </div>

            <button
              onClick={resetPassword}
              disabled={fpLoading || fpOtp.length < 6}
              style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: (fpLoading || fpOtp.length < 6) ? "not-allowed" : "pointer", fontSize: 13, opacity: (fpLoading || fpOtp.length < 6) ? 0.7 : 1 }}
            >
              {fpLoading ? "Resetting..." : "Reset Password"}
            </button>

            <p style={{ textAlign: "center", marginTop: 14, fontSize: 13 }}>
              <span
                onClick={() => { setStep("forgot"); setFpErr(""); setFpOtp(""); }}
                style={{ color: "var(--muted)", cursor: "pointer", textDecoration: "underline" }}
              >
                ← Back
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Login Screen ───────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#0C0E14" }}>
            <img src={logo} alt="logo" style={{ width: 30, height: 30, objectFit: "contain" }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--white)", marginBottom: 4 }}>IntellectaFlow</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Sign in to your student account</p>
        </div>

        <div style={card({ padding: 28 })}>
          {err && (
            <div style={{ padding: "10px 13px", background: err.startsWith("✅") ? "rgba(96,240,96,0.08)" : "rgba(240,96,96,0.08)", border: `1px solid ${err.startsWith("✅") ? "rgba(96,240,96,0.2)" : "rgba(240,96,96,0.2)"}`, borderRadius: "var(--radius)", color: err.startsWith("✅") ? "var(--green)" : "var(--red)", fontSize: 12, marginBottom: 16 }}>
              {err}
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 6 }}>Email Address</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@mite.ac.in" type="email" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                type={showPass ? "text" : "password"}
                style={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <span onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, color: "var(--muted)" }}>
                <Icon n={showPass ? "eyeOff" : "eye"} s={16} />
              </span>
            </div>
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <span
                onClick={() => {
                  setFpEmail(form.email || "");
                  setStep("forgot");
                  setFpErr("");
                  setFpOtp("");
                }}
                style={{ fontSize: 12, color: "var(--amber)", cursor: "pointer" }}
              >
                Forgot password?
              </span>
            </div>
          </div>
          <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: loading ? 0.7 : 1, transition: "opacity .15s" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
    
        </div>
      </div>
    </div>
  );
}