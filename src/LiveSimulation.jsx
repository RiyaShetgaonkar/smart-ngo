import { useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, limit } from 'firebase/firestore';

export default function LiveSimulation() {
  useEffect(() => {
    // Generate live donations
    const donationInterval = setInterval(async () => {
      await addDoc(collection(db, "donations"), {
        amount: Math.random() > 0.8 ? 75000 : Math.floor(Math.random() * 500), // Random high amounts for fraud testing
        userId: "user_" + Math.floor(Math.random() * 100),
        timestamp: serverTimestamp(),
        status: "pending"
      });
    }, 4000);

    return () => clearInterval(donationInterval);
  }, []);

  return null; 
}
