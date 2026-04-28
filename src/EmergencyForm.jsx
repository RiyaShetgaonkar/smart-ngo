import { useState } from "react";
import { addEmergency } from "./db";
import { auth } from "./firebase";

const SKILL_OPTIONS = ["medical", "rescue", "food", "transport", "shelter"];

export default function EmergencyForm({ onClose }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "medium",
    lat: "",
    lng: "",
    requiredSkills: [],
    affectedCount: "",  // ADD THIS
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      requiredSkills: f.requiredSkills.includes(skill)
        ? f.requiredSkills.filter((s) => s !== skill)
        : [...f.requiredSkills, skill],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.lat || !form.lng) {
      alert("Please fill in title, latitude, and longitude.");
      return;
    }
    setLoading(true);
    try {
      await addEmergency({
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        createdBy: auth.currentUser?.uid,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
      alert("Failed to create emergency.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 24,
        width: 400, boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>🚨 New Emergency</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {/* Title */}
        <label style={labelStyle}>Title</label>
        <input
          style={inputStyle}
          placeholder="e.g. Medical Emergency — Bhopal"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        {/* Description */}
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...inputStyle, height: 70, resize: "none" }}
          placeholder="Describe the situation..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* Severity */}
        <label style={labelStyle}>Severity</label>
        <select
          style={inputStyle}
          value={form.severity}
          onChange={(e) => setForm({ ...form, severity: e.target.value })}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        
        <label style={labelStyle}>Estimated People Affected</label>
<input
  style={inputStyle}
  placeholder="e.g. 500"
  type="number"
  value={form.affectedCount}
  onChange={(e) => setForm({ ...form, affectedCount: e.target.value })}
/>

        {/* Lat/Lng */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Latitude</label>
            <input
              style={inputStyle}
              placeholder="19.0760"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Longitude</label>
            <input
              style={inputStyle}
              placeholder="72.8777"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </div>
        </div>

        {/* Required Skills */}
        <label style={labelStyle}>Required Skills</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {SKILL_OPTIONS.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              style={{
                padding: "4px 10px", borderRadius: 20, fontSize: 11,
                border: "1px solid #e2e8f0", cursor: "pointer",
                background: form.requiredSkills.includes(skill) ? "#ef4444" : "#f8fafc",
                color: form.requiredSkills.includes(skill) ? "#fff" : "#333",
              }}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: 10, background: success ? "#22c55e" : "#ef4444",
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}
        >
          {success ? "✓ Created!" : loading ? "Creating..." : "Create Emergency"}
        </button>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 };
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, marginBottom: 12, boxSizing: "border-box" };

