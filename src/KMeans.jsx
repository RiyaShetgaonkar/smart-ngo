import { useState } from "react";
import { getDocs } from "firebase/firestore";
import { distressCol } from "./db";

// ── Pure K-Means implementation ───────────────────────────────────────────

function distance(a, b) {
  const latDiff = a.lat - b.lat;
  const lngDiff = a.lng - b.lng;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}

function average(points) {
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: parseFloat((sum.lat / points.length).toFixed(6)),
    lng: parseFloat((sum.lng / points.length).toFixed(6)),
  };
}

function kMeans(points, k = 7, maxIterations = 100) {
  // Step 1 — Pick k random starting centroids from the data
  const shuffled = [...points].sort(() => Math.random() - 0.5);
  let centroids = shuffled.slice(0, k).map(p => ({ lat: p.lat, lng: p.lng }));

  let assignments = new Array(points.length).fill(0);
  let changed = true;
  let iteration = 0;

  while (changed && iteration < maxIterations) {
    changed = false;
    iteration++;

    // Step 2 — Assign each point to nearest centroid
    points.forEach((point, i) => {
      let minDist = Infinity;
      let nearest = 0;
      centroids.forEach((centroid, ci) => {
        const d = distance(point, centroid);
        if (d < minDist) { minDist = d; nearest = ci; }
      });
      if (assignments[i] !== nearest) {
        assignments[i] = nearest;
        changed = true;
      }
    });

    // Step 3 — Recalculate centroids as mean of assigned points
    centroids = centroids.map((_, ci) => {
      const cluster = points.filter((_, i) => assignments[i] === ci);
      if (cluster.length === 0) return centroids[ci]; // keep old if empty
      return average(cluster);
    });
  }

  // Step 4 — Build result: each centroid with its cluster stats
  const results = centroids.map((centroid, ci) => {
    const cluster = points.filter((_, i) => assignments[i] === ci);
    const totalAffected = cluster.reduce((s, p) => s + (p.affectedCount || 1), 0);
    const avgSeverity   = cluster.length
      ? (cluster.reduce((s, p) => s + (p.severity || 3), 0) / cluster.length).toFixed(2)
      : 0;

    // Find dominant city in this cluster
    const cityCounts = {};
    cluster.forEach(p => {
      cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
    });
    const dominantCity = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

    // Find dominant need type
    const needCounts = {};
    cluster.forEach(p => {
      needCounts[p.needType] = (needCounts[p.needType] || 0) + 1;
    });
    const dominantNeed = Object.entries(needCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "mixed";

    return {
      id:            `cluster-${ci + 1}`,
      centroid,
      clusterSize:   cluster.length,
      totalAffected,
      avgSeverity:   parseFloat(avgSeverity),
      dominantCity,
      dominantNeed,
      suggestedName: `${dominantCity} Relief Camp ${ci + 1}`,
    };
  });

  // Sort by total affected descending (highest need first)
  return results.sort((a, b) => b.totalAffected - a.totalAffected);
}

// ── Color per cluster ─────────────────────────────────────────────────────

const CLUSTER_COLORS = [
  "#ef4444","#3b82f6","#22c55e","#f59e0b",
  "#8b5cf6","#ec4899","#14b8a6",
];

// ── Component ─────────────────────────────────────────────────────────────

export default function KMeans({ onCentroidsReady }) {
  const [status,    setStatus]    = useState("idle");
  const [progress,  setProgress]  = useState("");
  const [clusters,  setClusters]  = useState([]);
  const [k,         setK]         = useState(7);
  const [copied,    setCopied]    = useState(false);

  const run = async () => {
    setStatus("loading");
    setProgress("Fetching distress signals from Firestore...");
    setClusters([]);

    try {
      // Pull all distress signals
      const snap = await getDocs(distressCol);
      const points = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProgress(`Loaded ${points.length} signals. Running K-Means with k=${k}...`);

      // Small delay so UI updates before heavy compute
      await new Promise(r => setTimeout(r, 100));

      const results = kMeans(points, k);
      setClusters(results);
      setStatus("done");
      setProgress(`Done. Found ${results.length} optimal camp locations.`);

      // Hand off to F (Dashboard/Map)
      if (onCentroidsReady) onCentroidsReady(results);

    } catch (err) {
      console.error(err);
      setStatus("error");
      setProgress("Error: " + err.message);
    }
  };

  const centroidArray = clusters.map(c => ({
    name: c.suggestedName,
    lat:  c.centroid.lat,
    lng:  c.centroid.lng,
  }));

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(centroidArray, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      padding: 24, maxWidth: 640,
      background: "#fff", borderRadius: 12,
      border: "1px solid #e2e8f0", fontFamily: "sans-serif"
    }}>
      {/* Header */}
      <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
        K-Means Clustering Engine
      </p>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        Pulls all distress signals from Firestore and finds the optimal
        coordinates to place relief camps.
      </p>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: "#374151" }}>
          Number of camps (k):
          <input
            type="number" min={2} max={15} value={k}
            onChange={e => setK(Number(e.target.value))}
            style={{
              marginLeft: 8, width: 60, padding: "4px 8px",
              border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13
            }}
          />
        </label>
        <button
          onClick={run}
          disabled={status === "loading"}
          style={{
            padding: "8px 20px", borderRadius: 8, fontSize: 13,
            fontWeight: 500, border: "none", cursor: "pointer",
            background: status === "loading" ? "#94a3b8" : "#ef4444",
            color: "#fff",
          }}
        >
          {status === "loading" ? "Running..." : "Run K-Means"}
        </button>
      </div>

      {/* Status */}
      {progress && (
        <p style={{
          fontSize: 12, color: "#64748b",
          marginBottom: 16, fontStyle: "italic"
        }}>
          {progress}
        </p>
      )}

      {/* Results */}
      {clusters.length > 0 && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 10, marginBottom: 20
          }}>
            {clusters.map((c, i) => (
              <div key={c.id} style={{
                padding: "12px 14px", borderRadius: 10,
                border: `1.5px solid ${CLUSTER_COLORS[i % CLUSTER_COLORS.length]}22`,
                background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] + "08",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                    flexShrink: 0
                  }} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {c.suggestedName}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
                  <div>Signals in cluster: <strong>{c.clusterSize}</strong></div>
                  <div>People affected: <strong>{c.totalAffected}</strong></div>
                  <div>Avg severity: <strong>{c.avgSeverity}/5</strong></div>
                  <div>Primary need: <strong>{c.dominantNeed}</strong></div>
                  <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: 11, color: "#94a3b8" }}>
                    {c.centroid.lat}, {c.centroid.lng}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Centroid output for F */}
          <div style={{
            background: "#f8fafc", borderRadius: 8,
            border: "1px solid #e2e8f0", overflow: "hidden"
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "8px 14px",
              borderBottom: "1px solid #e2e8f0"
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                Centroid array → hand this to F for map rendering
              </span>
              <button
                onClick={handleCopy}
                style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 6,
                  border: "1px solid #e2e8f0", cursor: "pointer",
                  background: copied ? "#16a34a" : "#fff",
                  color: copied ? "#fff" : "#64748b",
                }}
              >
                {copied ? "Copied!" : "Copy JSON"}
              </button>
            </div>
            <pre style={{
              margin: 0, padding: 14,
              fontSize: 11, overflowX: "auto",
              color: "#374151", lineHeight: 1.6,
              maxHeight: 200, overflowY: "auto"
            }}>
              {JSON.stringify(centroidArray, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}