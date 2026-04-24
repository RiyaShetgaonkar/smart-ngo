import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err.message);
      alert(err.message);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100vh", gap: 16
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 500 }}>NGO Relief Platform</h1>
      <p style={{ color: "#666" }}>Sign in to continue</p>
      <button
        onClick={handleLogin}
        style={{
          padding: "10px 24px", fontSize: 15,
          cursor: "pointer", borderRadius: 8,
          border: "1px solid #ccc", background: "#fff"
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}