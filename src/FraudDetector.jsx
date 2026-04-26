import { useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function FraudDetector() {
  useEffect(() => {
    const q = query(collection(db, "donations"), where("status", "==", "pending"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const donation = change.doc.data();
          const status = donation.amount > 50000 ? "blocked" : "verified";
          
          [span_4](start_span)// Update the document status in real-time[span_4](end_span)
          await updateDoc(doc(db, "donations", change.doc.id), { status });
        }
      });
    });

    return () => unsubscribe();
  }, []);

  return null;
}
