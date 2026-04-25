import { addEmergency, addCamp, addDistressSignal } from "./db";
import { auth } from "./firebase";

const CAMPS_DATA = [
  { name: "Rajiv Gandhi Relief Camp",  lat: 19.0760, lng: 72.8777, capacity: 500, currentOccupancy: 120, resources: { food: 800,  water: 5000, medkits: 60  }},
  { name: "Ambedkar Seva Kendra",      lat: 18.9690, lng: 72.8205, capacity: 300, currentOccupancy: 210, resources: { food: 400,  water: 3000, medkits: 30  }},
  { name: "Shaheed Bhagat Singh Camp", lat: 19.1136, lng: 72.8697, capacity: 700, currentOccupancy: 50,  resources: { food: 1200, water: 8000, medkits: 100 }},
];

const EMERGENCIES_DATA = [
  { title: "Flood — Patna North",        description: "200 people stranded on rooftops",    severity: "high",   lat: 25.5941, lng: 85.1376, requiredSkills: ["boat-rescue","first-aid"]   },
  { title: "Building Collapse — Surat",  description: "Partial collapse, trapped survivors", severity: "high",   lat: 21.1702, lng: 72.8311, requiredSkills: ["search-rescue","medical"]  },
  { title: "Food Shortage — Block C",    description: "Supplies running out in 24 hours",   severity: "medium", lat: 19.0760, lng: 72.8777, requiredSkills: ["logistics","distribution"] },
  { title: "Medical Emergency — Bhopal", description: "Outbreak of waterborne illness",      severity: "high",   lat: 23.2599, lng: 77.4126, requiredSkills: ["medical","first-aid"]      },
  { title: "Road Blocked — NH 44",       description: "Access to 3 villages cut off",        severity: "low",    lat: 28.7041, lng: 77.1025, requiredSkills: ["engineering","logistics"] },
];

const DISTRESS_DATA = [
  { reporterName: "Priya Sharma",     reporterPhone: "+919812345678", lat: 19.0825, lng: 72.8900, affectedCount: 8,  needType: "rescue",  severity: 5 },
  { reporterName: "Mohammad Irfan",   reporterPhone: "+919823456789", lat: 18.9750, lng: 72.8300, affectedCount: 15, needType: "medical", severity: 4 },
  { reporterName: "Gurpreet Kaur",    reporterPhone: "+919834567890", lat: 19.1200, lng: 72.8600, affectedCount: 30, needType: "food",    severity: 3 },
  { reporterName: "Anita Devi",       reporterPhone: "+919845678901", lat: 19.0500, lng: 72.8400, affectedCount: 5,  needType: "shelter", severity: 4 },
  { reporterName: "Rajan Pillai",     reporterPhone: "+919856789012", lat: 19.0900, lng: 72.8650, affectedCount: 22, needType: "rescue",  severity: 5 },
  { reporterName: "Fatima Begum",     reporterPhone: "+919867890123", lat: 18.9800, lng: 72.8100, affectedCount: 10, needType: "medical", severity: 3 },
  { reporterName: "Suresh Babu",      reporterPhone: "+919878901234", lat: 19.1050, lng: 72.8750, affectedCount: 40, needType: "food",    severity: 2 },
  { reporterName: "Meera Nair",       reporterPhone: "+919889012345", lat: 19.0650, lng: 72.8550, affectedCount: 7,  needType: "rescue",  severity: 5 },
  { reporterName: "Arjun Singh",      reporterPhone: "+919890123456", lat: 19.0300, lng: 72.8200, affectedCount: 18, needType: "medical", severity: 4 },
  { reporterName: "Sunita Kumari",    reporterPhone: "+919801234567", lat: 19.0950, lng: 72.8850, affectedCount: 12, needType: "food",    severity: 3 },
  { reporterName: "Abdul Rehman",     reporterPhone: "+919811234567", lat: 18.9600, lng: 72.8000, affectedCount: 25, needType: "shelter", severity: 4 },
  { reporterName: "Deepa Krishnan",   reporterPhone: "+919822234567", lat: 19.1300, lng: 72.8900, affectedCount: 9,  needType: "rescue",  severity: 5 },
  { reporterName: "Harpreet Sandhu",  reporterPhone: "+919833234567", lat: 19.0100, lng: 72.8300, affectedCount: 35, needType: "medical", severity: 2 },
  { reporterName: "Kavitha Reddy",    reporterPhone: "+919844234567", lat: 19.0750, lng: 72.8450, affectedCount: 6,  needType: "food",    severity: 3 },
  { reporterName: "Imran Qureshi",    reporterPhone: "+919855234567", lat: 19.1100, lng: 72.8500, affectedCount: 20, needType: "rescue",  severity: 5 },
];

export default function Seed() {
  const handleSeed = async () => {
    const uid = auth.currentUser?.uid ?? "seed-user";
    try {
      for (const c of CAMPS_DATA)       await addCamp(c);
      for (const e of EMERGENCIES_DATA) await addEmergency({ ...e, createdBy: uid });
      for (const d of DISTRESS_DATA)    await addDistressSignal(d);
      alert("All 3 collections created in Firestore!");
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <p style={{ marginBottom: 12, color: "gray", fontSize: 13 }}>
        Run this once to create all Firestore collections.
      </p>
      <button onClick={handleSeed}>
        Seed Firestore (camps + emergencies + distress_signals)
      </button>
    </div>
  );
}
