import { useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, limit } from 'firebase/firestore';

export default function LiveSimulation() {
  useEffect(() => {
    // 1 & 3: STREAM MICRO-DONATIONS (Continuous loop for demo)
    const donationInterval = setInterval(async () => {
      // Logic for Normal vs Anomalous amounts
      const isAnomalous = Math.random() > 0.85; 
      
      await addDoc(collection(db, "donations"), {
        amount: isAnomalous ? Math.floor(Math.random() * 50000) + 60000 : Math.floor(Math.random() * 800) + 50,
        userId: isAnomalous ? "suspicious_node_404" : `donor_${Math.floor(Math.random() * 1000)}`,
        timestamp: serverTimestamp(),
        status: "pending", // R's Gateway will process this
        type: isAnomalous ? "anomalous" : "normal"
      });
    }, 3500);

    // 2 & 4: INJECT ESCALATING DISASTER METRICS
    const metricsInterval = setInterval(async () => {
      const q = query(collection(db, "emergencies"), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const emergencyDoc = snap.docs[0];
        const currentData = emergencyDoc.data();
        
        // Escalation logic: increasing affected count and setting status to high
        await updateDoc(doc(db, "emergencies", emergencyDoc.id), {
          affectedCount: (currentData.affectedCount || 0) + Math.floor(Math.random() * 30),
          severity: "high", // Escalates severity
          lastEscalation: serverTimestamp()
        });
      }
    }, 12000);

    return () => {
      clearInterval(donationInterval);
      clearInterval(metricsInterval);
    };
  }, []);

  return null; 
}
