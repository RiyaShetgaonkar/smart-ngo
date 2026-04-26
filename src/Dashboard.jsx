import { useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, Polyline } from "@vis.gl/react-google-maps";
import { listenEmergencies, listenCamps, listenDistressSignals } from "./db";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { matchVolunteers } from './services/aiService';
import { AStar } from './utils/astar'; // Ensure this matches your file structure

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const CLUSTER_COLORS = [
  "#ef4444","#3b82f6","#22c55e","#f59e0b",
  "#8b5cf6","#ec4899","#14b8a6",
];

const SEVERITY_COLOR = {
  high:   "#ef4444",
  medium: "#f59e0b",
  low:    "#22c55e",
};

export default function Dashboard({ user, centroids = [] }) {
  const [emergencies, setEmergencies] = useState([]);
  const [camps,       setCamps]       = useState([]);
  const [distress,    setDistress]    = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [activeTab,   setActiveTab]   = useState("all");
  const [aiMatchResult, setAiMatchResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [route, setRoute] = useState(null); // Stores the A* path coordinates added new
  useEffect(() => {
    const u1 = listenEmergencies(setEmergencies);
    const u2 = listenCamps(setCamps);
    const u3 = listenDistressSignals(setDistress);
    return () => { u1(); u2(); u3(); };
  }, []);

  const handleSignOut = () => signOut(auth);
  const handleRunMatching = async (emergency) => {
  setAiLoading(true);
  setAiMatchResult(null);
  setRoute(null); // Reset route when running new match
  
  // Note: Replace dummyVolunteers with a real query to your 'volunteers' collection if you have one.
  const dummyVolunteers = [
    { name: "Riya", skills: ["medical", "transport"], location: {lat: 19.07, lng: 72.87} },
    { name: "Smit", skills: ["rescue", "food"], location: {lat: 19.10, lng: 72.85} },
    { name: "Aarav", skills: ["medical", "first-aid"], location: {lat: 19.05, lng: 72.89} }
  ];

  const result = await matchVolunteers(emergency, dummyVolunteers);
  setAiMatchResult(result);
  setAiLoading(false);

   if (result && result.matches.length > 0) {
    const vol = dummyVolunteers[0];
    calculateRoute(
      vol.location.lat,
      vol.location.lng,
      emergency.lat,
      emergency.lng
    );
  }
};



  const calculateRoute = (startLat, startLng, endLat, endLng) => {
    const solver = new AStar(20);
    const startGrid = [0, 0]; 
    const endGrid = [19, 19];
    const obstacles = [[10, 10], [10, 11], [10, 12], [9, 10], [11, 10]]; 
   
    
    const path = solver.findPath(startGrid, endGrid, obstacles);
 

    if (path) {
      const latLngPath = path.map(p => ({ 
       /* lat: startLat + (p[0] * 0.001), 
        lng: startLng + (p[1] * 0.001) */
        lat: startLat + (p[0] / 19) * (endLat - startLat), 
        lng: startLng + (p[1] / 19) * (endLng - startLng)
      }));
      // Paste this inside calculateRoute, right before setRoute(latLngPath)
console.log("Calculated Path (First 3 coords):", latLngPath.slice(0, 3));
      setRoute(latLngPath);
    }
  };
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", fontFamily: "sans-serif",
      background: "#f8fafc"
    }}>

      {/* ── Top navbar ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px", height: 56,
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#ef4444", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 14
          }}>N</div>
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            NGO Relief Platform
          </span>
        </div>

        <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
          <Stat label="Emergencies" value={emergencies.length} color="#ef4444" />
          <Stat label="Camps"       value={camps.length}       color="#3b82f6" />
          <Stat label="Distress"    value={distress.length}    color="#f59e0b" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={user.photoURL}
            width={30} height={30}
            style={{ borderRadius: "50%" }}
            alt="avatar"
          />
          <span style={{ fontSize: 13, color: "#64748b" }}>
            {user.displayName}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              fontSize: 12, padding: "4px 12px",
              borderRadius: 6, border: "1px solid #e2e8f0",
              cursor: "pointer", background: "#fff", color: "#64748b"
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Main body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 320, background: "#fff",
          borderRight: "1px solid #e2e8f0",
          display: "flex", flexDirection: "column",
          overflow: "hidden", flexShrink: 0,
        }}>
          <div style={{
            display: "flex", borderBottom: "1px solid #e2e8f0",
            padding: "0 8px",
          }}>
            {["all","emergencies","camps","distress"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: "10px 4px",
                  fontSize: 11, fontWeight: 500,
                  border: "none", background: "none",
                  cursor: "pointer", textTransform: "capitalize",
                  borderBottom: activeTab === tab
                    ? "2px solid #ef4444" : "2px solid transparent",
                  color: activeTab === tab ? "#ef4444" : "#64748b",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ overflowY: "auto", flex: 1, padding: 12 }}>

            {(activeTab === "all" || activeTab === "emergencies") && (
              <Section title="Emergencies" count={emergencies.length} color="#ef4444">
                {emergencies.map(e => (
                  <Card
                    key={e.id}
                    title={e.title}
                    sub={e.description}
                    badge={e.severity}
                    badgeColor={SEVERITY_COLOR[e.severity]}
                    onClick={() => setSelected({ type: "emergency", data: e })}
                    active={selected?.data?.id === e.id}
                  />
                ))}
              </Section>
            )}

            {(activeTab === "all" || activeTab === "camps") && (
              <Section title="Relief Camps" count={camps.length} color="#3b82f6">
                {camps.map(c => (
                  <Card
                    key={c.id}
                    title={c.name}
                    sub={`Occupancy: ${c.currentOccupancy}/${c.capacity}`}
                    badge={c.status}
                    badgeColor="#3b82f6"
                    onClick={() => setSelected({ type: "camp", data: c })}
                    active={selected?.data?.id === c.id}
                  />
                ))}
              </Section>
            )}

            {(activeTab === "all" || activeTab === "distress") && (
              <Section title="Distress Signals" count={distress.length} color="#f59e0b">
                {distress.map(d => (
                  <Card
                    key={d.id}
                    title={d.reporterName}
                    sub={`${d.affectedCount} people · ${d.needType}`}
                    badge={`${d.severity}/5`}
                    badgeColor={d.severity >= 4 ? "#ef4444" : "#f59e0b"}
                    onClick={() => setSelected({ type: "distress", data: d })}
                    active={selected?.data?.id === d.id}
                  />
                ))}
              </Section>
            )}

          </div>
        </div>

        {/* ── Map ── */}
        <div style={{ flex: 1, position: "relative" }}>
          <APIProvider apiKey={MAPS_KEY}>
            <Map
              mapId="ngo-map"
              defaultCenter={{ lat: 19.0760, lng: 72.8777 }}
              defaultZoom={5}
              style={{ width: "100%", height: "100%" }}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              {/* Emergency markers — red */}
              {emergencies.map(e => (
                <AdvancedMarker
                  key={e.id}
                  position={{ lat: e.lat, lng: e.lng }}
                  onClick={() => setSelected({ type: "emergency", data: e })}
                >
                  <Pin
                    background={SEVERITY_COLOR[e.severity]}
                    borderColor="#fff"
                    glyphColor="#fff"
                    glyph="!"
                  />
                </AdvancedMarker>
              ))}

              {/* Camp markers — blue */}
              {camps.map(c => (
                <AdvancedMarker
                  key={c.id}
                  position={{ lat: c.lat, lng: c.lng }}
                  onClick={() => setSelected({ type: "camp", data: c })}
                >
                  <Pin
                    background="#3b82f6"
                    borderColor="#fff"
                    glyphColor="#fff"
                    glyph="C"
                  />
                </AdvancedMarker>
              ))}

              {/* Distress markers — amber */}
              {distress.map(d => (
                <AdvancedMarker
                  key={d.id}
                  position={{ lat: d.lat, lng: d.lng }}
                  onClick={() => setSelected({ type: "distress", data: d })}
                >
                  <Pin
                    background={d.severity >= 4 ? "#ef4444" : "#f59e0b"}
                    borderColor="#fff"
                    glyphColor="#fff"
                    glyph={String(d.severity)}
                  />
                </AdvancedMarker>
              ))}

              {/* ── K-Means centroid markers — numbered circles ── */}
              {centroids.map((c, i) => (
                <AdvancedMarker
                  key={`centroid-${i}`}
                  position={{ lat: c.centroid.lat, lng: c.centroid.lng }}
                  onClick={() => setSelected({ type: "centroid", data: c })}
                >
                  <div style={{
                    background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                    color: "#fff", borderRadius: "50%",
                    width: 32, height: 32,
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontWeight: 700,
                    fontSize: 13, border: "3px solid #fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                  }}>
                    {i + 1}
                  </div>
                </AdvancedMarker>
              ))}
              {route && (
    <Polyline
      path={route}
      strokeColor="#ef4444"
      strokeOpacity={0.8}
      strokeWeight={5}
    />
  )}

            </Map>
          </APIProvider>

          {/* ── Info popup ── */}
          {selected && (
            <div style={{
              position: "absolute", bottom: 24, left: "50%",
              transform: "translateX(-50%)",
              background: "#fff", borderRadius: 12,
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              padding: "16px 20px", minWidth: 280, maxWidth: 360,
              zIndex: 10,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 8
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                  color: selected.type === "emergency" ? "#ef4444"
                       : selected.type === "camp"      ? "#3b82f6"
                       : selected.type === "centroid"  ? "#22c55e" : "#f59e0b"
                }}>
                  {selected.type === "centroid" ? "Suggested Camp Location" : selected.type}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    border: "none", background: "none",
                    fontSize: 16, cursor: "pointer", color: "#94a3b8"
                  }}
                >×</button>
              </div>
{/* 
              { {selected.type === "emergency" && (
                <>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{selected.data.title}</p>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{selected.data.description}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selected.data.requiredSkills.map(s => (
                      <span key={s} style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 10,
                        background: "#fef2f2", color: "#ef4444"
                      }}>{s}</span>
                    ))}
                  </div>
                </>
               )} } */}
{selected.type === "emergency" && (
  <>
    <p style={{ fontWeight: 600, marginBottom: 4 }}>{selected.data.title}</p>
    <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{selected.data.description}</p>
    
    {/* --- AI MATCHING BUTTON --- */}
    <button 
      onClick={() => handleRunMatching(selected.data)}
      disabled={aiLoading}
      style={{
        background: aiLoading ? "#ccc" : "#ef4444", color: "white",
        border: "none", padding: "8px 12px", borderRadius: 6,
        fontSize: 12, cursor: "pointer", marginBottom: 12, width: "100%"
      }}
    >
      {aiLoading ? "AI is analyzing..." : "Match Volunteers with AI"}
    </button>

    {/* --- AI RESULTS PANEL --- */}
    {aiMatchResult && (
      <div style={{ background: "#f1f5f9", padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
        <h4 style={{ margin: "0 0 5px 0", color: "#ef4444" }}>AI Reasoning</h4>
        <p style={{ margin: "0 0 10px 0", fontStyle: "italic" }}>{aiMatchResult.overallStrategy}</p>
        <ul style={{ paddingLeft: 15, margin: 0 }}>
          {aiMatchResult.matches.map((m, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              <strong>{m.name}</strong>: {m.reasoning} 
            </li>
          ))}
        </ul>
      </div>
    )}

    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {selected.data.requiredSkills.map(s => (
        <span key={s} style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 10,
          background: "#fef2f2", color: "#ef4444"
        }}>{s}</span>
      ))}
    </div>
  </>
)}

 
              {selected.type === "camp" && (
                <>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{selected.data.name}</p>
                  <p style={{ fontSize: 13, color: "#64748b" }}>
                    Occupancy: {selected.data.currentOccupancy} / {selected.data.capacity}
                  </p>
                  <p style={{ fontSize: 13, color: "#64748b" }}>
                    Food: {selected.data.resources.food} units ·
                    Water: {selected.data.resources.water}L ·
                    Medkits: {selected.data.resources.medkits}
                  </p>
                </>
              )}

              {selected.type === "distress" && (
                <>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{selected.data.reporterName}</p>
                  <p style={{ fontSize: 13, color: "#64748b" }}>
                    {selected.data.affectedCount} people affected · Need: {selected.data.needType}
                  </p>
                  <p style={{ fontSize: 13, color: "#64748b" }}>
                    Severity: {selected.data.severity}/5 · Phone: {selected.data.reporterPhone}
                  </p>
                </>
              )}

              {selected.type === "centroid" && (
                <>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{selected.data.suggestedName}</p>
                  <p style={{ fontSize: 13, color: "#64748b" }}>
                    Signals in cluster: {selected.data.clusterSize}
                  </p>
                  <p style={{ fontSize: 13, color: "#64748b" }}>
                    People affected: {selected.data.totalAffected}
                  </p>
                  <p style={{ fontSize: 13, color: "#64748b" }}>
                    Avg severity: {selected.data.avgSeverity}/5 ·
                    Primary need: {selected.data.dominantNeed}
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontFamily: "monospace" }}>
                    {selected.data.centroid.lat}, {selected.data.centroid.lng}
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── Legend ── */}
          <div style={{
            position: "absolute", top: 16, right: 16,
            background: "#fff", borderRadius: 10,
            padding: "10px 14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontSize: 12, zIndex: 10,
          }}>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Legend</p>
            <LegendItem color="#ef4444" label="High emergency" />
            <LegendItem color="#f59e0b" label="Medium emergency" />
            <LegendItem color="#22c55e" label="Low emergency" />
            <LegendItem color="#3b82f6" label="Relief camp" />
            <LegendItem color="#f59e0b" label="Distress signal" />
            {centroids.length > 0 &&
              <LegendItem color="#22c55e" label="K-Means camp suggestion" />
            }
          </div>
        </div>
      </div>
    </div>
  );


function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94a3b8" }}>{label}</div>
    </div>
  );
}

function Section({ title, count, color, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginBottom: 8, padding: "0 4px"
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{title}</span>
        <span style={{
          fontSize: 10, padding: "1px 6px", borderRadius: 8,
          background: color + "20", color
        }}>{count}</span>
      </div>
      {children}
    </div>
  );
}

function Card({ title, sub, badge, badgeColor, onClick, active }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 12px", borderRadius: 8, marginBottom: 6,
        border: active ? `1.5px solid ${badgeColor}` : "1px solid #e2e8f0",
        background: active ? badgeColor + "08" : "#fff",
        cursor: "pointer", transition: "all .15s",
      }}
    >
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 3
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>
          {title}
        </span>
        <span style={{
          fontSize: 10, padding: "2px 7px", borderRadius: 8,
          background: badgeColor + "20", color: badgeColor,
          fontWeight: 600, flexShrink: 0, marginLeft: 6
        }}>{badge}</span>
      </div>
      <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{sub}</p>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", background: color
      }} />
      <span style={{ color: "#64748b" }}>{label}</span>
    </div>
  );
}}