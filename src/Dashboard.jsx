import { useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, Polyline } from "@vis.gl/react-google-maps";
import { listenEmergencies, listenCamps, listenDistressSignals, listenVolunteers, saveAiMatch } from "./db";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot, addDoc } from "firebase/firestore";
import { matchVolunteers, forecastShortages } from './services/aiService';
import { AStar } from './utils/astar';
import EmergencyForm from "./EmergencyForm";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const SEVERITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const LIGHT_CREAM = "#FDFBF7";
const GLOBAL_FONT = "serif";

export default function Dashboard({ user }) {
  const [emergencies, setEmergencies] = useState([]);
  const [camps, setCamps] = useState([]);
  const [distress, setDistress] = useState([]);
  const [selected, setSelected] = useState(null);
  const [aiMatchResult, setAiMatchResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [liveDonations, setLiveDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Volunteer registration state
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [volunteerSubmitted, setVolunteerSubmitted] = useState(false);
  const [volunteerError, setVolunteerError] = useState("");
  const [volunteerLoading, setVolunteerLoading] = useState(false);

  // SESSION STATE: Keeps the newly added volunteer active for the demo
  const [currentSessionVolunteer, setCurrentSessionVolunteer] = useState(null);

  useEffect(() => {
    const u1 = listenEmergencies(setEmergencies);
    const u2 = listenCamps(setCamps);
    const u3 = listenDistressSignals(setDistress);
    const u5 = listenVolunteers(setVolunteers);
    const q = query(collection(db, "donations"), orderBy("timestamp", "desc"), limit(5));
    const u4 = onSnapshot(q, (snap) => {
      setLiveDonations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, []);

  const handleSignOut = () => signOut(auth);

  const handleSelectEmergency = (emergency) => {
    setSelected({ type: "emergency", data: emergency });
    setAiMatchResult(null);
    setRoute(null);
  };

  const calculateRoute = (startLat, startLng, endLat, endLng) => {
    const solver = new AStar(20);
    const path = solver.findPath([0, 0], [19, 19], [[10, 10]]);
    if (path) {
      const latLngPath = path.map(p => ({
        lat: startLat + (p[0] / 19) * (endLat - startLat),
        lng: startLng + (p[1] / 19) * (endLng - startLng)
      }));
      setRoute(latLngPath);
    }
  };

  const triggerVolunteerAlert = async (alertData) => {
    const sheetBestUrl = import.meta.env.VITE_SHEET_BEST_URL;
    try {
      await fetch(sheetBestUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "Emergency ID": alertData.emergencyId,
          "Title": alertData.title,
          "Message": alertData.message,
          "Email": alertData.volunteerEmail,
          "Timestamp": new Date().toLocaleString()
        }),
      });
      console.log("Sheet.best: Logged successfully.");
    } catch (error) {
      console.error("Sheet error:", error);
    }
  };

  const handleRunMatching = async (emergency) => {
    setAiLoading(true);
    setAiMatchResult(null);
    const result = await matchVolunteers(emergency, volunteers);
    setAiMatchResult(result);
    setAiLoading(false);



    if (result && result.matches.length > 0) {
    await saveAiMatch(emergency.id, result.matches);

    // Draw route from top AI-matched volunteer ← ADD THIS BACK
    const topMatchName = result.matches[0].name;
    const topVolunteer = volunteers.find(v => v.name === topMatchName);
    if (topVolunteer) {
      calculateRoute(topVolunteer.lat, topVolunteer.lng, emergency.lat, emergency.lng);
    }
  }

    // DEMO LOGIC: Use the volunteer from this specific session
    if (currentSessionVolunteer) {
      calculateRoute(currentSessionVolunteer.lat, currentSessionVolunteer.lng, emergency.lat, emergency.lng);

      await triggerVolunteerAlert({
        emergencyId: emergency.id,
        title: emergency.title,
        message: `DISPATCH ALERT: Incident response assigned to ${currentSessionVolunteer.name}`,
        volunteerEmail: currentSessionVolunteer.email 
      });

      // Show the Gmail system is working
      const subject = encodeURIComponent(`URGENT: Smart-NGO Dispatch - ${emergency.title}`);
      const body = encodeURIComponent(`Hello ${currentSessionVolunteer.name},\n\nYou have been matched for the incident: ${emergency.title}.`);
      window.open(`mailto:${currentSessionVolunteer.email}?subject=${subject}&body=${body}`);
    }
  };

  const handleForecast = async (emergency) => {
    setForecast("Analyzing disaster metrics...");
    const prediction = await forecastShortages(emergency);
    setForecast(prediction);
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleVolunteerSubmit = async () => {
    setVolunteerError("");
    if (!volunteerName.trim() || !volunteerEmail.trim()) {
      setVolunteerError("Name and Email required.");
      return;
    }
    if (!isValidEmail(volunteerEmail)) {
      setVolunteerError("Invalid email format.");
      return;
    }

    setVolunteerLoading(true);
    try {
      const newVol = {
        name: volunteerName.trim(),
        email: volunteerEmail.trim(),
        lat: 19.0760 + (Math.random() - 0.5) * 0.1,
        lng: 72.8777 + (Math.random() - 0.5) * 0.1,
        skills: "General Relief",
      };

      await addDoc(collection(db, "volunteers"), newVol);
      setCurrentSessionVolunteer(newVol); // Save to temporary session state
      setVolunteerLoading(false);
      setVolunteerSubmitted(true);
    } catch (error) {
      setVolunteerError("Database error.");
      setVolunteerLoading(false);
    }
  };

  const handleVolunteerReset = () => {
    setVolunteerName("");
    setVolunteerEmail("");
    setVolunteerSubmitted(false);
  };

  if (!user) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f8fafc", fontFamily: GLOBAL_FONT }}>
      {/* Top Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 56, background: LIGHT_CREAM, borderBottom: "1px solid #e2e8f0" }}>
        <span style={{ fontWeight: 600 }}>NGO Relief</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowForm(true)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: GLOBAL_FONT }}>
            + New Emergency
          </button>
          <button onClick={handleSignOut} style={{ fontFamily: GLOBAL_FONT }}>Sign out</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Sidebar */}
        <div style={{ width: 320, background: "#fff", borderRight: "1px solid #e2e8f0", overflowY: "auto", padding: 12 }}>
          <div style={{ padding: '10px', background: '#0f172a', borderRadius: '8px', marginBottom: 20 }}>
            <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '10px', fontFamily: GLOBAL_FONT }}>Security Monitor</h3>
            {liveDonations.map(d => (
              <div key={d.id} style={{ color: d.status === 'blocked' ? '#ef4444' : '#4ade80', padding: '6px 0', fontSize: '15px', fontWeight: '500', fontFamily: GLOBAL_FONT }}>
                {d.status === 'blocked' ? '🛑 BLOCKED' : '💎'}  ₹ {d.amount}
              </div>
            ))}
          </div>
          <Section title="Emergencies" count={emergencies.length} color="#ef4444">
            {emergencies.map(e => (
              <Card key={e.id} title={e.title} badge={e.severity} badgeColor={SEVERITY_COLOR[e.severity]} onClick={() => handleSelectEmergency(e)} active={selected?.data?.id === e.id} />
            ))}
          </Section>
        </div>

        {/* Map Area */}
        <div style={{ flex: 1, position: "relative" }}>
          <APIProvider apiKey={MAPS_KEY}>
            <Map defaultCenter={{ lat: 19.0760, lng: 72.8777 }} defaultZoom={10} mapId="ngo-map">
              {emergencies.map(e => (
                <AdvancedMarker key={e.id} position={{ lat: e.lat, lng: e.lng }} onClick={() => handleSelectEmergency(e)}>
                  <Pin background={SEVERITY_COLOR[e.severity]} glyph="!" />
                </AdvancedMarker>
              ))}


              {/* ADD THIS BACK */}
  {volunteers.map((v, i) => (
    <AdvancedMarker key={`vol-${i}`} position={{ lat: v.lat, lng: v.lng }}>
      <div style={{
        background: aiMatchResult?.matches?.[0]?.name === v.name ? "#16a34a" : "#1e40af",
        color: "#fff", padding: "4px 10px", borderRadius: 20,
        fontSize: 11, fontWeight: 600, fontFamily: GLOBAL_FONT
      }}>
        👤 {v.name}
      </div>
    </AdvancedMarker>
  ))}




              {route && <Polyline path={route} strokeColor="#ef4444" strokeWeight={5} />}
            </Map>
          </APIProvider>

          {selected && (
            <div className="fade-in-entry" style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#fff", padding: 20, borderRadius: 12, zIndex: 10, width: 320, boxShadow: "var(--shadow)", border: "1px solid var(--border)", fontFamily: GLOBAL_FONT }}>
              <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 12, right: 12, border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: "18px" }}>✕</button>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--text-h)", fontFamily: GLOBAL_FONT }}>{selected.data.title}</h4>
              
              {/* RESTORED: All original action buttons */}
              {selected.type === "emergency" && !aiMatchResult && !aiLoading && (
                <>
                  <button onClick={() => handleRunMatching(selected.data)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "10px", width: "100%", borderRadius: 8, fontWeight: 600, cursor: "pointer", marginBottom: 6 }}>🚀 Run AI Match</button>
                  <button onClick={() => handleForecast(selected.data)} style={{ background: "#f59e0b", color: "#fff", border: "none", padding: 8, width: "100%", borderRadius: 6 }}>⚠️ Predict Supply Shortage</button>
                </>
              )}

              {aiLoading && <div className="skeleton" style={{ height: 120, borderRadius: 8 }}></div>}

              {/* RESTORED: AI Matching reasoning display */}
              {aiMatchResult && (
                <div style={{ marginTop: 12 }}>
                  <strong style={{ fontSize: 12, color: "var(--accent)", fontFamily: GLOBAL_FONT }}>🤖 AI Best Matches:</strong>
                  {aiMatchResult.matches.map((m, i) => (
                    <div key={i} style={{ background: "var(--accent-bg)", borderRadius: 8, padding: "8px 12px", marginTop: 8, border: "1px solid var(--accent-border)" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-h)", fontFamily: GLOBAL_FONT }}>{m.name} — {m.score}/100</div>
                      <div style={{ fontSize: 11, color: "var(--text)", fontFamily: GLOBAL_FONT }}>{m.reasoning}</div>
                    </div>
                  ))}
                  <p style={{ marginTop: 10, fontSize: 11, fontStyle: "italic", borderLeft: "2px solid var(--accent)", paddingLeft: 8 }}>{aiMatchResult.overallStrategy}</p>
                </div>
              )}

              {/* RESTORED: Supply Shortage Forecast result display */}
              {forecast && (
                <div style={{ background: '#fff7ed', border: '2px dashed #f59e0b', padding: '10px', marginTop: '10px', borderRadius: 8 }}>
                  <strong style={{ color: '#ea580c', fontSize: '11px' }}>⚠️  PREDICTIVE ALERT:</strong>
                  <p style={{ fontSize: '11px', margin: '4px 0 0 0' }}>{forecast}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Volunteer Registration Column */}
        <div style={{ width: 300, background: LIGHT_CREAM, borderLeft: "1px solid #e2e8f0", overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16, fontFamily: GLOBAL_FONT }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Become a Volunteer</h3>
          {!volunteerSubmitted ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="text" placeholder="Full Name" value={volunteerName} onChange={(e) => setVolunteerName(e.target.value)} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1" }} />
              <input type="email" placeholder="Email Address" value={volunteerEmail} onChange={(e) => setVolunteerEmail(e.target.value)} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1" }} />
              {volunteerError && <div style={{ color: "#ef4444", fontSize: 11 }}>{volunteerError}</div>}
              <button onClick={handleVolunteerSubmit} disabled={volunteerLoading} style={{ background: "#16a34a", color: "#fff", border: "none", padding: 11, borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Register</button>
            </div>
          ) : (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: 18, textAlign: "center" }}>
              <h4 style={{ color: "#15803d", fontSize: 14, margin: "0 0 10px 0" }}>Session Active</h4>
              <p style={{ fontSize: 12, margin: "0 0 5px 0" }}>Name: <strong>{currentSessionVolunteer?.name}</strong></p>
              <p style={{ fontSize: 12, margin: "0 0 15px 0" }}>Email: <strong>{currentSessionVolunteer?.email}</strong></p>
              <button onClick={handleVolunteerReset} style={{ background: "none", border: "1px solid #16a34a", color: "#16a34a", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>Add New</button>
            </div>
          )}
        </div>
      </div>
      {showForm && <EmergencyForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function Section({ title, count, color, children }) { return (<div style={{ marginBottom: 16 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 600 }}>{title}</span><span style={{ fontSize: 10, background: color + "20", color, padding: "1px 6px", borderRadius: 8 }}>{count}</span></div>{children}</div>); }
function Card({ title, badge, badgeColor, onClick, active }) {
  return (
    <div onClick={onClick} style={{ padding: 10, borderRadius: 8, marginBottom: 6, border: active ? `2px solid ${badgeColor}` : "1px solid #e2e8f0", background: LIGHT_CREAM, cursor: "pointer", fontFamily: GLOBAL_FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: 10, background: badgeColor + "20", color: badgeColor, padding: "2px 7px", borderRadius: 8 }}>{badge}</span>
      </div>
    </div>
  );
}