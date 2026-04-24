import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./Login";
import Seed from "./Seed";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;

  if (!user) return <Login />;

  return (
    <div style={{ padding: 24 }}>
      <p>Signed in as <strong>{user.displayName}</strong></p>
      <Seed />
    </div>
  );
}