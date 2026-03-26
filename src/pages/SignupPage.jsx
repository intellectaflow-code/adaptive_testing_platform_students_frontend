import { useState } from "react";
import Icon from "../components/Icon";
import Select from "../components/Select";
import { card } from "../utils/styles";
import API from "../api/api";

const BRANCHES = [
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

  const [step, setStep] = useState("form"); // "form" | "otp"
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

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

  // Step 1: Validate form and send OTP
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
      setStep("otp"); // ✅ move to OTP screen
    } catch (error) {
      const detail = error.response?.data?.detail;
      setErr(detail || "Failed to send OTP. Try again.");
    }
    setLoading(false);
  };

  // Step 2: Verify OTP then register
  const submitOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErr("Please enter the 6-digit OTP");
      return;
    }

    setErr("");
    setOtpLoading(true);
    try {
      // Verify OTP
      await API.post("/auth/verify-otp", { email: form.email, otp });

      // OTP passed → register
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
      const errMsg = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(" ")
        : detail || "Verification failed";
      setErr(errMsg);
    }
    setOtpLoading(false);
  };

  // Resend OTP
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
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#0C0E14" }}>
              <Icon n="mail" s={22} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>
              Verify your email
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              We sent a 6-digit code to
            </p>
            <p style={{ color: "var(--white)", fontSize: 13, fontWeight: 600 }}>
              {form.email}
            </p>
          </div>

          <div style={card({ padding: 28 })}>
            {err && (
              <div style={{ padding: "10px 13px", background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
                {err}
              </div>
            )}

            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
              Enter OTP <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              value={otp}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, ""); // digits only
                if (v.length <= 6) setOtp(v);
              }}
              placeholder="123456"
              maxLength={6}
              style={{
                ...inputStyle,
                fontSize: 22,
                letterSpacing: 8,
                textAlign: "center",
                padding: "12px",
                marginBottom: 16,
              }}
            />

            <button
              onClick={submitOtp}
              disabled={otpLoading}
              style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: otpLoading ? 0.7 : 1 }}
            >
              {otpLoading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
              Didn't receive it?{" "}
              <span onClick={resendOtp} style={{ color: "var(--amber)", cursor: "pointer", fontWeight: 600 }}>
                Resend OTP
              </span>
            </p>

            <p style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
              <span onClick={() => { setStep("form"); setErr(""); }} style={{ color: "var(--muted)", cursor: "pointer", textDecoration: "underline" }}>
                ← Back to form
              </span>
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>
            Create Account
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Register as a student on IntellectaFlow
          </p>
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

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
                Branch <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <Select
                value={form.branch}
                onChange={(v) => setForm((prev) => ({ ...prev, branch: v }))}
                options={BRANCHES}
                placeholder="Select branch"
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
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  style={inputStyle}
                />
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
                <input
                  type={showConfirmPw ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Repeat password"
                  style={inputStyle}
                />
                <span onClick={() => setShowConfirmPw(!showConfirmPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--muted)" }}>
                  <Icon n={showConfirmPw ? "eyeOff" : "eye"} s={16} />
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            style={{ width: "100%", padding: "10px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Sending OTP..." : "Create Account"}
          </button>

          <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
            Already have an account{" "}
            <span onClick={() => setAuthPage("login")} style={{ color: "var(--amber)", cursor: "pointer", fontWeight: 600 }}>
              Sign In
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}