import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";
import Select from "../components/Select";


const BRANCHES = [
  "Computer Science",
  "Information Science",
  "Electronics and Communication",
  "Electrical and Electronics",
  "Mechanical",
  "Civil",
  "Artificial Intelligence",
  "Data Science"
];

const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8"
];

// 1. Move Field OUTSIDE the main component to prevent focus loss
const Field = ({ label, k, form, setForm, disabled = false, type = "text", inputStyle }) => (
  <div>
    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
      {label}
    </label>
    <input
      value={form[k] || ""}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          [k]: e.target.value
        }))
      }
      type={type}
      disabled={disabled}
      style={inputStyle(disabled)}
    />
  </div>
);

export default function EditProfilePage({ student, setStudent, setPage }) {
  const [saved, setSaved] = useState(false);
  const [pw, setPw] = useState({ cur: "", np: "", cp: "" });
  const [pwErr, setPwErr] = useState("");
  const [loading, setLoading] = useState(false);  

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    usn: "",
    branch: "",
    section: "",
    semester: ""
  });

  useEffect(() => {
    if (!student) return;

    setForm({
      full_name: student.full_name || "",
      email: student.email || student.user?.email || "",
      usn: student.usn || "",
      branch: student.branch || "",
      section: student.section || "",
      semester: student.sem || student.semester || ""
    });
  }, [student]);

const save = async () => {
  try {
    setLoading(true);

    const res = await API.put("/profiles/me", {
      full_name: form.full_name,
      branch: form.branch,
      section: form.section,
      sem: Number(form.semester)
    });

    setStudent(prev => ({ ...prev, ...res.data }));

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);   // ✅ always reset loader
  }
};

  const changePw = () => {
    if (pw.np.length < 8) { setPwErr("Min 8 characters"); return; }
    if (pw.np !== pw.cp) { setPwErr("Passwords don't match"); return; }
    setPwErr("");
    // Here you would typically call your API to change password
    setPw({ cur: "", np: "", cp: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle = (disabled = false) => ({
    width: "100%",
    padding: "9px 12px",
    background: disabled ? "var(--surface2)" : "var(--bg)",
    border: "1px solid var(--border2)",
    borderRadius: "var(--radius)",
    color: disabled ? "var(--muted)" : "var(--white)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    cursor: disabled ? "not-allowed" : "text",
  });

  return (
    <div style={{ padding: "24px 28px", maxWidth: 620, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
        <button
          onClick={() => setPage("profile")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", gap: 3, fontSize: 12 }}
        >
          <Icon n="chevL" s={13} /> Back
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--white)" }}>Edit Profile</h1>
      </div>

      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: "var(--radius)", marginBottom: 12, color: "var(--green)", fontSize: 13 }}>
          <Icon n="check" s={13} /> Saved
        </div>
      )}

      <div style={card({ padding: 20, marginBottom: 11 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 13 }}>Personal Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Pass form and setForm props to the external Field component */}
          <Field label="Full Name" k="full_name" form={form} setForm={setForm} inputStyle={inputStyle} />
          <Field label="Email" k="email" form={form} setForm={setForm} inputStyle={inputStyle} disabled />
          <Field label="USN" k="usn" form={form} setForm={setForm} inputStyle={inputStyle} disabled />
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--muted)",
                marginBottom: 5
              }}
            >
              Branch <span style={{ color: "var(--red)" }}>*</span>
            </label>

            <Select
              value={form.branch || ""}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  branch: v
                }))
              }
              options={BRANCHES}
              placeholder="Select branch"
            />
          </div>
          <Field label="Section" k="section" form={form} setForm={setForm} inputStyle={inputStyle} />
          
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
              Semester
            </label>

            <Select
              value={form.semester ? `Semester ${form.semester}` : ""}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  semester: parseInt(v.split(" ")[1])
                }))
              }
              options={SEMESTERS}
              placeholder="Select semester"
            />
          </div>
        </div>
        <button
          onClick={save}
          disabled={loading}
          style={{
            marginTop: 14,
            padding: "8px 20px",
            background: "var(--amber)",
            border: "none",
            borderRadius: "var(--radius)",
            color: "#0C0E14",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 13,
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          {loading && <Icon n="loader" s={14} />}
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={card({ padding: 20 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 13 }}>Change Password</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11, maxWidth: 320 }}>
          {[["Current Password", "cur"], ["New Password", "np"], ["Confirm Password", "cp"]].map(([l, k]) => (
            <div key={k}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>{l}</label>
              <input 
                type="password" 
                value={pw[k]} 
                onChange={(e) => setPw({ ...pw, [k]: e.target.value })} 
                style={inputStyle()} 
              />
            </div>
          ))}
          {pwErr && <span style={{ fontSize: 12, color: "var(--red)" }}>{pwErr}</span>}
          <button onClick={changePw} style={{ padding: "8px 18px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", cursor: "pointer", fontSize: 13, fontWeight: 600, alignSelf: "flex-start" }}>
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}