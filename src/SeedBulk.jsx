import { addDistressSignal } from "./db";
import { auth } from "./firebase";
import { useState } from "react";

// ── Indian name pools (all religions) ─────────────────────────────────────
const FIRST_NAMES = [
  // Hindu
  "Aarav","Arjun","Vikram","Rohan","Kiran","Suresh","Ramesh","Mahesh","Rajesh","Dinesh",
  "Priya","Anita","Sunita","Kavitha","Meera","Pooja","Deepa","Rekha","Usha","Lata",
  // Muslim
  "Mohammad","Imran","Farouk","Abdul","Salim","Irfan","Zubair","Rafiq","Nasir","Tariq",
  "Fatima","Ayesha","Zainab","Rukhsar","Nadia","Shabnam","Reshma","Sana","Asma","Bilqis",
  // Sikh
  "Gurpreet","Harpreet","Jaspreet","Manpreet","Sukhpreet","Amarjit","Kulwant","Balwant",
  "Simran","Navneet","Parminder","Rajwinder","Sukhmani","Harleen","Jasveer","Gurjot",
  // South Indian
  "Rajan","Suresh","Venkat","Krishnan","Murugan","Selvam","Senthil","Karthik","Balan",
  "Meenakshi","Lakshmi","Saraswathi","Kamala","Vasantha","Revathi","Geetha","Padma",
  // Christian
  "Thomas","Joseph","George","Anthony","Francis","Jerome","Clement","Benedict","Xavier",
  "Mary","Grace","Esther","Priscilla","Sharon","Cynthia","Stella","Louisa","Rosa",
];

const LAST_NAMES = [
  // Hindu
  "Sharma","Verma","Gupta","Singh","Kumar","Yadav","Patel","Joshi","Mishra","Pandey",
  "Reddy","Nair","Pillai","Menon","Iyer","Rao","Naidu","Chandra","Bhat","Hegde",
  // Muslim
  "Khan","Sheikh","Ansari","Qureshi","Siddiqui","Malik","Mirza","Hussain","Baig","Chaudhary",
  // Sikh
  "Singh","Kaur","Sandhu","Gill","Grewal","Dhillon","Sidhu","Brar","Mann","Randhawa",
  // South Indian
  "Krishnamurthy","Venkataraman","Subramaniam","Sundaram","Raghavan","Annamalai","Natarajan",
  // Christian
  "D'Souza","Fernandes","Pereira","Rodrigues","Mascarenhas","D'Costa","Sequeira","Pinto",
];

const NEED_TYPES = ["medical","food","rescue","shelter"];

const INDIAN_CITIES = [
  // Mumbai region
  { city: "Mumbai",     lat: 19.0760, lng: 72.8777, spread: 0.15 },
  { city: "Thane",      lat: 19.2183, lng: 72.9781, spread: 0.08 },
  { city: "Navi Mumbai",lat: 19.0330, lng: 73.0297, spread: 0.08 },
  // Delhi region
  { city: "Delhi",      lat: 28.7041, lng: 77.1025, spread: 0.20 },
  { city: "Gurgaon",    lat: 28.4595, lng: 77.0266, spread: 0.08 },
  { city: "Noida",      lat: 28.5355, lng: 77.3910, spread: 0.08 },
  // Bihar / flood zone
  { city: "Patna",      lat: 25.5941, lng: 85.1376, spread: 0.12 },
  { city: "Muzaffarpur",lat: 26.1209, lng: 85.3647, spread: 0.10 },
  { city: "Darbhanga",  lat: 26.1542, lng: 85.8918, spread: 0.08 },
  // Gujarat
  { city: "Ahmedabad",  lat: 23.0225, lng: 72.5714, spread: 0.12 },
  { city: "Surat",      lat: 21.1702, lng: 72.8311, spread: 0.10 },
  { city: "Vadodara",   lat: 22.3072, lng: 73.1812, spread: 0.08 },
  // Madhya Pradesh
  { city: "Bhopal",     lat: 23.2599, lng: 77.4126, spread: 0.10 },
  { city: "Indore",     lat: 22.7196, lng: 75.8577, spread: 0.08 },
  // Rajasthan
  { city: "Jaipur",     lat: 26.9124, lng: 75.7873, spread: 0.12 },
  { city: "Jodhpur",    lat: 26.2389, lng: 73.0243, spread: 0.08 },
  // Tamil Nadu
  { city: "Chennai",    lat: 13.0827, lng: 80.2707, spread: 0.12 },
  { city: "Madurai",    lat: 9.9252,  lng: 78.1198, spread: 0.08 },
  // Kerala
  { city: "Kochi",      lat: 9.9312,  lng: 76.2673, spread: 0.08 },
  { city: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, spread: 0.08 },
  // West Bengal
  { city: "Kolkata",    lat: 22.5726, lng: 88.3639, spread: 0.12 },
  { city: "Howrah",     lat: 22.5958, lng: 88.2636, spread: 0.06 },
  // Odisha
  { city: "Bhubaneswar",lat: 20.2961, lng: 85.8245, spread: 0.10 },
  { city: "Cuttack",    lat: 20.4625, lng: 85.8830, spread: 0.08 },
  // Assam
  { city: "Guwahati",   lat: 26.1445, lng: 91.7362, spread: 0.10 },
  { city: "Silchar",    lat: 24.8333, lng: 92.7789, spread: 0.06 },
  // Uttar Pradesh
  { city: "Lucknow",    lat: 26.8467, lng: 80.9462, spread: 0.10 },
  { city: "Varanasi",   lat: 25.3176, lng: 82.9739, spread: 0.08 },
  { city: "Kanpur",     lat: 26.4499, lng: 80.3319, spread: 0.08 },
  // Punjab
  { city: "Amritsar",   lat: 31.6340, lng: 74.8723, spread: 0.08 },
  { city: "Ludhiana",   lat: 30.9010, lng: 75.8573, spread: 0.08 },
];

const DISASTER_SCENARIOS = [
  "Trapped under debris after building collapse",
  "Stranded due to flash flooding",
  "Running out of food and drinking water",
  "Requires urgent medical attention",
  "Elderly person unable to evacuate",
  "Children separated from family",
  "Pregnant woman needs immediate help",
  "House completely submerged in water",
  "No access to road due to landslide",
  "Injured after cyclone hit the area",
  "Fire broke out in slum area",
  "Contaminated water supply, disease spreading",
  "No shelter after earthquake damage",
  "Bridge washed away, village cut off",
  "Multiple casualties, need ambulance",
];

const GENDERS = ["Male","Female","Other"];
const AGE_GROUPS = ["0-12","13-25","26-40","41-60","60+"];
const RELIGIONS = ["Hindu","Muslim","Sikh","Christian","Buddhist","Jain","Other"];
const DISABILITIES = ["None","None","None","None","Visual","Mobility","Hearing","Cognitive"];

// ── Helpers ───────────────────────────────────────────────────────────────

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const jitter = (base, spread) => base + (Math.random() - 0.5) * spread * 2;
const phone = () => `+91${randInt(7000000000, 9999999999)}`;
const name = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

function generateSignal() {
  const location = pick(INDIAN_CITIES);
  const severity = randInt(1, 5);

  return {
    // Identity
    reporterName:    name(),
    reporterPhone:   phone(),
    reporterGender:  pick(GENDERS),
    reporterAge:     randInt(18, 75),

    // Location
    lat:             parseFloat(jitter(location.lat, location.spread).toFixed(6)),
    lng:             parseFloat(jitter(location.lng, location.spread).toFixed(6)),
    city:            location.city,
    state:           getState(location.city),

    // Emergency details
    affectedCount:   randInt(1, 80),
    needType:        pick(NEED_TYPES),
    severity:        severity,
    description:     pick(DISASTER_SCENARIOS),

    // Demographics
    demographics: {
      ageGroup:    pick(AGE_GROUPS),
      gender:      pick(GENDERS),
      religion:    pick(RELIGIONS),
      disability:  pick(DISABILITIES),
    },

    // Status
    nearestCamp:     null,
    linkedEmergency: null,
    resolved:        false,
    verifiedBy:      null,
  };
}

function getState(city) {
  const map = {
    "Mumbai": "Maharashtra",   "Thane": "Maharashtra",    "Navi Mumbai": "Maharashtra",
    "Delhi": "Delhi",          "Gurgaon": "Haryana",      "Noida": "Uttar Pradesh",
    "Patna": "Bihar",          "Muzaffarpur": "Bihar",    "Darbhanga": "Bihar",
    "Ahmedabad": "Gujarat",    "Surat": "Gujarat",        "Vadodara": "Gujarat",
    "Bhopal": "Madhya Pradesh","Indore": "Madhya Pradesh",
    "Jaipur": "Rajasthan",     "Jodhpur": "Rajasthan",
    "Chennai": "Tamil Nadu",   "Madurai": "Tamil Nadu",
    "Kochi": "Kerala",         "Thiruvananthapuram": "Kerala",
    "Kolkata": "West Bengal",  "Howrah": "West Bengal",
    "Bhubaneswar": "Odisha",   "Cuttack": "Odisha",
    "Guwahati": "Assam",       "Silchar": "Assam",
    "Lucknow": "Uttar Pradesh","Varanasi": "Uttar Pradesh","Kanpur": "Uttar Pradesh",
    "Amritsar": "Punjab",      "Ludhiana": "Punjab",
  };
  return map[city] || "India";
}

// ── Component ─────────────────────────────────────────────────────────────

export default function SeedBulk({ onDone }) {
  const [status, setStatus]   = useState("idle"); // idle | running | done | error
  const [progress, setProgress] = useState(0);
  const TOTAL = 500;
  const BATCH = 20; // write 20 at a time to avoid overwhelming Firestore

  const handleSeed = async () => {
    setStatus("running");
    setProgress(0);
    try {
      const signals = Array.from({ length: TOTAL }, generateSignal);
      for (let i = 0; i < signals.length; i += BATCH) {
        const batch = signals.slice(i, i + BATCH);
        await Promise.all(batch.map(s => addDistressSignal(s)));
        setProgress(Math.min(i + BATCH, TOTAL));
      }
      setStatus("done");
      if (onDone) onDone();
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div style={{
      padding: 24, maxWidth: 480,
      background: "#fff", borderRadius: 12,
      border: "1px solid #e2e8f0",
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>
        Bulk Distress Signal Seeder
      </p>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
        Generates {TOTAL} realistic signals across 32 Indian cities
        with full demographic data for K-Means clustering.
      </p>

      {status === "running" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            height: 6, background: "#e2e8f0",
            borderRadius: 3, overflow: "hidden", marginBottom: 6
          }}>
            <div style={{
              height: "100%", borderRadius: 3,
              background: "#ef4444",
              width: `${(progress / TOTAL) * 100}%`,
              transition: "width .3s"
            }} />
          </div>
          <p style={{ fontSize: 12, color: "#64748b" }}>
            {progress} / {TOTAL} signals written...
          </p>
        </div>
      )}

      {status === "done" && (
        <p style={{
          fontSize: 13, color: "#16a34a",
          marginBottom: 12, fontWeight: 500
        }}>
          Done! {TOTAL} distress signals added to Firestore.
        </p>
      )}

      {status === "error" && (
        <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>
          Something went wrong. Check the console.
        </p>
      )}

      <button
        onClick={handleSeed}
        disabled={status === "running" || status === "done"}
        style={{
          padding: "8px 20px", borderRadius: 8,
          background: status === "done" ? "#16a34a"
                    : status === "running" ? "#94a3b8" : "#ef4444",
          color: "#fff", border: "none",
          cursor: status === "running" || status === "done"
                  ? "not-allowed" : "pointer",
          fontWeight: 500, fontSize: 13,
        }}
      >
        {status === "idle"    && "Generate 500 Signals"}
        {status === "running" && "Writing to Firestore..."}
        {status === "done"    && "Complete"}
        {status === "error"   && "Retry"}
      </button>
    </div>
  );
}