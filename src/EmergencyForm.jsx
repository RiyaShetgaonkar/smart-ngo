import { useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps"; // Essential for geocoding
import { addEmergency } from "./db";
import { auth } from "./firebase";

const SKILL_OPTIONS = ["medical", "rescue", "food", "transport", "shelter"];

export default function EmergencyForm({ onClose }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "medium",
    address: "", // Replaced lat/lng with address
    requiredSkills: [],
    affectedCount: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Initialize the Geocoding library
  const geocodingLib = useMapsLibrary("geocoding");

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      requiredSkills: f.requiredSkills.includes(skill)
        ? f.requiredSkills.filter((s) => s !== skill)
        : [...f.requiredSkills, skill],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.address) {
      alert("Please fill in the title and address.");
      return;
    }
    if (!geocodingLib) {
      alert("Geocoding service is still loading, please wait a second.");
      return;
    }

    setLoading(true);

    try {
      // 1. Geocode the address
      const geocoder = new geocodingLib.Geocoder();
      const response = await geocoder.geocode({ address: form.address });

      if (response.results.length === 0) {
        throw new Error("Could not find the location. Please be more specific.");
      }

      const { lat, lng } = response.results[0].geometry.location.toJSON();

      // 2. Save to Firebase with the calculated Lat/Lng
      await addEmergency({
        ...form,
        lat,
        lng,
        createdBy: auth.currentUser?.uid,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to create emergency.");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 400, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>🚨 New Emergency</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer" }}>✕</button>
        </div>

        <label style={labelStyle}>Title</label>
        <input style={inputStyle} placeholder="e.g. Medical Emergency — Bhopal" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <label style={labelStyle}>Location / Address</label>
        <input style={inputStyle} placeholder="Enter street address or place name" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

        <label style={labelStyle}>Severity</label>
        <select style={inputStyle} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <label style={labelStyle}>People Affected</label>
        <input style={inputStyle} type="number" value={form.affectedCount} onChange={(e) => setForm({ ...form, affectedCount: e.target.value })} />

        {/* Skills code remains the same... */}
        <label style={labelStyle}>Required Skills</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {SKILL_OPTIONS.map((skill) => (
            <button key={skill} onClick={() => toggleSkill(skill)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, background: form.requiredSkills.includes(skill) ? "#ef4444" : "#f8fafc" }}>
              {skill}
            </button>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: 10, background: success ? "#22c55e" : "#ef4444", color: "#fff", border: "none", borderRadius: 8 }}>
          {success ? "✓ Created!" : loading ? "Locating..." : "Create Emergency"}
        </button>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 };
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, marginBottom: 12, boxSizing: "border-box" };