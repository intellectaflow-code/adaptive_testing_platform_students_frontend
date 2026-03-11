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

const Field = ({ label, k, type = "text", ph, req = true, form, setForm, inputStyle }) => (
  <div>
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 500,
        color: "var(--muted)",
        marginBottom: 5,
      }}
    >
      {label}
      {req && <span style={{ color: "var(--red)" }}> *</span>}
    </label>

    <input
      value={form[k]}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          [k]: e.target.value,
        }))
      }
      type={type}
      placeholder={ph}
      style={inputStyle}
    />
  </div>
);

export default function SignupPage({ setAuthPage, onLogin }) {
  const [form, setForm] = useState({
    name: "",
    usn: "",
    email: "",
    branch: "",
    semester: "",
    section: "",
    password: "",
    confirm: "",
  });

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name || !form.usn || !form.email || !form.branch || !form.semester || !form.password) {
      setErr("Please fill all required fields");
      return;
    }

    if (form.password !== form.confirm) {
      setErr("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }

    setErr("");
    setLoading(true);

    try {
      const res = await API.post("/auth/register", {
        email: form.email,
        password: form.password,
        full_name: form.name,
        role: "student",
        branch: form.branch,
      });

      const data = res.data;

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_id", data.user_id);

      onLogin();
    } catch (error) {
      setErr(error.response?.data?.detail || "Registration failed");
    }

    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    background: "var(--bg)",
    border: "1px solid var(--border2)",
    borderRadius: "var(--radius)",
    color: "var(--white)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: "#0C0E14",
            }}
          >
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
            <div
              style={{
                padding: "10px 13px",
                background: "rgba(240,96,96,0.08)",
                border: "1px solid rgba(240,96,96,0.2)",
                borderRadius: "var(--radius)",
                color: "var(--red)",
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              {err}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Full Name" k="name" ph="Your full name" form={form} setForm={setForm} inputStyle={inputStyle} />
            </div>

            <Field label="USN" k="usn" ph="1AT21CS045" form={form} setForm={setForm} inputStyle={inputStyle} />
            <Field label="Email" k="email" type="email" ph="you@university.edu" form={form} setForm={setForm} inputStyle={inputStyle} />

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
                Branch <span style={{ color: "var(--red)" }}>*</span>
              </label>

              <Select
                value={form.branch}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    branch: v,
                  }))
                }
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
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    semester: v,
                  }))
                }
                options={["1","2","3","4","5","6","7","8"].map((n) => ({
                  value: n,
                  label: `Semester ${n}`,
                }))}
                placeholder="Select semester"
              />
            </div>

            <Field label="Section" k="section" ph="A" req={false} form={form} setForm={setForm} inputStyle={inputStyle} />
            <Field label="Password" k="password" type="password" ph="Min 8 characters" form={form} setForm={setForm} inputStyle={inputStyle} />
            <Field label="Confirm Password" k="confirm" type="password" ph="Repeat password" form={form} setForm={setForm} inputStyle={inputStyle} />
          </div>

          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: "var(--amber)",
              border: "none",
              borderRadius: "var(--radius)",
              color: "#0C0E14",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
            Already have an account{" "}
            <span
              onClick={() => setAuthPage("login")}
              style={{ color: "var(--amber)", cursor: "pointer", fontWeight: 600 }}
            >
              Sign In
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}