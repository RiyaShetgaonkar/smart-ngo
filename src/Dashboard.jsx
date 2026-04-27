import React, { useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, Polyline } from "@vis.gl/react-google-maps";
import { listenEmergencies, listenCamps, listenDistressSignals } from "./db";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { matchVolunteers } from './services/aiService';
import { AStar } from './utils/astar'; 
import { listenVolunteers, saveAiMatch, listenAiMatches } from "./db";
import EmergencyForm from "./EmergencyForm";

// --- Constants ---
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const CLUSTER_COLORS = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ec4899","#14b8a6"];
const SEVERITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

export default function Dashboard({ user, centroids = [] }) {
  // --- STATES ---
  const [emergencies, setEmergencies] = useState([]);
  const [camps, setCamps] = useState([]);
  const [distress, setDistress] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [aiMatchResult, setAiMatchResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [route, setRoute] = useState(null); 
  const [forecast, setForecast] = useState(null);
  const [liveDonations, setLiveDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const u1 = listenEmergencies(setEmergencies);
    const u2 = listenCamps(setCamps);
    const u3 = listenDistressSignals(setDistress);
    const u5 = listenVolunteers(setVolunteers); // ADD THIS
    const q = query(collection(db, "donations"), orderBy("timestamp", "desc"), limit(5));
    const u4 = onSnapshot(q, (snap) => {
      setLiveDonations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, []);

  // --- FUNCTIONS ---
  const handleSignOut = () => signOut(auth);
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

const handleRunMatching = async (emergency) => {
  setAiLoading(true);
  setAiMatchResult(null);
  setRoute(null);
  const result = await matchVolunteers(emergency, volunteers);
  setAiMatchResult(result);
  setAiLoading(false);
  if (result && result.matches.length > 0) {
    await saveAiMatch(emergency.id, result.matches);
    const topMatchName = result.matches[0].name;
    const topVolunteer = volunteers.find(v => v.name === topMatchName);
    if (topVolunteer) {
      calculateRoute(topVolunteer.lat, topVolunteer.lng, emergency.lat, emergency.lng); // ← fixed
    }
  } // ← this closing brace was missing
};

if (!user) return null;
 
      // --- RETURN UI ---
return (
  <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f8fafc" }}>
    {/* Navbar */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 56, background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
      <span style={{ fontWeight: 600 }}>NGO Relief</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
        >
          + New Emergency
        </button>
        <button onClick={handleSignOut}>Sign out</button>
      </div>
    </div>  {/* ← this closing tag was missing */}

    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 320, background: "#fff", borderRight: "1px solid #e2e8f0", overflowY: "auto", padding: 12 }}>
          
          {/* Security Monitor */}
          <div style={{ padding: '10px', background: '#0f172a', borderRadius: '8px', marginBottom: 20 }}>
            <h3 style={{ color: '#fff', fontSize: '12px' }}>Security Monitor (F)</h3>
            {liveDonations.map(d => (
              <div key={d.id} style={{ color: d.status === 'blocked' ? '#ef4444' : '#22c55e', padding: '4px 0', fontWeight: d.status === 'blocked' ? 'bold' : 'normal' }}>
                {d.status === 'blocked' ? '🛑 BLOCKED' : '💎'} ₹{d.amount}
              </div>
            ))}
          </div>

          <Section title="Emergencies" count={emergencies.length} color="#ef4444">
             {emergencies.map(e => <Card key={e.id} title={e.title} badge={e.severity} badgeColor={SEVERITY_COLOR[e.severity]} onClick={() => setSelected({ type: "emergency", data: e })} active={selected?.data?.id === e.id} />)}
          </Section>
        </div>

        {/* Map Area */}
        <div style={{ flex: 1, position: "relative" }}>
          <APIProvider apiKey={MAPS_KEY}>
            <Map defaultCenter={{ lat: 19.0760, lng: 72.8777 }} defaultZoom={10} mapId="ngo-map">
              {emergencies.map(e => <AdvancedMarker key={e.id} position={{ lat: e.lat, lng: e.lng }} onClick={() => setSelected({ type: "emergency", data: e })}><Pin background={SEVERITY_COLOR[e.severity]} glyph="!" /></AdvancedMarker>)}
               {/* ADD THIS */}
  {volunteers.map((v, i) => (
    <AdvancedMarker key={`vol-${i}`} position={{ lat: v.lat, lng: v.lng }}>
      <div style={{
        background: aiMatchResult?.matches?.[0]?.name === v.name ? "#16a34a" : "#1e40af",
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        gap: 4
      }}>
        👤 {v.name}
      </div>
    </AdvancedMarker>
  ))}
              {route && <Polyline path={route} strokeColor="#ef4444" strokeWeight={5} />}
            </Map>
          </APIProvider>

          {/* THE MAP POPUP IS HERE (Inside the Map Area div) */}
          {selected && (
            <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#fff", padding: 20, borderRadius: 12, zIndex: 10, width: 300, boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }}>
              <h4>{selected.data.title || selected.data.name}</h4>
              {selected.type === "emergency" && (
                <button onClick={() => handleRunMatching(selected.data)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: 8, width: "100%", borderRadius: 6 }}>
                  Run AI Match
                </button>
              )}
              {/* ADD THIS BLOCK */}
    {aiMatchResult && (
      <div style={{ marginTop: 12 }}>
        <strong style={{ fontSize: 12 }}>🤖 AI Matches:</strong>
        {aiMatchResult.matches.map((m, i) => (
          <div key={i} style={{ background: "#f1f5f9", borderRadius: 6, padding: 8, marginTop: 6 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name} — {m.score}/100</div>
            <div style={{ fontSize: 11, color: "#555" }}>{m.reasoning}</div>
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 11, color: "#888", fontStyle: "italic" }}>
          {aiMatchResult.overallStrategy}
        </div>
      </div>
    )}
              
              {/* Forecast Alert UI */}
              {forecast && (
                <div style={{ background: '#fff7ed', border: '2px dashed #f59e0b', padding: '10px', marginTop: '10px' }}>
                  <strong style={{ color: '#ea580c', fontSize: '11px' }}>⚠️ SHE PREDICTIVE ALERT:</strong>
                  <p style={{ fontSize: '11px' }}>{forecast}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showForm && <EmergencyForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

// Helper components remain at the bottom
function Section({ title, count, color, children }) { return (<div style={{ marginBottom: 16 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 600 }}>{title}</span><span style={{ fontSize: 10, background: color + "20", color, padding: "1px 6px", borderRadius: 8 }}>{count}</span></div>{children}</div>); }
function Card({ title, badge, badgeColor, onClick, active }) { return (<div onClick={onClick} style={{ padding: 10, borderRadius: 8, marginBottom: 6, border: active ? `2px solid ${badgeColor}` : "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span><span style={{ fontSize: 10, background: badgeColor + "20", color: badgeColor, padding: "2px 7px", borderRadius: 8 }}>{badge}</span></div></div>); }