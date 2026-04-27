import { useEffect } from 'react'; // Added React import for safety
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function LiveSimulation() {
  useEffect(() => {
    console.log("SHA: Engine Started");
    const interval = setInterval(async () => {
      try {
        await addDoc(collection(db, "donations"), {
          amount: Math.random() > 0.8 ? 75000 : 250,
          status: "pending",
          timestamp: serverTimestamp()
        });
        console.log("SHA: Data Sent!");
      } catch (e) { console.log("SHA Error:", e.message); }
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  return null;
}
