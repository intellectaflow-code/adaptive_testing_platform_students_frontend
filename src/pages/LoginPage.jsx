import { useState } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";

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
    if (!form.email || !form.password) {
      setErr("Please fill all fields");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
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
    setFpErr("");
    setFpLoading(true);
    try {
      await API.post("/auth/send-otp", { email: fpEmail });
      setStep("reset");
    } catch (e) {
      setFpErr(e.response?.data?.detail || "Failed to send OTP. Try again.");
    }
    setFpLoading(false);
  };

  const resetPassword = async () => {
    if (!fpOtp || fpOtp.length !== 6) { setFpErr("Enter the 6-digit OTP"); return; }
    if (!fpPassword) { setFpErr("Enter a new password"); return; }
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
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              We'll send an OTP to{" "}
              <strong style={{ color: "var(--white)" }}>{fpEmail}</strong>
            </p>
          </div>
          <div style={card({ padding: 28 })}>
            {fpErr && (
              <div style={{ padding: "10px 13px", background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
                {fpErr}
              </div>
            )}
            {/* Read-only email display */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
              Email Address
            </label>
            <div style={{ padding: "9px 13px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--white)", fontSize: 13, marginBottom: 16 }}>
              {fpEmail}
            </div>

            <button
              onClick={sendFpOtp}
              disabled={fpLoading}
              style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: fpLoading ? 0.7 : 1 }}
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
              OTP sent to{" "}
              <strong style={{ color: "var(--white)" }}>{fpEmail}</strong>
            </p>
          </div>
          <div style={card({ padding: 28 })}>
            {fpErr && (
              <div style={{ padding: "10px 13px", background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
                {fpErr}
              </div>
            )}

            {/* OTP Input */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
              Enter OTP <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              value={fpOtp}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 6) setFpOtp(v); }}
              placeholder="123456"
              maxLength={6}
              style={{ ...inputStyle, fontSize: 22, letterSpacing: 8, textAlign: "center", padding: "12px", marginBottom: 14 }}
            />

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
            <div style={{ position: "relative", marginBottom: 16 }}>
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
              disabled={fpLoading}
              style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: fpLoading ? 0.7 : 1 }}
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#0C0E14" }}>
            <Icon n="brain" s={22} />
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
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@university.edu" type="email" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && submit()} />
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
                  if (!form.email) { setErr("Please enter your email address first"); return; }
                  setFpEmail(form.email);
                  setStep("forgot");
                  setFpErr("");
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
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
            Don't have an account?{" "}
            <span onClick={() => setAuthPage("signup")} style={{ color: "var(--amber)", cursor: "pointer", fontWeight: 600 }}>Sign Up</span>
          </p>
        </div>
      </div>
    </div>
  );
}