import { useState, useEffect, useRef } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";
import Select from "../components/Select";

const FALLBACK_BRANCHES = [
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
  "Semester 1", "Semester 2", "Semester 3", "Semester 4",
  "Semester 5", "Semester 6", "Semester 7", "Semester 8"
];

const style = document.createElement("style");
style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(style);

const Field = ({ label, k, form, setForm, disabled = false, type = "text", inputStyle }) => (
  <div>
    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
      {label}
    </label>
    <input
      value={form[k] || ""}
      onChange={(e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))}
      type={type}
      disabled={disabled}
      style={inputStyle(disabled)}
    />
  </div>
);

// ── Profile Photo Component ──
const ProfilePhotoField = ({ student, onPhotoChange, uploading }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setPreview(student?.profile_photo || student?.avatar || null);
  }, [student]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onPhotoChange(file);
  };


  const handleRemove = () => {
    setPreview(null);
    onPhotoChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const initials = student?.full_name
    ? student.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";


  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--border2)" }}>
        {/* Avatar circle */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: preview ? "transparent" : "var(--surface2)",
              border: "2px solid var(--border2)",
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, color: "var(--amber)",
              cursor: preview ? "pointer" : "default",
            }}
            onClick={() => preview && setExpanded(true)}
          >
            {preview
              ? <img src={preview} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </div>

          {/* Camera badge */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Change photo"
            style={{
              position: "absolute", bottom: 0, right: 0,
              width: 24, height: 24, borderRadius: "50%",
              background: "var(--amber)", border: "2px solid var(--bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              padding: 0, opacity: uploading ? 0.6 : 1,
            }}
          >
            <Icon n="camera" s={11} style={{ color: "#0C0E14" }} />
          </button>
        </div>

        {/* Text + actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>Profile Photo</span>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>JPG, PNG or WebP · Max 5 MB</span>
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: "5px 11px", fontSize: 11, fontWeight: 600,
                background: "var(--surface2)", border: "1px solid var(--border2)",
                borderRadius: "var(--radius)", color: "var(--body)",
                cursor: uploading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 5,
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? <Icon n="loader" s={14} style={{
                  animation: "spin 1s linear infinite",
                  display: "inline-block",
                  transformOrigin: "center",
                }} /> : <Icon n="upload" s={11} />}
              {uploading ? "Uploading..." : preview ? "Change" : "Upload"}
            </button>

            {preview && !uploading && (
              <button
                onClick={handleRemove}
                style={{
                  padding: "5px 11px", fontSize: 11, fontWeight: 600,
                  background: "transparent", border: "1px solid var(--border2)",
                  borderRadius: "var(--radius)", color: "var(--red)",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {/* ── Lightbox — inside the fragment, inside the component ── */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={preview}
            alt="Profile"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw", maxHeight: "90vh",
              borderRadius: 12,
              boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
              objectFit: "contain",
              cursor: "default",
            }}
          />
          <button
            onClick={() => setExpanded(false)}
            style={{
              position: "absolute", top: 20, right: 24,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50%", width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--white)",
            }}
          >
            <Icon n="x" s={16} />
          </button>
        </div>
      )}
    </>
  );
};
export default function EditProfilePage({ student, setStudent, setPage }) {
  const [saved, setSaved]           = useState(false);
  const [pw, setPw]                 = useState({ cur: "", np: "", cp: "" });
  const [pwErr, setPwErr]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwSuccess, setPwSuccess]   = useState(false);
  const [showPwFields, setShowPwFields] = useState({ cur: false, np: false, cp: false });

  const [photoFile, setPhotoFile]         = useState(null);  // ← new
  const [photoUploading, setPhotoUploading] = useState(false); // ← new

  const [branches, setBranches]           = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  const [form, setForm] = useState({
    full_name: "", email: "", usn: "",
    branch: "", section: "", semester: ""
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await API.get("/profiles/departments");
        const names = res.data.map((d) => (typeof d === "string" ? d : d.name));
        setBranches(names.length > 0 ? names : FALLBACK_BRANCHES);
      } catch {
        setBranches(FALLBACK_BRANCHES);
      } finally {
        setBranchesLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (!student) return;
    setForm({
      full_name: student.full_name || "",
      email:     student.email || student.user?.email || "",
      usn:       student.usn || "",
      branch:    student.branch || "",
      section:   student.section || "",
      semester:  student.sem || student.semester || ""
    });
  }, [student]);

  // ── Upload photo helper ──
const uploadPhoto = async (file) => {
  if (!file) return;
  setPhotoUploading(true);
  try {
    const formData = new FormData();
    formData.append("photo", file);
    const res = await API.put("/profiles/me/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const updated = { ...student, profile_photo: res.data.profile_photo };
    setStudent(updated);
    localStorage.setItem("user_data", JSON.stringify(updated)); // ← add this
    setPhotoFile(null);
  } catch (err) {
    console.error("Photo upload failed:", err);
  } finally {
    setPhotoUploading(false);
  }
};

// In your save() function, after setStudent:
const save = async () => {
  try {
    setLoading(true);

    if (photoFile) await uploadPhoto(photoFile);

    const res = await API.put("/profiles/me", {
      full_name: form.full_name,
      branch:    form.branch,
      section:   form.section,
      sem:       Number(form.semester)
    });

    const updated = { ...student, ...res.data };
    setStudent(updated);
    localStorage.setItem("user_data", JSON.stringify(updated)); // ← add this

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const changePw = async () => {
    if (!pw.cur)          { setPwErr("Enter your current password"); return; }
    if (pw.np.length < 8) { setPwErr("Min 8 characters"); return; }
    if (pw.np !== pw.cp)  { setPwErr("Passwords don't match"); return; }
    setPwErr("");
    setPwLoading(true);
    try {
      await API.put("/auth/password", {
        current_password: pw.cur,
        new_password:     pw.np,
      });
      setPw({ cur: "", np: "", cp: "" });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 2500);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setPwErr(Array.isArray(detail) ? detail.map((d) => d.msg).join(" ") : detail || "Failed to update password");
    } finally {
      setPwLoading(false);
    }
  };

  const inputStyle = (disabled = false) => ({
    width: "100%", padding: "9px 12px",
    background: disabled ? "var(--surface2)" : "var(--bg)",
    border: "1px solid var(--border2)", borderRadius: "var(--radius)",
    color: disabled ? "var(--muted)" : "var(--white)",
    fontSize: 13, outline: "none", boxSizing: "border-box",
    cursor: disabled ? "not-allowed" : "text",
  });

  return (
    <div style={{ padding: "24px 28px", maxWidth: 620, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
        <button onClick={() => setPage("profile")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", gap: 3, fontSize: 12 }}>
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

        {/* ── Profile Photo ── */}
        <ProfilePhotoField
          student={student}
          onPhotoChange={setPhotoFile}
          uploading={photoUploading}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Full Name" k="full_name" form={form} setForm={setForm} inputStyle={inputStyle} />
          <Field label="Email"     k="email"     form={form} setForm={setForm} inputStyle={inputStyle} disabled />
          <Field label="USN"       k="usn"       form={form} setForm={setForm} inputStyle={inputStyle} disabled />

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
              Branch <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <Select
              value={form.branch || ""}
              onChange={(v) => setForm((prev) => ({ ...prev, branch: v }))}
              options={branches}
              placeholder={branchesLoading ? "Loading..." : "Select branch"}
              disabled={branchesLoading}
              searchable
            />
          </div>

          <Field label="Section" k="section" form={form} setForm={setForm} inputStyle={inputStyle} />

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>
              Semester
            </label>
            <Select
              value={form.semester ? `Semester ${form.semester}` : ""}
              onChange={(v) => setForm((prev) => ({ ...prev, semester: parseInt(v.split(" ")[1]) }))}
              options={SEMESTERS}
              placeholder="Select semester"
            />
          </div>
        </div>

        <button onClick={save} disabled={loading || branchesLoading || photoUploading}
          style={{ marginTop: 14, padding: "8px 20px", background: "var(--amber)", border: "none", borderRadius: "var(--radius)", color: "#0C0E14", fontWeight: 700, cursor: (loading || branchesLoading || photoUploading) ? "not-allowed" : "pointer", fontSize: 13, opacity: (loading || branchesLoading || photoUploading) ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
          {loading && <Icon n="loader" s={14} />}
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={card({ padding: 20 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 13 }}>Change Password</div>
        {pwSuccess && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: "var(--radius)", marginBottom: 12, color: "var(--green)", fontSize: 13 }}>
            <Icon n="check" s={13} /> Password updated
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 11, maxWidth: 320 }}>
          {[["Current Password", "cur"], ["New Password", "np"], ["Confirm Password", "cp"]].map(([l, k]) => (
            <div key={k}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 5 }}>{l}</label>
              <div style={{ position: "relative" }}>
                <input type={showPwFields[k] ? "text" : "password"} value={pw[k]}
                  onChange={(e) => setPw({ ...pw, [k]: e.target.value })}
                  style={{ ...inputStyle(), paddingRight: 38 }} />
                <span onClick={() => setShowPwFields(prev => ({ ...prev, [k]: !prev[k] }))}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, color: "var(--muted)" }}>
                  <Icon n={showPwFields[k] ? "eyeOff" : "eye"} s={16} />
                </span>
              </div>
            </div>
          ))}
          {pwErr && <span style={{ fontSize: 12, color: "var(--red)" }}>{pwErr}</span>}
          <button onClick={changePw} disabled={pwLoading}
            style={{ padding: "8px 18px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", color: "var(--body)", cursor: pwLoading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, alignSelf: "flex-start", opacity: pwLoading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
            {pwLoading && <Icon n="loader" s={14} />}
            {pwLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}