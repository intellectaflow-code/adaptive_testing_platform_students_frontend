import { useState } from "react";
import Icon from "../components/Icon";
import Select from "../components/Select";
import { card } from "../utils/styles";

export default function EditProfilePage({ student, setStudent, setPage }) {
  const [form, setForm] = useState({ ...student });
  const [saved, setSaved] = useState(false);
  const [pw, setPw] = useState({ cur: "", np: "", cp: "" });
  const [pwErr, setPwErr] = useState("");

  const save = () => {
    setStudent(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const changePw = () => {
    if (pw.np.length < 8) { setPwErr("Min 8 characters"); return; }
    if (pw.np !== pw.cp) { setPwErr("Passwords don't match"); return; }
    setPwErr("");
    setPw({ cur: "", np: "", cp: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle = (disabled = false) => ({
    width: "100%", padding: "9px 12px", background: disabled ? "var(--surface2)" : "var(--bg)",
    border: "1px solid var(--border2)", borderRadius: "var(--radius)",
    color: disabled ? "var(--muted)" : "var(--white)", fontSize: 13, outline: "none",
    boxSizing: "border-box", cursor: disabled ? "not-allowed" : "text",
  });

  const Field = ({ label, k, disabled = false, type = "text" }) => (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>{label}</label>
      <input value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} type={type} disabled={disabled} style={inputStyle(disabled)} />
    </div>
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 620, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
        <button onClick={() => setPage("profile")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", gap: 3, fontSize: 12 }}>
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
          <Field label="Full Name" k="full_name" />
          <Field label="Email" k="email" disabled />
          <Field label="USN" k="usn" disabled />
          <Field label="Branch" k="branch" />
          <Field label="Section" k="section" />
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>Semester</label>
            <Select value={String(form.semester)} onChange={(v) => setForm({ ...form, semester: +v })} options={["1","2","3","4","5","6","7","8"].map((n) => ({ value: n, label: `Semester ${n}` }))} />
          </div>
        </div>
        <button onClick={save} style={{ marginTop: 14, padding: "8px 20px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
          Save Changes
        </button>
      </div>

      <div style={card({ padding: 20 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 13 }}>Change Password</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11, maxWidth: 320 }}>
          {[["Current Password", "cur"], ["New Password", "np"], ["Confirm Password", "cp"]].map(([l, k]) => (
            <div key={k}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>{l}</label>
              <input type="password" value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} style={inputStyle()} />
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
