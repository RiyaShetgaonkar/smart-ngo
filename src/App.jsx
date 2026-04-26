import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./Login";
import Dashboard from "./Dashboard";
import KMeans from "./KMeans";
import LiveSimulation from './LiveSimulation';
import FraudDetector from './FraudDetector';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showKMeans, setShowKMeans] = useState(false);
  const [centroids, setCentroids] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;
  if (!user) return <Login />;

  return (
    <>
      {/* SHA & R - Background Processors */}
      <LiveSimulation />
      <FraudDetector />
  
      {/* Floating K-Means Trigger */}
      <button
        onClick={() => setShowKMeans(!showKMeans)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "10px 18px", borderRadius: 10,
          background: "#ef4444", color: "#fff",
          border: "none", cursor: "pointer",
          fontWeight: 500, fontSize: 13,
          boxShadow: "0 4px 12px rgba(239,68,68,0.4)"
        }}
      >
        {showKMeans ? "Close" : "Run K-Means"}
      </button>

      {showKMeans && (
        <div style={{
          position: "fixed", bottom: 72, right: 24, zIndex: 9998,
          maxHeight: "80vh", overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          borderRadius: 12,
        }}>
          <KMeans onCentroidsReady={(results) => {
            setCentroids(results);
            setShowKMeans(false);
          }} />
        </div>
      )}

      {/* Main UI */}
      <Dashboard user={user} centroids={centroids} />
    </>
  );
}
