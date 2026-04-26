import React, { useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export default function FraudDetector() {
  useEffect(() => {
    const q = query(collection(db, "donations"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      snap.forEach(async (change) => {
        const data = change.data();
        if (data.amount > 50000) {
          await updateDoc(doc(db, "donations", change.id), { status: "blocked" });
          await addDoc(collection(db, "flagged_donations"), { ...data, flaggedAt: serverTimestamp() });
          console.log("R: Blocked Fraud!");
        } else {
          await updateDoc(doc(db, "donations", change.id), { status: "verified" });
        }
      });
    });
    return () => unsub();
  }, []);
  return null;
}
