import { useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, limit } from 'firebase/firestore';

export default function LiveSimulation() {
  useEffect(() => {
    // 1 & 3: STREAM MICRO-DONATIONS (Continuous during demo)
    const donationInterval = setInterval(async () => {
      const isAnomalous = Math.random() > 0.85; // 15% suspicious activity
      
      await addDoc(collection(db, "donations"), {
        amount: isAnomalous ? Math.floor(Math.random() * 50000) + 60000 : Math.floor(Math.random() * 500) + 10,
        userId: isAnomalous ? "attacker_node_04" : `donor_${Math.floor(Math.random() * 100)}`,
        timestamp: serverTimestamp(),
        status: "pending", // R will monitor this
        type: isAnomalous ? "anomalous" : "normal"
      });
    }, 3000);

    // 2 & 4: INJECT ESCALATING & DYNAMIC DISASTER METRICS
    const severityInterval = setInterval(async () => {
      const q = query(collection(db, "emergencies"), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const emergencyDoc = snap.docs[0];
        // Dynamic metric injection: random increase in affected people
        const escalation = Math.floor(Math.random() * 40) + 10;
        
        await updateDoc(doc(db, "emergencies", emergencyDoc.id), {
          severity: "high", // Escalating severity
          affectedCount: (emergencyDoc.data().affectedCount || 0) + escalation,
          lastEscalated: serverTimestamp()
        });
      }
    }, 12000);

    return () => {
      clearInterval(donationInterval);
      clearInterval(severityInterval);
    };
  }, []);

  return null; 
}
