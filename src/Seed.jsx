import { addEmergency, addCamp, addDistressSignal } from "./db";
import { auth } from "./firebase";

const CAMPS_DATA = [
  { name: "Rajiv Gandhi Relief Camp",  lat: 15.5527, lng: 32.5324, capacity: 500, currentOccupancy: 120, resources: { food: 800,  water: 5000, medkits: 60  }},
  { name: "Ambedkar Seva Kendra",      lat: 15.6012, lng: 32.4891, capacity: 300, currentOccupancy: 210, resources: { food: 400,  water: 3000, medkits: 30  }},
  { name: "Shaheed Bhagat Singh Camp", lat: 15.4788, lng: 32.5901, capacity: 700, currentOccupancy: 50,  resources: { food: 1200, water: 8000, medkits: 100 }},
];

const EMERGENCIES_DATA = [
  { title: "Flood — Patna North",        description: "200 people stranded on rooftops",    severity: "high",   lat: 15.5580, lng: 32.5410, requiredSkills: ["boat-rescue","first-aid"]   },
  { title: "Building Collapse — Surat",  description: "Partial collapse, trapped survivors", severity: "high",   lat: 15.6100, lng: 32.5100, requiredSkills: ["search-rescue","medical"]  },
  { title: "Food Shortage — Block C",    description: "Supplies running out in 24 hours",   severity: "medium", lat: 15.6012, lng: 32.4891, requiredSkills: ["logistics","distribution"] },
  { title: "Medical Emergency — Bhopal", description: "Outbreak of waterborne illness",      severity: "high",   lat: 15.4500, lng: 32.5600, requiredSkills: ["medical","first-aid"]      },
  { title: "Road Blocked — NH 44",       description: "Access to 3 villages cut off",        severity: "low",    lat: 15.5200, lng: 32.6000, requiredSkills: ["engineering","logistics"] },
];

const DISTRESS_DATA = [
  { reporterName: "Priya Sharma",      reporterPhone: "+919812345678", lat: 15.5601, lng: 32.5388, affectedCount: 8,  needType: "rescue",  severity: 5 },
  { reporterName: "Mohammad Irfan",    reporterPhone: "+919823456789", lat: 15.5750, lng: 32.5200, affectedCount: 15, needType: "medical", severity: 4 },
  { reporterName: "Gurpreet Kaur",     reporterPhone: "+919834567890", lat: 15.4900, lng: 32.5700, affectedCount: 30, needType: "food",    severity: 3 },
  { reporterName: "Anita Devi",        reporterPhone: "+919845678901", lat: 15.6200, lng: 32.4700, affectedCount: 5,  needType: "shelter", severity: 4 },
  { reporterName: "Rajan Pillai",      reporterPhone: "+919856789012", lat: 15.5100, lng: 32.5500, affectedCount: 22, needType: "rescue",  severity: 5 },
  { reporterName: "Fatima Begum",      reporterPhone: "+919867890123", lat: 15.5400, lng: 32.5900, affectedCount: 10, needType: "medical", severity: 3 },
  { reporterName: "Suresh Babu",       reporterPhone: "+919878901234", lat: 15.6050, lng: 32.5300, affectedCount: 40, needType: "food",    severity: 2 },
  { reporterName: "Meera Nair",        reporterPhone: "+919889012345", lat: 15.4700, lng: 32.4900, affectedCount: 7,  needType: "rescue",  severity: 5 },
  { reporterName: "Arjun Singh",       reporterPhone: "+919890123456", lat: 15.5300, lng: 32.5100, affectedCount: 18, needType: "medical", severity: 4 },
  { reporterName: "Sunita Kumari",     reporterPhone: "+919801234567", lat: 15.5900, lng: 32.4800, affectedCount: 12, needType: "food",    severity: 3 },
  { reporterName: "Abdul Rehman",      reporterPhone: "+919811234567", lat: 15.4600, lng: 32.5800, affectedCount: 25, needType: "shelter", severity: 4 },
  { reporterName: "Deepa Krishnan",    reporterPhone: "+919822234567", lat: 15.6300, lng: 32.5500, affectedCount: 9,  needType: "rescue",  severity: 5 },
  { reporterName: "Harpreet Sandhu",   reporterPhone: "+919833234567", lat: 15.5700, lng: 32.4600, affectedCount: 35, needType: "medical", severity: 2 },
  { reporterName: "Kavitha Reddy",     reporterPhone: "+919844234567", lat: 15.4800, lng: 32.6100, affectedCount: 6,  needType: "food",    severity: 3 },
  { reporterName: "Imran Qureshi",     reporterPhone: "+919855234567", lat: 15.6100, lng: 32.4700, affectedCount: 20, needType: "rescue",  severity: 5 },
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