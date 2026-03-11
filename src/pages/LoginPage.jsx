import { useState } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";

export default function LoginPage({ setAuthPage, onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

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

    // store tokens
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user_id", data.user_id);

    onLogin();

  } catch (error) {
    setErr(
      error.response?.data?.detail || "Login failed. Please try again."
    );
  }

  setLoading(false);
};

  const inputStyle = {
    width: "100%", padding: "9px 12px", background: "var(--bg)",
    border: "1px solid var(--border2)", borderRadius: "var(--radius)",
    color: "var(--white)", fontSize: 13, outline: "none", boxSizing: "border-box",
  };

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
            <div style={{ padding: "10px 13px", background: "rgba(240,96,96,0.08)", border: "1px solid rgba(240,96,96,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
              {err}
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 6 }}>Email Address</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@university.edu" type="email" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 6 }}>Password</label>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" type="password" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && submit()} />
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <span style={{ fontSize: 12, color: "var(--amber)", cursor: "pointer" }}>Forgot password?</span>
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
